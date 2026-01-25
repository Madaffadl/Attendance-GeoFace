-- =====================================================
-- RPC Function: get_student_with_stats
-- Returns student info with enrollment and attendance stats in single query
-- Run this script in Supabase SQL Editor
-- =====================================================

CREATE OR REPLACE FUNCTION get_student_with_stats(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_student RECORD;
  v_class_count INTEGER;
  v_total_attendance INTEGER;
  v_present_count INTEGER;
  v_attendance_rate INTEGER;
  v_history JSON;
BEGIN
  -- Get student basic info
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Student not found');
  END IF;
  
  -- Get enrollment count
  SELECT COUNT(*) INTO v_class_count
  FROM enrollments
  WHERE student_id = p_student_id;
  
  -- Get attendance stats
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Present') as present
  INTO v_total_attendance, v_present_count
  FROM attendance
  WHERE student_id = p_student_id;
  
  -- Calculate attendance rate
  IF v_total_attendance > 0 THEN
    v_attendance_rate := ROUND((v_present_count::NUMERIC / v_total_attendance::NUMERIC) * 100);
  ELSE
    v_attendance_rate := 0;
  END IF;
  
  -- Get attendance history with class info
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'status', a.status,
      'recorded_at', a.recorded_at,
      'classes', json_build_object(
        'class_name', c.class_name,
        'class_code', c.class_code
      )
    ) ORDER BY a.recorded_at DESC
  ) INTO v_history
  FROM attendance a
  JOIN classes c ON a.class_id = c.id
  WHERE a.student_id = p_student_id;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'student', json_build_object(
      'id', v_student.id,
      'nim', v_student.nim,
      'name', v_student.name,
      'email', v_student.email,
      'program_study', v_student.program_study,
      'photo', v_student.photo,
      'stats', json_build_object(
        'totalClasses', v_class_count,
        'totalAttendance', v_total_attendance,
        'attendanceRate', v_attendance_rate
      ),
      'history', COALESCE(v_history, '[]'::json)
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
