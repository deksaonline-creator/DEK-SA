/**
 * File utility helpers for assignment attachments and student submissions
 */

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'jpg', 'jpeg', 'png', 'webp', 'zip'
];

/**
 * Format bytes to readable string (e.g. "2.4 MB", "512 KB")
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Get file extension from file name or URL
 */
export function getFileExtension(filename = '') {
  const cleanName = filename.split('?')[0];
  const parts = cleanName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Categorize file type
 */
export function getFileTypeCategory(filename = '', mimeType = '') {
  const ext = getFileExtension(filename);
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (ext === 'pdf' || mimeType.includes('pdf')) {
    return 'pdf';
  }
  if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) {
    return 'word';
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('sheet') || mimeType.includes('excel')) {
    return 'excel';
  }
  if (['ppt', 'pptx'].includes(ext) || mimeType.includes('presentation')) {
    return 'powerpoint';
  }
  if (['zip', 'rar', '7z'].includes(ext) || mimeType.includes('zip')) {
    return 'archive';
  }
  return 'document';
}

/**
 * Validate a file for upload
 */
export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, error: 'ไม่พบไฟล์' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `ขนาดไฟล์ "${file.name}" เกินกำหนด (${formatBytes(file.size)} > สูงสุด 20 MB)`
    };
  }

  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `ประเภทไฟล์ .${ext} ไม่รองรับ (รองรับ: PDF, Word, Excel, PPT, รูปภาพ JPG/PNG/WEBP, ZIP)`
    };
  }

  return { valid: true, error: null };
}

/**
 * Get color code for file badge
 */
export function getFileColor(category) {
  switch (category) {
    case 'pdf': return '#ef4444';
    case 'word': return '#3b82f6';
    case 'excel': return '#10b981';
    case 'powerpoint': return '#f97316';
    case 'image': return '#8b5cf6';
    case 'archive': return '#eab308';
    default: return '#6b7280';
  }
}
