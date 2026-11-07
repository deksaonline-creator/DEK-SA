import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cloud, UploadCloud, Download, Share2, Search, Filter, Trash2, 
  Eye, Check, Copy, Plus, X, FileText, Folder, Calendar, 
  User, Tag, Sparkles, Clock, ArrowLeft, ExternalLink, Layers, 
  Grid, List, FileSpreadsheet, FileArchive, FileImage, FileCode,
  FileCheck2, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import Header from '../components/Header';
import { 
  getSharedFiles, 
  saveSharedFile, 
  deleteSharedFile, 
  uploadFileToStorage, 
  incrementFileDownloads 
} from '../store/mockDb';

// Helper for human-readable file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// File type badge and icon helper
const getFileTypeMeta = (fileType = '', fileName = '') => {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  
  if (fileType.includes('pdf') || ext === 'pdf') {
    return { label: 'PDF', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)', icon: <FileText size={22} color="#ef4444" /> };
  }
  if (fileType.includes('word') || fileType.includes('officedocument.wordprocessingml') || ['doc', 'docx'].includes(ext)) {
    return { label: 'DOCX', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)', icon: <FileText size={22} color="#3b82f6" /> };
  }
  if (fileType.includes('presentation') || fileType.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) {
    return { label: 'PPTX', color: '#f97316', bg: 'rgba(249, 115, 22, 0.14)', icon: <Layers size={22} color="#f97316" /> };
  }
  if (fileType.includes('sheet') || fileType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) {
    return { label: 'EXCEL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', icon: <FileSpreadsheet size={22} color="#10b981" /> };
  }
  if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
    return { label: 'IMAGE', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.14)', icon: <FileImage size={22} color="#06b6d4" /> };
  }
  if (fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('rar') || ['zip', 'rar', '7z', 'tar'].includes(ext)) {
    return { label: 'ZIP', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.14)', icon: <FileArchive size={22} color="#a855f7" /> };
  }
  if (['py', 'js', 'html', 'css', 'json', 'cpp', 'c', 'java'].includes(ext)) {
    return { label: 'CODE', color: '#eab308', bg: 'rgba(234, 179, 8, 0.14)', icon: <FileCode size={22} color="#eab308" /> };
  }
  return { label: ext.toUpperCase() || 'FILE', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.14)', icon: <FileText size={22} color="#a1a1aa" /> };
};

// Subject color badges
const SUBJECT_COLORS = {
  'วิทยาศาสตร์': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  'คณิตศาสตร์': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  'ภาษาอังกฤษ': { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  'ภาษาไทย': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  'สังคมศึกษา': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  'เทคโนโลยี': { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  'อื่นๆ': { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
};

const POPULAR_TAGS = ['#สรุปสอบ', '#ชีทติว', '#ข้อสอบเก่า', '#สไลด์สอน', '#การบ้าน', '#ใบงาน', '#สูตรลัด', '#เฉลย'];

const FileShareHub = () => {
  const navigate = useNavigate();

  // State
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ทั้งหมด');
  const [selectedSubject, setSelectedSubject] = useState('ทุกกลุ่มสาระ');
  const [selectedFileType, setSelectedFileType] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadGrade, setUploadGrade] = useState('ม.3');
  const [uploadSubject, setUploadSubject] = useState('วิทยาศาสตร์');
  const [uploadTags, setUploadTags] = useState(['#สรุปสอบ']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customUploader, setCustomUploader] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  // Preview Modal
  const [previewFile, setPreviewFile] = useState(null);

  // Drag and Drop
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Load user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('deksa_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        setCustomUploader(u.name || '');
      } catch (e) {}
    }
  }, []);

  // Fetch files from Supabase
  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getSharedFiles();
      setFiles(data || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file) => {
    setSelectedFile(file);
    if (!uploadTitle.trim()) {
      // Auto-set title from clean file name
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(nameWithoutExt);
    }
  };

  // Toggle tag
  const toggleTag = (tag) => {
    if (uploadTags.includes(tag)) {
      setUploadTags(uploadTags.filter(t => t !== tag));
    } else {
      setUploadTags([...uploadTags, tag]);
    }
  };

  const addCustomTag = (e) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const cleanTag = customTagInput.trim().startsWith('#') ? customTagInput.trim() : `#${customTagInput.trim()}`;
      if (!uploadTags.includes(cleanTag)) {
        setUploadTags([...uploadTags, cleanTag]);
      }
      setCustomTagInput('');
    }
  };

  // Handle File Upload Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('กรุณาเลือกไฟล์ที่ต้องการฝาก');
      return;
    }
    if (!uploadTitle.trim()) {
      alert('กรุณากรอกชื่อหัวข้อเอกสาร');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Upload to Supabase Storage
      setUploadProgress(50);
      const storageResult = await uploadFileToStorage(selectedFile, 'study-files');
      setUploadProgress(80);

      // Save record in database
      const filePayload = {
        id: crypto.randomUUID(),
        title: uploadTitle.trim(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || 'application/octet-stream',
        fileUrl: storageResult.url,
        storagePath: storageResult.path,
        category: uploadSubject,
        grade: uploadGrade,
        description: uploadDesc.trim(),
        tags: uploadTags,
        uploaderName: customUploader.trim() || currentUser?.name || 'เพื่อนนักเรียน Dek SA',
        uploaderId: currentUser?.id || null,
        downloads: 0,
        createdAt: new Date().toISOString()
      };

      await saveSharedFile(filePayload);
      setUploadProgress(100);

      showToast('ฝากไฟล์สำเร็จ! เอกสารของคุณพร้อมให้เพื่อนๆ เข้าใช้งานแล้ว');
      setShowUploadModal(false);
      resetUploadForm();
      await loadFiles();
    } catch (err) {
      console.error('Upload error:', err);
      showToast('เกิดข้อผิดพลาดในการอัปโหลดไฟล์ กรุณาลองใหม่อีกครั้ง: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadTitle('');
    setUploadDesc('');
    setUploadGrade('ม.3');
    setUploadSubject('วิทยาศาสตร์');
    setUploadTags(['#สรุปสอบ']);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Download File
  const handleDownload = async (fileItem) => {
    try {
      showToast(`กำลังเตรียมดาวน์โหลด: ${fileItem.title}`);
      
      // Increment counter in DB
      await incrementFileDownloads(fileItem);
      
      // Update local state downloads
      setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, downloads: (f.downloads || 0) + 1 } : f));

      // Trigger download
      if (fileItem.fileUrl) {
        const link = document.createElement('a');
        link.href = fileItem.fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = fileItem.fileName || `${fileItem.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Copy share link
  const handleCopyLink = (fileItem) => {
    const url = fileItem.fileUrl || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast('คัดลอกลิงก์ดาวน์โหลดไฟล์สำเร็จ!');
    }).catch(() => {
      prompt('คัดลอกลิงก์ไฟล์:', url);
    });
  };

  // Handle Delete File
  const handleDelete = async (fileItem) => {
    if (window.confirm(`ยืนยันการลบไฟล์ "${fileItem.title}"?`)) {
      try {
        await deleteSharedFile(fileItem.id, fileItem.storagePath);
        showToast('ลบไฟล์เรียบร้อยแล้ว');
        setFiles(prev => prev.filter(f => f.id !== fileItem.id));
      } catch (err) {
        showToast('ไม่สามารถลบไฟล์ได้: ' + err.message, 'error');
      }
    }
  };

  // Filter & Search Logic
  const filteredFiles = files.filter(f => {
    // Grade filter
    if (selectedGrade !== 'ทั้งหมด' && f.grade !== selectedGrade) {
      return false;
    }

    // Subject filter
    if (selectedSubject !== 'ทุกกลุ่มสาระ' && f.category !== selectedSubject) {
      return false;
    }

    // File type filter
    if (selectedFileType !== 'ทั้งหมด') {
      const ext = (f.fileName || '').split('.').pop().toLowerCase();
      if (selectedFileType === 'PDF' && ext !== 'pdf') return false;
      if (selectedFileType === 'Docs' && !['doc', 'docx', 'txt', 'rtf'].includes(ext)) return false;
      if (selectedFileType === 'Slides' && !['ppt', 'pptx'].includes(ext)) return false;
      if (selectedFileType === 'Images' && !['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) return false;
      if (selectedFileType === 'ZIP' && !['zip', 'rar', '7z'].includes(ext)) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (f.title || '').toLowerCase().includes(q);
      const matchDesc = (f.description || '').toLowerCase().includes(q);
      const matchUploader = (f.uploaderName || '').toLowerCase().includes(q);
      const matchFile = (f.fileName || '').toLowerCase().includes(q);
      const matchTags = (f.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchUploader && !matchFile && !matchTags) {
        return false;
      }
    }

    return true;
  });

  // Sort logic
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'downloads') {
      return (b.downloads || 0) - (a.downloads || 0);
    }
    if (sortBy === 'size') {
      return (b.fileSize || 0) - (a.fileSize || 0);
    }
    // Default 'latest'
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  // Stats calculation
  const totalDownloads = files.reduce((acc, f) => acc + (f.downloads || 0), 0);

  return (
    <div className="files-page-root">
      <Header />

      <main className="files-main-container">
        {/* Navigation Breadcrumb */}
        <div className="files-breadcrumb-bar">
          <button 
            type="button" 
            className="files-back-btn" 
            onClick={() => navigate('/services')}
          >
            <ArrowLeft size={16} />
            <span>กลับหน้ารวมบริการ (Services)</span>
          </button>
        </div>

        {/* Hero Section */}
        <section className="files-hero-section">
          <div className="files-hero-content">
            <div className="files-hero-badge">
              <Sparkles size={14} color="#38bdf8" />
              <span>DEK SA CLOUD DRIVE</span>
            </div>
            
            <h1 className="files-hero-title">
              ระบบฝากและแชร์ไฟล์การเรียน <Cloud size={30} color="#38bdf8" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }} />
            </h1>
            
            <p className="files-hero-desc">
              พื้นที่ฝากและดาวน์โหลดเอกสาร สรุปบทเรียน ชีทติว สไลด์ และสื่อการสอนออนไลน์สำหรับนักเรียนและคุณครู Dek SA แลกเปลี่ยนความรู้ร่วมกันได้ฟรีตลอด 24 ชั่วโมง
            </p>

            {/* Quick Action Button */}
            <div className="files-hero-actions">
              <button 
                type="button" 
                className="files-primary-upload-btn"
                onClick={() => setShowUploadModal(true)}
              >
                <UploadCloud size={20} />
                <span>+ ฝากไฟล์การเรียนใหม่</span>
              </button>

              <button 
                type="button" 
                className="files-refresh-btn"
                onClick={loadFiles}
                title="รีเฟรชข้อมูลไฟล์"
              >
                <RefreshCw size={17} className={loading ? 'spinning' : ''} />
                <span>รีเฟรช</span>
              </button>
            </div>

            {/* Stats Row */}
            <div className="files-stats-row">
              <div className="stat-pill">
                <Folder size={16} color="#38bdf8" />
                <span><strong>{files.length}</strong> ไฟล์พร้อมดาวน์โหลด</span>
              </div>
              <div className="stat-pill">
                <Download size={16} color="#34d399" />
                <span><strong>{totalDownloads}</strong> ครั้งที่ดาวน์โหลด</span>
              </div>
              <div className="stat-pill">
                <ShieldCheck size={16} color="#f472b6" />
                <span>Cloud CDN ความเร็วสูง</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Toolbar Area */}
        <section className="files-controls-section">
          {/* Top Search Bar & View Mode */}
          <div className="files-search-row">
            <div className="files-search-input-wrap">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อไฟล์, สรุปวิชา, ชื่อผู้ฝาก, หรือแท็ก เช่น #สรุปสอบ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* View Mode & Sort */}
            <div className="files-actions-controls">
              <div className="files-sort-wrap">
                <select 
                  className="files-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="latest">เรียงตาม: ล่าสุด</option>
                  <option value="downloads">เรียงตาม: ยอดดาวน์โหลดสูงสุด</option>
                  <option value="size">เรียงตาม: ขนาดไฟล์</option>
                </select>
              </div>

              <div className="files-view-toggle">
                <button 
                  type="button" 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="มุมมองการ์ด (Grid View)"
                >
                  <Grid size={17} />
                </button>
                <button 
                  type="button" 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="มุมมองตารางรายการ (List View)"
                >
                  <List size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* Grade Selector Tabs */}
          <div className="files-grade-tabs-bar">
            <span className="filter-label">ระดับชั้น:</span>
            <div className="grade-pills-list">
              {['ทั้งหมด', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'ทั่วไป'].map(g => (
                <button 
                  key={g} 
                  type="button" 
                  className={`grade-pill ${selectedGrade === g ? 'active' : ''}`}
                  onClick={() => setSelectedGrade(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Pills */}
          <div className="files-subject-filter-bar">
            <span className="filter-label">กลุ่มสาระ:</span>
            <div className="subject-pills-list">
              {['ทุกกลุ่มสาระ', 'วิทยาศาสตร์', 'คณิตศาสตร์', 'ภาษาอังกฤษ', 'ภาษาไทย', 'สังคมศึกษา', 'เทคโนโลยี', 'อื่นๆ'].map(subj => {
                const isSelected = selectedSubject === subj;
                const meta = SUBJECT_COLORS[subj];
                return (
                  <button 
                    key={subj} 
                    type="button" 
                    className={`subj-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedSubject(subj)}
                    style={isSelected && meta ? { background: meta.color, borderColor: meta.color } : {}}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Files Grid / List Display */}
        <section className="files-display-section">
          {loading ? (
            <div className="files-loading-state">
              <RefreshCw size={36} className="spinning" color="#38bdf8" />
              <p>กำลังเชื่อมต่อคลาวด์และโหลดไฟล์การเรียน...</p>
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="files-empty-state">
              <div className="empty-icon-wrap">
                <Cloud size={52} color="#71717a" />
              </div>
              <h3>ไม่พบไฟล์ที่ตรงกับเงื่อนไขการค้นหา</h3>
              <p>ลองเปลี่ยนคำค้นหา หรือเป็นคนแรกที่ฝากไฟล์การเรียนในหมวดนี้!</p>
              <button 
                type="button" 
                className="empty-upload-btn"
                onClick={() => setShowUploadModal(true)}
              >
                <Plus size={16} />
                <span>ฝากไฟล์ตอนนี้</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="files-grid-container">
              {sortedFiles.map(fileItem => {
                const typeMeta = getFileTypeMeta(fileItem.fileType, fileItem.fileName);
                const subjColor = SUBJECT_COLORS[fileItem.category] || { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
                
                return (
                  <div key={fileItem.id} className="file-card-box">
                    {/* Header Row: File Icon + Badges */}
                    <div className="file-card-top">
                      <div 
                        className="file-type-icon-box"
                        style={{ color: typeMeta.color, background: typeMeta.bg }}
                      >
                        {typeMeta.icon}
                        <span className="file-ext-label">{typeMeta.label}</span>
                      </div>

                      <div className="file-card-badges">
                        <span 
                          className="file-badge-subj"
                          style={{ color: subjColor.color, background: subjColor.bg, borderColor: `${subjColor.color}44` }}
                        >
                          {fileItem.category || 'ทั่วไป'}
                        </span>
                        <span className="file-badge-grade">{fileItem.grade || 'ทุกระดับ'}</span>
                      </div>
                    </div>

                    {/* Title & Desc */}
                    <h3 className="file-card-title" title={fileItem.title}>
                      {fileItem.title}
                    </h3>
                    
                    <p className="file-card-desc">
                      {fileItem.description || 'เอกสารประกอบการเรียนและสรุปเนื้อหาสำหรับนักเรียน Dek SA'}
                    </p>

                    {/* Tags List */}
                    {fileItem.tags && fileItem.tags.length > 0 && (
                      <div className="file-card-tags">
                        {fileItem.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="file-tag-pill">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Meta info footer */}
                    <div className="file-card-meta-row">
                      <div className="file-meta-item" title="ชื่อไฟล์ต้นฉบับ">
                        <FileText size={13} color="#a1a1aa" />
                        <span className="file-name-truncate">{fileItem.fileName || 'document.pdf'}</span>
                      </div>
                      <div className="file-meta-item">
                        <span className="file-size-text">{formatFileSize(fileItem.fileSize)}</span>
                      </div>
                    </div>

                    <div className="file-card-author-row">
                      <div className="author-info">
                        <div className="author-avatar-dot">
                          {(fileItem.uploaderName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="author-name">{fileItem.uploaderName || 'Dek SA'}</span>
                      </div>
                      <div className="downloads-counter">
                        <Download size={13} />
                        <span>{fileItem.downloads || 0}</span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="file-card-actions-bar">
                      <button 
                        type="button" 
                        className="btn-file-download"
                        onClick={() => handleDownload(fileItem)}
                      >
                        <Download size={15} />
                        <span>ดาวน์โหลด</span>
                      </button>

                      {fileItem.fileUrl && (
                        <button 
                          type="button" 
                          className="btn-file-preview"
                          onClick={() => setPreviewFile(fileItem)}
                          title="เปิดดูตัวอย่างไฟล์"
                        >
                          <Eye size={15} />
                        </button>
                      )}

                      <button 
                        type="button" 
                        className="btn-file-share"
                        onClick={() => handleCopyLink(fileItem)}
                        title="คัดลอกลิงก์แชร์"
                      >
                        <Copy size={15} />
                      </button>

                      {(currentUser?.role === 'admin' || (currentUser?.id && currentUser.id === fileItem.uploaderId)) && (
                        <button 
                          type="button" 
                          className="btn-file-delete"
                          onClick={() => handleDelete(fileItem)}
                          title="ลบไฟล์นี้"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="files-list-container">
              <div className="files-list-header-row">
                <span className="col-file">เอกสาร / ชื่อไฟล์</span>
                <span className="col-subj">กลุ่มสาระ & ระดับชั้น</span>
                <span className="col-uploader">ผู้ฝากไฟล์</span>
                <span className="col-size">ขนาด</span>
                <span className="col-downloads">ดาวน์โหลด</span>
                <span className="col-actions">การกระทำ</span>
              </div>

              {sortedFiles.map(fileItem => {
                const typeMeta = getFileTypeMeta(fileItem.fileType, fileItem.fileName);
                const subjColor = SUBJECT_COLORS[fileItem.category] || { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };

                return (
                  <div key={fileItem.id} className="files-list-item-row">
                    <div className="col-file file-main-cell">
                      <div 
                        className="file-mini-icon"
                        style={{ color: typeMeta.color, background: typeMeta.bg }}
                      >
                        {typeMeta.icon}
                      </div>
                      <div className="file-title-wrap">
                        <div className="file-row-title">{fileItem.title}</div>
                        <div className="file-row-sub">{fileItem.fileName}</div>
                      </div>
                    </div>

                    <div className="col-subj">
                      <span 
                        className="file-badge-subj"
                        style={{ color: subjColor.color, background: subjColor.bg }}
                      >
                        {fileItem.category || 'ทั่วไป'}
                      </span>
                      <span className="file-badge-grade">{fileItem.grade || 'ทุกระดับ'}</span>
                    </div>

                    <div className="col-uploader">
                      <span className="uploader-text">{fileItem.uploaderName || 'Dek SA'}</span>
                    </div>

                    <div className="col-size">
                      <span className="size-text">{formatFileSize(fileItem.fileSize)}</span>
                    </div>

                    <div className="col-downloads">
                      <span className="downloads-text">{fileItem.downloads || 0} ครั้ง</span>
                    </div>

                    <div className="col-actions list-actions-cell">
                      <button 
                        type="button" 
                        className="btn-list-download"
                        onClick={() => handleDownload(fileItem)}
                        title="ดาวน์โหลดไฟล์"
                      >
                        <Download size={15} />
                      </button>
                      <button 
                        type="button" 
                        className="btn-list-preview"
                        onClick={() => setPreviewFile(fileItem)}
                        title="ดูตัวอย่าง"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        type="button" 
                        className="btn-list-share"
                        onClick={() => handleCopyLink(fileItem)}
                        title="คัดลอกลิงก์"
                      >
                        <Copy size={15} />
                      </button>
                      {(currentUser?.role === 'admin' || (currentUser?.id && currentUser.id === fileItem.uploaderId)) && (
                        <button 
                          type="button" 
                          className="btn-list-delete"
                          onClick={() => handleDelete(fileItem)}
                          title="ลบไฟล์"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upload Modal Drawer */}
        {showUploadModal && (
          <div className="files-modal-backdrop" onClick={() => !isUploading && setShowUploadModal(false)}>
            <div className="files-modal-card" onClick={e => e.stopPropagation()}>
              <div className="files-modal-header">
                <div className="modal-title-wrap">
                  <UploadCloud size={24} color="#38bdf8" />
                  <h2>ฝากและแชร์ไฟล์การเรียนใหม่</h2>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => !isUploading && setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="files-upload-form">
                {/* Drag and Drop Zone */}
                <div 
                  className={`files-dropzone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {selectedFile ? (
                    <div className="selected-file-info">
                      <div className="file-ready-icon">
                        <FileCheck2 size={42} color="#38bdf8" />
                      </div>
                      <div className="selected-file-details">
                        <strong className="selected-name">{selectedFile.name}</strong>
                        <span className="selected-size">{formatFileSize(selectedFile.size)}</span>
                      </div>
                      <button 
                        type="button" 
                        className="btn-change-file"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        เปลี่ยนไฟล์
                      </button>
                    </div>
                  ) : (
                    <div className="dropzone-hint">
                      <UploadCloud size={46} color="#38bdf8" className="bounce-subtle" />
                      <h4>ลากและวางไฟล์ที่นี่ หรือ <span className="highlight-browse">กดเพื่อเลือกไฟล์</span></h4>
                      <p>รองรับไฟล์ PDF, Word, PowerPoint, Excel, รูปภาพ, โค้ด และ ZIP (ขนาดไม่เกิน 50MB)</p>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="form-group-field">
                  <label>ชื่อเอกสาร / หัวข้อการเรียน <span className="required-star">*</span></label>
                  <input 
                    type="text" 
                    placeholder="เช่น สรุปสอบวิชาฟิสิกส์ ม.3 เทอม 1 เรื่องแรงและการเคลื่อนที่"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-field">
                    <label>ระดับชั้น</label>
                    <select 
                      value={uploadGrade}
                      onChange={(e) => setUploadGrade(e.target.value)}
                    >
                      <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
                      <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
                      <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
                      <option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option>
                      <option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option>
                      <option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option>
                      <option value="ทั่วไป">ทั่วไป / ทุกระดับชั้น</option>
                    </select>
                  </div>

                  <div className="form-group-field">
                    <label>กลุ่มสาระวิชา</label>
                    <select 
                      value={uploadSubject}
                      onChange={(e) => setUploadSubject(e.target.value)}
                    >
                      <option value="วิทยาศาสตร์">วิทยาศาสตร์ (ฟิสิกส์/เคมี/ชีวะ)</option>
                      <option value="คณิตศาสตร์">คณิตศาสตร์ (พื้นฐาน/เพิ่มเติม)</option>
                      <option value="ภาษาอังกฤษ">ภาษาอังกฤษ (Grammar/Vocab)</option>
                      <option value="ภาษาไทย">ภาษาไทย (หลักภาษา/วรรณคดี)</option>
                      <option value="สังคมศึกษา">สังคมศึกษา ศาสนา และวัฒนธรรม</option>
                      <option value="เทคโนโลยี">เทคโนโลยี & วิทยาการคำนวณ</option>
                      <option value="อื่นๆ">อื่นๆ / สื่อกิจกรรม</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-field">
                  <label>คำอธิบายเพิ่มเติม (ช่วยให้เพื่อนๆ ค้นหาง่ายขึ้น)</label>
                  <textarea 
                    rows={2}
                    placeholder="ระบุเนื้อหาสำคัญ เช่น มีเฉลยท้ายเล่ม, สรุปก่อนสอบปลายภาค, มีโจทย์ฝึกทำ..."
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                  />
                </div>

                {/* Popular Tags Selector */}
                <div className="form-group-field">
                  <label>แท็กที่เกี่ยวข้อง</label>
                  <div className="tags-chips-cloud">
                    {POPULAR_TAGS.map(tag => (
                      <button 
                        key={tag}
                        type="button"
                        className={`chip-tag-btn ${uploadTags.includes(tag) ? 'selected' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    className="custom-tag-input"
                    placeholder="พิมพ์แท็กอื่นแล้วกด Enter เช่น #สอบเข้าม4"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={addCustomTag}
                  />
                </div>

                <div className="form-group-field">
                  <label>ชื่อผู้ฝากไฟล์ (แสดงในการ์ด)</label>
                  <input 
                    type="text" 
                    placeholder="ระบุชื่อหรือนามแฝงของคุณ"
                    value={customUploader}
                    onChange={(e) => setCustomUploader(e.target.value)}
                  />
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="upload-progress-box">
                    <div className="progress-labels">
                      <span>กำลังอัปโหลดไฟล์ไปยังคลาวด์...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* Modal Footer Buttons */}
                <div className="modal-actions-bar">
                  <button 
                    type="button" 
                    className="btn-cancel-modal"
                    onClick={() => setShowUploadModal(false)}
                    disabled={isUploading}
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit-upload"
                    disabled={isUploading || !selectedFile}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={17} className="spinning" />
                        <span>กำลังอัปโหลด...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={18} />
                        <span>ยืนยันการฝากไฟล์</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* File Preview Modal */}
        {previewFile && (
          <div className="files-modal-backdrop" onClick={() => setPreviewFile(null)}>
            <div className="preview-modal-card" onClick={e => e.stopPropagation()}>
              <div className="preview-modal-header">
                <div className="preview-title-wrap">
                  <FileText size={20} color="#38bdf8" />
                  <h3>{previewFile.title}</h3>
                </div>
                <div className="preview-header-actions">
                  <button 
                    type="button" 
                    className="btn-preview-dl"
                    onClick={() => handleDownload(previewFile)}
                  >
                    <Download size={16} />
                    <span>ดาวน์โหลด</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn-preview-ext"
                    onClick={() => window.open(previewFile.fileUrl, '_blank')}
                    title="เปิดในแท็บใหม่"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="modal-close-btn"
                    onClick={() => setPreviewFile(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="preview-content-body">
                {previewFile.fileType?.includes('image') || previewFile.fileName?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                  <div className="preview-image-container">
                    <img src={previewFile.fileUrl} alt={previewFile.title} />
                  </div>
                ) : (
                  <iframe 
                    src={previewFile.fileUrl} 
                    title={previewFile.title}
                    className="preview-iframe"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className={`files-toast-notification ${toastMessage.type}`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}
      </main>

      <style>{`
        .files-page-root {
          min-height: 100vh;
          min-height: calc(var(--vh, 1vh) * 100);
          background-color: transparent;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, "SF Pro Display", "Plus Jakarta Sans", "Prompt", system-ui, sans-serif;
          position: relative;
        }

        .files-main-container {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 1.5rem 1.5rem 5rem;
          box-sizing: border-box;
          flex: 1;
        }

        /* Breadcrumb */
        .files-breadcrumb-bar {
          margin-bottom: 1.25rem;
        }

        .files-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #a1a1aa;
          padding: 6px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .files-back-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Hero Section */
        .files-hero-section {
          background: linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(88, 28, 135, 0.2) 100%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15);
        }

        .files-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38bdf8;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
        }

        .files-hero-title {
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.75rem 0;
          line-height: 1.25;
        }

        .files-hero-desc {
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.6;
          max-width: 760px;
          margin: 0 0 1.75rem 0;
        }

        .files-hero-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .files-primary-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 11px 24px;
          border-radius: 999px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(37, 99, 235, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.4);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .files-primary-upload-btn:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.6);
        }

        .files-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #e2e8f0;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .files-refresh-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
        }

        .files-stats-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12.5px;
          color: #cbd5e1;
        }

        .stat-pill strong {
          color: #ffffff;
        }

        /* Controls Section */
        .files-controls-section {
          background: #141419;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .files-search-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .files-search-input-wrap {
          flex: 1 1 320px;
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          padding: 0 16px;
          transition: all 0.2s ease;
        }

        .files-search-input-wrap:focus-within {
          border-color: #38bdf8;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
        }

        .files-search-input-wrap input {
          width: 100%;
          border: none;
          background: transparent;
          color: #ffffff;
          padding: 10px 8px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }

        .files-search-input-wrap input::placeholder {
          color: #71717a;
        }

        .search-clear-btn {
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          display: flex;
          padding: 4px;
        }

        .search-clear-btn:hover {
          color: #ffffff;
        }

        .files-actions-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .files-sort-select {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }

        .files-sort-select option {
          background: #18181b;
          color: #ffffff;
        }

        .files-view-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          padding: 3px;
        }

        .view-btn {
          background: none;
          border: none;
          color: #71717a;
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .view-btn.active {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }

        .filter-label {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          white-space: nowrap;
          min-width: 65px;
        }

        .files-grade-tabs-bar,
        .files-subject-filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .files-grade-tabs-bar::-webkit-scrollbar,
        .files-subject-filter-bar::-webkit-scrollbar {
          display: none;
        }

        .grade-pills-list,
        .subject-pills-list {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .grade-pill, .subj-pill {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .grade-pill:hover, .subj-pill:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }

        .grade-pill.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.4);
        }

        .subj-pill.active {
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        }

        /* Grid View */
        .files-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .file-card-box {
          background: #141419;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .file-card-box:hover {
          transform: translateY(-4px);
          border-color: rgba(56, 189, 248, 0.35);
          box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.15);
        }

        .file-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.85rem;
        }

        .file-type-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .file-ext-label {
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .file-card-badges {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .file-badge-subj {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid;
        }

        .file-badge-grade {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .file-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.35;
          margin: 0 0 0.5rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 42px;
        }

        .file-card-desc {
          font-size: 12.5px;
          color: #94a3b8;
          line-height: 1.45;
          margin: 0 0 0.75rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        .file-card-tags {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .file-tag-pill {
          font-size: 11px;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.1);
          padding: 2px 7px;
          border-radius: 4px;
        }

        .file-card-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          color: #64748b;
          padding-top: 0.65rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 0.65rem;
        }

        .file-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          max-width: 65%;
        }

        .file-name-truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size-text {
          font-weight: 600;
          color: #94a3b8;
        }

        .file-card-author-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .author-avatar-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0284c7, #2563eb);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .author-name {
          font-size: 12px;
          color: #cbd5e1;
          font-weight: 500;
        }

        .downloads-counter {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #34d399;
          font-weight: 600;
        }

        .file-card-actions-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: auto;
        }

        .btn-file-download {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-file-download:hover {
          background: linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }

        .btn-file-preview, .btn-file-share, .btn-file-delete {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-file-preview:hover {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.3);
        }

        .btn-file-share:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
        }

        .btn-file-delete:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.3);
        }

        /* List View */
        .files-list-container {
          background: #141419;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          overflow: hidden;
        }

        .files-list-header-row {
          display: grid;
          grid-template-columns: 3.5fr 2fr 1.5fr 1fr 1fr 1.5fr;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12.5px;
          font-weight: 700;
          color: #94a3b8;
        }

        .files-list-item-row {
          display: grid;
          grid-template-columns: 3.5fr 2fr 1.5fr 1fr 1fr 1.5fr;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: background 0.2s;
        }

        .files-list-item-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .file-main-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-mini-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .file-title-wrap {
          min-width: 0;
        }

        .file-row-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-row-sub {
          font-size: 11.5px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .uploader-text, .size-text, .downloads-text {
          font-size: 13px;
          color: #cbd5e1;
        }

        .list-actions-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-list-download, .btn-list-preview, .btn-list-share, .btn-list-delete {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-list-download:hover {
          background: #2563eb;
          color: white;
        }

        .btn-list-preview:hover {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
        }

        .btn-list-share:hover {
          background: rgba(255, 255, 255, 0.14);
          color: white;
        }

        .btn-list-delete:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        /* Empty & Loading States */
        .files-loading-state, .files-empty-state {
          padding: 5rem 1rem;
          text-align: center;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .empty-icon-wrap {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .files-empty-state h3 {
          font-size: 18px;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
        }

        .files-empty-state p {
          font-size: 14px;
          margin: 0 0 1.5rem 0;
          max-width: 420px;
        }

        .empty-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 9px 20px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Upload Modal */
        .files-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .files-modal-card {
          background: #141419;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
          padding: 2rem;
          box-sizing: border-box;
        }

        .files-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-title-wrap h2 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          display: flex;
          padding: 4px;
        }

        .modal-close-btn:hover {
          color: #ffffff;
        }

        /* Dropzone */
        .files-dropzone {
          border: 2px dashed rgba(56, 189, 248, 0.4);
          background: rgba(56, 189, 248, 0.04);
          border-radius: 16px;
          padding: 2rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 1.25rem;
        }

        .files-dropzone:hover, .files-dropzone.drag-over {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          transform: scale(1.01);
        }

        .files-dropzone.has-file {
          border-color: #34d399;
          background: rgba(52, 211, 153, 0.05);
        }

        .dropzone-hint h4 {
          font-size: 15px;
          color: #ffffff;
          margin: 10px 0 6px;
        }

        .highlight-browse {
          color: #38bdf8;
          text-decoration: underline;
        }

        .dropzone-hint p {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .selected-file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          text-align: left;
        }

        .selected-file-details {
          flex: 1;
          min-width: 0;
        }

        .selected-name {
          display: block;
          color: #ffffff;
          font-size: 14.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .selected-size {
          font-size: 12px;
          color: #34d399;
          font-weight: 600;
        }

        .btn-change-file {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          cursor: pointer;
        }

        .form-group-field {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group-field label {
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
        }

        .required-star {
          color: #ef4444;
        }

        .form-group-field input,
        .form-group-field select,
        .form-group-field textarea {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: #ffffff;
          padding: 10px 14px;
          font-size: 13.5px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-group-field input:focus,
        .form-group-field select:focus,
        .form-group-field textarea:focus {
          border-color: #38bdf8;
          background: rgba(255, 255, 255, 0.08);
        }

        .form-group-field select option {
          background: #18181b;
          color: #ffffff;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .tags-chips-cloud {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .chip-tag-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chip-tag-btn.selected {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38bdf8;
          color: #38bdf8;
          font-weight: 600;
        }

        .custom-tag-input {
          font-size: 12.5px !important;
          padding: 6px 12px !important;
        }

        .upload-progress-box {
          margin: 1rem 0;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #38bdf8;
          margin-bottom: 6px;
        }

        .progress-bar-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #2563eb);
          transition: width 0.3s ease;
        }

        .modal-actions-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-cancel-modal {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #cbd5e1;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          cursor: pointer;
        }

        .btn-submit-upload {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          color: #ffffff;
          border: none;
          padding: 9px 22px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-submit-upload:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Preview Modal */
        .preview-modal-card {
          background: #141419;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          width: 95%;
          max-width: 900px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .preview-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: #18181f;
        }

        .preview-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 65%;
        }

        .preview-title-wrap h3 {
          font-size: 15px;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preview-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-preview-dl {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-preview-ext {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .preview-content-body {
          flex: 1;
          background: #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .preview-image-container img {
          max-width: 100%;
          max-height: 75vh;
          object-fit: contain;
        }

        .preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Toast */
        .files-toast-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 600;
          z-index: 3000;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          animation: slideUpToast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .files-toast-notification.success {
          background: #065f46;
          color: #6ee7b7;
          border: 1px solid #10b981;
        }

        .files-toast-notification.error {
          background: #7f1d1d;
          color: #fca5a5;
          border: 1px solid #ef4444;
        }

        @keyframes slideUpToast {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        /* Responsive Mobile Styles */
        @media (max-width: 768px) {
          .files-main-container {
            padding: 1rem 1rem 4rem;
          }

          .files-hero-section {
            padding: 1.5rem 1.25rem;
            border-radius: 18px;
          }

          .files-hero-title {
            font-size: 22px;
          }

          .files-hero-desc {
            font-size: 13px;
          }

          .files-controls-section {
            padding: 1rem;
            border-radius: 14px;
          }

          .files-search-row {
            flex-direction: column;
            align-items: stretch;
          }

          .files-search-input-wrap {
            flex: 1 1 100%;
          }

          .files-actions-controls {
            justify-content: space-between;
          }

          .files-grid-container {
            grid-template-columns: 1fr;
          }

          .form-grid-2 {
            grid-template-columns: 1fr;
          }

          .files-list-header-row {
            display: none;
          }

          .files-list-item-row {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 12px;
          }

          .files-list-item-row .col-subj,
          .files-list-item-row .col-uploader,
          .files-list-item-row .col-size,
          .files-list-item-row .col-downloads {
            display: inline-flex;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default FileShareHub;
