-- ==============================================================================
-- ข้อมูลตัวอย่างสำหรับทดสอบระบบ (Seed Test Data)
-- สามารถนำไป Run ใน Supabase SQL Editor ได้หลังจากรัน migration หลักแล้ว
-- ==============================================================================

-- ตรวจสอบว่ามี user ในระบบหรือไม่ หรือสร้างข้อมูลจำลอง
-- หมายเหตุ: หากมี user ใน auth.users อยู่แล้ว สามารถใส่ id ของ user จริงแทนได้
DO $$
DECLARE
    v_teacher_id UUID;
    v_student1_id UUID;
    v_course1_id UUID;
    v_course2_id UUID;
    v_assignment1_id UUID;
    v_assignment2_id UUID;
    v_submission1_id UUID;
BEGIN
    -- ดึง user ล่าสุดที่มีอยู่ใน auth.users มาเป็นครู (ถ้ามี)
    SELECT id INTO v_teacher_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    -- หากไม่มี user ใน auth.users จะไม่รัน seed เพื่อป้องกัน foreign key error
    IF v_teacher_id IS NULL THEN
        RAISE NOTICE 'ยังไม่มีผู้ใช้งานใน auth.users กรุณาสมัครสมาชิกผ่านหน้าเว็บ 1 บัญชีก่อนรัน seed นี้';
        RETURN;
    END IF;

    -- ปรับสิทธิ์ user แรกให้เป็นครู (teacher)
    UPDATE public.profiles
    SET role = 'teacher',
        first_name = 'อาจารย์กานต์',
        last_name = 'วิทยากิตติ์',
        grade_level = 'กลุ่มสาระวิทยาศาสตร์และเทคโนโลยี'
    WHERE id = v_teacher_id;

    -- สร้างรายวิชาตัวอย่างที่ 1
    INSERT INTO public.courses (code, name, description, cover_image, teacher_id, academic_year, semester)
    VALUES (
        'ว30101',
        'วิทยาการคำนวณ 1 (ม.4)',
        'วิชาการเขียนโปรแกรมและการแก้ปัญหาเชิงคำนวณด้วยเทคโนโลยีสมัยใหม่',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
        v_teacher_id,
        '2569',
        1
    ) RETURNING id INTO v_course1_id;

    -- สร้างรายวิชาตัวอย่างที่ 2
    INSERT INTO public.courses (code, name, description, cover_image, teacher_id, academic_year, semester)
    VALUES (
        'ว30202',
        'การพัฒนาเว็บแอปพลิเคชัน (ม.5)',
        'การสร้าง Web App ด้วย React, JavaScript, APIs และฐานข้อมูล Cloud',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
        v_teacher_id,
        '2569',
        1
    ) RETURNING id INTO v_course2_id;

    -- สร้างการบ้านในวิชา ว30101 (กำหนดส่งอีก 7 วันข้างหน้า)
    INSERT INTO public.assignments (course_id, title, description, due_date, max_score, allow_late, status)
    VALUES (
        v_course1_id,
        'ใบงานที่ 1: การเขียนผังงาน (Flowchart) และอัลกอริทึม',
        'ให้นักเรียนออกแบบผังงานการทำงานของระบบสั่งอาหารออนไลน์ พร้อมแนบไฟล์ PDF หรือรูปภาพ (ความยาวไม่เกิน 2 หน้า A4)',
        timezone('utc'::text, now() + interval '7 days'),
        10.00,
        true,
        'published'
    ) RETURNING id INTO v_assignment1_id;

    -- สร้างการบ้านชิ้นที่ 2 (แบบมีไฟล์แนบ)
    INSERT INTO public.assignments (course_id, title, description, due_date, max_score, allow_late, status)
    VALUES (
        v_course1_id,
        'โครงงานชิ้นที่ 1: ระบบจัดการข้อมูลร้านค้าจำลอง',
        'ให้นักเรียนทำงานเดี่ยว ส่ง Source code เป็นไฟล์ ZIP หรือส่งเอกสารสรุปผล',
        timezone('utc'::text, now() + interval '14 days'),
        20.00,
        false,
        'published'
    ) RETURNING id INTO v_assignment2_id;

    -- สร้างประกาศในวิชา ว30101
    INSERT INTO public.announcements (course_id, title, content, created_by)
    VALUES (
        v_course1_id,
        'ยินดีต้อนรับสู่ภาคเรียนที่ 1 ปีการศึกษา 2569',
        'ขอให้นักเรียนทุกคนตรวจสอบตารางเรียน และส่งใบงานที่ 1 ให้ตรงตามเวลาที่กำหนด หากมีข้อสงสัยสามารถติดต่อครูได้ผ่านช่องทางนี้',
        v_teacher_id
    );

    RAISE NOTICE 'สร้างข้อมูลตัวอย่างสำเร็จเรียบร้อย!';
END $$;
