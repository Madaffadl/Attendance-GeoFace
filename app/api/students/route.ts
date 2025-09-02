import { NextRequest, NextResponse } from 'next/server';
import { mockStudents, mockEnrollments, mockClasses } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lecturerId = searchParams.get('lecturerId');

    if (lecturerId) {
      // Dapatkan kelas yang diajar oleh dosen
      const lecturerClasses = mockClasses.filter(cls => cls.lecturer_id === lecturerId);
      const lecturerClassIds = lecturerClasses.map(cls => cls.id);

      // Dapatkan semua ID mahasiswa yang terdaftar di kelas-kelas tersebut
      const enrolledStudentIds = new Set<string>();
      Object.keys(mockEnrollments).forEach(studentId => {
        const studentClasses = mockEnrollments[studentId];
        if (studentClasses.some(classId => lecturerClassIds.includes(classId))) {
          enrolledStudentIds.add(studentId);
        }
      });
      
      const lecturerStudents = mockStudents.filter(student => 
        enrolledStudentIds.has(student.id)
      );
      
      return NextResponse.json({
        success: true,
        students: lecturerStudents
      });
    } else {
      // Kembalikan semua mahasiswa
      return NextResponse.json({
        success: true,
        students: mockStudents
      });
    }
  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}