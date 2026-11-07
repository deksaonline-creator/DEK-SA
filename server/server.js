require('dotenv').config();
const express = require('express');
const compression = require('compression');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'deksa_super_secret_key_2026';


// Railway specific configurations
app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (req.path.startsWith('/api/sgs')) {
    res.setTimeout(120000); // 2 minutes for SGS scraping
  } else {
    res.setTimeout(15000); // 15 second timeout for general API requests
  }
  next();
});

// --- Security Middlewares ---
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false, // disable CSP to allow React app to load external images/fonts easily during prototyping
}));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

// Safe JSON error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'ข้อมูลส่งมาไม่ถูกต้อง (Invalid JSON)' });
  }
  next();
});
// Custom Mongo Sanitize for req.body to avoid Express 5 req.query getter crash
const sanitizeObj = (obj) => {
  if (obj && typeof obj === 'object') {
    for (let key in obj) {
      if (/^\$/.test(key)) {
        delete obj[key];
      } else {
        sanitizeObj(obj[key]);
      }
    }
  }
};
app.use((req, res, next) => {
  if (req.body) sanitizeObj(req.body);
  next();
});

// Rate Limiting (General API)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for polling support)
  message: { error: 'Too many requests from this IP, please try again later' }
});
app.use('/api/', apiLimiter);

// Rate Limiting (Auth Routes - Stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login/register requests
  message: { error: 'Too many authentication attempts, please try again later' }
});

// --- MongoDB Setup (Removed since the app uses Supabase on the frontend) ---
// We no longer require a MongoDB connection for the Node.js backend.
// The backend is purely a Puppeteer proxy for SGS.

// Strict Schemas
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String, email: String, password: String, role: String,
  isVerified: Boolean, verificationOTP: String, otpExpires: Number,
  resetOTP: String, profilePicture: String
}, { strict: true, timestamps: true });

const ExamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String, categoryId: String, duration: Number,
  coverImage: String, questions: mongoose.Schema.Types.Mixed
}, { strict: true, timestamps: true });

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String, description: String
}, { strict: true, timestamps: true });

const AnnouncementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String, content: String, type: String,
  imageUrl: String, contentBlocks: mongoose.Schema.Types.Mixed
}, { strict: true, timestamps: true });

const SummarySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String, description: String, color: String,
  coverImage: String, images: [String], pdfData: String
}, { strict: true, timestamps: true });

const ChatSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sessionId: String, type: String, timestamp: String,
  nickname: String, text: String, channelId: String,
  userId: String, message: String, senderId: String, senderName: String, senderRole: String
}, { strict: true, timestamps: true });

const ScheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  rooms: mongoose.Schema.Types.Mixed, imageUrl: String
}, { strict: true, timestamps: true });

const ItaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String, description: String, documents: mongoose.Schema.Types.Mixed
}, { strict: true, timestamps: true });

const FriendSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String, friendId: String, status: String,
  targetUser: mongoose.Schema.Types.Mixed, friendDetails: mongoose.Schema.Types.Mixed
}, { strict: true, timestamps: true });

const SysNotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String, message: String, type: String, timestamp: String,
  link: String, readBy: [String], targetUserId: String
}, { strict: true, timestamps: true });

const FollowSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  followerId: String, followingId: String, timestamp: String
}, { strict: true, timestamps: true });

const TimetableSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timetable: mongoose.Schema.Types.Mixed
}, { strict: true, timestamps: true });

const models = {
  exam_app_exams: mongoose.model('Exam', ExamSchema),
  exam_app_categories: mongoose.model('Category', CategorySchema),
  exam_app_announcements: mongoose.model('Announcement', AnnouncementSchema),
  exam_app_users: mongoose.model('User', UserSchema),
  exam_app_summaries: mongoose.model('Summary', SummarySchema),
  exam_app_chats: mongoose.model('Chat', ChatSchema),
  exam_app_schedules: mongoose.model('Schedule', ScheduleSchema),
  exam_app_itas: mongoose.model('ITA', ItaSchema),
  exam_app_friends: mongoose.model('Friend', FriendSchema),
  exam_app_sys_notifications: mongoose.model('SysNotification', SysNotificationSchema),
  exam_app_follows: mongoose.model('Follow', FollowSchema),
  exam_app_timetables: mongoose.model('Timetable', TimetableSchema)
};

// --- Auth Routes ---
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const User = models.exam_app_users;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Determine role based on name
    const role = 'student';

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    const newUser = await User.create({
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: role,
      isVerified: false,
      verificationOTP: otp,
      otpExpires
    });
    
    res.json({ success: true, message: 'User registered successfully', otp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Missing email or otp' });
    
    const User = models.exam_app_users;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
    
    if (user.verificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    if (user.otpExpires && Date.now() > user.otpExpires) {
      return res.status(400).json({ error: 'OTP expired' });
    }
    
    // Update user
    await User.updateOne({ id: user.id }, { $set: { isVerified: true }, $unset: { verificationOTP: "", otpExpires: "" } });
    
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
    
    const User = models.exam_app_users;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    if (user.isVerified === false) {
      return res.status(403).json({ error: 'NOT_VERIFIED' });
    }
    
    // Check password
    let isMatch = false;
    // Fallback for old plain text passwords during migration
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      isMatch = (password === user.password);
      // Auto-migrate to hashed password if they logged in successfully with plain text
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await User.updateOne({ id: user.id }, { $set: { password: user.password } });
      }
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }
    
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    // Create JWT
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...payload, profilePicture: user.profilePicture } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    
    const User = models.exam_app_users;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ error: 'ไม่พบอีเมลนี้ในระบบ' });
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    
    await User.updateOne({ id: user.id }, { $set: { resetOTP: otp, otpExpires } });
    
    res.json({ success: true, message: 'OTP generated', otp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Missing fields' });
    
    const User = models.exam_app_users;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ error: 'ไม่พบผู้ใช้งาน' });
    if (user.resetOTP !== otp) return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง' });
    if (user.otpExpires && Date.now() > user.otpExpires) return res.status(400).json({ error: 'OTP หมดอายุแล้ว' });
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear resetOTP
    await User.updateOne({ id: user.id }, { $set: { password: hashedPassword }, $unset: { resetOTP: "", otpExpires: "" } });
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/change-email', async (req, res) => {
  try {
    const { email, newEmail, password } = req.body;
    if (!email || !newEmail || !password) return res.status(400).json({ error: 'Missing fields' });
    
    const User = models.exam_app_users;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'ไม่พบผู้ใช้งาน' });
    
    // Check password
    let isMatch = false;
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      isMatch = (password === user.password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }
    if (!isMatch) return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    
    // Check if newEmail is already taken
    const existingEmail = await User.findOne({ email: newEmail });
    if (existingEmail) return res.status(400).json({ error: 'อีเมลนี้มีผู้ใช้งานแล้ว' });
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    
    await User.updateOne({ id: user.id }, { $set: { email: newEmail, isVerified: false, verificationOTP: otp, otpExpires } });
    
    res.json({ success: true, message: 'Email changed successfully', otp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Custom Proxy Routes ---
app.get('/api/news', async (req, res) => {
  try {
    const url = `http://web.sa.ac.th/index.php/prachasamphanth/news?format=feed&type=rss`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch news from external site');
    const data = await response.text();
    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Generic REST API ---

// GET all items for a key
app.get('/api/:key', async (req, res) => {
  const { key } = req.params;
  const Model = models[key];
  if (!Model) return res.status(404).json({ error: 'Key not found' });
  
  // Require auth for users endpoint to prevent public scraping
  if (key === 'exam_app_users' || key === 'exam_app_friends') {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) return res.status(401).json({ error: 'Unauthorized: No token provided' });
    
    const token = bearerHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET); // just verify they are logged in
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  }
  
  try {
    let query = Model.find({});
    
    // Optmize query for summaries to prevent massive memory spikes
    if (key === 'exam_app_summaries') {
      query = query.select('-pdfData -images');
    }
    
    const data = await query;
    // Convert Mongoose documents back to plain objects for frontend compatibility
    res.json(data.map(doc => {
      const obj = doc.toObject();
      delete obj._id;
      delete obj.__v;
      if (key === 'exam_app_users') {
        delete obj.password; // Never send passwords
        delete obj.resetOTP; // Prevent OTP leaks
        delete obj.verificationOTP;
      }
      return obj;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single item by ID
app.get('/api/:key/:id', async (req, res) => {
  const { key, id } = req.params;
  const Model = models[key];
  if (!Model) return res.status(404).json({ error: 'Key not found' });
  
  if (key === 'exam_app_users' || key === 'exam_app_friends') {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) return res.status(401).json({ error: 'Unauthorized: No token provided' });
    
    const token = bearerHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  }
  
  try {
    const doc = await Model.findOne({ id });
    if (!doc) return res.status(404).json({ error: 'Item not found' });
    
    const obj = doc.toObject();
    delete obj._id;
    delete obj.__v;
    if (key === 'exam_app_users') {
      delete obj.password;
      delete obj.resetOTP;
      delete obj.verificationOTP;
      delete obj.otpExpires;
    }
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST (Save or Update) an item
app.post('/api/:key', async (req, res) => {
  const { key } = req.params;
  const Model = models[key];
  if (!Model) return res.status(404).json({ error: 'Key not found' });
  
  // Role-based access control
  let userRole = 'anonymous';
  let userId = null;
  
  if (key !== 'exam_app_chats') {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) return res.status(401).json({ error: 'Unauthorized: No token provided' });
    
    const token = bearerHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userRole = decoded.role;
      userId = decoded.id;
      req.user = decoded;
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    if (key === 'exam_app_users') {
      // Users can only update their own profile, unless Admin
      if (userRole !== 'admin' && req.body.id !== userId) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
      }
      // Prevent role escalation
      if (userRole !== 'admin' && (req.body.role === 'admin' || req.body.role === 'teacher')) {
        req.body.role = 'student';
      }
      // Hash password if being updated
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      }
    } else if (key === 'exam_app_summaries' || key === 'exam_app_friends') {
      // Students can submit summaries and add friends
    } else if (key === 'exam_app_exams' || key === 'exam_app_categories') {
      // Teachers and admins can create/update exams and categories
      if (userRole !== 'admin' && userRole !== 'teacher') {
        return res.status(403).json({ error: 'Forbidden: Admin or Teacher access required' });
      }
    } else {
      // All other collections (schedules, itas, announcements) require Admin
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    }
  }
  
  try {
    const item = req.body;
    if (!item.id) {
      item.id = Date.now().toString();
    }
    
    // Upsert
    const saved = await Model.findOneAndUpdate(
      { id: item.id },
      { $set: item },
      { returnDocument: 'after', upsert: true }
    );
    
    const obj = saved.toObject();
    delete obj._id;
    delete obj.__v;
    if (key === 'exam_app_users') {
      delete obj.password;
      delete obj.resetOTP;
      delete obj.verificationOTP;
    }
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an item
app.delete('/api/:key/:id', async (req, res) => {
  const { key, id } = req.params;
  const Model = models[key];
  if (!Model) return res.status(404).json({ error: 'Key not found' });
  
  // Require Token
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  
  let userRole = null;
  try {
    const token = bearerHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    userRole = decoded.role;
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  // Only exam_app_friends can be deleted by students
  if (userRole !== 'admin' && userRole !== 'teacher' && key !== 'exam_app_friends') {
    return res.status(403).json({ error: 'Forbidden: Admin or Teacher access required' });
  }
  
  if (userRole === 'teacher' && key !== 'exam_app_exams' && key !== 'exam_app_summaries' && key !== 'exam_app_categories') {
    return res.status(403).json({ error: 'Forbidden: Teachers can only delete exams, summaries, and categories' });
  }
  
  try {
    await Model.findOneAndDelete({ id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initial Seeding Route (called once manually if needed)
app.post('/api/seed/init', async (req, res) => {
  try {
    const User = models.exam_app_users;
    if (await User.countDocuments() === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password', salt);
      await User.create({ id: 'u1', name: 'Admin', role: 'admin', email: 'admin@admin.com', password: hashedPassword });
    }
    const Category = models.exam_app_categories;
    if (await Category.countDocuments() === 0) {
      await Category.create({ id: 'c1', name: 'คณิตศาสตร์', description: 'วิชาคณิตศาสตร์ ม.ปลาย' });
      await Category.create({ id: 'c2', name: 'ภาษาอังกฤษ', description: 'วิชาภาษาอังกฤษ' });
    }
    res.json({ success: true, message: 'Database seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SGS Grade Scraper & Local Data Storage
// ==========================================
const SGS_CACHE_DIR = path.join(__dirname, 'data/sgs_cache');
if (!fs.existsSync(SGS_CACHE_DIR)) {
  fs.mkdirSync(SGS_CACHE_DIR, { recursive: true });
}

// 1. Query grades (Check DATA Cache first, otherwise run Python crawler)
app.post('/api/sgs/grades', async (req, res) => {
  const { student_id, citizen_id, semester = 0, force_refresh = false } = req.body;

  if (!student_id) {
    return res.status(400).json({ success: false, error: 'กรุณากรอกเลขประจำตัวนักเรียน' });
  }

  const cleanStudentId = String(student_id).trim();

  // Demo mode
  if (cleanStudentId === 'demo' || cleanStudentId === '99999') {
    const demoPath = path.join(SGS_CACHE_DIR, 'demo.json');
    if (fs.existsSync(demoPath)) {
      try {
        const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
        return res.json({ ...demoData, from_cache: true, is_demo: true });
      } catch (e) {}
    }
  }

  const cacheFile = path.join(SGS_CACHE_DIR, `${cleanStudentId}.json`);

  // Check DATA cache if not forcing fresh crawl
  if (!force_refresh && fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (cached && (cached.grades?.length > 0 || cached.by_semester)) {
        return res.json({
          ...cached,
          from_cache: true
        });
      }
    } catch (err) {
      console.error('Error reading SGS cache file:', err);
    }
  }

  // If no cache or force refresh, require citizen_id to query SGS
  if (!citizen_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'ไม่พบข้อมูลที่บันทึกไว้ในระบบ กรุณากรอกเลขประจำตัวประชาชน 13 หลักเพื่อดึงข้อมูลจาก SGS' 
    });
  }

  const cleanCitizenId = String(citizen_id).trim();
  const scriptPath = path.join(__dirname, 'sgs_crawler.py');

  const args = [
    scriptPath,
    '--student-id', cleanStudentId,
    '--citizen-id', cleanCitizenId,
    '--semester', String(semester || 0),
    '--output', cacheFile
  ];

  execFile('python', args, { maxBuffer: 15 * 1024 * 1024, timeout: 90000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('SGS crawler error:', stderr || error.message);
      
      // Try to parse error output from Python if returned as JSON
      if (stdout) {
        try {
          const parsedErr = JSON.parse(stdout.trim());
          if (parsedErr && parsedErr.error) {
            return res.status(400).json(parsedErr);
          }
        } catch (e) {}
      }

      // If live crawl failed but cache exists, return cache with warning
      if (fs.existsSync(cacheFile)) {
        try {
          const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          return res.json({
            ...cached,
            from_cache: true,
            warning: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ SGS ได้ในขณะนี้ จึงแสดงข้อมูลที่บันทึกไว้ล่าสุด'
          });
        } catch (e) {}
      }

      const isTimeout = error.killed || error.signal === 'SIGTERM' || (error.message && error.message.includes('TIMEDOUT'));
      const friendlyMsg = isTimeout
        ? 'เซิร์ฟเวอร์ SGS (สพฐ.) ตอบสนองช้าเกินไปในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือทดลองใช้ข้อมูลตัวอย่าง (Demo)'
        : (stderr || error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ SGS');

      return res.status(500).json({
        success: false,
        error: friendlyMsg
      });
    }

    try {
      const result = JSON.parse(stdout);
      return res.json({
        ...result,
        from_cache: false
      });
    } catch (parseErr) {
      console.error('Failed to parse SGS output:', stdout);
      return res.status(500).json({
        success: false,
        error: 'เซิร์ฟเวอร์ส่งข้อมูลกลับมาในรูปแบบที่ไม่ถูกต้อง'
      });
    }
  });
});

// 2. Check if student has cached data in DATA storage
app.get('/api/sgs/cache/:student_id', (req, res) => {
  const { student_id } = req.params;
  const cleanId = String(student_id).trim();
  const cacheFile = path.join(SGS_CACHE_DIR, `${cleanId}.json`);

  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return res.json({
        has_cache: true,
        student_id: cached.student_id,
        student_name: cached.student_name,
        last_updated: cached.last_updated,
        total_courses: cached.total_courses,
        semesters: cached.semesters || []
      });
    } catch (e) {
      return res.json({ has_cache: false });
    }
  }
  return res.json({ has_cache: false });
});

// 3. Clear DATA cache for student
app.delete('/api/sgs/cache/:student_id', (req, res) => {
  const { student_id } = req.params;
  const cleanId = String(student_id).trim();
  const cacheFile = path.join(SGS_CACHE_DIR, `${cleanId}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      fs.unlinkSync(cacheFile);
    } catch (e) {}
  }
  res.json({ success: true, message: 'ลบข้อมูลแคชเรียบร้อยแล้ว' });
});

// Serve frontend static files
const distPath = path.join(__dirname, '../dist');

// Serve .mobileconfig with correct MIME type for iOS Web Clip profile installation
app.get('/install.mobileconfig', (req, res) => {
  const filePath = path.join(distPath, 'install.mobileconfig');
  res.setHeader('Content-Type', 'application/x-apple-aspen-config');
  res.setHeader('Content-Disposition', 'attachment; filename="dek-sa.mobileconfig"');
  res.sendFile(filePath);
});

app.use(express.static(distPath));

// Handle React routing, return all requests to React app
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
