import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AssignmentRoleBar from '../components/assignment/AssignmentRoleBar';
import CreateCourseModal from '../components/assignment/CreateCourseModal';
import CreateAssignmentModal from '../components/assignment/CreateAssignmentModal';
import { 
  getAssignments, 
  getCourses, 
  getActiveUser 
} from '../services/assignmentService';
import { 
  formatThaiDateShort, 
  getTimeRemaining 
} from '../utils/thaiDate';
import { 
  FileUp, BookOpen, Clock, CheckCircle2, 
  AlertTriangle, Search, Filter, Plus, 
  Calendar, Award, ChevronRight, Layers, FileText
} from 'lucide-react';
import '../components/assignment/Assignment.css';

export default function AssignmentPortal() {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState(getActiveUser());
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeFilterTab, setActiveFilterTab] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  useEffect(() => {
    loadData();
    const handleUserChange = (e) => {
      setActiveUser(e.detail);
      loadData(e.detail);
    };
    window.addEventListener('assignment-user-changed', handleUserChange);
    return () => window.removeEventListener('assignment-user-changed', handleUserChange);
  }, [activeFilterTab, selectedCourseId]);

  const loadData = async (user = getActiveUser()) => {
    setLoading(true);
    try {
      const [asgData, coursesData] = await Promise.all([
        getAssignments(selectedCourseId, activeFilterTab, user),
        getCourses(user)
      ]);
      setAssignments(asgData || []);
      setCourses(coursesData || []);
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionTriggered = (action) => {
    if (action === 'open-create-course') {
      setShowCreateCourse(true);
    } else if (action === 'open-create-assignment') {
      setShowCreateAssignment(true);
    } else {
      loadData();
    }
  };

  // Filter search query client-side
  const filteredAssignments = assignments.filter(asg => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      asg.title?.toLowerCase().includes(q) ||
      asg.course_name?.toLowerCase().includes(q) ||
      asg.course_code?.toLowerCase().includes(q) ||
      asg.description?.toLowerCase().includes(q)
    );
  });

  // Calculate Summary Metrics
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.submission_status === 'missing' && !getTimeRemaining(a.due_date).isOverdue).length,
    submitted: assignments.filter(a => a.submission_status === 'submitted' || a.submission_status === 'late').length,
    graded: assignments.filter(a => a.submission_status === 'graded').length,
    overdue: assignments.filter(a => a.submission_status === 'missing' && getTimeRemaining(a.due_date).isOverdue).length
  };

  return (
    <div className="apple-home-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="asg-container">
        {/* Role Bar & Switcher */}
        <AssignmentRoleBar onActionTriggered={handleActionTriggered} />

        {/* Hero Section */}
        <div className="asg-hero">
          <div className="asg-hero-header">
            <div className="asg-hero-title">
              <h1>
                <FileUp size={32} color="#4287f5" />
                ระบบส่งงานออนไลน์ (Online Assignment)
              </h1>
              <p>
                ส่งการบ้าน รายงาน โครงงาน ตรวจสอบกำหนดส่ง และดูคะแนนพร้อมข้อเสนอแนะจากครูผู้สอน
              </p>
            </div>

            <div className="asg-hero-buttons">
              {courses.length > 0 && (
                <button 
                  type="button" 
                  className="asg-btn-secondary"
                  onClick={() => navigate(`/assignments/course/${courses[0].id}`)}
                >
                  <BookOpen size={16} />
                  <span>หน้ารายวิชา</span>
                </button>
              )}
              {activeUser.role !== 'student' && (
                <button 
                  type="button" 
                  className="asg-btn-primary"
                  onClick={() => setShowCreateAssignment(true)}
                >
                  <Plus size={16} />
                  <span>มอบหมายงานใหม่</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="asg-stats-grid">
            <div className="asg-stat-card">
              <div className="asg-stat-icon" style={{ background: 'rgba(66, 135, 245, 0.15)', color: '#4287f5' }}>
                <Layers size={24} />
              </div>
              <div>
                <div className="asg-stat-val">{stats.total}</div>
                <div className="asg-stat-label">งานทั้งหมดในระบบ</div>
              </div>
            </div>

            {activeUser.role === 'student' ? (
              <>
                <div className="asg-stat-card">
                  <div className="asg-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="asg-stat-val" style={{ color: '#fbbf24' }}>{stats.pending}</div>
                    <div className="asg-stat-label">การบ้านที่ต้องส่ง</div>
                  </div>
                </div>

                <div className="asg-stat-card">
                  <div className="asg-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                    <FileUp size={24} />
                  </div>
                  <div>
                    <div className="asg-stat-val" style={{ color: '#60a5fa' }}>{stats.submitted}</div>
                    <div className="asg-stat-label">ส่งแล้ว (รอตรวจ)</div>
                  </div>
                </div>

                <div className="asg-stat-card">
                  <div className="asg-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                    <Award size={24} />
                  </div>
                  <div>
                    <div className="asg-stat-val" style={{ color: '#34d399' }}>{stats.graded}</div>
                    <div className="asg-stat-label">ตรวจแล้ว (มีคะแนน)</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="asg-stat-card">
                  <div className="asg-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <div className="asg-stat-val" style={{ color: '#a78bfa' }}>{courses.length}</div>
                    <div className="asg-stat-label">รายวิชาที่สอน</div>
                  </div>
                </div>

                <div className="asg-stat-card">
                  <div className="asg-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div className="asg-stat-val" style={{ color: '#34d399' }}>
                      {assignments.reduce((sum, a) => sum + (a.graded_count || 0), 0)}
                    </div>
                    <div className="asg-stat-label">ตรวจงานแล้วทั้งหมด</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="asg-filter-bar">
          <div className="asg-filter-tabs">
            <button 
              type="button" 
              className={`asg-tab-btn ${activeFilterTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('all')}
            >
              <span>ทั้งหมด</span>
              <span className="asg-tab-badge">{stats.total}</span>
            </button>
            <button 
              type="button" 
              className={`asg-tab-btn ${activeFilterTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('pending')}
            >
              <span>ต้องส่ง</span>
              {stats.pending > 0 && <span className="asg-tab-badge" style={{ color: '#fbbf24' }}>{stats.pending}</span>}
            </button>
            <button 
              type="button" 
              className={`asg-tab-btn ${activeFilterTab === 'submitted' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('submitted')}
            >
              <span>ส่งแล้ว</span>
              {stats.submitted > 0 && <span className="asg-tab-badge" style={{ color: '#60a5fa' }}>{stats.submitted}</span>}
            </button>
            <button 
              type="button" 
              className={`asg-tab-btn ${activeFilterTab === 'graded' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('graded')}
            >
              <span>ตรวจแล้ว</span>
              {stats.graded > 0 && <span className="asg-tab-badge" style={{ color: '#34d399' }}>{stats.graded}</span>}
            </button>
            <button 
              type="button" 
              className={`asg-tab-btn ${activeFilterTab === 'overdue' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('overdue')}
            >
              <span>เลยกำหนด</span>
              {stats.overdue > 0 && <span className="asg-tab-badge" style={{ color: '#f87171' }}>{stats.overdue}</span>}
            </button>
          </div>

          <div className="asg-filter-search-row">
            <div className="asg-search-box">
              <Search size={18} className="asg-search-icon" />
              <input 
                type="text"
                placeholder="ค้นหาชื่อการบ้าน, รหัสวิชา หรือรายละเอียด..."
                className="asg-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="asg-course-select"
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
            >
              <option value="all">ทุกรายวิชา</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignments Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#a1a1aa' }}>
            กำลังโหลดข้อมูลการบ้าน...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="asg-empty">
            <FileText size={48} className="asg-empty-icon" />
            <h3>ไม่พบรายการการบ้าน</h3>
            <p>ยังไม่มีการบ้านในเงื่อนไขการค้นหานี้ หรือคุณส่งการบ้านครบทุกชิ้นแล้ว</p>
            {activeUser.role !== 'student' && (
              <button 
                type="button" 
                className="asg-btn-primary"
                onClick={() => setShowCreateAssignment(true)}
              >
                <Plus size={16} />
                <span>มอบหมายงานแรก</span>
              </button>
            )}
          </div>
        ) : (
          <div className="asg-cards-grid">
            {filteredAssignments.map(asg => {
              const timeRemain = getTimeRemaining(asg.due_date);
              const isStudent = activeUser.role === 'student';
              const mySub = asg.my_submission;

              return (
                <div 
                  key={asg.id} 
                  className="asg-card"
                  onClick={() => navigate(`/assignments/${asg.id}`)}
                >
                  <div>
                    <div className="asg-card-top">
                      <span className="asg-course-pill">
                        {asg.course_code} • {asg.course_name}
                      </span>
                      <span className={`asg-due-pill ${timeRemain.urgency}`}>
                        <Clock size={12} />
                        {timeRemain.text}
                      </span>
                    </div>

                    <h3 className="asg-card-title">{asg.title}</h3>
                    <p className="asg-card-desc">{asg.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>
                  </div>

                  <div className="asg-card-footer">
                    <div>
                      {isStudent ? (
                        <>
                          {asg.submission_status === 'graded' ? (
                            <span className="asg-status-chip graded">
                              <CheckCircle2 size={13} />
                              ตรวจแล้ว ({mySub?.grade?.score}/{asg.max_score})
                            </span>
                          ) : asg.submission_status === 'submitted' ? (
                            <span className="asg-status-chip submitted">
                              <FileUp size={13} />
                              ส่งแล้ว (รอตรวจ)
                            </span>
                          ) : asg.submission_status === 'late' ? (
                            <span className="asg-status-chip late">
                              <AlertTriangle size={13} />
                              ส่งล่าช้า
                            </span>
                          ) : timeRemain.isOverdue ? (
                            <span className="asg-status-chip late">
                              <AlertTriangle size={13} />
                              เลยกำหนดส่ง
                            </span>
                          ) : (
                            <span className="asg-status-chip missing">
                              <Clock size={13} />
                              ยังไม่ส่ง
                            </span>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <span style={{ color: '#60a5fa' }}>ส่งแล้ว {asg.submission_count} คน</span>
                          <span style={{ color: '#71717a' }}>•</span>
                          <span style={{ color: '#34d399' }}>ตรวจแล้ว {asg.graded_count} คน</span>
                        </div>
                      )}
                    </div>

                    <div className="asg-card-score">
                      <span>คะแนนเต็ม {asg.max_score}</span>
                      <ChevronRight size={16} color="#71717a" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateCourseModal 
        isOpen={showCreateCourse}
        onClose={() => setShowCreateCourse(false)}
        onCreated={() => loadData()}
      />

      <CreateAssignmentModal 
        isOpen={showCreateAssignment}
        onClose={() => setShowCreateAssignment(false)}
        onCreated={() => loadData()}
        defaultCourseId={selectedCourseId !== 'all' ? selectedCourseId : null}
      />
    </div>
  );
}
