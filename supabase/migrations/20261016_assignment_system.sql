-- ==============================================================================
-- ระบบส่งงานออนไลน์ (Online Assignment Submission System)
-- สำหรับโรงเรียนระดับมัธยมศึกษา (ม.1 - ม.6) / มหาวิทยาลัย
-- Database Migration & Row Level Security (RLS)
-- วันที่สร้าง: 16 ตุลาคม 2569 (2026-10-16)
-- รองรับ Supabase Auth, PostgreSQL 15+, Storage Buckets
-- ==============================================================================

-- 1. ส่วนขยายที่จำเป็น (Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ฟังก์ชันอัปเดต timestamp อัตโนมัติ (Utility Functions)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สุ่มรหัสเข้าห้องเรียน 6 หลัก (ตัวพิมพ์ใหญ่และตัวเลข ไม่สับสน เช่น เลี่ยง 0, O, 1, I)
CREATE OR REPLACE FUNCTION public.generate_course_join_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    result TEXT := '';
    i INT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- ตรวจสอบว่าซ้ำในตาราง courses หรือไม่
        SELECT EXISTS (SELECT 1 FROM public.courses WHERE join_code = result) INTO code_exists;
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. ตารางข้อมูลหลัก (Core Tables)
-- ==============================================================================

-- 3.1 ตาราง profiles (ข้อมูลผู้ใช้ที่ผูกกับ auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    student_id TEXT, -- รหัสนักเรียน เช่น 65123 หรือรหัสประจำตัวครู
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    phone TEXT,
    grade_level TEXT, -- เช่น 'ม.4/1'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger auto updated_at สำหรับ profiles
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.2 ตาราง courses (รายวิชา)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL, -- เช่น 'ว30101'
    name TEXT NOT NULL, -- เช่น 'วิทยาการคำนวณ 1'
    description TEXT,
    cover_image TEXT,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    join_code VARCHAR(8) UNIQUE NOT NULL DEFAULT public.generate_course_join_code(),
    academic_year TEXT DEFAULT '2569', -- ปีการศึกษา พ.ศ.
    semester INT DEFAULT 1 CHECK (semester IN (1, 2)),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS tr_courses_updated_at ON public.courses;
CREATE TRIGGER tr_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.3 ตาราง enrollments (การลงทะเบียนเข้าเรียน)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_course_student UNIQUE (course_id, student_id)
);

-- 3.4 ตาราง assignments (ชิ้นงาน / การบ้าน)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_score NUMERIC(6, 2) NOT NULL DEFAULT 10.00 CHECK (max_score >= 0),
    allow_late BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS tr_assignments_updated_at ON public.assignments;
CREATE TRIGGER tr_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.5 ตาราง assignment_files (ไฟล์แนบคำสั่งงานจากครู เช่น เอกสารโจทย์ / Template)
CREATE TABLE IF NOT EXISTS public.assignment_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 ตาราง submissions (การส่งงานของนักเรียน)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded')),
    resubmitted_at TIMESTAMPTZ,
    note TEXT, -- ข้อความเพิ่มเติมจากนักเรียน
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id)
);

DROP TRIGGER IF EXISTS tr_submissions_updated_at ON public.submissions;
CREATE TRIGGER tr_submissions_updated_at
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.7 ตาราง submission_files (ไฟล์ที่นักเรียนอัปโหลด ส่งงาน)
CREATE TABLE IF NOT EXISTS public.submission_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.8 ตาราง grades (คะแนนและ Feedback จากครู)
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID UNIQUE NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    score NUMERIC(6, 2) NOT NULL CHECK (score >= 0),
    feedback TEXT,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS tr_grades_updated_at ON public.grades;
CREATE TRIGGER tr_grades_updated_at
    BEFORE UPDATE ON public.grades
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.9 ตาราง announcements (ข่าวสาร / ประกาศในรายวิชา)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.10 ตาราง notifications (ระบบแจ้งเตือนภายในแอป In-app Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    type TEXT DEFAULT 'assignment' CHECK (type IN ('assignment', 'grade', 'announcement', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. ดัชนีเพื่อประสิทธิภาพ (Indexes for High Concurrency 1,500+ Users)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_join_code ON public.courses(join_code);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submission_files_submission_id ON public.submission_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON public.grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON public.announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);

-- ==============================================================================
-- 5. Business Logic Triggers (การคำนวณสถานะส่งช้า / แจ้งเตือนอัตโนมัติ)
-- ==============================================================================

-- 5.1 ตรวจสอบกำหนดส่งงานและระบุสถานะ 'submitted' หรือ 'late' ฝั่งเซิร์ฟเวอร์
-- ป้องกันการโกงเวลาจากเครื่อง Client
CREATE OR REPLACE FUNCTION public.check_submission_status()
RETURNS TRIGGER AS $$
DECLARE
    v_due_date TIMESTAMPTZ;
    v_allow_late BOOLEAN;
BEGIN
    SELECT due_date, allow_late INTO v_due_date, v_allow_late
    FROM public.assignments
    WHERE id = NEW.assignment_id;

    -- หากเลยกำหนดส่ง
    IF NEW.submitted_at > v_due_date THEN
        IF NOT v_allow_late THEN
            RAISE EXCEPTION 'การบ้านชิ้นนี้ปิดรับส่งแล้ว และไม่อนุญาตให้ส่งล่าช้า';
        END IF;
        -- ถ้ายังไม่ได้ตรวจ ให้ตั้งเป็น 'late'
        IF NEW.status != 'graded' THEN
            NEW.status := 'late';
        END IF;
    ELSE
        IF NEW.status != 'graded' THEN
            NEW.status := 'submitted';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_submission_status ON public.submissions;
CREATE TRIGGER tr_check_submission_status
    BEFORE INSERT OR UPDATE OF submitted_at, assignment_id ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION public.check_submission_status();

-- 5.2 อัปเดตสถานะ submission เป็น 'graded' อัตโนมัติเมื่อมีการบันทึกคะแนนในตาราง grades
CREATE OR REPLACE FUNCTION public.handle_grade_saved()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.submissions
    SET status = 'graded'
    WHERE id = NEW.submission_id;

    -- ส่งแจ้งเตือนไปยังนักเรียนเจ้าของงาน
    INSERT INTO public.notifications (user_id, title, message, link, type)
    SELECT 
        s.student_id,
        'ตรวจงานแล้ว: ' || a.title,
        'คุณได้รับคะแนน ' || NEW.score || '/' || a.max_score || ' คะแนน',
        '/assignments/' || a.id,
        'grade'
    FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = NEW.submission_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_handle_grade_saved ON public.grades;
CREATE TRIGGER tr_handle_grade_saved
    AFTER INSERT OR UPDATE ON public.grades
    FOR EACH ROW EXECUTE FUNCTION public.handle_grade_saved();

-- 5.3 ส่งแจ้งเตือนให้นักเรียนทุกคนในวิชาเมื่อครูสั่งงานใหม่ (Published Assignment)
CREATE OR REPLACE FUNCTION public.handle_assignment_published()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR 
       (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'published') THEN
        
        INSERT INTO public.notifications (user_id, title, message, link, type)
        SELECT 
            e.student_id,
            'งานใหม่: ' || NEW.title,
            'มีงานใหม่ในวิชา ' || c.name || ' กำหนดส่ง ' || to_char(NEW.due_date AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI'),
            '/assignments/' || NEW.id,
            'assignment'
        FROM public.enrollments e
        JOIN public.courses c ON c.id = NEW.course_id
        WHERE e.course_id = NEW.course_id;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_handle_assignment_published ON public.assignments;
CREATE TRIGGER tr_handle_assignment_published
    AFTER INSERT OR UPDATE OF status ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_assignment_published();

-- 5.4 สร้างโปรไฟล์อัตโนมัติเมื่อมีผู้ใช้งานสมัครสมาชิกผ่าน Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        role,
        student_id,
        first_name,
        last_name,
        avatar_url,
        grade_level
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'student_id', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), ' ', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(COALESCE(NEW.raw_user_meta_data->>'name', ''), ' ', 2)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'grade_level', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
CREATE TRIGGER tr_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 6. Helper Security Functions สำหรับ Row Level Security (RLS)
-- ป้องกัน recursion และเพิ่มความเร็วในการ query (SECURITY DEFINER)
-- ==============================================================================

-- ตรวจสอบว่าเป็นแอดมินหรือไม่
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ตรวจสอบว่าเป็นครูหรือแอดมินหรือไม่
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ตรวจสอบว่าเป็นครูประจำรายวิชานี้หรือไม่
CREATE OR REPLACE FUNCTION public.is_course_teacher(target_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.courses
        WHERE id = target_course_id AND (teacher_id = auth.uid() OR public.is_admin())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ตรวจสอบว่าเป็นนักเรียนที่ลงทะเบียนในวิชานี้หรือไม่
CREATE OR REPLACE FUNCTION public.is_course_student(target_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.enrollments
        WHERE course_id = target_course_id AND student_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ดึง course_id จาก assignment_id
CREATE OR REPLACE FUNCTION public.get_assignment_course_id(target_assignment_id UUID)
RETURNS UUID AS $$
    SELECT course_id FROM public.assignments WHERE id = target_assignment_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ดึง course_id จาก submission_id
CREATE OR REPLACE FUNCTION public.get_submission_course_id(target_submission_id UUID)
RETURNS UUID AS $$
    SELECT a.course_id 
    FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = target_submission_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ==============================================================================
-- 7. เปิดใช้งาน Row Level Security (RLS) ทั้ง 10 ตาราง
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8. นโยบายความปลอดภัย RLS Policies
-- ==============================================================================

-- 8.1 PROFILES POLICIES
-- อ่าน: ผู้ใช้งานที่ล็อกอินแล้วสามารถดูโปรไฟล์ได้ (เพื่อดูชื่อครูผู้สอน, เพื่อนร่วมห้อง)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

-- เพิ่ม: ตนเอง หรือ auth trigger (Service Role)
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- แก้ไข: ตนเอง หรือ Admin
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (
        -- หากไม่ใช่ admin จะไม่สามารถเลื่อนขั้นบทบาทตนเองเป็น teacher หรือ admin ได้
        (auth.uid() = id AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid())))
        OR public.is_admin()
    );

-- 8.2 COURSES POLICIES
-- อ่าน: ครูผู้สอน, แอดมิน, นักเรียนที่ลงทะเบียน, หรือผู้ใช้งานที่ค้นหาด้วยรหัส join_code
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses
    FOR SELECT TO authenticated
    USING (
        teacher_id = auth.uid() 
        OR public.is_admin()
        OR public.is_course_student(id)
        OR is_archived = false -- อนุญาตให้เห็นวิชาสำหรับนำรหัส join_code ไปเข้าเรียน
    );

-- สร้างรายวิชา: เฉพาะครูหรือแอดมิน
DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
CREATE POLICY "courses_insert_policy" ON public.courses
    FOR INSERT TO authenticated
    WITH CHECK (public.is_teacher() AND teacher_id = auth.uid());

-- แก้ไขรายวิชา: ครูประจำวิชา หรือ แอดมิน
DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
CREATE POLICY "courses_update_policy" ON public.courses
    FOR UPDATE TO authenticated
    USING (teacher_id = auth.uid() OR public.is_admin());

-- ลบรายวิชา: ครูประจำวิชา หรือ แอดมิน
DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;
CREATE POLICY "courses_delete_policy" ON public.courses
    FOR DELETE TO authenticated
    USING (teacher_id = auth.uid() OR public.is_admin());

-- 8.3 ENROLLMENTS POLICIES
-- อ่าน: นักเรียนเจ้าของการลงทะเบียน, ครูประจำวิชา, แอดมิน
DROP POLICY IF EXISTS "enrollments_select_policy" ON public.enrollments;
CREATE POLICY "enrollments_select_policy" ON public.enrollments
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() 
        OR public.is_course_teacher(course_id) 
        OR public.is_admin()
    );

-- เพิ่ม: นักเรียนลงทะเบียนเรียนให้ตัวเอง หรือ ครู/แอดมินดึงนักเรียนเข้าห้อง
DROP POLICY IF EXISTS "enrollments_insert_policy" ON public.enrollments;
CREATE POLICY "enrollments_insert_policy" ON public.enrollments
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id = auth.uid() 
        OR public.is_course_teacher(course_id) 
        OR public.is_admin()
    );

-- ลบ: นักเรียนยกเลิกการลงทะเบียน หรือ ครูคัดนักเรียนออกจากห้อง
DROP POLICY IF EXISTS "enrollments_delete_policy" ON public.enrollments;
CREATE POLICY "enrollments_delete_policy" ON public.enrollments
    FOR DELETE TO authenticated
    USING (
        student_id = auth.uid() 
        OR public.is_course_teacher(course_id) 
        OR public.is_admin()
    );

-- 8.4 ASSIGNMENTS POLICIES
-- อ่าน: ครูผู้สอน/แอดมิน เห็นทุกสถานะ (รวม draft), นักเรียนที่ลงทะเบียนเห็นเฉพาะ 'published'
DROP POLICY IF EXISTS "assignments_select_policy" ON public.assignments;
CREATE POLICY "assignments_select_policy" ON public.assignments
    FOR SELECT TO authenticated
    USING (
        public.is_course_teacher(course_id)
        OR (public.is_course_student(course_id) AND status = 'published')
        OR public.is_admin()
    );

-- สร้าง/แก้ไข/ลบ: ครูประจำวิชา หรือ แอดมินเท่านั้น
DROP POLICY IF EXISTS "assignments_insert_policy" ON public.assignments;
CREATE POLICY "assignments_insert_policy" ON public.assignments
    FOR INSERT TO authenticated
    WITH CHECK (public.is_course_teacher(course_id));

DROP POLICY IF EXISTS "assignments_update_policy" ON public.assignments;
CREATE POLICY "assignments_update_policy" ON public.assignments
    FOR UPDATE TO authenticated
    USING (public.is_course_teacher(course_id));

DROP POLICY IF EXISTS "assignments_delete_policy" ON public.assignments;
CREATE POLICY "assignments_delete_policy" ON public.assignments
    FOR DELETE TO authenticated
    USING (public.is_course_teacher(course_id));

-- 8.5 ASSIGNMENT_FILES POLICIES
-- อ่าน: ตามสิทธิ์การมองเห็น assignment
DROP POLICY IF EXISTS "assignment_files_select_policy" ON public.assignment_files;
CREATE POLICY "assignment_files_select_policy" ON public.assignment_files
    FOR SELECT TO authenticated
    USING (
        public.is_course_teacher(public.get_assignment_course_id(assignment_id))
        OR public.is_course_student(public.get_assignment_course_id(assignment_id))
        OR public.is_admin()
    );

-- จัดการไฟล์การบ้าน: ครูประจำวิชา
DROP POLICY IF EXISTS "assignment_files_insert_policy" ON public.assignment_files;
CREATE POLICY "assignment_files_insert_policy" ON public.assignment_files
    FOR INSERT TO authenticated
    WITH CHECK (public.is_course_teacher(public.get_assignment_course_id(assignment_id)));

DROP POLICY IF EXISTS "assignment_files_delete_policy" ON public.assignment_files;
CREATE POLICY "assignment_files_delete_policy" ON public.assignment_files
    FOR DELETE TO authenticated
    USING (public.is_course_teacher(public.get_assignment_course_id(assignment_id)));

-- 8.6 SUBMISSIONS POLICIES
-- อ่าน: นักเรียนเจ้าของงาน, ครูประจำวิชา, แอดมิน
DROP POLICY IF EXISTS "submissions_select_policy" ON public.submissions;
CREATE POLICY "submissions_select_policy" ON public.submissions
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid()
        OR public.is_course_teacher(public.get_assignment_course_id(assignment_id))
        OR public.is_admin()
    );

-- ส่งงาน (Insert): นักเรียนที่เป็นสมาชิกในวิชา และส่งให้ตัวเองเท่านั้น
DROP POLICY IF EXISTS "submissions_insert_policy" ON public.submissions;
CREATE POLICY "submissions_insert_policy" ON public.submissions
    FOR INSERT TO authenticated
    WITH CHECK (
        student_id = auth.uid()
        AND public.is_course_student(public.get_assignment_course_id(assignment_id))
    );

-- แก้ไข (Update): นักเรียนแก้ไขงานตนเอง (หากยังไม่ได้ตรวจ) หรือครูอัปเดตสถานะ
DROP POLICY IF EXISTS "submissions_update_policy" ON public.submissions;
CREATE POLICY "submissions_update_policy" ON public.submissions
    FOR UPDATE TO authenticated
    USING (
        (student_id = auth.uid() AND status != 'graded')
        OR public.is_course_teacher(public.get_assignment_course_id(assignment_id))
        OR public.is_admin()
    );

-- 8.7 SUBMISSION_FILES POLICIES
-- อ่าน: เจ้าของงาน หรือ ครูประจำวิชา หรือ แอดมิน
DROP POLICY IF EXISTS "submission_files_select_policy" ON public.submission_files;
CREATE POLICY "submission_files_select_policy" ON public.submission_files
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = submission_id
            AND (
                s.student_id = auth.uid()
                OR public.is_course_teacher(public.get_assignment_course_id(s.assignment_id))
                OR public.is_admin()
            )
        )
    );

-- อัปโหลดไฟล์: นักเรียนเจ้าของงาน
DROP POLICY IF EXISTS "submission_files_insert_policy" ON public.submission_files;
CREATE POLICY "submission_files_insert_policy" ON public.submission_files
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = submission_id AND s.student_id = auth.uid()
        )
    );

-- ลบไฟล์: นักเรียนเจ้าของงาน (เมื่อยังไม่ตรวจ)
DROP POLICY IF EXISTS "submission_files_delete_policy" ON public.submission_files;
CREATE POLICY "submission_files_delete_policy" ON public.submission_files
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = submission_id 
            AND s.student_id = auth.uid() 
            AND s.status != 'graded'
        )
    );

-- 8.8 GRADES POLICIES
-- อ่าน: นักเรียนเจ้าของงาน, ครูประจำวิชา, แอดมิน
DROP POLICY IF EXISTS "grades_select_policy" ON public.grades;
CREATE POLICY "grades_select_policy" ON public.grades
    FOR SELECT TO authenticated
    USING (
        public.is_course_teacher(public.get_submission_course_id(submission_id))
        OR EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = submission_id AND s.student_id = auth.uid()
        )
        OR public.is_admin()
    );

-- บันทึกคะแนน/แก้ไข: ครูประจำวิชา หรือ แอดมินเท่านั้น
DROP POLICY IF EXISTS "grades_insert_policy" ON public.grades;
CREATE POLICY "grades_insert_policy" ON public.grades
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_course_teacher(public.get_submission_course_id(submission_id))
    );

DROP POLICY IF EXISTS "grades_update_policy" ON public.grades;
CREATE POLICY "grades_update_policy" ON public.grades
    FOR UPDATE TO authenticated
    USING (
        public.is_course_teacher(public.get_submission_course_id(submission_id))
    );

-- 8.9 ANNOUNCEMENTS POLICIES
-- อ่าน: นักเรียนในวิชา, ครูประจำวิชา, แอดมิน
DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
CREATE POLICY "announcements_select_policy" ON public.announcements
    FOR SELECT TO authenticated
    USING (
        public.is_course_teacher(course_id)
        OR public.is_course_student(course_id)
        OR public.is_admin()
    );

-- สร้าง/แก้ไข/ลบ: ครูประจำวิชา หรือ แอดมิน
DROP POLICY IF EXISTS "announcements_insert_policy" ON public.announcements;
CREATE POLICY "announcements_insert_policy" ON public.announcements
    FOR INSERT TO authenticated
    WITH CHECK (public.is_course_teacher(course_id));

DROP POLICY IF EXISTS "announcements_update_policy" ON public.announcements;
CREATE POLICY "announcements_update_policy" ON public.announcements
    FOR UPDATE TO authenticated
    USING (public.is_course_teacher(course_id));

DROP POLICY IF EXISTS "announcements_delete_policy" ON public.announcements;
CREATE POLICY "announcements_delete_policy" ON public.announcements
    FOR DELETE TO authenticated
    USING (public.is_course_teacher(course_id));

-- 8.10 NOTIFICATIONS POLICIES
-- อ่านและแก้ไข: เจ้าของการแจ้งเตือนเท่านั้น
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ==============================================================================
-- 9. Storage Buckets & Policies (ที่เก็บไฟล์แนบ & ไฟล์ส่งงาน)
-- ==============================================================================

-- สร้าง Buckets ใน storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'assignment_attachments', 
        'assignment_attachments', 
        true, 
        20971520, -- 20 MB
        ARRAY[
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg', 
            'image/png', 
            'image/webp',
            'application/zip', 
            'application/x-zip-compressed'
        ]
    ),
    (
        'submissions', 
        'submissions', 
        false, -- Private Bucket ป้องกันการแอบดูงานของเพื่อน
        20971520, -- 20 MB
        ARRAY[
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg', 
            'image/png', 
            'image/webp',
            'application/zip', 
            'application/x-zip-compressed'
        ]
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies สำหรับ 'assignment_attachments' (ทุกคนอ่านได้, ครูอัปโหลด)
DROP POLICY IF EXISTS "assignment_files_read" ON storage.objects;
CREATE POLICY "assignment_files_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'assignment_attachments');

DROP POLICY IF EXISTS "assignment_files_upload" ON storage.objects;
CREATE POLICY "assignment_files_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'assignment_attachments' AND public.is_teacher());

DROP POLICY IF EXISTS "assignment_files_delete" ON storage.objects;
CREATE POLICY "assignment_files_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'assignment_attachments' AND public.is_teacher());

-- Storage Policies สำหรับ 'submissions' (Private Vault)
-- Folder convention: submissions/{assignment_id}/{student_id}/{filename} หรือ {student_id}/{assignment_id}/{filename}
DROP POLICY IF EXISTS "submission_files_read" ON storage.objects;
CREATE POLICY "submission_files_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'submissions'
        AND (
            -- นักเรียนดูไฟล์ของตัวเอง (เช็คว่า auth.uid อยู่ใน path หรือเป็น owner)
            auth.uid()::text = ANY(storage.foldername(name))
            OR owner = auth.uid()
            -- ครูหรือแอดมินดูได้
            OR public.is_teacher()
        )
    );

DROP POLICY IF EXISTS "submission_files_upload" ON storage.objects;
CREATE POLICY "submission_files_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'submissions'
        AND (
            auth.uid()::text = ANY(storage.foldername(name))
            OR owner = auth.uid()
        )
    );

DROP POLICY IF EXISTS "submission_files_delete" ON storage.objects;
CREATE POLICY "submission_files_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'submissions'
        AND (
            auth.uid()::text = ANY(storage.foldername(name))
            OR owner = auth.uid()
            OR public.is_teacher()
        )
    );
