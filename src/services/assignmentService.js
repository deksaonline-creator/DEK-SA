import { supabase } from '../store/mockDb';
import JSZip from 'jszip';

// ==============================================================================
// Mock Fallback Data (ใช้เมื่อ Supabase ยังไม่ได้รัน Migration ตามที่ผู้ใช้แจ้ง)
// ==============================================================================
const STORAGE_PREFIX = 'deksa_assignment_';

const INITIAL_MOCK_PROFILES = [
  {
    id: 'user-teacher-01',
    role: 'teacher',
    student_id: 'T-8801',
    first_name: 'กานต์',
    last_name: 'วิทยากิตติ์',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    grade_level: 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี'
  },
  {
    id: 'user-student-01',
    role: 'student',
    student_id: '65101',
    first_name: 'กวินทร์',
    last_name: 'สุขสมบูรณ์',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    grade_level: 'ม.4/1 เลขที่ 1'
  },
  {
    id: 'user-student-02',
    role: 'student',
    student_id: '65102',
    first_name: 'ปภาดา',
    last_name: 'รัตนมงคล',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    grade_level: 'ม.4/1 เลขที่ 2'
  },
  {
    id: 'user-student-03',
    role: 'student',
    student_id: '65103',
    first_name: 'ธนภูมิ',
    last_name: 'เจริญกิจ',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    grade_level: 'ม.4/1 เลขที่ 3'
  }
];

const INITIAL_MOCK_COURSES = [
  {
    id: 'course-cs401',
    code: 'ว30101',
    name: 'วิทยาการคำนวณ 1',
    description: 'ศึกษาการคิดเชิงคำนวณ การวิเคราะห์ข้อมูล และการแก้ปัญหาด้วยอัลกอริทึม สำหรับนักเรียนชั้น ม.4',
    cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
    teacher_id: 'user-teacher-01',
    teacher_name: 'อ.กานต์ วิทยากิตติ์',
    join_code: 'CS401A',
    academic_year: '2569',
    semester: 1,
    student_count: 36,
    is_archived: false,
    created_at: '2026-05-15T08:30:00Z'
  },
  {
    id: 'course-web502',
    code: 'ว30202',
    name: 'การพัฒนาเว็บแอปพลิเคชัน',
    description: 'เรียนรู้พื้นฐาน HTML5, CSS3, JavaScript และการสร้าง Full-Stack Web Application ด้วย React และ Cloud Database',
    cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
    teacher_id: 'user-teacher-01',
    teacher_name: 'อ.กานต์ วิทยากิตติ์',
    join_code: 'WEB502',
    academic_year: '2569',
    semester: 1,
    student_count: 40,
    is_archived: false,
    created_at: '2026-05-18T09:00:00Z'
  }
];

const INITIAL_MOCK_ENROLLMENTS = [
  { id: 'en-01', course_id: 'course-cs401', student_id: 'user-student-01', enrolled_at: '2026-05-16T08:00:00Z' },
  { id: 'en-02', course_id: 'course-cs401', student_id: 'user-student-02', enrolled_at: '2026-05-16T08:05:00Z' },
  { id: 'en-03', course_id: 'course-cs401', student_id: 'user-student-03', enrolled_at: '2026-05-16T08:10:00Z' },
  { id: 'en-04', course_id: 'course-web502', student_id: 'user-student-01', enrolled_at: '2026-05-19T08:00:00Z' },
  { id: 'en-05', course_id: 'course-web502', student_id: 'user-student-02', enrolled_at: '2026-05-19T08:05:00Z' }
];

const now = new Date();
const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
const past2Days = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

const INITIAL_MOCK_ASSIGNMENTS = [
  {
    id: 'asg-01',
    course_id: 'course-cs401',
    title: 'ใบงานที่ 1: การออกแบบผังงาน (Flowchart) และอัลกอริทึม',
    description: 'ให้นักเรียนออกแบบผังงาน Flowchart จำลองขั้นตอนการทำงานของระบบสั่งอาหารออนไลน์ มีเงื่อนไขการตรวจสอบยอดเงินและการเลือกวิธีชำระเงิน แนบไฟล์สรุปส่งเป็น PDF',
    due_date: in3Days,
    max_score: 10.00,
    allow_late: true,
    status: 'published',
    created_at: '2026-10-10T10:00:00Z',
    files: [
      {
        id: 'file-doc-01',
        file_name: 'ใบงานที่_1_Flowchart_คำสั่งงาน.pdf',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_size: 450200,
        file_type: 'application/pdf'
      }
    ]
  },
  {
    id: 'asg-02',
    course_id: 'course-cs401',
    title: 'ใบงานที่ 2: การเขียนโปรแกรมภาษา Python เบื้องต้น',
    description: 'ให้นักเรียนเขียนโปรแกรมรับค่าคะแนน 5 วิชา แล้วคำนวณหาเกรดเฉลี่ย พร้อมแสดงผลทางหน้าจอ แคปรูปภาพผลลัพธ์และส่งไฟล์โค้ด .py หรือ .zip',
    due_date: in7Days,
    max_score: 15.00,
    allow_late: false,
    status: 'published',
    created_at: '2026-10-12T13:30:00Z',
    files: [
      {
        id: 'file-doc-02',
        file_name: 'ตัวอย่าง_Python_Exercise_2.pdf',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_size: 680000,
        file_type: 'application/pdf'
      }
    ]
  },
  {
    id: 'asg-03',
    course_id: 'course-cs401',
    title: 'การบ้านก่อนสอบกลางภาค: สรุปผังความคิดการแก้ปัญหาเชิงคำนวณ',
    description: 'สรุป 4 เสาหลักของ Computational Thinking (Decomposition, Pattern Recognition, Abstraction, Algorithm Design) ความยาว 1 หน้ากระดาษ A4',
    due_date: past2Days, // เลยกำหนด
    max_score: 10.00,
    allow_late: true,
    status: 'published',
    created_at: '2026-10-01T09:00:00Z',
    files: []
  },
  {
    id: 'asg-04',
    course_id: 'course-web502',
    title: 'มินิโปรเจกต์: หน้าเว็บไซต์ Portfolio ส่วนตัวด้วย HTML/CSS',
    description: 'ออกแบบหน้าเว็บแนะนำตัวที่รองรับ Mobile Responsive มีการใช้ Flexbox/Grid และตกแต่งโทนสีสวยงาม ส่งเป็นไฟล์ ZIP หรือลิงก์โฮสติ้ง',
    due_date: in7Days,
    max_score: 20.00,
    allow_late: true,
    status: 'published',
    created_at: '2026-10-11T11:00:00Z',
    files: []
  }
];

const INITIAL_MOCK_SUBMISSIONS = [
  {
    id: 'sub-01',
    assignment_id: 'asg-01',
    student_id: 'user-student-01',
    student_name: 'กวินทร์ สุขสมบูรณ์',
    student_code: '65101',
    submitted_at: '2026-10-14T14:20:00Z',
    status: 'graded',
    note: 'ส่งงานใบงานที่ 1 ครับ ออกแบบระบบตามเงื่อนไขครบถ้วนครับ',
    files: [
      {
        id: 'subfile-01',
        file_name: '65101_กวินทร์_Flowchart.pdf',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_size: 512000,
        file_type: 'application/pdf'
      }
    ],
    grade: {
      score: 9.5,
      feedback: 'ออกแบบผังงานถูกต้องตามมาตรฐาน สัญลักษณ์และเส้นเชื่อมชัดเจนดีมาก',
      graded_at: '2026-10-15T09:30:00Z',
      graded_by_name: 'อ.กานต์ วิทยากิตติ์'
    }
  },
  {
    id: 'sub-02',
    assignment_id: 'asg-01',
    student_id: 'user-student-02',
    student_name: 'ปภาดา รัตนมงคล',
    student_code: '65102',
    submitted_at: '2026-10-15T16:45:00Z',
    status: 'submitted',
    note: 'ส่งใบงานที่ 1 ค่ะอาจารย์',
    files: [
      {
        id: 'subfile-02',
        file_name: '65102_ปภาดา_ใบงานที่1.pdf',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_size: 780000,
        file_type: 'application/pdf'
      }
    ],
    grade: null
  },
  {
    id: 'sub-03',
    assignment_id: 'asg-03',
    student_id: 'user-student-01',
    student_name: 'กวินทร์ สุขสมบูรณ์',
    student_code: '65101',
    submitted_at: '2026-10-04T10:00:00Z',
    status: 'graded',
    note: 'ส่งสรุปผังความคิดครับ',
    files: [
      {
        id: 'subfile-03',
        file_name: '65101_สรุป_ComputationalThinking.pdf',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        file_size: 320000,
        file_type: 'application/pdf'
      }
    ],
    grade: {
      score: 10.0,
      feedback: 'สรุปได้กระชับ และยกตัวอย่างประกอบได้เข้าใจง่ายมาก เยี่ยมมากครับ',
      graded_at: '2026-10-05T11:00:00Z',
      graded_by_name: 'อ.กานต์ วิทยากิตติ์'
    }
  }
];

const INITIAL_MOCK_ANNOUNCEMENTS = [
  {
    id: 'ann-01',
    course_id: 'course-cs401',
    title: 'นัดหมายสอบย่อยบทที่ 1 สัปดาห์หน้า',
    content: 'ขอให้นักเรียนทบทวนเนื้อหาการคิดเชิงคำนวณ และการเขียนผังงาน โดยจะมีข้อสอบอัตนัย 3 ข้อในคาบเรียนวันอังคาร',
    created_at: '2026-10-12T08:00:00Z',
    created_by_name: 'อ.กานต์ วิทยากิตติ์'
  }
];

const INITIAL_MOCK_NOTIFICATIONS = [
  {
    id: 'notif-01',
    user_id: 'user-student-01',
    title: 'ตรวจงานแล้ว: ใบงานที่ 1 การออกแบบผังงาน',
    message: 'คุณได้รับคะแนน 9.5 / 10.00 คะแนน พร้อมคำแนะนำจากครูผู้สอน',
    link: '/assignments/asg-01',
    type: 'grade',
    is_read: false,
    created_at: '2026-10-15T09:30:00Z'
  },
  {
    id: 'notif-02',
    user_id: 'user-student-01',
    title: 'มีงานใหม่: ใบงานที่ 2 Python เบื้องต้น',
    message: 'วิชา ว30101 วิทยาการคำนวณ 1 กำหนดส่งอีก 7 วันข้างหน้า',
    link: '/assignments/asg-02',
    type: 'assignment',
    is_read: true,
    created_at: '2026-10-12T13:30:00Z'
  }
];

// Helper ฟังก์ชันสำหรับ LocalStorage Mock Store
function getStore(key, defaultData) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  setStore(key, defaultData);
  return defaultData;
}

function setStore(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
}

// โหมดจำลองผู้ใช้ (Active Role State)
export function getActiveUser() {
  try {
    const saved = localStorage.getItem('deksa_assignment_active_user');
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  // ดีฟอลต์เป็นนักเรียนคนที่ 1 (เพื่อความสะดวกในการทดสอบ)
  const defaultUser = INITIAL_MOCK_PROFILES[1];
  localStorage.setItem('deksa_assignment_active_user', JSON.stringify(defaultUser));
  return defaultUser;
}

export function setActiveUser(user) {
  localStorage.setItem('deksa_assignment_active_user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('assignment-user-changed', { detail: user }));
}

export function getAllMockProfiles() {
  return getStore('profiles', INITIAL_MOCK_PROFILES);
}

// ==============================================================================
// Course Services
// ==============================================================================
export async function getCourses(user = getActiveUser()) {
  try {
    // ลองดึงจาก Supabase ก่อน
    const { data, error } = await supabase.from('courses').select('*, teacher:teacher_id(first_name, last_name)');
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {}

  // Fallback to local store
  const courses = getStore('courses', INITIAL_MOCK_COURSES);
  const enrollments = getStore('enrollments', INITIAL_MOCK_ENROLLMENTS);

  if (user.role === 'teacher') {
    return courses.filter(c => c.teacher_id === user.id || !c.teacher_id);
  } else if (user.role === 'admin') {
    return courses;
  } else {
    // นักเรียน: คืนเฉพาะวิชาที่ลงทะเบียน
    const enrolledIds = enrollments.filter(e => e.student_id === user.id).map(e => e.course_id);
    return courses.filter(c => enrolledIds.includes(c.id));
  }
}

export async function getCourseById(courseId) {
  try {
    const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (!error && data) return data;
  } catch (e) {}

  const courses = getStore('courses', INITIAL_MOCK_COURSES);
  return courses.find(c => c.id === courseId) || null;
}

export async function createCourse(courseData, teacher = getActiveUser()) {
  const newCourse = {
    id: 'course-' + Date.now(),
    code: courseData.code,
    name: courseData.name,
    description: courseData.description || '',
    cover_image: courseData.cover_image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
    teacher_id: teacher.id,
    teacher_name: `อ.${teacher.first_name} ${teacher.last_name}`,
    join_code: courseData.join_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
    academic_year: courseData.academic_year || '2569',
    semester: Number(courseData.semester) || 1,
    student_count: 0,
    is_archived: false,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('courses').insert(newCourse).select().single();
    if (!error && data) return data;
  } catch (e) {}

  const courses = getStore('courses', INITIAL_MOCK_COURSES);
  courses.unshift(newCourse);
  setStore('courses', courses);
  return newCourse;
}

export async function joinCourseByCode(joinCode, student = getActiveUser()) {
  const cleanCode = joinCode.trim().toUpperCase();
  const courses = getStore('courses', INITIAL_MOCK_COURSES);
  const course = courses.find(c => c.join_code.toUpperCase() === cleanCode);

  if (!course) {
    throw new Error('ไม่พบรายวิชาที่ตรงกับรหัส ' + cleanCode + ' กรุณาตรวจสอบรหัสอีกครั้ง');
  }

  const enrollments = getStore('enrollments', INITIAL_MOCK_ENROLLMENTS);
  const alreadyEnrolled = enrollments.some(e => e.course_id === course.id && e.student_id === student.id);

  if (alreadyEnrolled) {
    return { success: true, message: 'คุณลงทะเบียนในวิชานี้อยู่แล้ว', course };
  }

  const newEnrollment = {
    id: 'en-' + Date.now(),
    course_id: course.id,
    student_id: student.id,
    enrolled_at: new Date().toISOString()
  };

  enrollments.push(newEnrollment);
  setStore('enrollments', enrollments);

  // เพิ่ม count
  course.student_count = (course.student_count || 0) + 1;
  setStore('courses', courses);

  return { success: true, message: 'เข้าร่วมวิชา ' + course.name + ' เรียบร้อยแล้ว', course };
}

// ==============================================================================
// Assignment Services
// ==============================================================================
export async function getAssignments(courseId = null, filter = 'all', user = getActiveUser()) {
  const allAssignments = getStore('assignments', INITIAL_MOCK_ASSIGNMENTS);
  const submissions = getStore('submissions', INITIAL_MOCK_SUBMISSIONS);
  const courses = getStore('courses', INITIAL_MOCK_COURSES);

  let filtered = allAssignments.map(asg => {
    const course = courses.find(c => c.id === asg.course_id) || {};
    const mySub = submissions.find(s => s.assignment_id === asg.id && s.student_id === user.id);
    const allSubs = submissions.filter(s => s.assignment_id === asg.id);

    return {
      ...asg,
      course_name: course.name || 'รายวิชาทั่วไป',
      course_code: course.code || '-',
      my_submission: mySub || null,
      submission_status: mySub ? mySub.status : 'missing',
      submission_count: allSubs.length,
      graded_count: allSubs.filter(s => s.status === 'graded').length
    };
  });

  if (courseId && courseId !== 'all') {
    filtered = filtered.filter(a => a.course_id === courseId);
  }

  // Filter tab logic
  if (filter === 'pending') {
    // ยังไม่ส่ง
    filtered = filtered.filter(a => !a.my_submission && new Date(a.due_date) >= new Date());
  } else if (filter === 'submitted') {
    // ส่งแล้ว (รอตรวจ)
    filtered = filtered.filter(a => a.my_submission && a.my_submission.status !== 'graded');
  } else if (filter === 'graded') {
    // ตรวจแล้ว
    filtered = filtered.filter(a => a.my_submission && a.my_submission.status === 'graded');
  } else if (filter === 'overdue') {
    // เลยกำหนดส่ง
    filtered = filtered.filter(a => !a.my_submission && new Date(a.due_date) < new Date());
  }

  // Sort by due date (ใกล้ถึงกำหนดส่งมากสุดขึ้นก่อน)
  filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  return filtered;
}

export async function getAssignmentById(assignmentId, user = getActiveUser()) {
  const assignments = getStore('assignments', INITIAL_MOCK_ASSIGNMENTS);
  const courses = getStore('courses', INITIAL_MOCK_COURSES);
  const submissions = getStore('submissions', INITIAL_MOCK_SUBMISSIONS);

  const asg = assignments.find(a => a.id === assignmentId);
  if (!asg) return null;

  const course = courses.find(c => c.id === asg.course_id) || {};
  const mySub = submissions.find(s => s.assignment_id === asg.id && s.student_id === user.id);
  const allSubs = submissions.filter(s => s.assignment_id === asg.id);

  return {
    ...asg,
    course,
    my_submission: mySub || null,
    all_submissions: allSubs
  };
}

export async function createAssignment(assignmentData, attachedFiles = []) {
  const newAsg = {
    id: 'asg-' + Date.now(),
    course_id: assignmentData.course_id,
    title: assignmentData.title,
    description: assignmentData.description || '',
    due_date: assignmentData.due_date,
    max_score: Number(assignmentData.max_score) || 10.00,
    allow_late: assignmentData.allow_late !== false,
    status: assignmentData.status || 'published',
    created_at: new Date().toISOString(),
    files: attachedFiles.map((f, i) => ({
      id: 'file-' + Date.now() + '-' + i,
      file_name: f.name || f.file_name,
      file_url: f.url || f.file_url || URL.createObjectURL(f),
      file_size: f.size || f.file_size || 0,
      file_type: f.type || f.file_type || 'application/pdf'
    }))
  };

  const assignments = getStore('assignments', INITIAL_MOCK_ASSIGNMENTS);
  assignments.unshift(newAsg);
  setStore('assignments', assignments);

  // Broadcast notification to mock students
  if (newAsg.status === 'published') {
    const notifs = getStore('notifications', INITIAL_MOCK_NOTIFICATIONS);
    notifs.unshift({
      id: 'notif-' + Date.now(),
      user_id: 'user-student-01',
      title: 'งานใหม่: ' + newAsg.title,
      message: 'มีงานใหม่เข้ามา กำหนดส่ง ' + newAsg.due_date,
      link: '/assignments/' + newAsg.id,
      type: 'assignment',
      is_read: false,
      created_at: new Date().toISOString()
    });
    setStore('notifications', notifs);
  }

  return newAsg;
}

// ==============================================================================
// Submission Services
// ==============================================================================
export async function submitAssignment(assignmentId, files = [], note = '', student = getActiveUser()) {
  const assignments = getStore('assignments', INITIAL_MOCK_ASSIGNMENTS);
  const asg = assignments.find(a => a.id === assignmentId);
  if (!asg) throw new Error('ไม่พบงานที่ต้องการส่ง');

  const now = new Date();
  const isLate = now > new Date(asg.due_date);

  if (isLate && !asg.allow_late) {
    throw new Error('การบ้านชิ้นนี้ปิดรับส่งแล้ว และไม่อนุญาตให้ส่งล่าช้า');
  }

  const submissions = getStore('submissions', INITIAL_MOCK_SUBMISSIONS);
  const existingIndex = submissions.findIndex(s => s.assignment_id === assignmentId && s.student_id === student.id);

  const uploadedFiles = files.map((f, i) => ({
    id: 'subfile-' + Date.now() + '-' + i,
    file_name: f.name,
    file_url: f.url || (typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(f) : '#'),
    file_size: f.size || 0,
    file_type: f.type || 'application/pdf'
  }));

  const submissionObj = {
    id: existingIndex >= 0 ? submissions[existingIndex].id : 'sub-' + Date.now(),
    assignment_id: assignmentId,
    student_id: student.id,
    student_name: `${student.first_name} ${student.last_name}`,
    student_code: student.student_id || '65000',
    submitted_at: now.toISOString(),
    status: isLate ? 'late' : 'submitted',
    resubmitted_at: existingIndex >= 0 ? now.toISOString() : null,
    note: note,
    files: uploadedFiles,
    grade: null
  };

  if (existingIndex >= 0) {
    submissions[existingIndex] = submissionObj;
  } else {
    submissions.unshift(submissionObj);
  }

  setStore('submissions', submissions);
  return submissionObj;
}

// ==============================================================================
// Grading Services (สำหรับครูผู้สอน)
// ==============================================================================
export async function gradeSubmission(submissionId, score, feedback = '', teacher = getActiveUser()) {
  const submissions = getStore('submissions', INITIAL_MOCK_SUBMISSIONS);
  const subIndex = submissions.findIndex(s => s.id === submissionId);
  if (subIndex === -1) throw new Error('ไม่พบข้อมูลการส่งงาน');

  const sub = submissions[subIndex];
  sub.status = 'graded';
  sub.grade = {
    score: Number(score),
    feedback: feedback.trim(),
    graded_at: new Date().toISOString(),
    graded_by_name: `อ.${teacher.first_name} ${teacher.last_name}`
  };

  submissions[subIndex] = sub;
  setStore('submissions', submissions);

  // ส่งแจ้งเตือนให้นักเรียน
  const notifs = getStore('notifications', INITIAL_MOCK_NOTIFICATIONS);
  notifs.unshift({
    id: 'notif-' + Date.now(),
    user_id: sub.student_id,
    title: 'ผลการตรวจงาน',
    message: `คุณได้รับคะแนน ${score} คะแนน พร้อมคำแนะนำจากครูผู้สอน`,
    link: `/assignments/${sub.assignment_id}`,
    type: 'grade',
    is_read: false,
    created_at: new Date().toISOString()
  });
  setStore('notifications', notifs);

  return sub;
}

// Download all submissions as ZIP
export async function downloadAllSubmissionsZip(assignmentId) {
  const asg = await getAssignmentById(assignmentId);
  if (!asg) throw new Error('ไม่พบงาน');

  const zip = new JSZip();
  const folderName = `${asg.course_code}_${asg.title}`.replace(/[\/\\?%*:|"<>]/g, '_');
  const folder = zip.folder(folderName);

  const submissions = asg.all_submissions || [];
  if (submissions.length === 0) {
    throw new Error('ยังไม่มีนักเรียนส่งงานในชิ้นนี้');
  }

  for (const sub of submissions) {
    const studentPrefix = `${sub.student_code}_${sub.student_name}`.replace(/[\/\\?%*:|"<>]/g, '_');
    
    // ใส่ Note ข้อความของนักเรียน
    if (sub.note) {
      folder.file(`${studentPrefix}/ข้อความจากนักเรียน.txt`, `นักเรียน: ${sub.student_name}\nส่งเมื่อ: ${sub.submitted_at}\nสถานะ: ${sub.status}\n\nข้อความ:\n${sub.note}`);
    }

    // ดาวน์โหลดไฟล์แต่ละไฟล์
    for (const f of sub.files || []) {
      try {
        const response = await fetch(f.file_url);
        const blob = await response.blob();
        folder.file(`${studentPrefix}/${f.file_name}`, blob);
      } catch (err) {
        // หาก blob ดึงไม่ได้ (เช่น mock url) ให้เขียน dummy text เพื่อให้ zip ไม่เสีย
        folder.file(`${studentPrefix}/${f.file_name}.txt`, `ไฟล์: ${f.file_name} (${f.file_size} bytes)\nURL: ${f.file_url}`);
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${folderName}_ไฟล์ส่งงานทั้งหมด.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

// ==============================================================================
// Announcements & Notifications
// ==============================================================================
export async function getAnnouncements(courseId) {
  const ann = getStore('announcements', INITIAL_MOCK_ANNOUNCEMENTS);
  if (!courseId || courseId === 'all') return ann;
  return ann.filter(a => a.course_id === courseId);
}

export async function createAnnouncement(courseId, title, content, teacher = getActiveUser()) {
  const newAnn = {
    id: 'ann-' + Date.now(),
    course_id: courseId,
    title: title.trim(),
    content: content.trim(),
    created_at: new Date().toISOString(),
    created_by_name: `อ.${teacher.first_name} ${teacher.last_name}`
  };

  const ann = getStore('announcements', INITIAL_MOCK_ANNOUNCEMENTS);
  ann.unshift(newAnn);
  setStore('announcements', ann);
  return newAnn;
}

export async function getNotifications(user = getActiveUser()) {
  const notifs = getStore('notifications', INITIAL_MOCK_NOTIFICATIONS);
  return notifs.filter(n => n.user_id === user.id);
}

export async function markNotificationRead(notifId) {
  const notifs = getStore('notifications', INITIAL_MOCK_NOTIFICATIONS);
  const target = notifs.find(n => n.id === notifId);
  if (target) {
    target.is_read = true;
    setStore('notifications', notifs);
  }
}
