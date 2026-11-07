import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CalendarDays, Download, X, Maximize2, 
  ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, 
  RotateCcw, Share2, Check, User, GraduationCap,
  Star
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import Header from '../components/Header';
import MyTimetable from '../components/MyTimetable';
import { getSchedules } from '../store/mockDb';
import { playUiSound } from '../utils/audioEffects';

const Schedule = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode and initial selection from URL params
  const initialGrade = searchParams.get('grade') || 'm1';
  const initialRoom = searchParams.get('room') || null;
  const initialMode = searchParams.get('mode') || (searchParams.get('grade') ? 'school' : 'personal');

  const [viewMode, setViewMode] = useState(initialMode);
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoom);
  const [schedules, setSchedules] = useState([]);

  // Global room search (Instant search across all grades & rooms)
  const [globalRoomSearch, setGlobalRoomSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Pinned / Favorite Classroom
  const [pinnedRoom, setPinnedRoom] = useState(() => {
    try {
      const saved = localStorage.getItem('deksa_pinned_room');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fullscreen / Zoom Lightbox
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);

  // Current real-time date
  const [currentDate, setCurrentDate] = useState(new Date());
  const viewerCardRef = useRef(null);

  // Grades definitions
  const grades = useMemo(() => [
    { id: 'm1', label: 'ม.1', num: '1', fullName: 'มัธยมศึกษาปีที่ 1' },
    { id: 'm2', label: 'ม.2', num: '2', fullName: 'มัธยมศึกษาปีที่ 2' },
    { id: 'm3', label: 'ม.3', num: '3', fullName: 'มัธยมศึกษาปีที่ 3' },
    { id: 'm4', label: 'ม.4', num: '4', fullName: 'มัธยมศึกษาปีที่ 4' },
    { id: 'm5', label: 'ม.5', num: '5', fullName: 'มัธยมศึกษาปีที่ 5' },
    { id: 'm6', label: 'ม.6', num: '6', fullName: 'มัธยมศึกษาปีที่ 6' },
  ], []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchSchedules = async () => {
      try {
        const data = await getSchedules();
        setSchedules(data || []);
      } catch (err) {
        console.error('Failed to load schedules:', err);
      } finally {
        window.dispatchEvent(new Event('app-ready'));
      }
    };
    fetchSchedules();

    const timer = setInterval(() => setCurrentDate(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Update room when grade changes
  useEffect(() => {
    if (!initialRoom) {
      setSelectedRoomId(null);
    }
  }, [selectedGrade, initialRoom]);

  // Handle outside click to close search results dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset zoom on fullscreen modal
  useEffect(() => {
    if (fullscreenImage) {
      setZoomLevel(1);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setFullscreenImage(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [fullscreenImage]);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Build indexed list of all rooms across all grades for global search
  const allRoomsList = useMemo(() => {
    const list = [];
    for (const g of grades) {
      const sched = schedules.find(s => s.id === g.id);
      if (!sched) continue;
      if (sched.rooms && sched.rooms.length > 0) {
        sched.rooms.forEach((r, idx) => {
          const numOnly = r.name.replace(/\D/g, '');
          list.push({
            gradeId: g.id,
            gradeLabel: g.label,
            gradeFullName: g.fullName,
            roomId: r.id,
            roomName: r.name,
            imageUrl: r.imageUrl,
            index: idx + 1,
            aliases: [
              `${g.label}/${numOnly}`,
              `${g.num}/${numOnly}`,
              `ม.${g.num}/${numOnly}`,
              `${g.label} ${r.name}`,
              `${g.fullName} ${r.name}`,
              r.name,
              numOnly ? `ห้อง ${numOnly}` : '',
              numOnly ? `ห้อง${numOnly}` : '',
              numOnly
            ].filter(Boolean)
          });
        });
      } else if (sched.imageUrl) {
        list.push({
          gradeId: g.id,
          gradeLabel: g.label,
          gradeFullName: g.fullName,
          roomId: 'legacy',
          roomName: 'ห้อง 1',
          imageUrl: sched.imageUrl,
          index: 1,
          aliases: [`${g.label}/1`, `${g.num}/1`, `${g.label} ห้อง 1`, g.label, g.fullName]
        });
      }
    }
    return list;
  }, [schedules, grades]);

  // Filter global search results across all grades
  const globalSearchResults = useMemo(() => {
    const q = globalRoomSearch.trim().toLowerCase();
    if (!q) return [];
    
    return allRoomsList.filter(item => {
      return item.aliases.some(alias => alias.toLowerCase().includes(q)) ||
             item.gradeLabel.toLowerCase().includes(q) ||
             item.roomName.toLowerCase().includes(q);
    }).slice(0, 6);
  }, [allRoomsList, globalRoomSearch]);

  // Rooms for the currently selected grade
  const currentSchedule = schedules.find(s => s.id === selectedGrade);
  const rooms = useMemo(() => {
    if (!currentSchedule) return [];
    if (currentSchedule.rooms && currentSchedule.rooms.length > 0) {
      return [...currentSchedule.rooms].sort((a, b) => 
        a.name.localeCompare(b.name, 'th', { numeric: true })
      );
    } else if (currentSchedule.imageUrl) {
      return [{ id: 'legacy', name: 'ห้อง 1', imageUrl: currentSchedule.imageUrl }];
    }
    return [];
  }, [currentSchedule]);

  const activeRoomId = selectedRoomId || (rooms.length > 0 ? rooms[0].id : null);
  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  // Active room index for previous/next navigation
  const activeRoomIndex = rooms.findIndex(r => r.id === (activeRoom?.id));
  const prevRoom = activeRoomIndex > 0 ? rooms[activeRoomIndex - 1] : null;
  const nextRoom = activeRoomIndex >= 0 && activeRoomIndex < rooms.length - 1 ? rooms[activeRoomIndex + 1] : null;

  const handleModeChange = (newMode) => {
    playUiSound('tab');
    setViewMode(newMode);
    setSearchParams(newMode === 'school' ? { mode: 'school', grade: selectedGrade } : { mode: 'personal' }, { replace: true });
  };

  const handleGradeChange = (gradeId) => {
    playUiSound('tab');
    setSelectedGrade(gradeId);
    setSelectedRoomId(null);
    setSearchParams({ mode: 'school', grade: gradeId }, { replace: true });
  };

  const handleRoomChange = (roomId) => {
    playUiSound('pop');
    setSelectedRoomId(roomId);
    setSearchParams({ mode: 'school', grade: selectedGrade, room: roomId }, { replace: true });
  };

  // Jump to room from global search
  const selectRoomFromSearch = (item) => {
    playUiSound('tab');
    setViewMode('school');
    setSelectedGrade(item.gradeId);
    setSelectedRoomId(item.roomId);
    setGlobalRoomSearch('');
    setIsSearchFocused(false);
    showToast(`เปิดตาราง ${item.gradeLabel} ${item.roomName}`);
    setSearchParams({ mode: 'school', grade: item.gradeId, room: item.roomId }, { replace: true });
  };

  // Toggle Pinned / Favorite Classroom
  const togglePinRoom = (room, gradeId) => {
    playUiSound('pop');
    const gradeObj = grades.find(g => g.id === gradeId);
    if (pinnedRoom && pinnedRoom.gradeId === gradeId && pinnedRoom.roomId === room.id) {
      setPinnedRoom(null);
      localStorage.removeItem('deksa_pinned_room');
      showToast('ยกเลิกปักหมุดแล้ว');
    } else {
      const pinData = {
        gradeId,
        gradeLabel: gradeObj?.label || '',
        gradeFullName: gradeObj?.fullName || '',
        roomId: room.id,
        roomName: room.name,
        imageUrl: room.imageUrl
      };
      setPinnedRoom(pinData);
      localStorage.setItem('deksa_pinned_room', JSON.stringify(pinData));
      showToast(`ปักหมุด ${gradeObj?.label} ${room.name} แล้ว`);
    }
  };

  const copyScheduleDirectLink = (gradeId, roomId) => {
    playUiSound('pop');
    const url = `${window.location.origin}/schedule?mode=school&grade=${gradeId}&room=${roomId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('คัดลอกลิงก์ตารางเรียนห้องนี้แล้ว');
    }
  };

  const formattedThaiDate = useMemo(() => {
    return currentDate.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  }, [currentDate]);

  const isCurrentRoomPinned = pinnedRoom && 
    pinnedRoom.gradeId === selectedGrade && 
    pinnedRoom.roomId === activeRoom?.id;

  return (
    <PageTransition>
      <div className="schedule-page-root">
        <Header />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="toast-float-banner">
            <Check size={15} />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="schedule-main-container">
          
          {/* Minimalist Top Header & Mode Toggle Bar */}
          <div className="schedule-clean-header">
            <div className="header-meta">
              <div className="header-title-row">
                <h1 className="schedule-title">ตารางเรียน</h1>
                <span className="header-date-pill">
                  <CalendarDays size={13} className="date-icon" />
                  <span>{formattedThaiDate}</span>
                </span>
              </div>
              <p className="schedule-subtitle">
                {viewMode === 'personal'
                  ? 'ตารางเรียนส่วนตัวพร้อมระบบแจ้งเตือน'
                  : 'ตารางเรียนรวมระดับชั้น ม.1 - ม.6'}
              </p>
            </div>

            {/* Apple / Linear Style Segmented Pill Control */}
            <div className="clean-segmented-control" role="tablist">
              <button
                role="tab"
                aria-selected={viewMode === 'personal'}
                className={`segment-btn ${viewMode === 'personal' ? 'active' : ''}`}
                onClick={() => handleModeChange('personal')}
              >
                <User size={15} />
                <span>ตารางส่วนตัว</span>
              </button>
              <button
                role="tab"
                aria-selected={viewMode === 'school'}
                className={`segment-btn ${viewMode === 'school' ? 'active' : ''}`}
                onClick={() => handleModeChange('school')}
              >
                <GraduationCap size={16} />
                <span>ตารางโรงเรียน</span>
              </button>
            </div>
          </div>

          {/* View Content */}
          {viewMode === 'personal' ? (
            <div className="personal-mode-container">
              <MyTimetable />
            </div>
          ) : (
            <div className="school-mode-container">

              {/* Pinned Room Discrete Pill (if any) */}
              {pinnedRoom && (
                <div className="pinned-room-strip">
                  <button 
                    className="pinned-jump-btn"
                    onClick={() => {
                      playUiSound('tab');
                      setSelectedGrade(pinnedRoom.gradeId);
                      setSelectedRoomId(pinnedRoom.roomId);
                      showToast(`เปิดตาราง ${pinnedRoom.gradeLabel} ${pinnedRoom.roomName}`);
                    }}
                  >
                    <Star size={12} fill="#facc15" color="#facc15" />
                    <span className="pinned-strip-tag">ห้องประจำ:</span>
                    <strong>{pinnedRoom.gradeLabel} {pinnedRoom.roomName}</strong>
                    <span className="pinned-strip-arrow">แตะเพื่อดู</span>
                  </button>
                  <button 
                    className="pinned-strip-close"
                    onClick={() => {
                      playUiSound('pop');
                      setPinnedRoom(null);
                      localStorage.removeItem('deksa_pinned_room');
                      showToast('ยกเลิกห้องประจำแล้ว');
                    }}
                    title="ยกเลิกปักหมุด"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Minimal Navigation & Filter Bar */}
              <div className="schedule-nav-box">
                
                {/* Grade Segment Tabs */}
                <div className="nav-top-row">
                  <div className="grade-pill-group">
                    {grades.map(grade => {
                      const isSelected = selectedGrade === grade.id;
                      return (
                        <button
                          key={grade.id}
                          className={`grade-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => handleGradeChange(grade.id)}
                        >
                          {grade.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Compact Search Box */}
                  <div className="compact-search-box" ref={searchContainerRef}>
                    <Search size={14} className="compact-search-icon" />
                    <input 
                      type="text"
                      placeholder="ค้นหาห้อง..."
                      value={globalRoomSearch}
                      onChange={(e) => {
                        setGlobalRoomSearch(e.target.value);
                        setIsSearchFocused(true);
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                      className="compact-search-input"
                    />
                    {globalRoomSearch && (
                      <button 
                        className="compact-clear-btn"
                        onClick={() => setGlobalRoomSearch('')}
                      >
                        <X size={12} />
                      </button>
                    )}

                    {/* Compact Auto-Suggest Dropdown */}
                    {isSearchFocused && globalRoomSearch.trim() && (
                      <div className="compact-search-dropdown">
                        {globalSearchResults.length > 0 ? (
                          globalSearchResults.map(item => (
                            <div 
                              key={`${item.gradeId}-${item.roomId}`}
                              className="compact-result-item"
                              onClick={() => selectRoomFromSearch(item)}
                            >
                              <div className="result-info">
                                <span className="result-badge">{item.gradeLabel}</span>
                                <span className="result-name">{item.roomName}</span>
                              </div>
                              <ChevronRight size={13} className="result-chevron" />
                            </div>
                          ))
                        ) : (
                          <div className="compact-no-result">
                            ไม่พบห้องเรียน "{globalRoomSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Chips Row */}
                <div className="room-chips-wrapper">
                  <div className="room-chips-scroll">
                    {rooms.map((room) => {
                      const isSelected = activeRoom?.id === room.id;
                      const isRoomPinned = pinnedRoom && pinnedRoom.gradeId === selectedGrade && pinnedRoom.roomId === room.id;
                      const shortName = room.name.replace(/^ห้อง\s*/i, '');

                      return (
                        <button
                          key={room.id}
                          className={`room-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => handleRoomChange(room.id)}
                        >
                          {isRoomPinned && (
                            <Star size={11} fill="#facc15" color="#facc15" className="room-star-icon" />
                          )}
                          <span>{shortName || room.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Timetable Image Viewer Card */}
              <div className="schedule-viewer-card" ref={viewerCardRef}>
                {activeRoom && activeRoom.imageUrl ? (
                  <div className="viewer-container">
                    
                    {/* Sleek Minimal Toolbar */}
                    <div className="viewer-toolbar">
                      <div className="viewer-left">
                        <span className="room-tag">
                          {grades.find(g => g.id === selectedGrade)?.label}/{activeRoom.name.replace(/^ห้อง\s*/i, '')}
                        </span>
                        
                        <button 
                          className={`viewer-pin-btn ${isCurrentRoomPinned ? 'pinned' : ''}`}
                          onClick={() => togglePinRoom(activeRoom, selectedGrade)}
                          title={isCurrentRoomPinned ? 'ยกเลิกห้องประจำ' : 'ปักหมุดห้องประจำ'}
                        >
                          <Star 
                            size={13} 
                            color={isCurrentRoomPinned ? '#facc15' : 'currentColor'} 
                            fill={isCurrentRoomPinned ? '#facc15' : 'none'} 
                          />
                          <span>{isCurrentRoomPinned ? 'ห้องประจำ' : 'ปักหมุด'}</span>
                        </button>
                      </div>

                      <div className="viewer-center">
                        <button 
                          className="pager-btn"
                          disabled={!prevRoom}
                          onClick={() => prevRoom && handleRoomChange(prevRoom.id)}
                          title={prevRoom ? `ก่อนหน้า (${prevRoom.name})` : ''}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="pager-text">
                          {activeRoomIndex + 1} / {rooms.length}
                        </span>
                        <button 
                          className="pager-btn"
                          disabled={!nextRoom}
                          onClick={() => nextRoom && handleRoomChange(nextRoom.id)}
                          title={nextRoom ? `ถัดไป (${nextRoom.name})` : ''}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="viewer-right">
                        <button 
                          className="viewer-action-btn"
                          onClick={() => copyScheduleDirectLink(selectedGrade, activeRoom.id)}
                          title="คัดลอกลิงก์ห้องนี้"
                        >
                          <Share2 size={14} />
                          <span className="btn-label">แชร์</span>
                        </button>

                        <a 
                          href={activeRoom.imageUrl}
                          download={`schedule-${selectedGrade}-${activeRoom.name}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="viewer-action-btn"
                          title="ดาวน์โหลดภาพ"
                        >
                          <Download size={14} />
                          <span className="btn-label">ดาวน์โหลด</span>
                        </a>

                        <button 
                          className="viewer-action-btn primary"
                          onClick={() => {
                            playUiSound('pop');
                            setFullscreenImage(activeRoom.imageUrl);
                          }}
                          title="ขยายเต็มจอ"
                        >
                          <Maximize2 size={14} />
                          <span className="btn-label">ขยาย</span>
                        </button>
                      </div>
                    </div>

                    {/* Schedule Image Display Box */}
                    <div 
                      className="image-viewport" 
                      onClick={() => {
                        playUiSound('pop');
                        setFullscreenImage(activeRoom.imageUrl);
                      }}
                    >
                      <img 
                        key={activeRoom.id}
                        src={activeRoom.imageUrl} 
                        alt={`ตารางเรียน ${grades.find(g => g.id === selectedGrade)?.label} ${activeRoom.name}`} 
                        className="schedule-main-image"
                        loading="lazy"
                      />
                      <div className="image-hover-hint">
                        <Maximize2 size={16} />
                        <span>แตะเพื่อขยายภาพและซูม</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="schedule-empty-box">
                    <CalendarDays size={36} color="rgba(255, 255, 255, 0.25)" />
                    <p className="empty-title">
                      ยังไม่มีตารางเรียนสำหรับ {grades.find(g => g.id === selectedGrade)?.label}
                    </p>
                    <button 
                      className="empty-switch-btn"
                      onClick={() => handleModeChange('personal')}
                    >
                      ไปที่ตารางเรียนส่วนตัว
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenImage && (
        <div 
          className="fullscreen-modal-backdrop"
          onClick={() => {
            playUiSound('pop');
            setFullscreenImage(null);
          }}
        >
          <div className="fullscreen-controls-bar" onClick={e => e.stopPropagation()}>
            <div className="fullscreen-info">
              <span className="fullscreen-title">
                {grades.find(g => g.id === selectedGrade)?.label}/{activeRoom?.name.replace(/^ห้อง\s*/i, '')}
              </span>
              <span className="fullscreen-zoom-text">{Math.round(zoomLevel * 100)}%</span>
            </div>

            <div className="fullscreen-btns">
              <button 
                className="lightbox-tool-btn"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                title="ซูมเข้า (+)"
              >
                <ZoomIn size={16} />
              </button>

              <button 
                className="lightbox-tool-btn"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                title="ซูมออก (-)"
              >
                <ZoomOut size={16} />
              </button>

              <button 
                className="lightbox-tool-btn"
                onClick={() => setZoomLevel(1)}
                title="รีเซ็ตขนาด 100%"
              >
                <RotateCcw size={15} />
              </button>

              <a 
                href={fullscreenImage} 
                download={`schedule-${selectedGrade}-${activeRoom?.name || 'table'}.png`}
                className="lightbox-tool-btn download"
                title="ดาวน์โหลดรูปภาพ"
              >
                <Download size={15} />
              </a>

              <button 
                className="lightbox-tool-btn close"
                onClick={() => setFullscreenImage(null)}
                title="ปิด (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="fullscreen-img-scroll" onClick={e => e.stopPropagation()}>
            <img 
              src={fullscreenImage} 
              alt="ตารางเรียนแบบเต็มจอ" 
              className="fullscreen-rendered-img"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)'
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        .schedule-page-root {
          min-height: calc(var(--vh, 1vh) * 100);
          background-color: transparent;
          color: #ffffff;
          padding-bottom: 5rem;
        }

        .schedule-main-container {
          max-width: 1060px;
          margin: 0 auto;
          padding: 1.5rem 1.25rem;
        }

        /* Toast */
        .toast-float-banner {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(16, 185, 129, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 8px 16px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          z-index: 99999;
          animation: slideInRight 0.25s ease-out;
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Sleek Clean Header */
        .schedule-clean-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .header-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .header-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .schedule-title {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
          color: #ffffff;
        }

        .header-date-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.65);
          font-weight: 500;
        }

        .date-icon {
          color: #4287f5;
        }

        .schedule-subtitle {
          margin: 0;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
        }

        /* Segmented Pill Switcher */
        .clean-segmented-control {
          display: inline-flex;
          align-items: center;
          background: rgba(20, 22, 30, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .segment-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 16px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
          white-space: nowrap;
        }

        .segment-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.04);
        }

        .segment-btn.active {
          background: #4287f5;
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(66, 135, 245, 0.35);
        }

        /* Pinned Room Discrete Strip */
        .pinned-room-strip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(234, 179, 8, 0.08);
          border: 1px solid rgba(234, 179, 8, 0.25);
          border-radius: 999px;
          padding: 4px 12px 4px 14px;
          margin-bottom: 1.25rem;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.9);
          transition: border-color 0.15s ease;
        }

        .pinned-room-strip:hover {
          border-color: rgba(234, 179, 8, 0.45);
        }

        .pinned-jump-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
        }

        .pinned-strip-tag {
          color: #facc15;
          font-weight: 600;
        }

        .pinned-strip-arrow {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.5);
          margin-left: 2px;
          text-decoration: underline;
        }

        .pinned-strip-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 50%;
          margin-left: 4px;
        }

        .pinned-strip-close:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
        }

        /* Minimal Navigation Box */
        .schedule-nav-box {
          background: rgba(18, 20, 28, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 12px 14px;
          margin-bottom: 1.25rem;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .nav-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .grade-pill-group {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .grade-pill-group::-webkit-scrollbar {
          display: none;
        }

        .grade-pill {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          white-space: nowrap;
        }

        .grade-pill:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .grade-pill.active {
          background: #4287f5;
          border-color: #4287f5;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(66, 135, 245, 0.3);
        }

        /* Compact Search Box */
        .compact-search-box {
          position: relative;
          min-width: 170px;
          max-width: 240px;
          flex: 1;
        }

        .compact-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.4);
          pointer-events: none;
        }

        .compact-search-input {
          width: 100%;
          height: 32px;
          padding: 0 28px 0 30px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          color: #ffffff;
          font-size: 0.8rem;
          font-family: inherit;
          outline: none;
          transition: all 0.15s ease;
        }

        .compact-search-input:focus {
          border-color: #4287f5;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(66, 135, 245, 0.18);
        }

        .compact-search-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .compact-clear-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .compact-search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          left: 0;
          min-width: 220px;
          background: #171923;
          border: 1px solid rgba(66, 135, 245, 0.35);
          border-radius: 12px;
          padding: 6px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .compact-result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.12s;
        }

        .compact-result-item:hover {
          background: rgba(66, 135, 245, 0.15);
        }

        .result-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .result-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: #4287f5;
          background: rgba(66, 135, 245, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .result-name {
          font-size: 0.82rem;
          font-weight: 500;
          color: #ffffff;
        }

        .result-chevron {
          color: rgba(255, 255, 255, 0.3);
        }

        .compact-no-result {
          padding: 10px;
          text-align: center;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.45);
        }

        /* Room Chips Row */
        .room-chips-wrapper {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
        }

        .room-chips-scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }

        .room-chips-scroll::-webkit-scrollbar {
          display: none;
        }

        .room-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 11px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.12s ease;
          font-family: inherit;
          white-space: nowrap;
        }

        .room-chip:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .room-chip.active {
          background: rgba(66, 135, 245, 0.15);
          border-color: #4287f5;
          color: #60a5fa;
        }

        .room-star-icon {
          flex-shrink: 0;
        }

        /* Timetable Viewer Card */
        .schedule-viewer-card {
          background: #11131a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        }

        /* Minimal Viewer Toolbar */
        .viewer-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          gap: 12px;
          flex-wrap: wrap;
        }

        .viewer-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .room-tag {
          font-size: 1rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .viewer-pin-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .viewer-pin-btn:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
        }

        .viewer-pin-btn.pinned {
          background: rgba(234, 179, 8, 0.12);
          border-color: rgba(234, 179, 8, 0.35);
          color: #facc15;
        }

        .viewer-center {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pager-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s;
        }

        .pager-btn:hover:not(:disabled) {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .pager-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .pager-text {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
          min-width: 42px;
          text-align: center;
        }

        .viewer-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .viewer-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          font-family: inherit;
        }

        .viewer-action-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .viewer-action-btn.primary {
          background: #4287f5;
          border-color: #4287f5;
          color: #ffffff;
        }

        .viewer-action-btn.primary:hover {
          background: #3373dc;
        }

        /* Image Viewport */
        .image-viewport {
          position: relative;
          width: 100%;
          min-height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #090a0f;
          cursor: zoom-in;
          overflow: hidden;
        }

        .schedule-main-image {
          max-width: 100%;
          max-height: 72vh;
          object-fit: contain;
          display: block;
          transition: opacity 0.2s ease;
        }

        .image-hover-hint {
          position: absolute;
          bottom: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.76rem;
          font-weight: 500;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: 0.7;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .image-viewport:hover .image-hover-hint {
          opacity: 1;
        }

        /* Empty State */
        .schedule-empty-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
          text-align: center;
          gap: 12px;
        }

        .empty-title {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .empty-switch-btn {
          margin-top: 6px;
          padding: 7px 16px;
          border-radius: 999px;
          background: #4287f5;
          border: none;
          color: #ffffff;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        /* Lightbox Modal */
        .fullscreen-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 6, 10, 0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 99999;
          display: flex;
          flex-direction: column;
        }

        .fullscreen-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 18px;
          background: rgba(18, 20, 28, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          gap: 12px;
        }

        .fullscreen-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fullscreen-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #ffffff;
        }

        .fullscreen-zoom-text {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.5);
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }

        .fullscreen-btns {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lightbox-tool-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.12s;
          text-decoration: none;
        }

        .lightbox-tool-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .lightbox-tool-btn.download {
          background: #4287f5;
          border-color: #4287f5;
        }

        .lightbox-tool-btn.close {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        .lightbox-tool-btn.close:hover {
          background: rgba(239, 68, 68, 0.4);
          color: #ffffff;
        }

        .fullscreen-img-scroll {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          padding: 1.5rem;
        }

        .fullscreen-rendered-img {
          max-width: 95%;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .schedule-main-container {
            padding: 1rem 0.75rem;
          }

          .schedule-clean-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .clean-segmented-control {
            width: 100%;
          }

          .segment-btn {
            flex: 1;
            justify-content: center;
          }

          .nav-top-row {
            flex-direction: column;
            align-items: stretch;
          }

          .compact-search-box {
            max-width: 100%;
          }

          .viewer-toolbar {
            gap: 8px;
          }

          .btn-label {
            display: none;
          }

          .viewer-action-btn {
            padding: 5px 8px;
          }

          .image-viewport {
            min-height: 260px;
          }
        }
      `}</style>
    </PageTransition>
  );
};

export default Schedule;
