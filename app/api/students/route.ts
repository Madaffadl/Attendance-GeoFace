import { NextRequest, NextResponse } from 'next/server';
import { mockStudents, mockEnrollments } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lecturerId = searchParams.get('lecturerId');

    if (lecturerId) {
      // Return students for a specific lecturer's classes
      const enrolledStudentIds = Object.keys(mockEnrollments);
      const lecturerStudents = mockStudents.filter(student => 
        enrolledStudentIds.includes(student.id)
      );
      
      return NextResponse.json({
        success: true,
        students: lecturerStudents
      });
    } else {
      // Return all students
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