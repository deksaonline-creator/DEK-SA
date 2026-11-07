const fs = require('fs');
const file = 'server.js';
let content = fs.readFileSync(file, 'utf8');

const loginStart = content.indexOf('// POST /api/sgs/login');
const dataEnd = content.indexOf('// PUT /api/users/profile');

if (loginStart === -1 || dataEnd === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const newSgsLogic = `// Setup Puppeteer once (optional optimization, but we launch per request to ensure clean sessions)
const puppeteer = require('puppeteer');

// POST /api/sgs/login — Authenticate with SGS and return sessionToken
app.post('/api/sgs/login', async (req, res) => {
  try {
    const { studentId, citizenId } = req.body;
    if (!studentId || !citizenId) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสนักเรียนและเลขประจำตัวประชาชน' });
    }

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    // Go to login page
    await page.goto('https://sgs.bopp-obec.info/sgss', { waitUntil: 'networkidle0' });
    
    // Type credentials and submit
    await page.type('[name="ctl00\\\\$PageContent\\\\$UserName"]', studentId);
    await page.type('[name="ctl00\\\\$PageContent\\\\$Password"]', citizenId);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.evaluate(() => document.getElementById('ctl00_PageContent_OKButton__Button').click())
    ]);

    const url = page.url();
    const html = await page.content();
    
    // Check if login failed
    if (url.includes('SignIn.aspx')) {
      const $err = cheerio.load(html);
      const errText = $err('span[style*="color:red"], span[style*="Color:Red"], .ErrorMessage').text().trim();
      await browser.close();
      return res.status(401).json({ error: 'เลขประจำตัวนักเรียนหรือเลขประจำตัวประชาชนไม่ถูกต้อง' + (errText ? ': ' + errText : '') });
    }

    // Get cookies and return session token
    const cookies = await page.cookies();
    await browser.close();

    const sessionToken = Buffer.from(JSON.stringify(cookies)).toString('base64');
    res.json({ success: true, sessionToken, studentId });
  } catch (err) {
    console.error('SGS login error:', err);
    res.status(500).json({ error: 'ไม่สามารถเชื่อมต่อกับระบบ SGS ได้: ' + err.message });
  }
});

// POST /api/sgs/data — Fetch student data using Puppeteer navigation
app.post('/api/sgs/data', async (req, res) => {
  try {
    const { sessionToken, dataType } = req.body;
    if (!sessionToken) return res.status(400).json({ error: 'Missing sessionToken' });

    let cookies;
    try {
      cookies = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid sessionToken' });
    }

    const eventTargets = {
      profile: 'ctl00$_Menu$_Menu1MenuItem$_Button',
      grades: 'ctl00$_Menu$_Menu2MenuItem$_Button',
      absences: 'ctl00$_Menu$_Menu3MenuItem$_Button',
      failed: 'ctl00$_Menu$_ผลการเร_ยนไม_ผ_านMenuItem$_Button',
      electives: 'ctl00$_Menu$_SubjectsElectionMenuItem$_Button',
      news: 'ctl00$_Menu$_ข_าวประชาส_มพ_นธ_MenuItem$_Button',
    };

    const eventTarget = eventTargets[dataType];
    if (!eventTarget) return res.status(400).json({ error: 'Unknown dataType: ' + dataType });

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    
    // Go to dashboard to load the menu
    await page.goto('https://sgs.bopp-obec.info/sgss/TblStudentsInfo/Show-TblStudentsInfo-Table.aspx', { waitUntil: 'networkidle0' });
    
    const url = page.url();
    if (url.includes('SignIn.aspx')) {
      await browser.close();
      return res.status(401).json({ error: 'SESSION_EXPIRED' });
    }

    // Click the target menu and wait for data page
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.evaluate((target) => __doPostBack(target, ''), eventTarget)
    ]);

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    let data = null;

    if (dataType === 'profile') {
      const rows = {};
      $('table tr').each((i, el) => {
        const cols = $(el).find('td, th, span'); // Capture various cell types
        const textStr = $(el).text().replace(/\\s+/g, ' ').trim();
        if (textStr.includes('เลขประจำตัวนักเรียน')) {
          rows['เลขประจำตัวนักเรียน'] = textStr.split('เลขประจำตัวนักเรียน')[1].trim().split(' ')[0];
        }
        if (textStr.includes('ชื่อ')) {
          const match = textStr.match(/ชื่อ\\s+([^\\s]+)\\s+นามสกุล\\s+([^\\s]+)/);
          if (match) rows['ชื่อ-สกุล'] = match[1] + ' ' + match[2];
        }
        // Extract dynamically if it maps to general key-values
        if (cols.length >= 2) {
          const key = $(cols[0]).text().trim().replace(/\\s+/g, ' ');
          const val = $(cols[1]).text().trim().replace(/\\s+/g, ' ');
          if (key && val && key.length < 50) rows[key] = val;
        }
      });
      data = { raw: rows };
    }

    if (dataType === 'grades') {
      const grades = [];
      $('table tr').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 3) {
          const code = $(cols[0]).text().trim();
          const name = $(cols[1]).text().trim();
          const credit = $(cols[2]).text().trim();
          const grade = cols.length >= 4 ? $(cols[3]).text().trim() : '';
          if (code && name && code !== 'รหัสวิชา' && code !== 'รหัส') {
            grades.push({ code, name, credit, grade });
          }
        }
      });
      data = { grades };
    }

    if (dataType === 'absences') {
      const records = [];
      $('table tr').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 3) {
          const date = $(cols[0]).text().trim();
          const subject = $(cols[1]).text().trim();
          const period = cols.length >= 3 ? $(cols[2]).text().trim() : '';
          const type = cols.length >= 4 ? $(cols[3]).text().trim() : '';
          if (date && subject && date !== 'วันที่' && date !== 'วัน') {
            records.push({ date, subject, period, type });
          }
        }
      });
      data = { records };
    }

    if (dataType === 'failed') {
      const subjects = [];
      $('table tr').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 2) {
          const code = $(cols[0]).text().trim();
          const name = $(cols[1]).text().trim();
          const type = cols.length >= 3 ? $(cols[2]).text().trim() : '';
          if (code && name && code !== 'รหัส' && code !== 'รหัสวิชา') subjects.push({ code, name, type });
        }
      });
      data = { subjects };
    }

    if (dataType === 'electives') {
      const subjects = [];
      $('table tr').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 2) {
          const code = $(cols[0]).text().trim();
          const name = $(cols[1]).text().trim();
          const teacher = cols.length >= 3 ? $(cols[2]).text().trim() : '';
          if (code && name && code !== 'รหัส' && code !== 'รหัสวิชา') subjects.push({ code, name, teacher });
        }
      });
      data = { subjects };
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('SGS data fetch error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลจาก SGS ได้: ' + err.message });
  }
});

`;

content = content.substring(0, loginStart) + newSgsLogic + content.substring(dataEnd);
fs.writeFileSync(file, content);
console.log('Successfully patched server.js!');
