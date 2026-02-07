-- =============================================
-- Supabase Database Schema for Attendance-GeoFace
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nim VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  program_study VARCHAR(100) NOT NULL,
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lecturers table
CREATE TABLE IF NOT EXISTS lecturers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_code VARCHAR(20) UNIQUE NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  schedule VARCHAR(100) NOT NULL,
  lecturer_id UUID REFERENCES lecturers(id) ON DELETE SET NULL,
  location_latitude DECIMAL(10, 8) NOT NULL,
  location_longitude DECIMAL(11, 8) NOT NULL,
  location_radius INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments (many-to-many students <-> classes)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('Present', 'Absent', 'Late')) NOT NULL,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  face_recognition_status VARCHAR(20) CHECK (face_recognition_status IN ('Matched', 'Unmatched', 'Pending')) DEFAULT 'Pending',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Face data storage
CREATE TABLE IF NOT EXISTS face_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  face_descriptor TEXT NOT NULL,
  confidence_score DECIMAL(4, 3) DEFAULT 0.95,
  photos_count INTEGER DEFAULT 5,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules (individual class sessions)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  lecturer_id UUID REFERENCES lecturers(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- For demo purposes, allow public read/write (adjust for production!)
CREATE POLICY "Allow public read students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public read lecturers" ON lecturers FOR SELECT USING (true);
CREATE POLICY "Allow public read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow public all enrollments" ON enrollments FOR ALL USING (true);
CREATE POLICY "Allow public all attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow public all face_data" ON face_data FOR ALL USING (true);
CREATE POLICY "Allow public all schedules" ON schedules FOR ALL USING (true);
CREATE POLICY "Allow public all activity_logs" ON activity_logs FOR ALL USING (true);
CREATE POLICY "Allow public insert classes" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update classes" ON classes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete classes" ON classes FOR DELETE USING (true);

-- =============================================
-- Seed Demo Data
-- =============================================

-- Insert demo students
INSERT INTO students (nim, name, email, program_study, photo) VALUES
  ('2021001', 'M.Daffa Fadillah', 'daffa@university.edu', 'Computer Science', NULL),
  ('2021002', 'Jane Smith', 'jane.smith@university.edu', 'Information Systems', NULL),
  ('2021003', 'Mike Johnson', 'mike.johnson@university.edu', 'Computer Science', NULL)
ON CONFLICT (nim) DO NOTHING;

-- Insert demo lecturers (password: password123 and password456 - in production use proper hashing!)
INSERT INTO lecturers (name, code, password_hash) VALUES
  ('Dr. Sarah Wilson', 'LEC001', 'password123'),
  ('Prof. David Brown', 'LEC002', 'password456')
ON CONFLICT (code) DO NOTHING;

-- Insert demo classes (need to get lecturer IDs first)
DO $$
DECLARE
  lec1_id UUID;
  lec2_id UUID;
  class1_id UUID;
  class2_id UUID;
  class3_id UUID;
  student1_id UUID;
  student2_id UUID;
  student3_id UUID;
BEGIN
  SELECT id INTO lec1_id FROM lecturers WHERE code = 'LEC001';
  SELECT id INTO lec2_id FROM lecturers WHERE code = 'LEC002';
  SELECT id INTO student1_id FROM students WHERE nim = '2021001';
  SELECT id INTO student2_id FROM students WHERE nim = '2021002';
  SELECT id INTO student3_id FROM students WHERE nim = '2021003';
  
  -- Insert classes
  INSERT INTO classes (class_code, class_name, schedule, lecturer_id, location_latitude, location_longitude, location_radius)
  VALUES 
    ('CS101', 'Introduction to Programming', 'Senin 08:00-10:00', lec1_id, -6.9929, 110.4280, 5000)
  ON CONFLICT (class_code) DO NOTHING
  RETURNING id INTO class1_id;
  
  INSERT INTO classes (class_code, class_name, schedule, lecturer_id, location_latitude, location_longitude, location_radius)
  VALUES 
    ('CS201', 'Data Structures and Algorithms', 'Rabu 10:00-12:00', lec1_id, -6.9929, 110.4280, 50)
  ON CONFLICT (class_code) DO NOTHING
  RETURNING id INTO class2_id;
  
  INSERT INTO classes (class_code, class_name, schedule, lecturer_id, location_latitude, location_longitude, location_radius)
  VALUES 
    ('IS301', 'Database Systems', 'Jumat 13:00-15:00', lec2_id, -6.9929, 110.4280, 50)
  ON CONFLICT (class_code) DO NOTHING
  RETURNING id INTO class3_id;
  
  -- Get class IDs if they already existed
  IF class1_id IS NULL THEN
    SELECT id INTO class1_id FROM classes WHERE class_code = 'CS101';
  END IF;
  IF class2_id IS NULL THEN
    SELECT id INTO class2_id FROM classes WHERE class_code = 'CS201';
  END IF;
  IF class3_id IS NULL THEN
    SELECT id INTO class3_id FROM classes WHERE class_code = 'IS301';
  END IF;
  
  -- Insert enrollments
  INSERT INTO enrollments (student_id, class_id) VALUES
    (student1_id, class1_id),
    (student1_id, class2_id),
    (student2_id, class1_id),
    (student2_id, class3_id),
    (student3_id, class2_id),
    (student3_id, class3_id)
  ON CONFLICT (student_id, class_id) DO NOTHING;
  
  -- Insert sample attendance records
  INSERT INTO attendance (student_id, class_id, status, location_latitude, location_longitude, face_recognition_status, recorded_at) VALUES
    (student1_id, class1_id, 'Present', -6.9929, 110.4280, 'Matched', NOW() - INTERVAL '1 day'),
    (student2_id, class1_id, 'Present', -6.9929, 110.4280, 'Matched', NOW() - INTERVAL '1 day'),
    (student3_id, class1_id, 'Present', -6.9929, 110.4280, 'Matched', NOW() - INTERVAL '2 days');
END $$;

-- =============================================
-- Useful Views
-- =============================================

-- View for classes with lecturer names
CREATE OR REPLACE VIEW classes_with_lecturer AS
SELECT 
  c.*,
  l.name as lecturer_name,
  l.code as lecturer_code
FROM classes c
LEFT JOIN lecturers l ON c.lecturer_id = l.id;

-- View for attendance with student and class info
CREATE OR REPLACE VIEW attendance_details AS
SELECT 
  a.*,
  s.nim,
  s.name as student_name,
  s.photo as student_photo,
  cl.class_code,
  cl.class_name
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN classes cl ON a.class_id = cl.id;
