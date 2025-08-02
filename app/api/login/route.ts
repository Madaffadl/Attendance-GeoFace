import { NextRequest, NextResponse } from 'next/server';
import { mockStudents, mockLecturers, mockActivityLogs } from '@/lib/mockData';
import { LoginRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { identifier, password, userType } = body;

    if (userType === 'student') {
      // Login with NIM only for students
      const student = mockStudents.find(s => s.nim === identifier);
      
      if (student) {
        // Log the activity
        const activityLog = {
          id: Date.now().toString(),
          student_id: student.id,
          activity_type: 'Login' as const,
          time: new Date().toISOString(),
          details: 'Student logged in successfully'
        };
        mockActivityLogs.push(activityLog);

        return NextResponse.json({
          success: true,
          user: {
            id: student.id,
            name: student.name,
            userType: 'student',
            identifier: student.nim,
            email: student.email,
            program_study: student.program_study,
            photo: student.photo
          }
        });
      }
    } else if (userType === 'lecturer') {
      // Login with code and password for lecturers
      const lecturer = mockLecturers.find(l => l.code === identifier && l.password === password);
      
      if (lecturer) {
        // Log the activity
        const activityLog = {
          id: Date.now().toString(),
          lecturer_id: lecturer.id,
          activity_type: 'Login' as const,
          time: new Date().toISOString(),
          details: 'Lecturer logged in successfully'
        };
        mockActivityLogs.push(activityLog);

        return NextResponse.json({
          success: true,
          user: {
            id: lecturer.id,
            name: lecturer.name,
            userType: 'lecturer',
            identifier: lecturer.code
          }
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid credentials'
    }, { status: 401 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}