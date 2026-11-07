import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleReady = () => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // 500ms for fade out animation
    };
    
    window.addEventListener('app-ready', handleReady);
    // Fallback: If for some reason a page doesn't dispatch app-ready, it will auto-close after 5s max
    const fallbackTimer = setTimeout(handleReady, 5000);
    
    return () => {
      window.removeEventListener('app-ready', handleReady);
      clearTimeout(fallbackTimer);
    };
  }, [onComplete]);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        transition: 'opacity 0.5s ease',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/favicon.png" 
          alt="Dek SA Logo" 
          style={{
            width: '120px',
            height: '120px',
            marginBottom: '1rem',
            animation: 'float 2s ease-in-out infinite, pulse 2s ease-in-out infinite',
            filter: 'drop-shadow(0 0 15px rgba(37, 99, 235, 0.5))'
          }} 
        />
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '900', 
          fontStyle: 'italic', 
          letterSpacing: '-0.5px', 
          color: 'white',
          animation: 'pulse 2s infinite' 
        }}>
          Dek <span style={{ color: '#2563eb' }}>SA</span>
        </h1>
        <div style={{ 
          marginTop: '2rem',
          width: '200px',
          height: '4px',
          background: '#27272a',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: '#2563eb',
            width: '100%',
            animation: 'loading-bar 1.5s ease-in-out forwards'
          }} />
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
