-- =====================================================
-- RPC Function: get_lecturer_stats
-- Returns lecturer dashboard stats in single query
-- Run this script in Supabase SQL Editor
-- =====================================================

CREATE OR REPLACE FUNCTION get_lecturer_stats(p_lecturer_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_total_classes INTEGER;
  v_total_students INTEGER;
  v_total_attendance INTEGER;
  v_present_count INTEGER;
  v_attendance_rate INTEGER;
  v_class_ids UUID[];
BEGIN
  -- Get all class IDs for this lecturer
  SELECT ARRAY_AGG(id) INTO v_class_ids
  FROM classes
  WHERE lecturer_id = p_lecturer_id;
  
  -- Get total classes count
  v_total_classes := COALESCE(array_length(v_class_ids, 1), 0);
  
  IF v_total_classes = 0 THEN
    RETURN json_build_object(
      'success', true,
      'stats', json_build_object(
        'totalClasses', 0,
        'totalStudents', 0,
        'totalAttendance', 0,
        'attendanceRate', 0
      )
    );
  END IF;
  
  -- Get unique students count
  SELECT COUNT(DISTINCT student_id) INTO v_total_students
  FROM enrollments
  WHERE class_id = ANY(v_class_ids);
  
  -- Get attendance stats
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Present') as present
  INTO v_total_attendance, v_present_count
  FROM attendance
  WHERE class_id = ANY(v_class_ids);
  
  -- Calculate attendance rate
  IF v_total_attendance > 0 THEN
    v_attendance_rate := ROUND((v_present_count::NUMERIC / v_total_attendance::NUMERIC) * 100);
  ELSE
    v_attendance_rate := 0;
  END IF;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'stats', json_build_object(
      'totalClasses', v_total_classes,
      'totalStudents', v_total_students,
      'totalAttendance', v_total_attendance,
      'presentCount', v_present_count,
      'attendanceRate', v_attendance_rate
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
