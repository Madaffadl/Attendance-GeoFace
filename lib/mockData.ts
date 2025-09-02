import { Student, Lecturer, Class, Attendance, FaceRecognition, ActivityLog } from '@/types';

// Data Mahasiswa, Dosen, dan lainnya tetap sama...
export const mockStudents: Student[] = [
  {
    id: '1',
    nim: '2021001',
    name: 'John Doe',
    email: 'john.doe@university.edu',
    program_study: 'Computer Science',
    photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    face_vector: 'vector_data_1'
  },
  {
    id: '2',
    nim: '2021002',
    name: 'Jane Smith',
    email: 'jane.smith@university.edu',
    program_study: 'Information Systems',
    photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    face_vector: 'vector_data_2'
  },
  {
    id: '3',
    nim: '2021003',
    name: 'Mike Johnson',
    email: 'mike.johnson@university.edu',
    program_study: 'Computer Science',
    photo: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
    face_vector: 'vector_data_3'
  }
];

export const mockLecturers: Lecturer[] = [
  {
    id: '1',
    name: 'Dr. Sarah Wilson',
    code: 'LEC001',
    password: 'password123'
  },
  {
    id: '2',
    name: 'Prof. David Brown',
    code: 'LEC002',
    password: 'password456'
  }
];


export const mockClasses: Class[] = [
  {
    id: '1',
    class_code: 'CS101',
    class_name: 'Introduction to Programming',
    schedule: 'Senin 08:00-10:00',
    lecturer_id: '1',
    lecturer_name: 'Dr. Sarah Wilson',
    location: {
      latitude: -6.9929,
      longitude: 110.4280,
      radius: 50
    }
  },
  {
    id: '2',
    class_code: 'CS201',
    class_name: 'Data Structures and Algorithms',
    schedule: 'Rabu 10:00-12:00',
    lecturer_id: '1',
    lecturer_name: 'Dr. Sarah Wilson',
    location: {
      latitude: -6.9929,
      longitude: 110.4280,
      radius: 50
    }
  },
  {
    id: '3',
    class_code: 'IS301',
    class_name: 'Database Systems',
    schedule: 'Jumat 13:00-15:00',
    lecturer_id: '2',
    lecturer_name: 'Prof. David Brown',
    location: {
      latitude: -6.9929,
      longitude: 110.4280,
      radius: 50
    }
  }
];

export const mockAttendance: Attendance[] = [
  {
    id: '1',
    student_id: '1',
    class_id: '1',
    status: 'Present',
    location: {
      latitude: -6.9929,
      longitude: 110.4280
    },
    time: '2024-12-16T08:05:00Z',
    face_recognition_status: 'Matched'
  },
  {
    id: '2',
    student_id: '2',
    class_id: '1',
    status: 'Present',
    location: {
      latitude: -6.9929,
      longitude: 110.4280
    },
    time: '2024-12-16T08:03:00Z',
    face_recognition_status: 'Matched'
  },
  {
    id: '3',
    student_id: '3',
    class_id: '1',
    status: 'Present',
    location: {
      latitude: -6.9929,
      longitude: 110.4280
    },
    time: '2024-12-15T08:07:00Z',
    face_recognition_status: 'Matched'
  },
  {
    id: '4',
    student_id: '1',
    class_id: '2',
    status: 'Present',
    location: {
      latitude: -6.9929,
      longitude: 110.4280
    },
    time: '2024-12-15T10:05:00Z',
    face_recognition_status: 'Matched'
  },
  {
    id: '5',
    student_id: '2',
    class_id: '3',
    status: 'Present',
    location: {
      latitude: -6.9929,
      longitude: 110.4280
    },
    time: '2024-12-14T13:05:00Z',
    face_recognition_status: 'Matched'
  },
  {
    id: '6',
    student_id: '1',
    class_id: '1',
    status: 'Present',
    location: {
      latitude: -6.9929,
      longitude: 110.4280
    },
    time: '2024-12-14T08:05:00Z',
    face_recognition_status: 'Matched'
  },
  {
    id: '7',
    student_id: '3',
    class_id: '2',
    status: 'Present',
    location: {
      latitude: -6.9929,
      longitude: 110.4280
    },
    time: '2024-12-13T10:05:00Z',
    face_recognition_status: 'Matched'
  }
];

export const mockFaceRecognition: FaceRecognition[] = [
  {
    id: '1',
    student_id: '1',
    face_vector: 'processed_vector_1',
    status: 'Matched',
    confidence: 0.95
  },
  {
    id: '2',
    student_id: '2',
    face_vector: 'processed_vector_2',
    status: 'Matched',
    confidence: 0.92
  }
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    student_id: '1',
    activity_type: 'Login',
    time: '2024-01-15T07:30:00Z',
    details: 'Student logged in successfully'
  },
  {
    id: '2',
    student_id: '1',
    activity_type: 'Attendance',
    time: '2024-01-15T08:05:00Z',
    details: 'Attendance marked for CS101'
  },
  {
    id: '3',
    lecturer_id: '1',
    activity_type: 'Login',
    time: '2024-01-15T07:00:00Z',
    details: 'Lecturer logged in successfully'
  }
];

// Enrollment mapping (which students are enrolled in which classes)
export const mockEnrollments: { [studentId: string]: string[] } = {
  '1': ['1', '2'], // John Doe enrolled in CS101 and CS201
  '2': ['1', '3'], // Jane Smith enrolled in CS101 and IS301
  '3': ['2', '3']  // Mike Johnson enrolled in CS201 and IS301
};