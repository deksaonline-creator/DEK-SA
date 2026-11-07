require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in the environment');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MONGO_URI = process.env.MONGO_URI;

const AnySchema = new mongoose.Schema({}, { strict: false });

const models = {
  exam_app_users: mongoose.model('User', AnySchema, 'users'),
  exam_app_categories: mongoose.model('Category', AnySchema, 'categories'),
  exam_app_exams: mongoose.model('Exam', AnySchema, 'exams'),
  exam_app_announcements: mongoose.model('Announcement', AnySchema, 'announcements'),
  exam_app_summaries: mongoose.model('Summary', AnySchema, 'summaries'),
  exam_app_chats: mongoose.model('Chat', AnySchema, 'chats'),
  exam_app_schedules: mongoose.model('Schedule', AnySchema, 'schedules'),
  exam_app_itas: mongoose.model('ITA', AnySchema, 'itas'),
  exam_app_friends: mongoose.model('Friend', AnySchema, 'friends')
};

const allowedColumns = {
  exam_app_users: ['id', 'name', 'email', 'role', 'profilePicture', 'password'],
  exam_app_exams: ['id', 'title', 'categoryId', 'duration', 'coverImage', 'questions'],
  exam_app_categories: ['id', 'name', 'description'],
  exam_app_announcements: ['id', 'title', 'content', 'type', 'imageUrl', 'contentBlocks'],
  exam_app_summaries: ['id', 'title', 'description', 'color', 'coverImage', 'images', 'pdfData'],
  exam_app_chats: ['id', 'sessionId', 'type', 'timestamp', 'nickname', 'text', 'channelId', 'userId', 'message', 'senderId', 'senderName', 'senderRole'],
  exam_app_schedules: ['id', 'rooms', 'imageUrl'],
  exam_app_itas: ['id', 'title', 'description', 'documents'],
  exam_app_friends: ['id', 'userId', 'friendId', 'status', 'targetUser', 'friendDetails']
};

async function uploadBase64ToSupabase(base64String, folder, filename) {
  if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:')) return base64String;

  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64String;

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  let extension = contentType.split('/')[1];
  if (extension === 'jpeg') extension = 'jpg';
  if (extension === 'x-empty') extension = 'txt';
  
  const finalPath = `${folder}/${filename}_${Date.now()}.${extension}`;
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(finalPath, buffer, { contentType, upsert: true });

  if (error) {
    console.error('Storage Upload Error:', error.message);
    return base64String;
  }
  
  const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(finalPath);
  return publicUrlData.publicUrl;
}

// Recursively traverse object and upload any base64 string
async function traverseAndUploadBase64(obj, folder, idPrefix) {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('data:image/') || obj.startsWith('data:application/pdf')) {
      console.log(`Uploading base64 file for ${idPrefix}...`);
      return await uploadBase64ToSupabase(obj, folder, idPrefix);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await traverseAndUploadBase64(obj[i], folder, `${idPrefix}_${i}`);
    }
    return obj;
  }
  if (typeof obj === 'object') {
    for (let key in obj) {
      obj[key] = await traverseAndUploadBase64(obj[key], folder, `${idPrefix}_${key}`);
    }
    return obj;
  }
  return obj;
}

async function migrateData() {
  await mongoose.connect(MONGO_URI, { family: 4 });
  console.log('Connected to MongoDB');

  const emailsSeen = new Set(); // To prevent duplicate emails in users table

  for (const [supabaseTable, Model] of Object.entries(models)) {
    console.log(`Migrating ${Model.collection.name} to ${supabaseTable}...`);
    const docs = await Model.find({});
    console.log(`Found ${docs.length} documents.`);
    
    for (let doc of docs) {
      let obj = doc.toObject();
      
      // Clean up object recursively and upload base64 strings
      obj = await traverseAndUploadBase64(obj, 'migrated_media', `doc_${obj.id}`);

      // Strip unallowed columns
      let cleanObj = {};
      const allowed = allowedColumns[supabaseTable];
      for (let key of allowed) {
        if (obj[key] !== undefined) {
          cleanObj[key] = obj[key];
        }
      }

      // Handle duplicate emails in users
      if (supabaseTable === 'exam_app_users') {
        if (!cleanObj.email) cleanObj.email = `noemail_${cleanObj.id}@deksa.local`;
        if (emailsSeen.has(cleanObj.email)) {
           cleanObj.email = `dup_${cleanObj.id}_${cleanObj.email}`;
        }
        emailsSeen.add(cleanObj.email);
      }

      const { error } = await supabase.from(supabaseTable).upsert(cleanObj);
      if (error) {
        console.error(`Failed to insert ${supabaseTable} id=${cleanObj.id}:`, error.message);
      }
    }
    console.log(`Finished ${supabaseTable}`);
  }
  
  console.log('Migration Completed!');
  process.exit(0);
}

migrateData().catch(console.error);
