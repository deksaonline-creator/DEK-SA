import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Info, Megaphone, X, ShieldCheck, LogOut } from 'lucide-react';
import { getSysNotifications } from '../store/mockDb';
import LoginModal from './LoginModal';
import { playUiSound } from '../utils/audioEffects';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const tabsRef = useRef(null);
  const indicatorRef = useRef(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const savedUser = localStorage.getItem('deksa_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Listen for open-login-modal and user-logged-in events
  useEffect(() => {
    const handleOpenLogin = () => setShowLoginModal(true);
    const handleUserChange = () => {
      const savedUser = localStorage.getItem('deksa_user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    window.addEventListener('open-login-modal', handleOpenLogin);
    window.addEventListener('user-logged-in', handleUserChange);

    return () => {
      window.removeEventListener('open-login-modal', handleOpenLogin);
      window.removeEventListener('user-logged-in', handleUserChange);
    };
  }, []);

  // Update active tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setActiveTab('home');
    } else if (path.startsWith('/services') || path.startsWith('/service') || path.startsWith('/e-service')) {
      setActiveTab('services');
    } else if (path.startsWith('/game') || path.startsWith('/popcat')) {
      setActiveTab('game');
    } else if (path.startsWith('/info')) {
      setActiveTab('info');
    } else if (path.startsWith('/dev')) {
      setActiveTab('dev');
    } else {
      setActiveTab('');
    }
  }, [location.pathname]);

  const updateTabIndicator = (element) => {
    if (!indicatorRef.current) return;
    if (element) {
      indicatorRef.current.style.width = `${element.offsetWidth}px`;
      indicatorRef.current.style.transform = `translateX(${element.offsetLeft}px)`;
      indicatorRef.current.style.opacity = '1';
    } else {
      indicatorRef.current.style.opacity = '0';
    }
  };

  useEffect(() => {
    const update = () => {
      if (tabsRef.current) {
        const activeBtn = tabsRef.current.querySelector('.header-tab-btn.on');
        updateTabIndicator(activeBtn);
      }
    };
    update();
    const timer = setTimeout(update, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      if (tabsRef.current) {
        const activeBtn = tabsRef.current.querySelector('.header-tab-btn.on');
        updateTabIndicator(activeBtn);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabClick = (tabKey, targetPath, btnEl, isScroll = false) => {
    playUiSound('tab');
    setActiveTab(tabKey);
    updateTabIndicator(btnEl);

    if (isScroll) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById(targetPath)?.scrollIntoView({ behavior: 'smooth' });
        }, 400);
      } else {
        document.getElementById(targetPath)?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (targetPath === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
        window.scrollTo(0, 0);
      }
    } else {
      navigate(targetPath);
    }
  };

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const allNotifs = await getSysNotifications();
        
        // Filter: show global notifications (no targetUserId) OR notifications targeted specifically at this user
        let notifs = allNotifs.filter(n => !n.targetUserId || (user && n.targetUserId === user.id));

        // Sort by latest
        notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(notifs);

        // Calculate unread
        const lastRead = localStorage.getItem('deksa_last_read_notifications') || 0;
        const unread = notifs.filter(n => new Date(n.timestamp).getTime() > parseInt(lastRead)).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error(err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notification popover on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
      localStorage.setItem('deksa_last_read_notifications', Date.now().toString());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('deksa_user');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <nav className="main-header">
      <div className="header-logo" onClick={() => { navigate('/'); window.scrollTo(0, 0); }}>
        <img src="/favicon.png" alt="Ghost Logo" className="logo-img" width="36" height="36" />
        <span className="logo-text">Dek <span>SA</span></span>
      </div>

      <div className="desktop-nav-tabs">
        <div className="header-glass-pill" ref={tabsRef}>
          <span className="header-tab-indicator" ref={indicatorRef}></span>
          <button 
            type="button"
            className={`header-tab-btn ${activeTab === 'home' ? 'on' : ''}`}
            onClick={(e) => handleTabClick('home', '/', e.currentTarget)}
          >
            HOME
          </button>
          <button 
            type="button"
            className={`header-tab-btn ${activeTab === 'services' ? 'on' : ''}`}
            onClick={(e) => handleTabClick('services', '/services', e.currentTarget)}
          >
            บริการ
          </button>
          <button 
            type="button"
            className={`header-tab-btn ${activeTab === 'game' ? 'on' : ''}`}
            onClick={(e) => handleTabClick('game', '/game', e.currentTarget)}
          >
            GAME
          </button>
          <button 
            type="button"
            className={`header-tab-btn ${activeTab === 'info' ? 'on' : ''}`}
            onClick={(e) => handleTabClick('info', '/info', e.currentTarget)}
          >
            INFO
          </button>
          <button 
            type="button"
            className={`header-tab-btn ${activeTab === 'dev' ? 'on' : ''}`}
            onClick={(e) => handleTabClick('dev', '/dev', e.currentTarget)}
          >
            DEV
          </button>
        </div>
      </div>

      <div className="header-actions">
        {/* Notification Bell with Modern Dropdown Popover */}
        <div className="notif-bell-wrapper" ref={dropdownRef}>
          <button 
            type="button"
            aria-label="การแจ้งเตือน"
            className={`header-bell-btn ${showNotifications ? 'active' : ''}`}
            onClick={handleOpenNotifications}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="header-bell-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Transparent dismiss backdrop */}
          {showNotifications && (
            <div 
              className="notif-backdrop-dismiss"
              onClick={() => setShowNotifications(false)}
            />
          )}

          {/* Floating Dropdown Popover */}
          {showNotifications && (
            <div className="notif-popover">
              <div className="notif-popover-header">
                <div className="notif-popover-title">
                  <Bell size={16} color="#4287f5" />
                  <span>การแจ้งเตือน</span>
                  {notifications.length > 0 && (
                    <span className="notif-count-pill">{notifications.length}</span>
                  )}
                </div>
                <button 
                  type="button"
                  aria-label="ปิดการแจ้งเตือน"
                  className="notif-close-btn"
                  onClick={() => setShowNotifications(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="notif-list-wrap">
                {notifications.length === 0 ? (
                  <div className="notif-empty-state">
                    <div className="notif-empty-icon">
                      <Bell size={22} color="#71717a" />
                    </div>
                    <p className="notif-empty-text">ไม่มีการแจ้งเตือนในขณะนี้</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notif-item ${notif.link ? 'clickable' : ''}`}
                      onClick={() => { 
                        if (notif.link) { 
                          window.open(notif.link, '_blank'); 
                          setShowNotifications(false); 
                        } 
                      }}
                    >
                      <div className={`notif-item-icon ${notif.type === 'system' ? 'system' : 'announcement'}`}>
                        {notif.type === 'system' ? <Info size={16} /> : <Megaphone size={16} />}
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-title">{notif.title}</div>
                        {notif.message && <div className="notif-item-msg">{notif.message}</div>}
                        <div className="notif-item-time">
                          {new Date(notif.timestamp).toLocaleString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {user ? (
          <div className="user-nav-cluster">
            {user.role === 'admin' && (
              <button 
                type="button"
                className="btn-admin-pill" 
                onClick={() => navigate('/admin')}
                title="จัดการระบบ"
              >
                <ShieldCheck size={16} />
                <span>จัดการระบบ</span>
              </button>
            )}

            <div className="user-capsule">
              <div 
                className="capsule-profile-btn" 
                onClick={() => navigate('/profile')} 
                title="ดูข้อมูลโปรไฟล์"
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="capsule-avatar" />
                ) : (
                  <div className="capsule-avatar-placeholder">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="capsule-details">
                  <span className="capsule-name" title={user.name}>{user.name}</span>
                  <div className="capsule-status-row">
                    <span className="capsule-online-dot"></span>
                    <span className="capsule-status">ออนไลน์</span>
                    {user.role === 'admin' && (
                      <span className="capsule-role-badge">ADMIN</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="capsule-divider"></div>

              <button 
                type="button"
                className="capsule-logout-btn" 
                onClick={handleLogout}
                title="ออกจากระบบ"
              >
                <LogOut size={15} />
                <span>ออก</span>
              </button>
            </div>
          </div>
        ) : location.pathname !== '/login' ? (
          <button className="btn-login-nav" onClick={() => setShowLoginModal(true)}>
            เข้าสู่ระบบ
          </button>
        ) : null}
      </div>
    </nav>

    {/* Login Popup Modal */}
    <LoginModal 
      isOpen={showLoginModal} 
      onClose={() => setShowLoginModal(false)}
      onLoginSuccess={(loggedInUser) => {
        setUser(loggedInUser);
      }}
    />
  </>
  );
};

export default Header;
