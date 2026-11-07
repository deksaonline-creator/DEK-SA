import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Gamepad2, Play, Flame, HelpCircle, Trophy, Hammer, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';

const GameHub = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'xo',
      title: 'เกม XO (Tic-Tac-Toe)',
      desc: 'ประลองไหวพริบวางหมาก XO เล่นกับเพื่อนหรือแข่งขันจับเวลา',
      icon: '❌⭕',
      grad: 'linear-gradient(135deg, #a855f7, #6366f1)',
      status: 'wip',
      players: '1 - 2 ผู้เล่น',
      action: () => navigate('/service/game-xo?title=เกม+XO+(Tic-Tac-Toe)&icon=❌⭕&category=เกม')
    },
    {
      id: 'omi',
      title: 'Omi - สุ่มคุยวิดีโอ (แบบ ome.tv)',
      desc: 'กด Start สุ่มจับคู่คนแปลกหน้า คุยวิดีโอและแชทแบบเรียลไทม์ กด Next เพื่อข้าม',
      icon: '🎲',
      grad: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      status: 'ready',
      players: '1 ต่อ 1 ออนไลน์',
      action: () => navigate('/omi')
    },
    {
      id: 'streak',
      title: 'มาโรงสะสมไฟ (School Streak)',
      desc: 'เช็คชื่อเข้าโรงเรียนทุกวัน สะสมเปลวไฟ Streak ชิงเหรียญรางวัล',
      icon: '🔥',
      grad: 'linear-gradient(135deg, #f97316, #eab308)',
      status: 'wip',
      players: 'เดี่ยว / ชุมชน',
      action: () => navigate('/service/game-streak?title=มาโรงสะสมไฟ&icon=🔥&category=เกม')
    },
    {
      id: 'quiz',
      title: 'เกมตอบคำถาม (Quiz Challenge)',
      desc: 'ทดสอบความรู้รอบตัวและวิชาเรียน แข่งขันตอบเร็วชิงอันดับ Leaderboard',
      icon: '💡',
      grad: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      status: 'wip',
      players: 'จัดอันดับรายสัปดาห์',
      action: () => navigate('/service/game-quiz?title=เกมตอบคำถาม+(Quiz)&icon=💡&category=เกม')
    },
    {
      id: 'popcat',
      title: 'Popcat SA Challenge',
      desc: 'คลิกเก็บคะแนนสนุกๆ พร้อมระบบคอมโบและเสียงเอฟเฟกต์สุดเร้าใจ',
      icon: '🐱',
      grad: 'linear-gradient(135deg, #10b981, #059669)',
      status: 'ready',
      players: 'พร้อมเล่นทันที',
      action: () => navigate('/popcat')
    }
  ];

  return (
    <div className="game-hub-page">
      <Header />

      <main className="game-hub-wrap">
        {/* Hero Banner */}
        <div className="game-hero">
          <div className="game-badge">
            <Gamepad2 size={15} color="#ec4899" />
            <span>DEK SA 2.0 ARCADE</span>
          </div>
          <h1 className="game-title">มินิเกม Dek SA</h1>
          <p className="game-desc">
            ศูนย์รวมเกมฝึกสมอง พักผ่อนหย่อนใจ และกิจกรรมสะสมแต้มสำหรับชาว Dek SA
          </p>
        </div>

        {/* Games Grid */}
        <div className="games-grid">
          {games.map((g) => (
            <div 
              key={g.id}
              className="game-card"
              onClick={g.action}
            >
              <div className="game-card-art" style={{ background: g.grad }}>
                <span className="game-art-emoji">{g.icon}</span>
                {g.status === 'ready' ? (
                  <span className="game-status-tag ready">
                    <CheckCircle2 size={12} />
                    <span>พร้อมเล่น</span>
                  </span>
                ) : (
                  <span className="game-status-tag wip">
                    <Hammer size={12} />
                    <span>กำลังทำ</span>
                  </span>
                )}
              </div>

              <div className="game-card-body">
                <div className="game-meta-row">
                  <span className="game-players-badge">{g.players}</span>
                </div>
                <h3 className="game-name">{g.title}</h3>
                <p className="game-about">{g.desc}</p>

                <button type="button" className={`btn-play-game ${g.status}`}>
                  {g.status === 'ready' ? (
                    <>
                      <Play size={14} fill="currentColor" />
                      <span>เล่นเกมนี้</span>
                    </>
                  ) : (
                    <>
                      <Hammer size={14} />
                      <span>ดูรายละเอียด (กำลังทำ)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        .game-hub-page {
          min-height: calc(var(--vh, 1vh) * 100);
          background-color: transparent;
          color: #ffffff;
          padding-bottom: 5rem;
        }

        .game-hub-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }

        .game-hero {
          text-align: center;
          margin-bottom: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .game-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          background: rgba(236, 72, 153, 0.15);
          border: 1px solid rgba(236, 72, 153, 0.35);
          font-size: 0.78rem;
          font-weight: 700;
          color: #f472b6;
          margin-bottom: 1rem;
          letter-spacing: 0.5px;
        }

        .game-title {
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0 0 0.75rem;
        }

        .game-desc {
          max-width: 580px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 1rem;
          line-height: 1.6;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .game-card {
          background: linear-gradient(180deg, rgba(28, 28, 36, 0.85), rgba(18, 18, 24, 0.95));
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
        }

        .game-card:hover {
          transform: translateY(-5px);
          border-color: rgba(236, 72, 153, 0.4);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55), 0 0 25px rgba(236, 72, 153, 0.15);
        }

        .game-card-art {
          height: 130px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .game-art-emoji {
          font-size: 3.5rem;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4));
          transition: transform 0.3s ease;
        }

        .game-card:hover .game-art-emoji {
          transform: scale(1.1) rotate(-4deg);
        }

        .game-status-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .game-status-tag.ready {
          background: rgba(16, 185, 129, 0.9);
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .game-status-tag.wip {
          background: rgba(0, 0, 0, 0.6);
          color: #fde68a;
          border: 1px solid rgba(245, 158, 11, 0.4);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
        }

        .game-card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .game-meta-row {
          margin-bottom: 0.5rem;
        }

        .game-players-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.06);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .game-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }

        .game-about {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.5;
          margin: 0 0 1.25rem;
          flex: 1;
        }

        .btn-play-game {
          height: 40px;
          border-radius: 999px;
          border: 0;
          font-size: 13.5px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-play-game.ready {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }

        .btn-play-game.ready:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.6);
        }

        .btn-play-game.wip {
          background: rgba(255, 255, 255, 0.08);
          color: #fde68a;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .btn-play-game.wip:hover {
          background: rgba(245, 158, 11, 0.15);
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default GameHub;
