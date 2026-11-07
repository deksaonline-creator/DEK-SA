import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Gamepad2, Info, User, ShieldAlert } from 'lucide-react';
import './MobileNav.css';
import { playUiSound } from '../utils/audioEffects';

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('deksa_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'admin') {
        setIsAdmin(true);
      }
    }
  }, []);

  const navItems = [
    { id: 'home', label: 'HOME', icon: <Home size={19} />, path: '/' },
    { id: 'services', label: 'บริการ', icon: <Compass size={19} />, path: '/services' },
    { id: 'game', label: 'GAME', icon: <Gamepad2 size={19} />, path: '/game' },
    { id: 'info', label: 'INFO', icon: <Info size={19} />, path: '/info' },
    { id: 'profile', label: 'โปรไฟล์', icon: <User size={19} />, path: '/profile' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'แอดมิน', icon: <ShieldAlert size={19} />, path: '/admin' });
  }

  if (location.pathname === '/omi' || location.pathname === '/service/game-omi') {
    return null;
  }

  return (
    <div className="mobile-nav-wrapper">
      <div className="mobile-nav">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <div 
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                playUiSound('tab');
                if (item.id === 'profile' && !localStorage.getItem('deksa_user')) {
                  window.dispatchEvent(new Event('open-login-modal'));
                  return;
                }
                navigate(item.path);
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
