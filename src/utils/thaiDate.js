/**
 * Thai Buddhist Era (พ.ศ.) and Asia/Bangkok date formatting utilities
 */

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
];

/**
 * แปลงปี ค.ศ. เป็น พ.ศ.
 */
export function getBuddhistYear(date) {
  const d = new Date(date);
  return d.getFullYear() + 543;
}

/**
 * ฟอร์แมตวันที่แบบสั้น: เช่น "16 ต.ค. 2569 เวลา 23:59 น."
 */
export function formatThaiDateShort(dateInput, includeTime = true) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const bYear = d.getFullYear() + 543;
  
  if (!includeTime) {
    return `${day} ${month} ${bYear}`;
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${bYear} เวลา ${hours}:${minutes} น.`;
}

/**
 * ฟอร์แมตวันที่แบบเต็ม: เช่น "วันศุกร์ที่ 16 ตุลาคม 2569 เวลา 23:59 น."
 */
export function formatThaiDateFull(dateInput, includeTime = true) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const dayName = THAI_DAYS[d.getDay()];
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const bYear = d.getFullYear() + 543;

  if (!includeTime) {
    return `${dayName}ที่ ${day} ${month} ${bYear}`;
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dayName}ที่ ${day} ${month} ${bYear} เวลา ${hours}:${minutes} น.`;
}

/**
 * คำนวณเวลาที่เหลือ หรือเวลาที่เลยกำหนด
 * @returns {{ text: string, isOverdue: boolean, urgency: 'safe'|'warning'|'critical'|'overdue' }}
 */
export function getTimeRemaining(dueDateInput) {
  if (!dueDateInput) return { text: '-', isOverdue: false, urgency: 'safe' };
  const due = new Date(dueDateInput).getTime();
  const now = Date.now();
  const diff = due - now;

  if (diff < 0) {
    // เลยกำหนด
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / (1000 * 60));
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

    let text = '';
    if (days > 0) {
      text = `เลยกำหนด ${days} วัน ${hours % 24} ชม.`;
    } else if (hours > 0) {
      text = `เลยกำหนด ${hours} ชม. ${mins % 60} นาที`;
    } else {
      text = `เลยกำหนด ${mins} นาที`;
    }

    return { text, isOverdue: true, urgency: 'overdue' };
  }

  // ยังไม่เลยกำหนด
  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  let text = '';
  let urgency = 'safe';

  if (days > 2) {
    text = `เหลืออีก ${days} วัน`;
    urgency = 'safe';
  } else if (days > 0) {
    text = `เหลืออีก ${days} วัน ${hours % 24} ชม.`;
    urgency = 'warning';
  } else if (hours > 0) {
    text = `เหลืออีก ${hours} ชม. ${mins % 60} นาที`;
    urgency = 'critical';
  } else {
    text = `เหลืออีก ${mins} นาที (ด่วน)`;
    urgency = 'critical';
  }

  return { text, isOverdue: false, urgency };
}

/**
 * คำนวณความล่าช้าของการส่งงาน
 */
export function calculateSubmissionDelay(submittedAt, dueDate) {
  const subTime = new Date(submittedAt).getTime();
  const dueTime = new Date(dueDate).getTime();
  if (subTime <= dueTime) {
    return { isLate: false, text: 'ส่งตรงเวลา' };
  }

  const diff = subTime - dueTime;
  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  let text = '';
  if (days > 0) {
    text = `ส่งช้ากว่ากำหนด ${days} วัน ${hours % 24} ชม.`;
  } else if (hours > 0) {
    text = `ส่งช้ากว่ากำหนด ${hours} ชม. ${mins % 60} นาที`;
  } else {
    text = `ส่งช้ากว่ากำหนด ${mins} นาที`;
  }

  return { isLate: true, text };
}
