import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, FileText, ChevronRight, ChevronLeft, Image as ImageIcon, 
  Home as HomeIcon, Calendar, BookOpen, Zap, User, 
  Sparkles, ExternalLink, Search, ArrowRight, X, Maximize2,
  Gamepad2, BarChart3, Calculator, Microscope, Languages,
  BookMarked, Globe2, Atom, FlaskConical, Dna, Flame, Rocket, Landmark,
  Compass, GraduationCap, Megaphone
} from 'lucide-react';
import { getExams, getSummaries, getAnnouncements } from '../store/mockDb';
import Header from '../components/Header';

// Fallback summaries matching home.html & Supabase
const FALLBACK_SUMMARIES = [
  { id: '1784037800004', title: 'วิทยาศาสตร์', description: 'มัธยมศึกษาชั้นที่ 3 เทอม 1', color: '#22c55e' },
  { id: '1784037900868', title: 'ประวัติศาสตร์', description: 'มัธยมศึกษาชั้นที่ 3 เทอม 1', color: '#3b82f6' },
  { id: '1784099884996', title: 'คณิตศาสตร์ (Mathematics)', description: 'มัธยมศึกษาชั้นที่ 3 เทอม 1', color: '#f59e0b' },
  { id: '1784100009226', title: 'วิชาอังกฤษ', description: 'มัธยมศึกษาชั้นที่ 3 เทอม 1', color: '#ec4899' },
  { id: '1784112030684', title: 'คณิตศาสตร์', description: 'มัธยมศึกษาชั้นที่ 1 เทอม 1', color: '#06b6d4' },
  { id: '1784113871044', title: 'คณิตศาสตร์ (การแยกตัวประกอบของพหุนามดีกรีสอง)', description: 'มัธยมศึกษาชั้นที่ 2 เทอม 1', color: '#84cc16' },
  { id: '1784115592652', title: 'สังคมศึกษา ศาสนาและวัฒนธรรม', description: 'มัธยมศึกษาชั้นที่ 3 เทอม 1', color: '#fb923c' },
  { id: 'ea14428d-c50f-46e2-adf9-1a5256942ddd', title: 'ภาษาอังกฤษ', description: 'มัธยมศึกษาชั้นที่ 1 เทอม 1', color: '#a855f7' }
];

// Helper to render crisp Lucide SVG vector icons instead of emojis
const renderSubjectIcon = (iconKey, size = 18) => {
  switch (iconKey) {
    case 'วิทยาศาสตร์':
      return <Atom size={size} color="#ffffff" strokeWidth={2.2} />;
    case 'ฟิสิกส์':
      return <Compass size={size} color="#ffffff" strokeWidth={2.2} />;
    case 'เคมี':
      return <FlaskConical size={size} color="#ffffff" strokeWidth={2.2} />;
    case 'ชีววิทยา':
      return <Dna size={size} color="#ffffff" strokeWidth={2.2} />;
    case 'ประวัติศาสตร์':
      return <Landmark size={size} color="#ffffff" strokeWidth={2.2} />;
    case 'คณิตศาสตร์ (Mathematics)':
    case 'คณิตศาสตร์':
      return <Calculator size={size} color="#ffffff" strokeWidth={2.2} />;
    case 'วิชาอังกฤษ':
    case 'ภาษาอังกฤษ':
      return <Languages size={size} color="#ffffff" strokeWidth={2.2} />;
    case 'สังคมศึกษา ศาสนาและวัฒนธรรม':
    case 'สังคมศึกษา':
      return <Globe2 size={size} color="#ffffff" strokeWidth={2.2} />;
    case 'ภาษาไทย':
      return <BookMarked size={size} color="#ffffff" strokeWidth={2.2} />;
    default:
      return <BookOpen size={size} color="#ffffff" strokeWidth={2.2} />;
  }
};

// Curated metadata for subjects
const SUBJECT_METAS = {
  'วิทยาศาสตร์': { iconKey: 'วิทยาศาสตร์', c1: '#22c55e', c2: '#064e3b', badge: 'ใหม่', pages: 14, defaultProgress: 60, gradeNum: 3 },
  'ประวัติศาสตร์': { iconKey: 'ประวัติศาสตร์', c1: '#3b82f6', c2: '#1e1b4b', badge: '', pages: 9, defaultProgress: 25, gradeNum: 3 },
  'คณิตศาสตร์ (Mathematics)': { iconKey: 'คณิตศาสตร์ (Mathematics)', c1: '#f59e0b', c2: '#9a3412', badge: 'ยอดนิยม', pages: 18, defaultProgress: 80, gradeNum: 3 },
  'วิชาอังกฤษ': { iconKey: 'วิชาอังกฤษ', c1: '#ec4899', c2: '#5b21b6', badge: '', pages: 12, defaultProgress: 0, gradeNum: 3 },
  'คณิตศาสตร์': { iconKey: 'คณิตศาสตร์', c1: '#06b6d4', c2: '#1e3a8a', badge: '', pages: 16, defaultProgress: 100, gradeNum: 1 },
  'คณิตศาสตร์ (การแยกตัวประกอบของพหุนามดีกรีสอง)': { iconKey: 'คณิตศาสตร์', c1: '#84cc16', c2: '#14532d', badge: '', pages: 8, defaultProgress: 40, gradeNum: 2 },
  'สังคมศึกษา ศาสนาและวัฒนธรรม': { iconKey: 'สังคมศึกษา ศาสนาและวัฒนธรรม', c1: '#fb923c', c2: '#7c2d12', badge: '', pages: 11, defaultProgress: 10, gradeNum: 3 },
  'ภาษาอังกฤษ': { iconKey: 'ภาษาอังกฤษ', c1: '#a855f7', c2: '#3b0764', badge: 'ใหม่', pages: 10, defaultProgress: 0, gradeNum: 1 },
};

const getSummaryDetails = (summary, index = 0) => {
  const title = summary.title || '';
  const desc = summary.description || '';
  const fullText = `${title} ${desc}`;

  // Match predefined metadata
  const metaEntry = Object.entries(SUBJECT_METAS).find(([k]) => title.includes(k) || k.includes(title));
  const meta = metaEntry ? metaEntry[1] : null;

  // Grade parsing
  let gradeNum = 0;
  if (/ม\.?\s*1|ชั้นที่\s*1|ปีที่\s*1/i.test(fullText)) gradeNum = 1;
  else if (/ม\.?\s*2|ชั้นที่\s*2|ปีที่\s*2/i.test(fullText)) gradeNum = 2;
  else if (/ม\.?\s*3|ชั้นที่\s*3|ปีที่\s*3/i.test(fullText)) gradeNum = 3;
  else if (meta) gradeNum = meta.gradeNum;

  // Icon key (Lucide Vector based)
  let iconKey = meta?.iconKey;
  if (!iconKey) {
    if (/ชีว/i.test(fullText)) iconKey = 'ชีววิทยา';
    else if (/เคมี/i.test(fullText)) iconKey = 'เคมี';
    else if (/ฟิสิกส์/i.test(fullText)) iconKey = 'ฟิสิกส์';
    else if (/วิทย์/i.test(fullText)) iconKey = 'วิทยาศาสตร์';
    else if (/คณิต|เลข|math/i.test(fullText)) iconKey = 'คณิตศาสตร์';
    else if (/อังกฤษ|english/i.test(fullText)) iconKey = 'วิชาอังกฤษ';
    else if (/ประวัติ/i.test(fullText)) iconKey = 'ประวัติศาสตร์';
    else if (/สังคม/i.test(fullText)) iconKey = 'สังคมศึกษา ศาสนาและวัฒนธรรม';
    else if (/ไทย/i.test(fullText)) iconKey = 'ภาษาไทย';
    else iconKey = 'default';
  }

  // Color gradient
  const fallbackGradients = [
    { c1: '#22c55e', c2: '#064e3b' },
    { c1: '#3b82f6', c2: '#1e1b4b' },
    { c1: '#f59e0b', c2: '#9a3412' },
    { c1: '#ec4899', c2: '#5b21b6' },
    { c1: '#06b6d4', c2: '#1e3a8a' },
    { c1: '#84cc16', c2: '#14532d' },
    { c1: '#fb923c', c2: '#7c2d12' },
    { c1: '#a855f7', c2: '#3b0764' },
  ];
  const defaultColors = fallbackGradients[index % fallbackGradients.length];
  const c1 = (summary.color && summary.color !== '#3b82f6') ? summary.color : (meta?.c1 || defaultColors.c1);
  const c2 = meta?.c2 || defaultColors.c2;

  // Term label
  let termLabel = desc;
  if (!termLabel || termLabel.trim() === '') {
    termLabel = gradeNum ? `ม.${gradeNum} เทอม 1` : 'มัธยมศึกษา';
  } else {
    termLabel = termLabel.replace(/มัธยมศึกษาปีที่\s*|มัธยมศึกษาชั้นที่\s*/g, 'ม.').trim();
  }

  // Reading progress: real progress from localStorage, default 0
  const savedProg = localStorage.getItem(`deksa_summary_prog_${summary.id}`);
  const progress = savedProg !== null ? parseInt(savedProg, 10) : 0;

  const pages = meta?.pages || (8 + ((index * 3) % 12));
  const badge = meta?.badge || (index === 0 ? 'ใหม่' : index === 2 ? 'ยอดนิยม' : '');

  return {
    ...summary,
    iconKey,
    c1,
    c2,
    gradeNum,
    termLabel,
    progress,
    pages,
    badge
  };
};

const Home = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [showAllSummaries, setShowAllSummaries] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Search & Filter state for summaries
  const [summarySearch, setSummarySearch] = useState('');
  const [summaryGradeFilter, setSummaryGradeFilter] = useState(0); // 0 = ทั้งหมด, 1 = ม.1, 2 = ม.2, 3 = ม.3
  const [poppingStarId, setPoppingStarId] = useState(null);

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('deksa_favorite_summaries');
    return saved ? JSON.parse(saved) : [];
  });

  const heroRef = useRef(null);

  // Sync favorites to local storage
  useEffect(() => {
    localStorage.setItem('deksa_favorite_summaries', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e, id) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites(prev => {
      const exists = prev.includes(id);
      if (!exists) {
        setPoppingStarId(id);
        setTimeout(() => setPoppingStarId(null), 500);
        return [...prev, id];
      } else {
        return prev.filter(fId => fId !== id);
      }
    });
  };

  // Process and filter summaries
  const effectiveSummaries = summaries.length > 0 ? summaries : FALLBACK_SUMMARIES;
  const processedSummaries = effectiveSummaries.map((s, idx) => getSummaryDetails(s, idx));
  const favoriteSummaries = processedSummaries.filter(s => favorites.includes(s.id));

  const filteredSummaries = processedSummaries.filter(item => {
    if (summaryGradeFilter !== 0 && item.gradeNum !== summaryGradeFilter) return false;
    if (summarySearch.trim() !== '') {
      const q = summarySearch.trim().toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchTerm = item.termLabel?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTerm) return false;
    }
    return true;
  });

  const hasFilterActive = summaryGradeFilter !== 0 || summarySearch.trim() !== '';
  const displayedSummaries = (showAllSummaries || hasFilterActive)
    ? filteredSummaries
    : filteredSummaries.slice(0, 4);

  // Modern clean Summary Card renderer
  const renderSummaryCard = (item, idx) => {
    const isFav = favorites.includes(item.id);
    return (
      <div
        key={item.id}
        className="summary-modern-card"
        style={{ '--c1': item.c1, '--c2': item.c2, animationDelay: `${idx * 40}ms` }}
        onClick={() => navigate('/summary/' + item.id)}
      >
        {/* Cover Thumbnail */}
        <div className="summary-thumb-box">
          {item.coverImage ? (
            <img className="summary-cover-img" src={item.coverImage} alt={item.title} loading="lazy" />
          ) : (
            <div className="summary-fallback-cover" style={{ background: `linear-gradient(135deg, ${item.c1}33, ${item.c2}66)` }}>
              <div className="summary-fallback-icon-wrap" style={{ background: `${item.c1}26`, borderColor: `${item.c1}4d` }}>
                {renderSubjectIcon(item.iconKey, 30)}
              </div>
            </div>
          )}
          <div className="summary-thumb-gradient" />

          {/* Top Row: Badge & Star */}
          <div className="summary-thumb-header">
            {item.badge ? (
              <span className={`summary-badge-tag ${item.badge === 'ใหม่' ? 'badge-new' : 'badge-popular'}`}>
                {item.badge}
              </span>
            ) : <span />}

            <button
              type="button"
              className={`summary-fav-btn ${isFav ? 'is-fav' : ''} ${poppingStarId === item.id ? 'pop' : ''}`}
              onClick={(e) => toggleFavorite(e, item.id)}
              aria-label={isFav ? "นำออกจากวิชาโปรด" : "บันทึกเป็นวิชาโปรด"}
              title={isFav ? "นำออกจากวิชาโปรด" : "บันทึกเป็นวิชาโปรด"}
            >
              <Star 
                size={15} 
                fill={isFav ? '#facc15' : 'transparent'} 
                color={isFav ? '#facc15' : 'rgba(255,255,255,0.85)'} 
                strokeWidth={2.2} 
              />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="summary-body">
          {/* Tag row */}
          <div className="summary-tags-row">
            <span className="summary-cat-pill" style={{ color: item.c1, background: `${item.c1}18`, borderColor: `${item.c1}33` }}>
              {renderSubjectIcon(item.iconKey, 12)}
              <span>{item.termLabel}</span>
            </span>
            <span className="summary-page-pill">
              <FileText size={12} color="rgba(255,255,255,0.5)" />
              <span>{item.pages} หน้า</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="summary-title" title={item.title}>
            {item.title}
          </h3>

          {/* Footer Action / Progress */}
          <div className="summary-footer">
            {item.progress > 0 ? (
              <div className="summary-prog-wrap">
                <div className="summary-prog-track">
                  <div className="summary-prog-bar" style={{ width: `${item.progress}%`, background: item.c1 }} />
                </div>
                <span className="summary-prog-label">อ่านแล้ว {item.progress}%</span>
              </div>
            ) : (
              <div className="summary-action-btn">
                <span>อ่านสรุปเนื้อหา</span>
                <ArrowRight size={13} className="summary-arrow" strokeWidth={2.4} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Load backend data from Supabase
  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      try {
        const [examsData, sumData, annData] = await Promise.all([
          getExams(),
          getSummaries(),
          getAnnouncements()
        ]);
        setExams(examsData || []);
        setSummaries((sumData && sumData.length > 0) ? sumData : FALLBACK_SUMMARIES);
        setAnnouncements(annData || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setSummaries(FALLBACK_SUMMARIES);
      } finally {
        setIsPageLoading(false);
        window.dispatchEvent(new Event('app-ready'));
      }
    };
    loadData();
  }, []);

  // Fallback slides if no announcements are in database
  const DEFAULT_SLIDES = [
    {
      id: 'default-1',
      isDefault: true,
      type: 'DEK SA ONLINE',
      title: 'ระบบการเรียนรู้และเตรียมสอบ',
      content: 'คลังคอร์สเรียน แบบทดสอบวัดระดับ และสรุปเนื้อหาเข้มข้นครบทุกกลุ่มสาระ',
      btnText: 'เข้าสู่คอร์สเรียน ›',
      action: () => navigate('/student'),
      themeClass: 's1',
      icon: <GraduationCap size={150} color="#ffffff" strokeWidth={1.5} />
    },
    {
      id: 'default-2',
      isDefault: true,
      type: 'KNOWLEDGE HUB',
      title: 'สรุปวิชา ม.1 - ม.6',
      content: 'อ่านทบทวนก่อนสอบ สรุปเนื้อหาเข้าใจง่าย พลิกอ่านหรือดาวน์โหลดได้ทันที',
      btnText: 'อ่านสรุปวิชา ›',
      action: () => handleScrollToSection('summaries-section'),
      themeClass: 's2',
      icon: <BookOpen size={150} color="#ffffff" strokeWidth={1.5} />
    },
    {
      id: 'default-3',
      isDefault: true,
      type: 'DEK SA SERVICE',
      title: 'ระบบบริการ & ตรวจสอบผลการเรียน',
      content: 'เช็คตารางเรียน ชำระเงินบำรุงการศึกษา และระบบตรวจสอบเกรด SGS ครบวงจร',
      btnText: 'เปิดบริการ DEK SA ›',
      action: () => navigate('/e-service'),
      themeClass: 's3',
      icon: <Zap size={150} color="#ffffff" strokeWidth={1.5} />
    }
  ];

  // Dynamic hero slides driven by "จัดการประกาศข่าวสาร"
  const heroSlides = (announcements && announcements.length > 0)
    ? announcements.map((ann, idx) => ({
        id: ann.id || `ann-${idx}`,
        isDefault: false,
        type: ann.type || 'NEWS UPDATE',
        title: ann.title || 'ประกาศข่าวสาร',
        content: ann.content || '',
        imageUrl: ann.imageUrl || null,
        btnText: 'อ่านประกาศ ›',
        action: () => navigate(`/announcement/${ann.id}`),
        themeClass: `s${(idx % 3) + 1}`,
      }))
    : DEFAULT_SLIDES;

  const totalSlides = heroSlides.length;

  // Hero auto-slide timer (every 5 seconds)
  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      if (heroRef.current) {
        const nextSlide = (activeSlide + 1) % totalSlides;
        heroRef.current.scrollTo({
          left: nextSlide * heroRef.current.clientWidth,
          behavior: 'smooth'
        });
        setActiveSlide(nextSlide);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlide, totalSlides]);

  const handleHeroScroll = () => {
    if (heroRef.current) {
      const slideIndex = Math.round(heroRef.current.scrollLeft / heroRef.current.clientWidth);
      setActiveSlide(slideIndex);
    }
  };

  const scrollToSlide = (index) => {
    if (heroRef.current) {
      heroRef.current.scrollTo({
        left: index * heroRef.current.clientWidth,
        behavior: 'smooth'
      });
      setActiveSlide(index);
    }
  };

  const handleScrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Quick Apps Scroll & Drag-to-Slide Handlers
  const quickAppsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkQuickAppsScroll = () => {
    if (quickAppsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = quickAppsRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    const el = quickAppsRef.current;
    if (!el) return;

    checkQuickAppsScroll();

    // Mouse wheel vertically scrolls horizontally
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.2;
        checkQuickAppsScroll();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', checkQuickAppsScroll, { passive: true });
    window.addEventListener('resize', checkQuickAppsScroll);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', checkQuickAppsScroll);
      window.removeEventListener('resize', checkQuickAppsScroll);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (!quickAppsRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - quickAppsRef.current.offsetLeft;
    scrollLeftRef.current = quickAppsRef.current.scrollLeft;
    quickAppsRef.current.style.cursor = 'grabbing';
    quickAppsRef.current.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !quickAppsRef.current) return;
    const x = e.pageX - quickAppsRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
    }
    quickAppsRef.current.scrollLeft = scrollLeftRef.current - walk;
    checkQuickAppsScroll();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    if (quickAppsRef.current) {
      quickAppsRef.current.style.cursor = 'grab';
      quickAppsRef.current.style.removeProperty('user-select');
    }
  };

  const scrollQuickApps = (direction) => {
    if (!quickAppsRef.current) return;
    const distance = 280;
    quickAppsRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
    setTimeout(checkQuickAppsScroll, 350);
  };

  // Quick App Icons (Row) with Lucide Vector Icons (#4287f5 Royal Sky / Modern Tech Palette)
  const quickApps = [
    { name: 'ดูเกรด SGS', icon: <BarChart3 size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#1e3a8a, #4287f5', action: () => navigate('/sgs') },
    { name: 'ตารางเรียน', icon: <Calendar size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#4287f5, #60a5fa', action: () => navigate('/schedule') },
    { name: 'คลังชีท & สรุป', icon: <BookOpen size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#0284c7, #38bdf8', action: () => navigate('/student') },
    { name: 'แชร์และส่งไฟล์', icon: <FileText size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#0369a1, #4287f5', action: () => navigate('/files') },
    { name: 'E-Service', icon: <GraduationCap size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#1d4ed8, #4287f5', action: () => navigate('/e-service') },
    { name: 'ข่าวโรงเรียน', icon: <Megaphone size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#4287f5, #93c5fd', action: () => navigate('/news') },
    { name: 'มินิเกม', icon: <Gamepad2 size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#4f46e5, #4287f5', action: () => navigate('/game') },
    { name: 'Popcat SA', icon: <Flame size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#0284c7, #4287f5', action: () => navigate('/popcat') },
    { name: 'บริการทั้งหมด', icon: <Zap size={30} color="#ffffff" strokeWidth={2.2} />, grad: '#1e40af, #4287f5', action: () => navigate('/services') },
  ];

  // News ticker array with icons
  const marqueeItems = [
    { icon: <Flame size={14} color="#ff453a" strokeWidth={2.4} />, text: "ยินดีต้อนรับสู่ DEK SA Service แพลตฟอร์มการเรียนรู้ออนไลน์" },
    { icon: <BookOpen size={14} color="#4287f5" strokeWidth={2.4} />, text: "อัปเดตสรุปวิชาใหม่ประจำสัปดาห์ พร้อมดาวน์โหลดแล้ววันนี้" },
    { icon: <BarChart3 size={14} color="#30d158" strokeWidth={2.4} />, text: "ระบบตรวจสอบผลการเรียน SGS ใช้งานได้ตลอด 24 ชั่วโมง" },
    { icon: <Zap size={14} color="#ffd60a" strokeWidth={2.4} />, text: "ทดลองทำข้อสอบวัดระดับความรู้ เตรียมพร้อมสอบกลางภาคและปลายภาค" },
    { icon: <Calendar size={14} color="#bf5af2" strokeWidth={2.4} />, text: "ตรวจสอบตารางเรียนและห้องเรียนประจำวันได้ทันที" },
    { icon: <User size={14} color="#ff9f0a" strokeWidth={2.4} />, text: "ร่วมศึกษาและเตรียมตัวสอบไปพร้อมกับเพื่อนๆ ใน Dek SA" }
  ];

  return (
    <div className="apple-home-root">
      {/* Top Navbar */}
      <Header />

      <div className="home-wrap">

        {/* ================= HERO CAROUSEL BANNER ================= */}
        <div className="hero-carousel" ref={heroRef} onScroll={handleHeroScroll}>
          {heroSlides.map((slide) => (
            <section 
              key={slide.id} 
              className={`hero-slide ${slide.themeClass || 's1'} ${slide.imageUrl ? 'has-image-bg' : ''}`}
            >
              {slide.imageUrl ? (
                <div className="slide-full-bg-wrap">
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.title} 
                    className="slide-full-bg-img" 
                    loading="eager"
                  />
                  <div className="slide-full-bg-scrim" />
                </div>
              ) : (
                <div className="slide-art-icon">
                  {slide.icon || <Megaphone size={140} color="#ffffff" strokeWidth={1.5} />}
                </div>
              )}

              <div className="slide-content-wrap">
                <span className="slide-eyebrow">{slide.type}</span>
                <h1 className="slide-heading">{slide.title}</h1>
                <p className="slide-desc">{slide.content}</p>
                <div className="slide-btn-group">
                  <button className="slide-pill-btn" onClick={slide.action}>
                    {slide.btnText}
                  </button>
                  {slide.imageUrl && (
                    <button 
                      type="button" 
                      className="slide-expand-img-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage({ url: slide.imageUrl, title: slide.title });
                      }}
                      title="ดูรูปภาพขนาดเต็มจอ"
                    >
                      <Maximize2 size={14} />
                      <span>ดูรูปเต็ม</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Hero Dots Indicators */}
        {totalSlides > 1 && (
          <div className="carousel-dots">
            {heroSlides.map((_, idx) => (
              <i 
                key={idx} 
                className={`dot-item ${activeSlide === idx ? 'on' : ''}`}
                onClick={() => scrollToSlide(idx)}
              />
            ))}
          </div>
        )}

        {/* ================= INFINITE MARQUEE TICKER ================= */}
        <div className="ticker-marquee-wrap">
          <div className="ticker-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="ticker-item">
                <span className="ticker-icon-badge">{item.icon}</span>
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* ================= QUICK SERVICES ROW ================= */}
        <div className="section-title-row quick-apps-header" onClick={() => navigate('/services')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>บริการด่วน</span>
            <span className="title-chevron">›</span>
          </div>
          <div className="quick-apps-nav-buttons">
            <button
              type="button"
              className={`nav-scroll-btn ${!canScrollLeft ? 'disabled' : ''}`}
              onClick={() => scrollQuickApps('left')}
              disabled={!canScrollLeft}
              aria-label="เลื่อนซ้าย"
              title="เลื่อนซ้าย"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className={`nav-scroll-btn ${!canScrollRight ? 'disabled' : ''}`}
              onClick={() => scrollQuickApps('right')}
              disabled={!canScrollRight}
              aria-label="เลื่อนขวา"
              title="เลื่อนขวา"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="quick-apps-outer-wrap">
          {canScrollLeft && (
            <button 
              type="button" 
              className="quick-apps-floating-arrow left"
              onClick={() => scrollQuickApps('left')}
              aria-label="เลื่อนไปทางซ้าย"
              title="เลื่อนไปทางซ้าย"
            >
              <ChevronLeft size={20} strokeWidth={2.4} />
            </button>
          )}

          <div 
            className="apps-horizontal-scroll"
            ref={quickAppsRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            {quickApps.map((app, idx) => (
              <div 
                key={idx} 
                className="app-item" 
                onClick={(e) => {
                  if (hasDraggedRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  app.action();
                }}
              >
                <div className="app-icon-squircle" style={{ background: `linear-gradient(135deg, ${app.grad})` }}>
                  {app.icon}
                </div>
                <span className="app-label">{app.name}</span>
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button 
              type="button" 
              className="quick-apps-floating-arrow right"
              onClick={() => scrollQuickApps('right')}
              aria-label="เลื่อนไปทางขวา"
              title="เลื่อนไปทางขวา"
            >
              <ChevronRight size={20} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* ================= FRIENDS ARE STUDYING ================= */}
        <h2 className="section-title-row">
          <span>เพื่อนๆ กำลังอ่าน & คอร์สยอดนิยม</span>
          <span className="title-chevron">›</span>
        </h2>
        <div className="friends-study-grid">
          
          <div className="study-card" onClick={() => handleScrollToSection('summaries-section')}>
            <div className="card-visual-thumb" style={{ background: 'linear-gradient(135deg, #1e3a8a, #4287f5)' }}>
              <BookOpen size={46} color="#ffffff" strokeWidth={2.2} />
            </div>
            <div className="card-info-box">
              <div className="avatar-stack-group">
                <b style={{ background: 'linear-gradient(135deg, #ff9f0a, #ff6b00)' }}>
                  <User size={13} color="#ffffff" strokeWidth={2.5} />
                </b>
                <b style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                  <User size={13} color="#ffffff" strokeWidth={2.5} />
                </b>
                <b style={{ background: 'linear-gradient(135deg, #4287f5, #2d74e8)' }}>
                  <User size={13} color="#ffffff" strokeWidth={2.5} />
                </b>
              </div>
              <p className="card-study-text">เพื่อน 4 คนกำลังอ่าน <strong>สรุปคณิตศาสตร์ ม.ปลาย</strong></p>
            </div>
          </div>

          <div className="study-card" onClick={() => navigate('/student')}>
            <div className="card-visual-thumb" style={{ background: 'linear-gradient(135deg, #0f4c81, #2d74e8)' }}>
              <Rocket size={46} color="#ffffff" strokeWidth={2.2} />
            </div>
            <div className="card-info-box">
              <div className="avatar-stack-group">
                <b style={{ background: 'linear-gradient(135deg, #ef4444, #f43f5e)' }}>
                  <User size={13} color="#ffffff" strokeWidth={2.5} />
                </b>
                <b style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)' }}>
                  <User size={13} color="#ffffff" strokeWidth={2.5} />
                </b>
              </div>
              <p className="card-study-text">นักเรียนกว่า 120 คนกำลังทำข้อสอบ <strong>ฟิสิกส์ การเคลื่อนที่</strong></p>
            </div>
          </div>

        </div>

        {/* ================= SUMMARIES SECTION ================= */}
        <div id="summaries-section" className="content-block-section aur-section-wrap">
          
          {/* Favorite Summaries */}
          {favoriteSummaries.length > 0 && (
            <div style={{ marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <Star fill="#facc15" color="#facc15" size={22} />
                <h2 className="aur-section-title" style={{ margin: 0, color: '#facc15' }}>สรุปวิชาโปรดของคุณ</h2>
                <span className="aur-count-badge glass">{favoriteSummaries.length} วิชา</span>
              </div>
              <div className="aur-grid">
                {favoriteSummaries.map((item, idx) => renderSummaryCard(item, idx))}
              </div>
            </div>
          )}

          {/* All Summaries Title & Controls */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h1 className="aur-title">สรุปวิชาทั้งหมด</h1>
              <p className="aur-sub">
                ทบทวนบทเรียนและเตรียมสอบ · {filteredSummaries.length} วิชาพร้อมอ่าน
              </p>
            </div>

            {!hasFilterActive && processedSummaries.length > 4 && (
              <button 
                type="button"
                className="aur-see-all-btn glass" 
                onClick={() => setShowAllSummaries(prev => !prev)}
              >
                {showAllSummaries ? 'ย่อรายการ ⌃' : `ดูทั้งหมด (${processedSummaries.length}) ›`}
              </button>
            )}
          </div>

          {/* Search & Grade Filter Chips Bar */}
          <div className="aur-bar">
            <label className="aur-search glass">
              <Search size={16} color="rgba(255, 255, 255, 0.6)" strokeWidth={2.2} />
              <input 
                type="text"
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
                placeholder="ค้นหาวิชา…"
              />
              {summarySearch && (
                <button 
                  type="button"
                  onClick={() => setSummarySearch('')} 
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                  aria-label="ล้างการค้นหา"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="aur-chips glass">
              {['ทั้งหมด', 'ม.1', 'ม.2', 'ม.3'].map((gradeName, idx) => (
                <button
                  key={gradeName}
                  type="button"
                  className={`aur-chip ${summaryGradeFilter === idx ? 'on' : ''}`}
                  onClick={() => setSummaryGradeFilter(idx)}
                >
                  {gradeName}
                </button>
              ))}
            </div>
          </div>

          {/* Modern Cards Grid */}
          <div className="aur-grid">
            {isPageLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="aur-skeleton-card glass" />
              ))
            ) : displayedSummaries.length > 0 ? (
              displayedSummaries.map((item, idx) => renderSummaryCard(item, idx))
            ) : (
              <div className="aur-empty glass">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <Search size={38} color="rgba(255,255,255,0.35)" strokeWidth={1.8} />
                </div>
                <div>ไม่พบวิชาที่ค้นหา</div>
                <button 
                  type="button" 
                  className="aur-reset-btn"
                  onClick={() => { setSummarySearch(''); setSummaryGradeFilter(0); }}
                >
                  ล้างการค้นหา
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= COURSES & EXAMS SECTION ================= */}
        <div id="courses-section" className="content-block-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 className="section-title-row" style={{ margin: 0 }}>
              <span>ข้อสอบและคอร์สเรียนแนะนำ</span>
            </h2>
            <button className="btn-see-all-pill" onClick={() => navigate('/student')}>
              ดูคอร์สทั้งหมด ›
            </button>
          </div>

          <div className="courses-cards-grid">
            {isPageLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="course-skeleton-box" />
              ))
            ) : exams.length > 0 ? (
              exams.slice(0, 3).map((exam) => (
                <div key={exam.id} className="course-item-card" onClick={() => navigate('/student')}>
                  {exam.coverImage ? (
                    <div className="course-cover-wrap">
                      <img src={exam.coverImage} alt={exam.title} className="course-cover-img" />
                      <div className="course-cover-overlay" />
                      <h3 className="course-overlay-title">{exam.title}</h3>
                    </div>
                  ) : (
                    <div className="course-fallback-box">
                      <ImageIcon size={48} color="#52525b" />
                      <h3 className="course-fallback-title">{exam.title}</h3>
                      <p className="course-fallback-sub">คลิกเพื่อดูรายละเอียดและเข้าทำข้อสอบ</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: '#a1a1aa' }}>ยังไม่มีคอร์สเรียนในระบบขณะนี้</p>
            )}
          </div>
        </div>

      </div>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        <div className="footer-container">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src="/favicon.png" alt="Dek SA Logo" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
              <span style={{ fontSize: '1.4rem', fontWeight: '900', fontStyle: 'italic', color: '#fff' }}>
                Dek <span style={{ color: '#4287f5' }}>SA</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#8e8e93', lineHeight: 1.6, maxWidth: '320px' }}>
              ระบบแพลตฟอร์มการเรียนรู้และเตรียมสอบออนไลน์ มุ่งเน้นการพัฒนาศักยภาพของนักเรียนอย่างเต็มที่
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>เมนูลัด</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: '#8e8e93' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>หน้าหลัก</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/schedule')}>ตารางเรียน</span>
              <span style={{ cursor: 'pointer' }} onClick={() => handleScrollToSection('summaries-section')}>สรุปวิชา</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/student')}>คอร์สเรียนและข้อสอบ</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/e-service')}>DEK SA Service</span>
            </div>
          </div>
        </div>

        <div className="footer-copyright-bar">
          <div>© 2026 Dek SA. All Rights Reserved.</div>
        </div>
      </footer>

      {/* Lightbox Modal for Full View Image */}
      {lightboxImage && (
        <div 
          className="image-lightbox-backdrop" 
          onClick={() => setLightboxImage(null)}
        >
          <div className="image-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="image-lightbox-close" 
              onClick={() => setLightboxImage(null)}
              title="ปิด"
            >
              <X size={20} />
            </button>
            <img 
              src={lightboxImage.url} 
              alt={lightboxImage.title || 'รูปภาพ'} 
              className="image-lightbox-img" 
            />
            {lightboxImage.title && (
              <div className="image-lightbox-caption">
                <span>{lightboxImage.title}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= STYLES ================= */}
      <style>{`
        :root {
          --bg: #0b0c10;
          --fg: #ffffff;
          --muted: #9a9aa6;
          --glass: rgba(255, 255, 255, 0.14);
          --card: rgba(20, 21, 28, 0.78);
        }

        .apple-home-root {
          background-color: transparent;
          color: var(--fg);
          font-family: -apple-system, "SF Pro Display", "Plus Jakarta Sans", "Prompt", system-ui, sans-serif;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          padding-bottom: 0;
          flex: 1;
          width: 100%;
        }

        .home-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px;
          flex: 1 0 auto;
          width: 100%;
        }

        /* Hero Carousel with seamless bottom gradient mask */
        .hero-carousel {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          gap: 0;
          scrollbar-width: none;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-top: 0;
          -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 48px), transparent 100%);
          mask-image: linear-gradient(180deg, #000 0%, #000 calc(100% - 48px), transparent 100%);
        }

        .hero-carousel::-webkit-scrollbar {
          display: none;
        }

        .hero-slide {
          flex: 0 0 100%;
          scroll-snap-align: center;
          position: relative;
          height: min(60vw, 520px);
          min-height: 380px;
          overflow: hidden;
          padding: 36px max(20px, calc(50vw - 550px)) 28px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .hero-slide.s1 {
          background: linear-gradient(120deg, #3a0008 0%, #c4111f 60%, #ff3b30 100%);
        }

        .hero-slide.s2 {
          background: linear-gradient(120deg, #021b3a 0%, #0a5bd8 60%, #35c2ff 100%);
        }

        .hero-slide.s3 {
          background: linear-gradient(120deg, #0a2a14 0%, #1a8f45 60%, #8fe36b 100%);
        }

        .hero-slide::after {
          content: "";
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(0deg, var(--bg) 0%, rgba(11, 12, 16, 0.82) 22%, rgba(11, 12, 16, 0) 70%), 
            linear-gradient(90deg, rgba(0, 0, 0, 0.35), transparent 60%);
          pointer-events: none;
        }

        .hero-slide.has-image-bg {
          background: #09090d;
        }

        .hero-slide.has-image-bg::after {
          display: none;
        }

        .slide-full-bg-wrap {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: hidden;
          pointer-events: none;
        }

        .slide-full-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transform: scale(1);
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease;
          filter: brightness(0.92);
        }

        .hero-slide:hover .slide-full-bg-img {
          transform: scale(1.025);
          filter: brightness(0.98);
        }

        .slide-full-bg-scrim {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(90deg, 
              rgba(11, 12, 16, 0.95) 0%, 
              rgba(11, 12, 16, 0.85) 36%, 
              rgba(11, 12, 16, 0.45) 68%, 
              rgba(11, 12, 16, 0.2) 85%,
              rgba(11, 12, 16, 0.45) 100%
            ),
            linear-gradient(0deg, 
              var(--bg) 0%, 
              rgba(11, 12, 16, 0.72) 22%, 
              transparent 55%
            ),
            linear-gradient(180deg, 
              rgba(11, 12, 16, 0.75) 0%, 
              rgba(11, 12, 16, 0.2) 28%, 
              transparent 45%
            );
          pointer-events: none;
        }

        .slide-content-wrap {
          position: relative;
          z-index: 2;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .slide-btn-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .slide-expand-img-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .slide-expand-img-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.42);
          transform: translateY(-1px);
        }

        .hero-slide > *:not(.slide-art-icon):not(.slide-art-image):not(.slide-backdrop-glow):not(.slide-full-bg-wrap) {
          position: relative;
          z-index: 2;
        }

        .slide-backdrop-glow {
          position: absolute;
          inset: -30px;
          background-size: cover;
          background-position: center;
          filter: blur(48px) brightness(0.35) saturate(1.4);
          opacity: 0.65;
          z-index: 0;
          pointer-events: none;
        }

        .slide-art-icon {
          position: absolute;
          right: 8%;
          top: 50%;
          transform: translateY(-50%);
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.45));
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          z-index: 1;
          opacity: 0.9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-slide:hover .slide-art-icon {
          transform: translateY(-52%) scale(1.08) rotate(-3deg);
        }

        .slide-art-image {
          position: absolute;
          right: 7%;
          top: 50%;
          transform: translateY(-50%);
          max-width: 440px;
          max-height: 330px;
          width: 38vw;
          height: auto;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6));
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .hero-slide:hover .slide-art-image {
          transform: translateY(-52%) scale(1.05) rotate(-1deg);
        }

        .slide-hero-art-img {
          max-width: 100%;
          max-height: 320px;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          background: rgba(11, 11, 15, 0.35);
        }

        /* Lightbox Modal */
        .image-lightbox-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }

        .image-lightbox-dialog {
          position: relative;
          max-width: 92vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .image-lightbox-img {
          max-width: 90vw;
          max-height: 82vh;
          object-fit: contain;
          border-radius: 16px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .image-lightbox-close {
          position: absolute;
          top: -46px;
          right: 0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .image-lightbox-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.08);
        }

        .image-lightbox-caption {
          margin-top: 12px;
          color: rgba(255, 255, 255, 0.88);
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }

        .slide-eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.88;
          margin-bottom: 3px;
        }

        .slide-heading {
          font-size: clamp(20px, 2.6vw, 29px);
          font-weight: 800;
          letter-spacing: -0.015em;
          margin: 3px 0 6px;
          color: #ffffff;
          line-height: 1.25;
        }

        .slide-desc {
          opacity: 0.85;
          font-size: 14px;
          margin-bottom: 15px;
          max-width: 480px;
          line-height: 1.45;
        }

        .slide-pill-btn {
          align-self: flex-start;
          border: 0;
          color: #ffffff;
          background: var(--glass);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 7px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .slide-pill-btn:hover {
          background: rgba(255, 255, 255, 0.32);
          transform: scale(1.04);
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin: 14px 0 6px;
        }

        .dot-item {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .dot-item.on {
          background: #ffffff;
          width: 20px;
          border-radius: 3px;
        }

        /* Marquee Ticker */
        .ticker-marquee-wrap {
          overflow: hidden;
          margin: 8px 0 20px;
          background: transparent;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 34s linear infinite;
        }

        .ticker-marquee-wrap:hover .ticker-track {
          animation-play-state: paused;
        }

        .ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0 8px 26px;
          font-size: 13.5px;
          font-weight: 600;
          white-space: nowrap;
          color: rgba(255, 255, 255, 0.75);
        }

        .ticker-icon-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .ticker-item::after {
          content: "✦";
          margin-left: 26px;
          color: rgba(255, 255, 255, 0.25);
        }

        @keyframes marqueeScroll {
          to { transform: translateX(-50%); }
        }

        /* Section Title Row */
        .section-title-row {
          font-size: 21px;
          font-weight: 800;
          margin: 32px 0 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ffffff;
        }

        .section-title-row.quick-apps-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .quick-apps-nav-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-scroll-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-scroll-btn:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.35);
          transform: scale(1.08);
        }

        .nav-scroll-btn:active:not(.disabled) {
          transform: scale(0.94);
        }

        .nav-scroll-btn.disabled {
          opacity: 0.25;
          cursor: default;
          pointer-events: none;
        }

        .title-chevron {
          color: var(--muted);
          font-size: 22px;
          font-weight: 400;
        }

        /* Quick Apps Outer & Horizontal Scroll */
        .quick-apps-outer-wrap {
          position: relative;
          margin-bottom: 16px;
        }

        .quick-apps-floating-arrow {
          position: absolute;
          top: 38px;
          transform: translateY(-50%);
          z-index: 10;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: rgba(18, 18, 26, 0.88);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (max-width: 768px) {
          .quick-apps-floating-arrow {
            display: none !important;
          }
        }

        .quick-apps-floating-arrow.left {
          left: -8px;
        }

        .quick-apps-floating-arrow.right {
          right: -8px;
        }

        .quick-apps-floating-arrow:hover {
          background: rgba(36, 36, 50, 0.96);
          border-color: rgba(255, 255, 255, 0.45);
          transform: translateY(-50%) scale(1.12);
        }

        .quick-apps-floating-arrow:active {
          transform: translateY(-50%) scale(0.95);
        }

        .apps-horizontal-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 6px 4px 14px;
          scrollbar-width: none;
          cursor: grab;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          user-select: none;
        }

        .apps-horizontal-scroll:active {
          cursor: grabbing;
        }

        .apps-horizontal-scroll::-webkit-scrollbar {
          display: none;
        }

        .app-item {
          flex: 0 0 auto;
          width: 80px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          transition: transform 0.2s ease, color 0.2s ease;
          user-select: none;
        }

        .app-icon-squircle {
          width: 76px;
          height: 76px;
          border-radius: 22%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 6px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
        }

        .app-item:hover {
          color: #ffffff;
        }

        .app-item:hover .app-icon-squircle {
          transform: translateY(-5px) scale(1.06);
        }

        .app-label {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Friends Study Cards */
        .friends-study-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 16px;
          margin-bottom: 3rem;
        }

        .study-card {
          display: flex;
          border-radius: 20px;
          overflow: hidden;
          background: var(--card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          min-height: 125px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }

        .study-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .card-visual-thumb {
          flex: 0 0 38%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-info-box {
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .avatar-stack-group {
          display: flex;
        }

        .avatar-stack-group b {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--card);
          margin-right: -8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .card-study-text {
          font-size: 13.5px;
          color: #d4d4d8;
          line-height: 1.4;
        }

        /* Summaries Grid */
        .content-block-section {
          padding: 1.5rem 0 3rem;
        }

        .btn-see-all-pill {
          background: #1f1f24;
          color: #93c5fd;
          border: 1px solid rgba(66, 135, 245, 0.35);
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-see-all-pill:hover {
          background: #4287f5;
          color: #ffffff;
        }

        /* ================= SUMMARIES SECTION ================= */
        .aur-section-wrap {
          position: relative;
          margin-bottom: 3.5rem;
        }

        .aur-title {
          font-size: clamp(24px, 3.8vw, 32px);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0;
        }

        .aur-section-title {
          font-size: clamp(20px, 3.2vw, 24px);
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .aur-sub {
          color: #a1a1aa;
          margin: 6px 0 0;
          font-size: 14px;
        }

        .aur-count-badge {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 999px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .aur-see-all-btn {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .aur-see-all-btn:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.25);
          color: #609bf8;
        }

        .aur-bar {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin: 20px 0 24px;
        }

        .aur-search {
          flex: 1 1 240px;
          max-width: 360px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 14px;
          padding: 0 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: border-color 0.2s, background 0.2s;
        }

        .aur-search:focus-within {
          border-color: #4287f5;
          background: rgba(255, 255, 255, 0.09);
        }

        .aur-search input {
          flex: 1;
          background: none;
          border: 0;
          outline: 0;
          color: #ffffff;
          font-size: 14px;
          padding: 10px 0;
          font-family: inherit;
        }

        .aur-search input::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }

        .aur-chips {
          display: flex;
          gap: 6px;
          padding: 4px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .aur-chip {
          border: 0;
          background: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          padding: 6px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .aur-chip:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .aur-chip.on {
          color: #ffffff;
          background: #4287f5;
          box-shadow: 0 2px 8px rgba(66, 135, 245, 0.4);
        }

        /* 4 Columns Grid on Desktop (balanced 4 items = 1 row, 8 items = 2 rows) */
        .aur-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        /* Modern Clean Summary Card */
        .summary-modern-card {
          position: relative;
          background: rgba(20, 21, 28, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          user-select: none;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s, box-shadow 0.25s;
          overflow: hidden;
        }

        .summary-modern-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.7), 0 0 20px -6px var(--c1, #4287f5);
        }

        .summary-thumb-box {
          position: relative;
          aspect-ratio: 16/10;
          border-radius: 12px;
          overflow: hidden;
          background: #0d0d12;
        }

        .summary-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
          display: block;
        }

        .summary-modern-card:hover .summary-cover-img {
          transform: scale(1.05);
        }

        .summary-fallback-cover {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-fallback-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-thumb-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.3) 100%);
          pointer-events: none;
        }

        .summary-thumb-header {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
        }

        .summary-badge-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 999px;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .badge-new {
          background: rgba(34, 197, 94, 0.9);
        }

        .badge-popular {
          background: rgba(245, 158, 11, 0.9);
        }

        .summary-fav-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(15, 16, 22, 0.7);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .summary-fav-btn:hover {
          transform: scale(1.12);
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.35);
        }

        .summary-fav-btn.is-fav {
          background: rgba(250, 204, 21, 0.18);
          border-color: rgba(250, 204, 21, 0.55);
        }

        .summary-fav-btn.pop {
          animation: starPopAnim 0.45s ease;
        }

        @keyframes starPopAnim {
          40% {
            transform: scale(1.35) rotate(12deg);
          }
        }

        .summary-body {
          padding: 10px 4px 2px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .summary-tags-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .summary-cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid;
        }

        .summary-page-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #a1a1aa;
        }

        .summary-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.35;
          margin: 0 0 12px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 40px;
        }

        .summary-footer {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .summary-action-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
          font-weight: 600;
          color: #93c5fd;
          transition: color 0.2s;
        }

        .summary-modern-card:hover .summary-action-btn {
          color: #38bdf8;
        }

        .summary-arrow {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .summary-modern-card:hover .summary-arrow {
          transform: translateX(4px);
        }

        .summary-prog-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-prog-track {
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .summary-prog-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        .summary-prog-label {
          font-size: 11px;
          color: #a1a1aa;
        }

        .aur-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 50px 20px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #9b9bb0;
          font-size: 14.5px;
        }

        .aur-reset-btn {
          margin-top: 14px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #ffffff;
          padding: 6px 18px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          transition: 0.2s;
        }

        .aur-reset-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .aur-skeleton-card {
          height: 270px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.05);
          animation: skeletonPulse 1.8s infinite ease-in-out;
        }

        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @media (max-width: 1024px) {
          .aur-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 580px) {
          .aur-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .aur-search {
            max-width: none;
            width: 100%;
          }
          .aur-chips {
            width: 100%;
            justify-content: space-between;
          }
          .aur-chip {
            flex: 1;
            text-align: center;
            padding: 6px 8px;
          }
        }

        /* Courses Grid */
        .courses-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .course-item-card {
          border-radius: 20px;
          overflow: hidden;
          background: rgba(20, 21, 28, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
          cursor: pointer;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .course-item-card:hover {
          transform: translateY(-4px);
          border-color: #4287f5;
        }

        .course-cover-wrap {
          position: relative;
          height: 260px;
          overflow: hidden;
        }

        .course-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .course-cover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(11, 11, 15, 0.95), transparent 60%);
        }

        .course-overlay-title {
          position: absolute;
          bottom: 1.25rem;
          left: 1.25rem;
          right: 1.25rem;
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.3;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
        }

        .course-fallback-box {
          padding: 2rem;
          height: 240px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .course-fallback-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
          margin: 1rem 0 0.25rem;
        }

        .course-fallback-sub {
          font-size: 0.85rem;
          color: #8e8e93;
        }

        .course-skeleton-box {
          height: 240px;
          border-radius: 20px;
          background: #18181e;
          animation: skeletonPulse 1.8s infinite ease-in-out;
        }

        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @media (max-width: 860px) {
          .slide-art-image {
            max-width: 280px;
            max-height: 220px;
            right: 4%;
            opacity: 0.85;
          }
          .slide-hero-art-img {
            max-height: 200px;
          }
        }

        /* Mobile Compact & Polished (จอโทรศัพท์เล็กแบบพอดี สบายตา) */
        @media (max-width: 640px) {
          .apple-home-root {
            padding-bottom: 0;
          }

          .home-wrap {
            padding: 0 12px;
          }

          /* Hero Carousel Banner Mobile */
          .hero-carousel {
            margin-top: 0;
          }

          .hero-slide {
            height: auto;
            min-height: 340px;
            padding: 24px 18px 24px;
          }

          .slide-full-bg-scrim {
            background: 
              linear-gradient(0deg, rgba(11, 11, 15, 0.82) 0%, rgba(11, 11, 15, 0.38) 28%, transparent 60%),
              linear-gradient(90deg, rgba(11, 11, 15, 0.45) 0%, transparent 65%);
          }

          .slide-content-wrap {
            max-width: 100%;
          }

          .slide-btn-group {
            gap: 10px;
            margin-top: 6px;
          }

          .slide-expand-img-btn {
            padding: 9px 18px;
            font-size: 13.5px;
            font-weight: 600;
          }

          .slide-art-image {
            display: block;
            position: absolute;
            right: 12px;
            bottom: 14px;
            top: auto;
            transform: none;
            max-width: 110px;
            max-height: 90px;
            width: auto;
            height: auto;
            opacity: 0.9;
            z-index: 1;
            pointer-events: none;
          }

          .slide-hero-art-img {
            max-height: 85px;
            max-width: 110px;
            border-radius: 12px;
          }

          .slide-art-icon {
            position: absolute;
            right: 6px;
            bottom: 8px;
            top: auto;
            transform: none;
            opacity: 0.22;
            pointer-events: none;
            z-index: 1;
          }

          .slide-art-icon svg {
            width: 72px !important;
            height: 72px !important;
          }

          .hero-slide:hover .slide-art-icon,
          .hero-slide:hover .slide-art-image {
            transform: none;
          }

          .slide-eyebrow {
            font-size: 12.5px;
            letter-spacing: 0.08em;
            margin-bottom: 3px;
            opacity: 0.95;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.85);
          }

          .slide-heading {
            font-size: clamp(24px, 6.5vw, 29px);
            line-height: 1.22;
            margin: 3px 0 6px;
            max-width: 100%;
            font-weight: 800;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
          }

          .slide-desc {
            font-size: 14.5px;
            line-height: 1.45;
            margin-bottom: 12px;
            max-width: 100%;
            display: block;
            opacity: 0.92;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.85);
          }

          .slide-pill-btn {
            padding: 9px 20px;
            font-size: 13.5px;
            font-weight: 700;
          }

          .carousel-dots {
            margin: 10px 0 4px;
            gap: 5px;
          }

          .dot-item {
            width: 6px;
            height: 6px;
          }

          .dot-item.on {
            width: 18px;
          }

          /* Ticker Marquee Mobile */
          .ticker-marquee-wrap {
            margin: 4px 0 10px;
          }

          .ticker-item {
            font-size: 11px;
            padding: 4px 0 4px 12px;
            gap: 4px;
          }

          .ticker-item::after {
            margin-left: 12px;
            font-size: 9px;
          }

          /* Section Titles Mobile */
          .section-title-row {
            font-size: 15px;
            margin: 18px 0 8px;
            font-weight: 700;
            gap: 4px;
          }

          .section-title-row.quick-apps-header {
            margin-bottom: 8px;
          }

          .title-chevron {
            font-size: 15px;
          }

          .quick-apps-nav-buttons {
            display: none !important;
          }

          .btn-see-all-pill {
            padding: 4px 10px;
            font-size: 11px;
          }

          /* Quick Apps Horizontal Scroll Mobile */
          .quick-apps-outer-wrap {
            margin-bottom: 10px;
          }

          .apps-horizontal-scroll {
            gap: 10px;
            padding: 2px 2px 8px;
          }

          .app-item {
            width: 56px;
            font-size: 10px;
          }

          .app-icon-squircle {
            width: 50px;
            height: 50px;
            border-radius: 15px;
            margin: 0 auto 4px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
          }

          .app-icon-squircle svg {
            width: 22px !important;
            height: 22px !important;
          }

          .app-label {
            font-size: 10px;
            font-weight: 500;
          }

          /* Friends Study Cards Mobile */
          .friends-study-grid {
            grid-template-columns: 1fr;
            gap: 8px;
            margin-bottom: 1.25rem;
          }

          .study-card {
            min-height: 70px;
            border-radius: 14px;
          }

          .card-visual-thumb {
            flex: 0 0 24%;
          }

          .card-visual-thumb svg {
            width: 24px !important;
            height: 24px !important;
          }

          .card-info-box {
            padding: 6px 10px;
            gap: 3px;
          }

          .card-study-text {
            font-size: 11px;
            line-height: 1.25;
          }

          .avatar-stack-group b {
            width: 18px;
            height: 18px;
            font-size: 8px;
            margin-right: -5px;
          }

          .avatar-stack-group b svg {
            width: 9px !important;
            height: 9px !important;
          }

          /* Summaries Section (Aurora) Mobile */
          .aur-section-wrap {
            margin-bottom: 1.75rem;
          }

          .aur-title {
            font-size: 17px;
          }

          .aur-section-title {
            font-size: 14.5px;
          }

          .aur-sub {
            font-size: 11px;
            margin-top: 1px;
          }

          .aur-count-badge {
            font-size: 9.5px;
            padding: 2px 6px;
          }

          .aur-see-all-btn {
            font-size: 10.5px;
            padding: 3px 10px;
          }

          .aur-bar {
            gap: 6px;
            margin: 8px 0 10px;
          }

          .aur-search {
            padding: 0 10px;
            height: 32px;
            flex: 1 1 100%;
            max-width: none;
            border-radius: 999px;
          }

          .aur-search input {
            font-size: 11.5px;
            padding: 4px 0;
          }

          .aur-search svg {
            width: 14px !important;
            height: 14px !important;
          }

          .aur-chips {
            gap: 2px;
            padding: 2px;
            overflow-x: auto;
            max-width: 100%;
            scrollbar-width: none;
            flex-wrap: nowrap;
          }

          .aur-chips::-webkit-scrollbar {
            display: none;
          }

          .aur-chip {
            font-size: 10.5px;
            padding: 3px 9px;
            white-space: nowrap;
          }

          .aur-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .aur-card {
            border-radius: 14px;
            padding: 5px 5px 8px;
          }

          .aur-card .thumb {
            border-radius: 10px;
          }

          .aur-card .sticker {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            left: 4px;
            bottom: 4px;
          }

          .aur-card .sticker svg {
            width: 12px !important;
            height: 12px !important;
          }

          .aur-card .badge {
            font-size: 8.5px;
            padding: 1px 5px;
            left: 4px;
            top: 4px;
          }

          .aur-card .star {
            width: 24px;
            height: 24px;
            top: 4px;
            right: 4px;
          }

          .aur-card .star svg {
            width: 12px !important;
            height: 12px !important;
          }

          .aur-card .info {
            padding: 5px 2px 0;
          }

          .aur-card .t {
            font-size: 11.5px;
            line-height: 1.25;
            min-height: 28px;
            font-weight: 600;
          }

          .aur-card .meta {
            font-size: 9px;
            margin: 3px 0 4px;
            gap: 4px;
          }

          .aur-card .g {
            padding: 1px 5px;
            font-size: 8.5px;
            border-radius: 4px;
          }

          .aur-card .prog {
            height: 3px;
          }

          .aur-card .pl {
            margin-top: 2px;
            font-size: 8.5px;
          }

          /* Courses Section Mobile */
          .content-block-section {
            padding: 0.75rem 0 1.5rem;
          }

          .courses-cards-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .course-item-card {
            border-radius: 14px;
          }

          .course-cover-wrap {
            height: 125px;
          }

          .course-overlay-title {
            font-size: 0.95rem;
            bottom: 0.6rem;
            left: 0.6rem;
            right: 0.6rem;
          }

          .course-fallback-box {
            height: 125px;
            padding: 0.75rem;
          }

          .course-fallback-title {
            font-size: 0.9rem;
            margin: 0.4rem 0 0.15rem;
          }

          .course-fallback-sub {
            font-size: 0.75rem;
          }

          /* Footer Mobile */
          .home-footer {
            padding: 1.5rem 0 1rem;
            margin-top: 1.5rem;
          }

          .footer-container {
            gap: 1.25rem;
          }

          .footer-copyright-bar {
            margin-top: 1rem;
            padding-top: 0.65rem;
            font-size: 0.7rem;
          }
        }

        /* Extra Small Phones (iPhone SE / 360-390px screens) */
        @media (max-width: 380px) {
          .app-item {
            width: 48px;
          }
          .app-icon-squircle {
            width: 44px;
            height: 44px;
            border-radius: 13px;
          }
          .app-label {
            font-size: 9px;
          }
          .slide-heading {
            font-size: 17px;
          }
          .aur-card .t {
            font-size: 10.5px;
          }
        }

        /* Footer */
        .home-footer {
          background: #09090b;
          color: #a1a1aa;
          padding: 3.5rem 0 1.5rem;
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          width: 100%;
        }

        .footer-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 2.5rem;
        }

        .footer-copyright-bar {
          max-width: 1100px;
          margin: 2rem auto 0;
          padding: 1.25rem 20px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.75rem;
          color: #71717a;
        }
      `}</style>
    </div>
  );
};

export default Home;
