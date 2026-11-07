const { CookieJar } = require('tough-cookie');
const fetchCookie = require('fetch-cookie').default || require('fetch-cookie');

const SGS_BASE = 'https://sgs.bopp-obec.info/sgss';
const studentId = '31515';
const citizenId = '1159900578314';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function testFetchCookie() {
  const jar = new CookieJar();
  const fetch = fetchCookie(globalThis.fetch, jar);

  // 1. Initial GET
  let res = await fetch(SGS_BASE, { headers: HEADERS });
  let html = await res.text();
  let currentUrl = res.url;
  console.log('Initial URL:', currentUrl);
  
  let viewState = (html.match(/name="__VIEWSTATE"[^>]+value="([^"]*)"/) || [])[1] || '';
  let viewStateGen = (html.match(/name="__VIEWSTATEGENERATOR"[^>]+value="([^"]*)"/) || [])[1] || '';

  // 2. Login POST
  const loginForm = new URLSearchParams({
    '__EVENTTARGET': '', '__EVENTARGUMENT': '', '__LASTFOCUS': '',
    '__VIEWSTATE': viewState, '__VIEWSTATEGENERATOR': viewStateGen,
    'isd_geo_location': '', 'ctl00$pageLeftCoordinate': '0', 'ctl00$pageTopCoordinate': '0',
    'ctl00$PageContent$SignInCPExtender_ClientState': '',
    'ctl00$PageContent$UserName': studentId, 'ctl00$PageContent$Password': citizenId,
    'ctl00$PageContent$OKButton$_Button.x': '50', 'ctl00$PageContent$OKButton$_Button.y': '15',
  });
  
  res = await fetch(currentUrl, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': currentUrl },
    body: loginForm.toString(),
  });
  
  html = await res.text();
  currentUrl = res.url;
  console.log('Post-Login URL:', currentUrl);
  
  viewState = (html.match(/name="__VIEWSTATE"[^>]+value="([^"]*)"/) || [])[1] || '';
  viewStateGen = (html.match(/name="__VIEWSTATEGENERATOR"[^>]+value="([^"]*)"/) || [])[1] || '';

  // 3. Navigation POST to Profile
  const navForm = new URLSearchParams({
    'ctl00_scriptManager1_HiddenField': '',
    '__EVENTTARGET': 'ctl00$_Menu$_Menu1MenuItem$_Button',
    '__EVENTARGUMENT': '', '__LASTFOCUS': '',
    '__VIEWSTATE': viewState, '__VIEWSTATEGENERATOR': viewStateGen,
    'isd_geo_location': '', 'ctl00$pageLeftCoordinate': '0', 'ctl00$pageTopCoordinate': '0',
  });
  
  res = await fetch(currentUrl, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': currentUrl },
    body: navForm.toString(),
  });
  
  html = await res.text();
  console.log('Nav URL:', res.url);
  console.log('Status:', res.status);
  console.log('Contains ธีรพล:', html.includes('ธีรพล'));
}

testFetchCookie().catch(console.error);
