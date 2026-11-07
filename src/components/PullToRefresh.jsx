import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const PullToRefresh = ({ children, onRefresh }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    const handleScroll = () => {
      // Check if we are at the very top of the page
      setIsAtTop(window.scrollY <= 0);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const pullDistance = Math.max(0, currentY - startY);
  const maxPull = 120;
  const actualPull = Math.min(pullDistance, maxPull);
  const pullProgress = Math.min(actualPull / 80, 1);

  const handleTouchStart = (e) => {
    if (!isMobile || !isAtTop || refreshing) return;
    if (document.body.classList.contains('hide-mobile-nav')) return; // Disable in chat rooms
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isAtTop || startY === 0 || refreshing) return;
    if (document.body.classList.contains('hide-mobile-nav')) return; // Disable in chat rooms
    
    const y = e.touches[0].clientY;
    
    // If pulling down
    if (y > startY) {
      setCurrentY(y);
      
      // Stop native scroll/refresh behavior only if we are pulling down at the top
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (startY === 0) return;
    
    if (pullDistance > 80 && !refreshing) {
      setRefreshing(true);
      if (onRefresh) {
        await onRefresh();
      }
      setRefreshing(false);
    }
    
    setStartY(0);
    setCurrentY(0);
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', background: 'var(--bg-color)' }}
      id="main-scroll-container"
      onScroll={(e) => {
        setIsAtTop(e.target.scrollTop <= 0);
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${refreshing ? 20 : (actualPull - 40)}px)`,
          transition: startY === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease' : 'none',
          opacity: startY === 0 && !refreshing ? 0 : pullProgress,
          zIndex: 1000
        }}
      >
        <div style={{ 
          background: '#18181b', 
          padding: '0.6rem', 
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          border: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <RefreshCw 
            size={24} 
            color="#3b82f6"
            style={{ 
              transform: `rotate(${actualPull * 3}deg)`,
              animation: refreshing ? 'spin 1s linear infinite' : 'none'
            }} 
          />
        </div>
      </div>
      
      <div 
        style={{ 
          transform: `translateY(${refreshing ? 60 : (startY > 0 ? actualPull * 0.4 : 0)}px)`,
          transition: startY === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </div>

      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default PullToRefresh;
