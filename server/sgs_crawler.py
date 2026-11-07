import sys
import os
import json
import re
import argparse
import datetime
import requests
from bs4 import BeautifulSoup

# Fix Thai console encoding on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


class SGSGradeCrawler:
    BASE_URL = "https://sgs.bopp-obec.info/sgss"
    SIGN_IN_URL = f"{BASE_URL}/Security/SignIn.aspx"
    WELCOME_URL = f"{BASE_URL}/TblStudentsInfo/Show-TblStudentsInfo-Table.aspx"
    GRADE_URL = f"{BASE_URL}/View_TransScoreSub/Show-View-TransScoreSub-Table.aspx"
    FILTER_NAME = "ctl00$PageContent$ColTrFilter"

    def __init__(self, student_id: str, citizen_id: str):
        self.student_id = str(student_id).strip()
        self.citizen_id = str(citizen_id).strip()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": self.SIGN_IN_URL,
            "Origin": "https://sgs.bopp-obec.info",
        })
        self.is_logged_in = False
        self.student_name = ""

    def _parse_html(self, resp: requests.Response) -> BeautifulSoup:
        """Properly decode response bytes avoiding Thai character corruption"""
        content = resp.content
        for enc in ("utf-8", "cp874", "tis-620", "windows-874"):
            try:
                text = content.decode(enc)
                return BeautifulSoup(text, "html.parser")
            except (UnicodeDecodeError, LookupError):
                continue
        return BeautifulSoup(content.decode("utf-8", errors="ignore"), "html.parser")

    def _extract_payload(self, soup: BeautifulSoup) -> dict:
        """Extract only valid form fields and ViewState (ignore image buttons & unchecked inputs)"""
        payload = {}
        for inp in soup.find_all("input"):
            name = inp.get("name")
            if not name:
                continue
            inp_type = (inp.get("type") or "text").lower()
            if inp_type in ("image", "button", "submit", "reset"):
                continue
            if inp_type in ("checkbox", "radio") and not inp.has_attr("checked"):
                continue
            payload[name] = inp.get("value", "")

        for sel in soup.find_all("select"):
            name = sel.get("name")
            if name:
                selected = sel.find("option", selected=True)
                if selected:
                    payload[name] = selected.get("value", "")
                else:
                    first_opt = sel.find("option")
                    if first_opt:
                        payload[name] = first_opt.get("value", "")
        return payload

    def login(self) -> tuple:
        """Authenticate with SGS portal"""
        try:
            get_resp = self.session.get(self.SIGN_IN_URL, timeout=20)
        except requests.RequestException as e:
            return False, f"เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ SGS: {str(e)}"

        if get_resp.status_code != 200:
            return False, f"ไม่สามารถเข้าหน้า SignIn SGS ได้ (HTTP {get_resp.status_code})"

        soup = self._parse_html(get_resp)
        payload = self._extract_payload(soup)

        payload["__EVENTTARGET"] = "ctl00$PageContent$OKButton$_Button"
        payload["__EVENTARGUMENT"] = ""
        payload["ctl00$PageContent$UserName"] = self.student_id
        payload["ctl00$PageContent$Password"] = self.citizen_id

        headers = {
            "Origin": "https://sgs.bopp-obec.info",
            "Referer": self.SIGN_IN_URL,
            "Content-Type": "application/x-www-form-urlencoded"
        }

        try:
            post_resp = self.session.post(
                self.SIGN_IN_URL,
                data=payload,
                headers=headers,
                allow_redirects=True,
                timeout=25
            )
        except requests.RequestException as e:
            return False, f"ส่งข้อมูลเข้าสู่ระบบไม่สำเร็จ: {str(e)}"

        # Check authentication by accessing the grade page directly
        try:
            grade_check_resp = self.session.get(self.GRADE_URL, timeout=20)
        except requests.RequestException as e:
            return False, f"เชื่อมต่อหน้าผลการเรียนไม่สำเร็จ: {str(e)}"

        # If redirected back to SignIn, authentication failed
        if "SignIn" in grade_check_resp.url or grade_check_resp.status_code != 200:
            return False, "เลขประจำตัวนักเรียนหรือเลขบัตรประชาชนไม่ถูกต้อง หรือเซิร์ฟเวอร์ SGS ขัดข้อง"

        self.is_logged_in = True

        # Extract student name from grade page or header
        grade_soup = self._parse_html(grade_check_resp)
        name_el = (
            grade_soup.find(id="ctl00__PageHeader__UserNameLbl") or
            grade_soup.find(id="ctl00_PageContent_UserNameLbl") or
            soup.find(id="ctl00__PageHeader__UserNameLbl")
        )
        if name_el:
            raw_name = name_el.get_text(strip=True)
            raw_name = re.sub(r"^(ยินดีต้อนรับ|คุณ|นาย|นางสาว|ด\.ช\.|ด\.ญ\.)\s*", "", raw_name)
            self.student_name = raw_name.strip()

        if not self.student_name:
            self.student_name = f"นักเรียนรหัส {self.student_id}"

        return True, "เข้าสู่ระบบสำเร็จ"

    def get_available_semesters(self) -> tuple:
        """Fetch list of semesters from grade page"""
        if not self.is_logged_in:
            return None, [], self.FILTER_NAME

        try:
            resp = self.session.get(self.GRADE_URL, timeout=20)
        except requests.RequestException:
            return None, [], self.FILTER_NAME

        soup = self._parse_html(resp)

        semester_select = (
            soup.find("select", {"id": "ctl00_PageContent_ColTrFilter"}) or
            soup.find("select", {"name": "ctl00$PageContent$ColTrFilter"})
        )

        if not semester_select:
            for sel in soup.find_all("select"):
                opts_text = " ".join([o.get_text(strip=True) for o in sel.find_all("option")])
                if "ภาคเรียน" in opts_text or "ปีที่" in opts_text:
                    semester_select = sel
                    break

        if not semester_select:
            return soup, [], self.FILTER_NAME

        select_name = semester_select.get("name", self.FILTER_NAME)
        options = []
        for opt in semester_select.find_all("option"):
            val = opt.get("value", "").strip()
            text = opt.get_text(strip=True)
            if val and val != "--PLEASE_SELECT--" and "โปรดเลือก" not in text:
                options.append((val, text))

        return soup, options, select_name

    def fetch_grades_for_semester(self, sem_val: str, sem_name: str, select_name: str = None) -> dict:
        """Postback to select semester and scrape table"""
        try:
            get_resp = self.session.get(self.GRADE_URL, timeout=20)
        except requests.RequestException:
            return {"subjects": [], "summary": {}}

        soup = self._parse_html(get_resp)
        payload = self._extract_payload(soup)

        target_name = select_name or self.FILTER_NAME
        payload["__EVENTTARGET"] = target_name
        payload["__EVENTARGUMENT"] = ""
        payload[target_name] = sem_val
        payload["ctl00$PageContent$View_TransScoreSubTableControl_PostbackTracker"] = ""

        headers = {
            "Origin": "https://sgs.bopp-obec.info",
            "Referer": self.GRADE_URL,
            "Content-Type": "application/x-www-form-urlencoded"
        }

        try:
            resp = self.session.post(self.GRADE_URL, data=payload, headers=headers, timeout=25)
        except requests.RequestException:
            return {"subjects": [], "summary": {}}

        post_soup = self._parse_html(resp)
        return self._parse_semester_table(post_soup, sem_name)

    def _parse_semester_table(self, soup: BeautifulSoup, sem_name: str) -> dict:
        subjects = []
        summary = {
            "GPA": "",
            "อันดับที่_ห้อง": "",
            "อันดับที่_ระดับ": "",
            "หน่วยกิตรวม": "",
            "หน่วยกิตพื้นฐาน": "",
            "หน่วยกิตเพิ่มเติม": ""
        }

        if not soup:
            return {"subjects": subjects, "summary": summary}

        # 1. Parse top and bottom summary cards/tables
        for tr in soup.find_all("tr"):
            tds = tr.find_all(["td", "th"])
            if len(tds) >= 2:
                for i in range(len(tds) - 1):
                    lbl = tds[i].get_text(strip=True)
                    val = tds[i + 1].get_text(strip=True)
                    gpa_val_match = re.search(r"\b([0-4]\.\d{1,2})\b", val.strip())
                    if "GPA" in lbl and not summary["GPA"] and gpa_val_match:
                        summary["GPA"] = gpa_val_match.group(1)
                    elif "อันดับที่/ห้อง" in lbl or "อันดับที่_ห้อง" in lbl:
                        summary["อันดับที่_ห้อง"] = val
                    elif "อันดับที่/ระดับ" in lbl or "อันดับที่_ระดับ" in lbl:
                        summary["อันดับที่_ระดับ"] = val

        # 2. Iterate table rows for subjects
        for tr in soup.find_all("tr"):
            tds = tr.find_all("td")
            if not tds or len(tds) < 3:
                continue

            row_texts = [td.get_text(strip=True) for td in tds]
            clean_cols = [c for c in row_texts if c]
            if not clean_cols:
                continue

            joined = " ".join(clean_cols)

            # Skip header or pagination rows
            if any(k in joined for k in ["ของ0/หน้า", "ของ 0/หน้า", "โปรดเลือก", "หน้าแรก", "ก่อนหน้า", "รวมร้อยละ"]):
                continue
            if "วิชา" in joined and "หน่วยกิต" in joined:
                continue

            # Look for true OBEC subject codes like ท23101, ค23101, ว20109, ก23901, etc.
            first_col = clean_cols[0].strip()
            is_valid_code = bool(re.match(r"^[ก-๙a-zA-Z]{1,3}\d{4,6}[a-zA-Z0-9]?$", first_col))

            # If not matching strict pattern, check if it's a summary row
            if not is_valid_code or any(k in first_col for k in ["ประเภทวิชา", "พื้นฐาน", "เพิ่มเติม", "GPA", "อันดับที่"]):
                if "พื้นฐาน" in joined and len(clean_cols) >= 3:
                    summary["หน่วยกิตพื้นฐาน"] = clean_cols[1]
                if "เพิ่มเติม" in joined and len(clean_cols) >= 3:
                    summary["หน่วยกิตเพิ่มเติม"] = clean_cols[1]

                gpa_match = re.search(r"GPA\s*([0-4]\.\d{1,2})\b", joined)
                if gpa_match and not summary["GPA"]:
                    summary["GPA"] = gpa_match.group(1)

                room_match = re.search(r"อันดับที่[/_]ห้อง\s*([\d/]+)", joined)
                if room_match and not summary["อันดับที่_ห้อง"]:
                    summary["อันดับที่_ห้อง"] = room_match.group(1)

                level_match = re.search(r"อันดับที่[/_]ระดับ\s*([\d/]+)", joined)
                if level_match and not summary["อันดับที่_ระดับ"]:
                    summary["อันดับที่_ระดับ"] = level_match.group(1)

                continue

            # Valid course found!
            course_name = clean_cols[1] if len(clean_cols) > 1 else ""
            credit = clean_cols[2] if len(clean_cols) > 2 else ""

            item = {
                "ปีและภาคเรียน": sem_name,
                "รหัสวิชา": first_col,
                "ชื่อวิชา": course_name,
                "หน่วยกิต": credit,
                "ก่อนกลางภาค": "-",
                "สอบกลางภาค": "-",
                "หลังกลางภาค": "-",
                "สอบปลายภาค": "-",
                "คะแนนรวม": "-",
                "ร้อยละ": "-",
                "เกรด": "-"
            }

            if len(clean_cols) >= 15:
                item["ก่อนกลางภาค"] = f"{clean_cols[4]}/{clean_cols[3]}"
                item["สอบกลางภาค"] = f"{clean_cols[6]}/{clean_cols[5]}"
                item["หลังกลางภาค"] = f"{clean_cols[8]}/{clean_cols[7]}"
                item["สอบปลายภาค"] = f"{clean_cols[10]}/{clean_cols[9]}"
                item["คะแนนรวม"] = f"{clean_cols[12]}/{clean_cols[11]}"
                item["ร้อยละ"] = clean_cols[13]
                item["เกรด"] = clean_cols[14]
            else:
                grade_val = ""
                for col in reversed(clean_cols):
                    if re.match(r"^[0-4](\.5)?$", col) or col in ["ร", "มส", "ผ", "มผ"]:
                        grade_val = col
                        break
                item["เกรด"] = grade_val if grade_val else clean_cols[-1]

            if summary["GPA"]:
                item["GPA_เทอมนี้"] = summary["GPA"]
            if summary["อันดับที่_ห้อง"]:
                item["อันดับที่_ห้อง"] = summary["อันดับที่_ห้อง"]
            if summary["อันดับที่_ระดับ"]:
                item["อันดับที่_ระดับ"] = summary["อันดับที่_ระดับ"]

            item["ข้อมูลเต็ม"] = " | ".join(clean_cols)
            subjects.append(item)

        # Calculate total credits and fallback GPA for this semester
        total_cred = 0.0
        total_points = 0.0
        calc_cred = 0.0
        for s in subjects:
            try:
                c = float(s["หน่วยกิต"])
                if c <= 5.0:  # standard credit range
                    total_cred += c
                g = float(s["เกรด"])
                if 0 <= g <= 4 and 0 < c <= 5:
                    total_points += c * g
                    calc_cred += c
            except Exception:
                pass
        summary["หน่วยกิตรวม"] = f"{total_cred:.1f}"
        
        # Calculate real weighted GPA from semester courses
        calculated_gpa = f"{total_points / calc_cred:.2f}" if calc_cred > 0 else "-"
        
        # Prioritize accurate weighted GPA or validate scraped GPA
        if summary.get("GPA"):
            try:
                g_float = float(summary["GPA"])
                if 0.0 <= g_float <= 4.0 and calc_cred > 0 and abs(g_float - (total_points / calc_cred)) < 0.05:
                    summary["GPA"] = f"{g_float:.2f}"
                else:
                    summary["GPA"] = calculated_gpa
            except Exception:
                summary["GPA"] = calculated_gpa
        else:
            summary["GPA"] = calculated_gpa

        # Ensure all subject rows have formatted GPA_เทอมนี้
        for s in subjects:
            s["GPA_เทอมนี้"] = summary["GPA"]
            if summary.get("อันดับที่_ห้อง"):
                s["อันดับที่_ห้อง"] = summary["อันดับที่_ห้อง"]
            if summary.get("อันดับที่_ระดับ"):
                s["อันดับที่_ระดับ"] = summary["อันดับที่_ระดับ"]

        return {
            "subjects": subjects,
            "summary": summary
        }

    def fetch_all_grades(self, chosen_index: int = 0) -> dict:
        soup, options, select_name = self.get_available_semesters()

        all_grades = []
        semesters_list = []
        by_semester = {}

        if options:
            semesters_list = [{"code": val, "name": text} for val, text in options]
            if chosen_index == 0:
                for val, text in options:
                    sem_data = self.fetch_grades_for_semester(val, text, select_name)
                    if sem_data["subjects"]:
                        by_semester[text] = sem_data
                        all_grades.extend(sem_data["subjects"])
            else:
                if 1 <= chosen_index <= len(options):
                    val, text = options[chosen_index - 1]
                    sem_data = self.fetch_grades_for_semester(val, text, select_name)
                    if sem_data["subjects"]:
                        by_semester[text] = sem_data
                        all_grades.extend(sem_data["subjects"])
        elif soup:
            # Fallback: scrape the default page if no options dropdown found
            default_data = self._parse_semester_table(soup, "ภาคเรียนปัจจุบัน")
            if default_data["subjects"]:
                by_semester["ภาคเรียนปัจจุบัน"] = default_data
                all_grades.extend(default_data["subjects"])
                semesters_list.append({"code": "current", "name": "ภาคเรียนปัจจุบัน"})

        # Calculate overall cumulative GPAX
        all_points = 0.0
        all_cred = 0.0
        for s in all_grades:
            try:
                c = float(s.get("หน่วยกิต", 0))
                g = float(s.get("เกรด", -1))
                if 0 <= g <= 4 and 0 < c <= 5:
                    all_points += c * g
                    all_cred += c
            except (ValueError, TypeError):
                continue
        gpax = f"{all_points / all_cred:.2f}" if all_cred > 0 else "-"

        return {
            "success": True,
            "student_id": self.student_id,
            "student_name": self.student_name,
            "last_updated": datetime.datetime.now().isoformat(),
            "semesters": semesters_list,
            "by_semester": by_semester,
            "grades": all_grades,
            "total_courses": len(all_grades),
            "GPAX": gpax,
            "total_credits": f"{all_cred:.1f}"
        }


def main():
    parser = argparse.ArgumentParser(description="SGS Grade Crawler CLI")
    parser.add_argument("--student-id", required=True, help="Student ID (5 digits)")
    parser.add_argument("--citizen-id", required=True, help="Citizen ID (13 digits)")
    parser.add_argument("--semester", type=int, default=0, help="Semester index (0 = all)")
    parser.add_argument("--output", default="", help="Optional output filepath to save JSON")
    args = parser.parse_args()

    crawler = SGSGradeCrawler(
        student_id=args.student_id,
        citizen_id=args.citizen_id
    )

    success, msg = crawler.login()
    if not success:
        err_res = {
            "success": False,
            "error": msg
        }
        print(json.dumps(err_res, ensure_ascii=False))
        sys.exit(1)

    result = crawler.fetch_all_grades(args.semester)

    if args.output:
        try:
            os.makedirs(os.path.dirname(args.output), exist_ok=True)
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
        except Exception as e:
            sys.stderr.write(f"Failed to write output file: {e}\n")

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
