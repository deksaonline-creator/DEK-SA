import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentPortal from './pages/StudentPortal';
import ExamPlayer from './pages/ExamPlayer';
import EService from './pages/EService';
import SchoolNews from './pages/SchoolNews';
import AnnouncementDetail from './pages/AnnouncementDetail';
import Schedule from './pages/Schedule';
import ITA from './pages/ITA';
import SummaryDetail from './pages/SummaryDetail';
import Popcat from './pages/Popcat';
import UpdatePassword from './pages/UpdatePassword';
import SGSGrades from './pages/SGSGrades';

import Settings from './pages/Settings';
import ExamLeaderboard from './pages/ExamLeaderboard';
import ServicesHub from './pages/ServicesHub';
import GameHub from './pages/GameHub';
import InfoPage from './pages/InfoPage';
import DevPage from './pages/DevPage';
import UnderConstruction from './pages/UnderConstruction';
import FileShareHub from './pages/FileShareHub';
import Omi from './pages/Omi';
import AssignmentPortal from './pages/AssignmentPortal';
import AssignmentDetail from './pages/AssignmentDetail';
import AssignmentGrading from './pages/AssignmentGrading';
import CourseDetail from './pages/CourseDetail';
import { supabase } from './store/mockDb';

import PageTransition from './components/PageTransition';
import MobileNav from './components/MobileNav';
import LoadingScreen from './components/LoadingScreen';
import PullToRefresh from './components/PullToRefresh';
import NotificationManager from './components/NotificationManager';
import { initGlobalUiSounds } from './utils/audioEffects';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cleanupSounds = initGlobalUiSounds();

    // Fire app-ready immediately instead of waiting for heavy preload
    setTimeout(() => {
      window.dispatchEvent(new Event('app-ready'));
    }, 100);

    // Check for auth errors in URL hash (if user clicked an expired link)
    if (window.location.hash.includes('error=')) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = params.get('error_description');
      if (errorDesc) {
        alert(`เกิดข้อผิดพลาดจากลิงก์: ${errorDesc.replace(/\+/g, ' ')}\nกรุณากดขอรหัส OTP หรือลิงก์ใหม่อีกครั้ง`);
        window.history.replaceState(null, '', window.location.pathname); // clear hash
      }
    }

    // Listen for Password Recovery events (if user clicks the link instead of typing OTP)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/update-password';
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      cleanupSounds();
    };
  }, []);

  const handleRefresh = async () => {
    // Refresh the page to fetch latest data and reset states
    return new Promise(resolve => {
      setTimeout(() => {
        window.location.reload();
        resolve();
      }, 500);
    });
  };

  return (
    <Router>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <NotificationManager />
      <PullToRefresh onRefresh={handleRefresh}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/sgs" element={<SGSGrades />} />
              <Route path="/grades" element={<SGSGrades />} />
              <Route path="/e-service" element={<EService />} />
              <Route path="/dek-sa-service" element={<EService />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/student" element={<StudentPortal />} />
              <Route path="/exam/:id" element={<ExamPlayer />} />
              <Route path="/news" element={<SchoolNews />} />
              <Route path="/announcement/:id" element={<AnnouncementDetail />} />
              <Route path="/summary/:id" element={<SummaryDetail />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/ita" element={<Navigate to="/" replace />} />
              {/* Dek SA 2.0 Core Routes */}
              <Route path="/services" element={<ServicesHub />} />
              <Route path="/assignments" element={<AssignmentPortal />} />
              <Route path="/assignments/:id" element={<AssignmentDetail />} />
              <Route path="/assignments/:id/grading" element={<AssignmentGrading />} />
              <Route path="/assignments/course/:courseId" element={<CourseDetail />} />
              <Route path="/service/assignment" element={<Navigate to="/assignments" replace />} />
              <Route path="/service/file-share" element={<FileShareHub />} />
              <Route path="/files" element={<FileShareHub />} />
              <Route path="/service/:serviceName" element={<UnderConstruction />} />
              <Route path="/service/game-omi" element={<Omi />} />
              <Route path="/omi" element={<Omi />} />
              <Route path="/game" element={<GameHub />} />
              <Route path="/games" element={<GameHub />} />
              <Route path="/info" element={<InfoPage />} />
              <Route path="/dev" element={<DevPage />} />
              <Route path="/profile" element={<Settings />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/popcat" element={<Popcat />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/exam-leaderboard/:id" element={<ExamLeaderboard />} />

            </Routes>
          </PageTransition>
        </main>
      </PullToRefresh>
      <MobileNav />
    </Router>
  );
}

export default App;
