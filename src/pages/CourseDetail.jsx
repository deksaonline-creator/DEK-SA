import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AssignmentRoleBar from '../components/assignment/AssignmentRoleBar';
import CreateAssignmentModal from '../components/assignment/CreateAssignmentModal';
import { 
  getCourseById, 
  getAssignments, 
  getAnnouncements, 
  createAnnouncement, 
  getActiveUser 
} from '../services/assignmentService';
import { formatThaiDateShort, getTimeRemaining } from '../utils/thaiDate';
import { 
  ArrowLeft, BookOpen, KeyRound, Copy, Check, 
  Users, Plus, Megaphone, FileText, ChevronRight, 
  Calendar, Clock, Award, Send
} from 'lucide-react';
import '../components/assignment/Assignment.css';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState(getActiveUser());
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('classwork'); // 'classwork', 'announcements', 'people'
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCreateAsg, setShowCreateAsg] = useState(false);

  // New announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [postingAnn, setPostingAnn] = useState(false);

  useEffect(() => {
    loadCourseData();
    const handleUserChange = (e) => {
      setActiveUser(e.detail);
      loadCourseData(e.detail);
    };
    window.addEventListener('assignment-user-changed', handleUserChange);
    return () => window.removeEventListener('assignment-user-changed', handleUserChange);
  }, [courseId]);

  const loadCourseData = async (user = getActiveUser()) => {
    setLoading(true);
    try {
      const [cData, asgData, annData] = await Promise.all([
        getCourseById(courseId),
        getAssignments(courseId, 'all', user),
        getAnnouncements(courseId)
      ]);
      setCourse(cData);
      setAssignments(asgData || []);
      setAnnouncements(annData || []);
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!course?.join_code) return;
    navigator.clipboard.writeText(course.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setPostingAnn(true);
    try {
      await createAnnouncement(courseId, annTitle, annContent, activeUser);
      setAnnTitle('');
      setAnnContent('');
      setPostingAnn(false);
      loadCourseData();
    } catch (err) {
      setPostingAnn(false);
      alert(err.message || 'โพสต์ประกาศไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ textAlign: 'center', padding: '6rem 0', color: '#a1a1aa' }}>
          กำลังโหลดข้อมูลรายวิชา...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div className="asg-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2>ไม่พบรายวิชานี้</h2>
          <button type="button" className="asg-btn-primary" onClick={() => navigate('/assignments')} style={{ marginTop: '1rem' }}>
            กลับหน้ารวมการบ้าน
          </button>
        </div>
      </div>
    );
  }

  const isTeacher = activeUser.role !== 'student';

  return (
    <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="asg-container">
        <AssignmentRoleBar onActionTriggered={() => loadCourseData()} />

        {/* Back Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button 
            type="button" 
            className="asg-btn-secondary" 
            onClick={() => navigate('/assignments')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            <span>กลับหน้ารายการ</span>
          </button>
        </div>

        {/* Course Banner */}
        <div style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '2rem',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '2rem',
          backgroundImage: `linear-gradient(to top, rgba(11, 12, 16, 0.95) 10%, rgba(11, 12, 16, 0.4) 60%, rgba(11, 12, 16, 0.2)), url(${course.cover_image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="asg-course-pill" style={{ marginBottom: '0.5rem', background: 'rgba(66, 135, 245, 0.3)', color: '#93c5fd' }}>
                {course.code} • ภาคเรียนที่ {course.semester || 1} ปีการศึกษา {course.academic_year || '2569'}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {course.name}
              </h1>
              <p style={{ color: '#d4d4d8', maxWidth: '650px', fontSize: '0.95rem', marginTop: '0.3rem' }}>
                {course.description || 'ไม่มีคำอธิบายรายวิชา'}
              </p>
              <div style={{ color: '#a1a1aa', fontSize: '0.88rem', marginTop: '0.5rem' }}>
                ผู้สอน: <strong style={{ color: '#fff' }}>{course.teacher_name || 'อาจารย์ประจำวิชา'}</strong> • นักเรียน {course.student_count || 36} คน
              </div>
            </div>

            {/* Join Code Box */}
            <div style={{ background: 'rgba(22, 23, 29, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '0.8rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>รหัสเข้าห้องเรียน (Join Code)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '2px' }}>
                  {course.join_code}
                </div>
              </div>
              <button 
                type="button" 
                className="asg-btn-secondary" 
                onClick={handleCopyCode}
                title="คัดลอกรหัสเข้าห้องเรียน"
                style={{ padding: '0.5rem 0.75rem' }}
              >
                {copiedCode ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          <button 
            type="button" 
            className={`asg-tab-btn ${activeTab === 'classwork' ? 'active' : ''}`}
            onClick={() => setActiveTab('classwork')}
            style={{ fontSize: '0.95rem', padding: '0.5rem 1.25rem' }}
          >
            <FileText size={18} />
            <span>งานของชั้นเรียน ({assignments.length})</span>
          </button>
          <button 
            type="button" 
            className={`asg-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
            style={{ fontSize: '0.95rem', padding: '0.5rem 1.25rem' }}
          >
            <Megaphone size={18} />
            <span>กระดานประกาศ ({announcements.length})</span>
          </button>
          <button 
            type="button" 
            className={`asg-tab-btn ${activeTab === 'people' ? 'active' : ''}`}
            onClick={() => setActiveTab('people')}
            style={{ fontSize: '0.95rem', padding: '0.5rem 1.25rem' }}
          >
            <Users size={18} />
            <span>สมาชิกในห้อง</span>
          </button>
        </div>

        {/* TAB 1: Classwork */}
        {activeTab === 'classwork' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>รายการการบ้านทั้งหมด</h2>
              {isTeacher && (
                <button 
                  type="button" 
                  className="asg-btn-primary" 
                  onClick={() => setShowCreateAsg(true)}
                >
                  <Plus size={16} />
                  <span>มอบหมายงานใหม่ในวิชานี้</span>
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="asg-empty">
                <FileText size={42} className="asg-empty-icon" />
                <h3>ยังไม่มีการมอบหมายงานในวิชานี้</h3>
                <p>เมื่อครูผู้สอนสั่งการบ้าน ชิ้นงานจะปรากฏที่นี่</p>
              </div>
            ) : (
              <div className="asg-cards-grid">
                {assignments.map(asg => {
                  const timeRemain = getTimeRemaining(asg.due_date);
                  return (
                    <div 
                      key={asg.id} 
                      className="asg-card"
                      onClick={() => navigate(`/assignments/${asg.id}`)}
                    >
                      <div>
                        <div className="asg-card-top">
                          <span className={`asg-due-pill ${timeRemain.urgency}`}>
                            <Clock size={12} />
                            {timeRemain.text}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                            {asg.max_score} คะแนน
                          </span>
                        </div>
                        <h3 className="asg-card-title">{asg.title}</h3>
                        <p className="asg-card-desc">{asg.description || 'ไม่มีคำอธิบาย'}</p>
                      </div>

                      <div className="asg-card-footer">
                        <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                          กำหนดส่ง: {formatThaiDateShort(asg.due_date, false)}
                        </span>
                        <ChevronRight size={16} color="#71717a" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Announcements */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            {/* Teacher Post Form */}
            {isTeacher && (
              <form onSubmit={handlePostAnnouncement} style={{ background: 'rgba(22, 23, 29, 0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Megaphone size={18} color="#4287f5" />
                  ประกาศข่าวสารในชั้นเรียน
                </h3>

                <input 
                  type="text" 
                  placeholder="หัวข้อประกาศ..."
                  className="asg-form-input"
                  required
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                />

                <textarea 
                  rows={3}
                  placeholder="เขียนข้อความถึงนักเรียนทุกคนในห้อง..."
                  className="asg-form-textarea"
                  required
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="asg-btn-primary" disabled={postingAnn}>
                    <Send size={15} />
                    <span>{postingAnn ? 'กำลังโพสต์...' : 'โพสต์ประกาศ'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Announcements List */}
            {announcements.length === 0 ? (
              <div className="asg-empty">
                <Megaphone size={42} className="asg-empty-icon" />
                <h3>ยังไม่มีประกาศในวิชานี้</h3>
                <p>ข่าวสารและการนัดหมายจากครูผู้สอนจะแสดงในกระดานนี้</p>
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} style={{ background: 'rgba(22, 23, 29, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(66, 135, 245, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                        <Megaphone size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{ann.title}</h4>
                        <div style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>
                          โพสต์โดย: {ann.created_by_name || 'ครูผู้สอน'} • {formatThaiDateShort(ann.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p style={{ color: '#e4e4e7', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {ann.content}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: People */}
        {activeTab === 'people' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Teacher section */}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '2px solid var(--primary-color, #4287f5)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#60a5fa' }}>
                ครูผู้สอน
              </h3>
              <div style={{ background: 'rgba(22, 23, 29, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" 
                  alt="Teacher" 
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #a78bfa' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>
                    {course.teacher_name || 'อาจารย์กานต์ วิทยากิตติ์'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
                    กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี
                  </div>
                </div>
              </div>
            </div>

            {/* Students section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  เพื่อนร่วมห้อง ({course.student_count || 36} คน)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { name: 'กวินทร์ สุขสมบูรณ์', code: '65101', role: 'ม.4/1 เลขที่ 1', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
                  { name: 'ปภาดา รัตนมงคล', code: '65102', role: 'ม.4/1 เลขที่ 2', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
                  { name: 'ธนภูมิ เจริญกิจ', code: '65103', role: 'ม.4/1 เลขที่ 3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }
                ].map((s, idx) => (
                  <div key={idx} style={{ background: 'rgba(22, 23, 29, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={s.avatar} alt={s.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{s.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>รหัส: {s.code}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{s.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      <CreateAssignmentModal 
        isOpen={showCreateAsg}
        onClose={() => setShowCreateAsg(false)}
        onCreated={() => loadCourseData()}
        defaultCourseId={courseId}
      />
    </div>
  );
}
