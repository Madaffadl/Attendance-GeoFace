export interface Student {
  id: string;
  nim: string;
  name: string;
  email: string;
  program_study: string;
  photo: string;
  face_vector?: string;
}

export interface Lecturer {
  id: string;
  name: string;
  code: string;
  password: string;
}

export interface Class {
  id: string;
  class_code: string;
  class_name: string;
  schedule: string;
  lecturer_id: string;
  lecturer_name?: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  status: 'Present' | 'Absent' | 'Late';
  location?: {
    latitude: number;
    longitude: number;
  };
  time: string;
  face_recognition_status: 'Matched' | 'Unmatched' | 'Pending';
}

export interface FaceRecognition {
  id: string;
  student_id: string;
  face_vector: string;
  status: 'Matched' | 'Unmatched';
  confidence: number;
}

export interface ActivityLog {
  id: string;
  student_id?: string;
  lecturer_id?: string;
  activity_type: 'Login' | 'Attendance' | 'Class_Added' | 'Export_Data' | 'Face_Registration';
  time: string;
  details?: string;
}

export interface LoginRequest {
  identifier: string; // NIM for students, code for lecturers
  password?: string; // Only for lecturers
  userType: 'student' | 'lecturer';
}

export interface AttendanceRequest {
  student_id: string;
  class_id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  face_data: string; // Base64 encoded image
}