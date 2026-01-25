-- =====================================================
-- Performance Indexes for Attendance-GeoFace Database
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Enrollments table indexes
-- Speeds up: student class lookup, class enrollment lists
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);

-- Attendance table indexes
-- Speeds up: attendance history, class attendance reports
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_at ON attendance(recorded_at);

-- Classes table indexes
-- Speeds up: lecturer class listings
CREATE INDEX IF NOT EXISTS idx_classes_lecturer_id ON classes(lecturer_id);

-- Verify indexes were created
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
