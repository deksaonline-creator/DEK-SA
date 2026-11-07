import React from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <div 
      key={location.pathname}
      className="page-transition-wrapper"
    >
      <style>{`
        .page-transition-wrapper {
          animation: pageFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          -webkit-animation: pageFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 1; /* Ensure visible */
          display: flex;
          flex-direction: column;
          flex: 1;
          width: 100%;
          min-height: 100%;
        }
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @-webkit-keyframes pageFadeIn {
          from { opacity: 0; -webkit-transform: translateY(15px); }
          to { opacity: 1; -webkit-transform: translateY(0); }
        }
      `}</style>
      {children}
    </div>
  );
};

export default PageTransition;
