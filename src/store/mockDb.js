import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aklhclmpocrszbyyndbu.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GUepcz2wIOc0nbI3fykctg_wivDhzRc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EXAMS_KEY = 'exam_app_exams';
const CATEGORIES_KEY = 'exam_app_categories';
const ANNOUNCEMENTS_KEY = 'exam_app_announcements';
const USERS_KEY = 'exam_app_users';
const SUMMARIES_KEY = 'exam_app_summaries';
const CHATS_KEY = 'exam_app_chats';
const SCHEDULES_KEY = 'exam_app_schedules';
const ITAS_KEY = 'exam_app_itas';
const FRIENDS_KEY = 'exam_app_friends';
const SYS_NOTIFICATIONS_KEY = 'exam_app_sys_notifications';
const FOLLOWS_KEY = 'exam_app_follows';


// --- Exam Results ---
const EXAM_RESULTS_KEY = 'exam_app_exam_results';

// --- Global Data Cache ---
let dataCache = {};

export const preloadAllData = async () => {
  try {
    return true;
  } catch (err) {
    console.error('Preload error:', err);
    return false;
  }
};


const getData = async (key, noCache = false) => {
  // Check memory cache
  if (!noCache && dataCache[key]) {
    return dataCache[key];
  }

  // Check sessionStorage cache
  if (!noCache) {
    try {
      const cached = sessionStorage.getItem(`cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        dataCache[key] = parsed;
        return parsed;
      }
    } catch (e) {
      // Ignore sessionStorage parsing errors
    }
  }
  
  try {
    // Limit to 100 to prevent huge payloads crashing the app
    const { data, error } = await supabase.from(key).select('*').limit(100);
    if (error) throw error;
    
    dataCache[key] = data || [];
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem(`cache_${key}`, JSON.stringify(dataCache[key]));
    } catch (e) {}
    
    return dataCache[key];
  } catch (err) {
    console.error('Error fetching data:', err);
    return [];
  }
};

const saveData = async (key, item) => {
  try {
    if (!item.id) item.id = crypto.randomUUID();
    const { data, error } = await supabase.from(key).upsert(item).select();
    if (error) throw error;
    delete dataCache[key]; // Invalidate cache
    try { sessionStorage.removeItem(`cache_${key}`); } catch (e) {}
    return data ? data[0] : item;
  } catch (err) {
    console.error('Error saving data:', err);
    throw err;
  }
};

const deleteData = async (key, id) => {
  try {
    const { error } = await supabase.from(key).delete().eq('id', id);
    if (error) throw error;
    delete dataCache[key]; // Invalidate cache
    try { sessionStorage.removeItem(`cache_${key}`); } catch (e) {}
  } catch (err) {
    console.error('Error deleting data:', err);
  }
};

// --- Auth Endpoints (Migrated to Supabase Auth) ---
export const registerUser = async (userData) => {
  const { name, email, password } = userData;
  // Use Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'student' } }
  });
  if (error) throw new Error(error.message);
  
  // Also save to our custom users table for profile info
  if (data.user) {
    await supabase.from(USERS_KEY).upsert({
      id: data.user.id,
      name,
      email,
      role: 'student'
    });
  }
  
  return { success: true, message: 'User registered successfully. You can log in now.' };
};

export const loginUser = async (credentials) => {
  const { email, password } = credentials;
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    // Auto-migrate old users from mock database whenever Supabase Auth fails
    const { data: oldUsers, error: oldErr } = await supabase.from(USERS_KEY).select('*').eq('email', email).eq('password', password);
    
    if (oldUsers && oldUsers.length > 0) {
      const oldUser = oldUsers[0];
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: oldUser.name, role: oldUser.role } }
      });
      
      if (signUpError) {
        // If it says user already registered, maybe they are already migrated but typed wrong password?
        if (signUpError.message.includes('already registered')) {
          throw new Error('อีเมลนี้ถูกอัปเกรดระบบแล้ว แต่รหัสผ่านไม่ถูกต้อง กรุณาใช้รหัสผ่านล่าสุด หรือกดลืมรหัสผ่าน');
        }
        throw new Error("พบข้อมูลบัญชีเก่า แต่ไม่สามารถอัปเกรดได้: " + signUpError.message);
      }
      
      // Update the mock db record to use the new Supabase Auth UUID
      if (signUpData.user) {
        await supabase.from(USERS_KEY).update({ id: signUpData.user.id }).eq('email', email);
      }
      
      if (signUpData.session) {
        data = signUpData;
        error = null;
      } else {
        // If session is null, try signing in again
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw new Error("อัปเกรดบัญชีเก่าสำเร็จแล้ว แต่ต้องมีการยืนยันอีเมล หรือรอสักครู่แล้วลองเข้าสู่ระบบอีกครั้ง");
        data = signInData;
        error = null;
      }
    } else {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ');
      } else {
        throw new Error(error.message);
      }
    }
  }
  
  // Fetch custom role from users table
  const { data: userData } = await supabase.from(USERS_KEY).select('*').eq('email', email).single();
  const role = userData ? userData.role : 'student';
  const name = userData ? userData.name : data.user.email;
  const profilePicture = userData ? userData.profilePicture : null;
  const custom_uid = userData ? userData.custom_uid : null;
  
  const userPayload = {
    id: data.user.id,
    name,
    email,
    role,
    profilePicture,
    custom_uid,
    token: data.session.access_token
  };
  
  localStorage.setItem('deksa_user', JSON.stringify(userPayload));
  return { token: data.session.access_token, user: userPayload };
};

export const forgotPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Password reset email sent' };
};

export const resetPassword = async (email, otp, newPassword) => {
  // 1. Verify the 6-digit OTP code sent to the email
  const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });
  if (error) throw new Error(error.message);
  
  // 2. The user is now authenticated for this session, we can update the password
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) throw new Error(updateError.message);
  
  // 3. Sign out immediately so they can log in normally with the new password
  await supabase.auth.signOut();
  return { success: true, message: 'Password reset successfully' };
};

export const changeEmail = async (email, newEmail, password) => {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Check your new email to confirm the change' };
};

export const verifyUser = async (email, otp) => {
  const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Verified successfully' };
};

export const resendOtp = async (email) => {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Resent successfully' };
};


// --- Exams ---
export const getExams = () => getData(EXAMS_KEY);
export const saveExam = (exam) => saveData(EXAMS_KEY, exam);
export const getExamById = async (id) => {
  const exams = await getExams();
  return exams.find(e => e.id === id);
};
export const deleteExam = (id) => deleteData(EXAMS_KEY, id);

// --- Exam Results ---
export const getExamResults = () => getData(EXAM_RESULTS_KEY);
export const saveExamResult = (result) => saveData(EXAM_RESULTS_KEY, result);
export const getExamResultsByExamId = async (examId) => {
  const allResults = await getExamResults();
  return allResults.filter(r => r.examId === examId);
};
export const getExamResultsByUserId = async (userId) => {
  const allResults = await getExamResults();
  return allResults.filter(r => r.userId === userId);
};

// --- Categories ---
export const getCategories = () => getData(CATEGORIES_KEY);
export const saveCategory = (cat) => saveData(CATEGORIES_KEY, cat);
export const deleteCategory = (id) => deleteData(CATEGORIES_KEY, id);

// --- Announcements ---
export const getAnnouncements = () => getData(ANNOUNCEMENTS_KEY);
export const saveAnnouncement = (ann) => saveData(ANNOUNCEMENTS_KEY, ann);
export const deleteAnnouncement = (id) => deleteData(ANNOUNCEMENTS_KEY, id);

// --- Users ---
export const getUsers = () => getData(USERS_KEY);

export const checkUidAvailability = async (uid, currentUserId) => {
  if (!uid) return false;
  try {
    const { data, error } = await supabase
      .from(USERS_KEY)
      .select('id')
      .eq('custom_uid', uid);
      
    if (error) throw error;
    
    // Available if no one has it, or the only person who has it is the current user
    if (!data || data.length === 0) return true;
    if (data.length === 1 && data[0].id === currentUserId) return true;
    return false;
  } catch (err) {
    console.error('Error checking UID availability:', err);
    return false;
  }
};

export const saveUser = (user) => {
  const payload = { ...user };
  delete payload.token;
  if (!payload.password) {
    delete payload.password; // Only delete if empty to not overwrite existing passwords
  }
  return saveData(USERS_KEY, payload);
};
export const deleteUser = (id) => deleteData(USERS_KEY, id);

// --- Summaries ---
export const getSummaries = async () => {
    // Optimization: Don't fetch pdfData when listing summaries
    const { data, error } = await supabase.from(SUMMARIES_KEY).select('id, title, description, color, coverImage');
    if (error) return [];
    return data;
}

export const getSummaryById = async (id) => {
  try {
    const { data, error } = await supabase.from(SUMMARIES_KEY).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching summary by id:', err);
    return null;
  }
};
export const saveSummary = (summary) => saveData(SUMMARIES_KEY, summary);
export const deleteSummary = (id) => deleteData(SUMMARIES_KEY, id);

// --- Schedules API ---
export const getSchedules = () => getData(SCHEDULES_KEY);
export const saveSchedule = (schedule) => saveData(SCHEDULES_KEY, schedule);
export const deleteSchedule = (id) => deleteData(SCHEDULES_KEY, id);

// --- ITAs API ---
export const getItas = () => getData(ITAS_KEY);
export const saveIta = (ita) => saveData(ITAS_KEY, ita);
export const deleteIta = (id) => deleteData(ITAS_KEY, id);

// --- Friends API ---
export const getFriends = () => getData(FRIENDS_KEY);
export const saveFriend = (friend) => saveData(FRIENDS_KEY, friend);
export const deleteFriend = (id) => deleteData(FRIENDS_KEY, id);

// --- System Notifications API ---
export const getSysNotifications = () => getData(SYS_NOTIFICATIONS_KEY, true); // true for noCache to get realtime updates via polling if needed
export const saveSysNotification = (notification) => saveData(SYS_NOTIFICATIONS_KEY, notification);
export const deleteSysNotification = (id) => deleteData(SYS_NOTIFICATIONS_KEY, id);

// --- Follows API ---
export const getFollows = () => getData(FOLLOWS_KEY, true);
export const saveFollow = (follow) => saveData(FOLLOWS_KEY, follow);
export const deleteFollow = (id) => deleteData(FOLLOWS_KEY, id);

// --- File Sharing & Cloud Drive API ---
const FILES_KEY = ITAS_KEY;

// Sample study files if empty
const SAMPLE_FILES = [
  {
    id: 'sample-file-1',
    title: 'สรุปวิทยาศาสตร์ ม.3 - การถ่ายทอดลักษณะทางพันธุกรรม (DNA & ยีน)',
    fileName: 'สรุปวิทยาศาสตร์_ม3_พันธุกรรม.pdf',
    fileSize: 3565158,
    fileType: 'application/pdf',
    category: 'วิทยาศาสตร์',
    grade: 'ม.3',
    uploaderName: 'ครูวิทย์ Dek SA',
    description: 'สรุปเน้นๆ เรื่องโครโมโซม ยีน แอลลีล และกฎของเมนเดล พร้อมภาพประกอบเข้าใจง่ายสำหรับเตรียมสอบกลางภาค',
    fileUrl: 'https://aklhclmpocrszbyyndbu.supabase.co/storage/v1/object/public/media/migrated_media/doc_1784037800004_coverImage_1784140017168.jpg',
    downloads: 148,
    tags: ['#สรุปสอบ', '#วิทยาศาสตร์', '#ม3'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'sample-file-2',
    title: 'ชีทสูตรคณิตศาสตร์ ม.1-ม.3 เตรียมสอบเข้า ม.4 ฉบับย่อ',
    fileName: 'ชีทสรุปสูตรคณิต_ม1-ม3.pdf',
    fileSize: 5033164,
    fileType: 'application/pdf',
    category: 'คณิตศาสตร์',
    grade: 'ม.3',
    uploaderName: 'kenta admin',
    description: 'รวบรวมสูตรคณิต ม.ต้น ทั้งหมด ได้แก่ พหุนาม สมการกำลังสอง พีทาโกรัส สถิติ และตรีโกณมิติ',
    fileUrl: 'https://aklhclmpocrszbyyndbu.supabase.co/storage/v1/object/public/media/migrated_media/doc_1784099884996_coverImage_1784140020815.jpg',
    downloads: 312,
    tags: ['#คณิตศาสตร์', '#สอบเข้าม4', '#สูตรลัด'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'sample-file-3',
    title: 'รวมคำศัพท์ภาษาอังกฤษ 500 คำออกสอบบ่อย พร้อมตัวอย่างประโยค',
    fileName: 'English_Vocab_500_Words.docx',
    fileSize: 1258291,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'ภาษาอังกฤษ',
    grade: 'ม.2',
    uploaderName: 'พี่หมอแนะแนว',
    description: 'คำศัพท์ภาษาอังกฤษที่พบบ่อยในข้อสอบ O-NET และข้อสอบประจำภาค พร้อมความหมายและคำเหมือน (Synonyms)',
    fileUrl: 'https://aklhclmpocrszbyyndbu.supabase.co/storage/v1/object/public/media/migrated_media/doc_1784100009226_coverImage_1784140021671.jpg',
    downloads: 185,
    tags: ['#English', '#Vocabulary', '#ชีทคำศัพท์'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'sample-file-4',
    title: 'สไลด์สรุปประวัติศาสตร์ไทย ยุคอยุธยา-รัตนโกสินทร์ตอนต้น',
    fileName: 'History_Ayutthaya_Slide.pptx',
    fileSize: 9017753,
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    category: 'สังคมศึกษา',
    grade: 'ม.1',
    uploaderName: 'ฝ่ายวิชาการ Dek SA',
    description: 'สไลด์ประกอบการเรียนและการทบทวนเรื่องการเมืองการปกครองและเศรษฐกิจในสมัยอยุธยา มีไทม์ไลน์ชัดเจน',
    fileUrl: 'https://aklhclmpocrszbyyndbu.supabase.co/storage/v1/object/public/media/migrated_media/doc_1784037900868_coverImage_1784140018563.jpg',
    downloads: 94,
    tags: ['#สังคมศึกษา', '#ประวัติศาสตร์', '#สไลด์สรุป'],
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString()
  },
  {
    id: 'sample-file-5',
    title: 'แบบฝึกหัดภาษาไทย หลักภาษาและการใช้ภาษา ม.2 พร้อมเฉลย',
    fileName: 'แบบฝึกหัดภาษาไทย_ม2.pdf',
    fileSize: 2202009,
    fileType: 'application/pdf',
    category: 'ภาษาไทย',
    grade: 'ม.2',
    uploaderName: 'ครูภาษาไทยใจดี',
    description: 'แบบฝึกหัดคำสมาส สนธิ ประโยคซับซ้อน และการแต่งคำประพันธ์ พร้อมเฉลยละเอียดท้ายเล่ม',
    fileUrl: 'https://aklhclmpocrszbyyndbu.supabase.co/storage/v1/object/public/media/migrated_media/doc_1784099504572_imageUrl_1784139955270.jpg',
    downloads: 87,
    tags: ['#ภาษาไทย', '#แบบฝึกหัด', '#มีเฉลย'],
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: 'sample-file-6',
    title: 'โค้ดตัวอย่าง Python เบื้องต้น สำหรับวิชาวิทยาการคำนวณ ม.3',
    fileName: 'python_basics_samples.zip',
    fileSize: 645120,
    fileType: 'application/zip',
    category: 'เทคโนโลยี',
    grade: 'ม.3',
    uploaderName: 'Dev Team',
    description: 'รวมไฟล์ .py สำหรับฝึกเขียนโปรแกรมคำนวณเกรด หาพื้นที่เรขาคณิต และเกมทายตัวเลข',
    fileUrl: 'https://aklhclmpocrszbyyndbu.supabase.co/storage/v1/object/public/media/migrated_media/doc_1784099478032_value_1784139954958.jpg',
    downloads: 215,
    tags: ['#Python', '#วิทยาการคำนวณ', '#เขียนโค้ด'],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  }
];

export const getSharedFiles = async () => {
  const rawList = await getData(FILES_KEY, true);
  if (!rawList || rawList.length === 0) {
    return SAMPLE_FILES;
  }
  const parsed = rawList.map(item => {
    let meta = {};
    try {
      meta = typeof item.description === 'string' ? JSON.parse(item.description) : (item.description || {});
    } catch (e) {
      meta = { description: item.description };
    }
    return {
      id: item.id,
      title: item.title,
      documents: item.documents || [],
      ...meta
    };
  });
  return parsed;
};

export const uploadFileToStorage = async (file, folder = 'study-files') => {
  const cleanName = (file.name || 'document').replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanName}`;
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) throw error;
  
  const { data: publicUrlData } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);
    
  return {
    url: publicUrlData.publicUrl,
    path: filePath
  };
};

export const saveSharedFile = async (fileData) => {
  const { id, title, documents, ...meta } = fileData;
  const payload = {
    id: id || crypto.randomUUID(),
    title: title || meta.fileName || 'ไฟล์เอกสารการเรียน',
    description: JSON.stringify(meta),
    documents: documents || (meta.fileUrl ? [{ name: meta.fileName, url: meta.fileUrl, size: meta.fileSize, type: meta.fileType }] : [])
  };
  return await saveData(FILES_KEY, payload);
};

export const deleteSharedFile = async (id, filePath) => {
  if (filePath) {
    try {
      await supabase.storage.from('media').remove([filePath]);
    } catch (e) {
      console.warn('Storage delete warn:', e);
    }
  }
  return await deleteData(FILES_KEY, id);
};

export const incrementFileDownloads = async (fileItem) => {
  const updatedItem = {
    ...fileItem,
    downloads: (fileItem.downloads || 0) + 1
  };
  await saveSharedFile(updatedItem);
  return updatedItem.downloads;
};

// ============================================================
// 🔍 Lost & Found API
// ============================================================

const LF_POSTS_TABLE   = 'lost_found_posts';
const LF_CLAIMS_TABLE  = 'lost_found_claims';
const LF_REPORTS_TABLE = 'lost_found_reports';
const LF_QUOTA_TABLE   = 'lost_found_daily_quota';
const LF_IMAGE_BUCKET  = 'lost-found-images';
const LF_MAX_PER_DAY   = 5;

export const getLostFoundPosts = async ({
  type = null, category = null, status = null,
  location = null, search = null,
  dateFrom = null, dateTo = null,
  limit = 50, offset = 0
} = {}) => {
  let q = supabase
    .from(LF_POSTS_TABLE)
    .select('*')
    .neq('status', 'removed')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type)     q = q.eq('type', type);
  if (category) q = q.eq('category', category);
  if (status && status !== 'all') q = q.eq('status', status);
  if (location) q = q.ilike('location', `%${location}%`);
  if (dateFrom) q = q.gte('lost_found_date', dateFrom);
  if (dateTo)   q = q.lte('lost_found_date', dateTo);
  if (search) {
    q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

export const getLostFoundPostById = async (id) => {
  const { data, error } = await supabase
    .from(LF_POSTS_TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

export const checkLostFoundQuota = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from(LF_QUOTA_TABLE).select('count')
    .eq('user_id', userId).eq('post_date', today).single();
  return (data?.count || 0) < LF_MAX_PER_DAY;
};

const _incQuota = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from(LF_QUOTA_TABLE).select('count')
    .eq('user_id', userId).eq('post_date', today).single();
  if (data) {
    await supabase.from(LF_QUOTA_TABLE)
      .update({ count: data.count + 1 })
      .eq('user_id', userId).eq('post_date', today);
  } else {
    await supabase.from(LF_QUOTA_TABLE)
      .insert({ user_id: userId, post_date: today, count: 1 });
  }
};

export const createLostFoundPost = async (postData, userId) => {
  const canPost = await checkLostFoundQuota(userId);
  if (!canPost) throw new Error(`โพสต์ได้สูงสุด ${LF_MAX_PER_DAY} รายการต่อวัน`);

  const { data, error } = await supabase
    .from(LF_POSTS_TABLE)
    .insert({ ...postData, poster_id: userId })
    .select().single();
  if (error) throw error;
  await _incQuota(userId);

  // Auto-match
  try {
    const { data: matches } = await supabase.rpc('find_lost_found_matches', { p_id: data.id });
    if (matches?.length > 0 && matches[0].similarity_score >= 5) {
      await supabase.from(LF_POSTS_TABLE)
        .update({ matched_post_id: matches[0].match_id, status: 'matched' })
        .eq('id', data.id);
    }
  } catch (e) { console.warn('Auto-match (non-critical):', e.message); }

  return data;
};

export const updateLostFoundPost = async (id, updates, userId) => {
  const { data, error } = await supabase
    .from(LF_POSTS_TABLE)
    .update(updates).eq('id', id).eq('poster_id', userId)
    .select().single();
  if (error) throw error;
  return data;
};

export const deleteLostFoundPost = async (id, userId) => {
  const { error } = await supabase
    .from(LF_POSTS_TABLE).delete().eq('id', id).eq('poster_id', userId);
  if (error) throw error;
};

export const staffUpdateLFStatus = async (id, status, note = '') => {
  const updates = { status };
  if (status === 'returned' || status === 'removed') {
    updates.resolved_at = new Date().toISOString();
    if (note) updates.resolution_note = note;
  }
  const { data, error } = await supabase
    .from(LF_POSTS_TABLE).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const uploadLostFoundImage = async (file, userId) => {
  const compressed = await _compressLFImage(file, 1200, 0.82);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(LF_IMAGE_BUCKET).upload(path, compressed, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(LF_IMAGE_BUCKET).getPublicUrl(path);
  return { url: urlData.publicUrl, path };
};

const _compressLFImage = (file, maxSize = 1200, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else       { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          b => resolve(new File([b], file.name, { type: 'image/jpeg' })),
          'image/jpeg', quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const submitLostFoundClaim = async (postId, answer, user) => {
  const { data, error } = await supabase
    .from(LF_CLAIMS_TABLE)
    .insert({ post_id: postId, claimant_id: user.id, claimant_name: user.name, answer })
    .select().single();
  if (error) {
    if (error.code === '23505') throw new Error('คุณยื่นคำขอนี้ไปแล้ว');
    throw error;
  }
  return data;
};

export const getClaimsForPost = async (postId) => {
  const { data, error } = await supabase
    .from(LF_CLAIMS_TABLE).select('*').eq('post_id', postId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const reviewLFClaim = async (claimId, verdict, staffNote = '') => {
  const { data, error } = await supabase
    .from(LF_CLAIMS_TABLE)
    .update({ status: verdict, staff_note: staffNote, reviewed_at: new Date().toISOString() })
    .eq('id', claimId).select().single();
  if (error) throw error;
  return data;
};

export const reportLostFoundPost = async (postId, reason, userId) => {
  const { error } = await supabase
    .from(LF_REPORTS_TABLE)
    .insert({ post_id: postId, reporter_id: userId, reason });
  if (error) {
    if (error.code === '23505') throw new Error('คุณรายงานประกาศนี้ไปแล้ว');
    throw error;
  }
};

export const staffGetAllLFPosts = async () => {
  const { data, error } = await supabase
    .from(LF_POSTS_TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const staffGetLFReports = async () => {
  const { data, error } = await supabase
    .from(LF_REPORTS_TABLE)
    .select('*, lost_found_posts(title, type, status)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getMatchesForPost = async (postId) => {
  const { data, error } = await supabase.rpc('find_lost_found_matches', { p_id: postId });
  if (error) return [];
  return (data || []).filter(m => m.similarity_score >= 3);
};


