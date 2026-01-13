import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, logActivity, isSupabaseConfigured } from '@/lib/supabase';
import { LoginRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'Database not configured. Please set up Supabase credentials.'
      }, { status: 503 });
    }

    const body: LoginRequest = await request.json();
    const { identifier, password, userType } = body;

    if (userType === 'student') {
      // Login with NIM only for students
      const { data: student, error } = await getSupabase()
        .from('students')
        .select('*')
        .eq('nim', identifier)
        .single();
      
      if (error || !student) {
        return NextResponse.json({
          success: false,
          message: 'Student not found'
        }, { status: 401 });
      }

      // Log the activity
      await logActivity({
        student_id: student.id,
        lecturer_id: null,
        activity_type: 'Login',
        details: 'Student logged in successfully'
      });

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

    } else if (userType === 'lecturer') {
      // Login with code and password for lecturers
      const { data: lecturer, error } = await getSupabase()
        .from('lecturers')
        .select('*')
        .eq('code', identifier)
        .single();
      
      if (error || !lecturer) {
        return NextResponse.json({
          success: false,
          message: 'Lecturer not found'
        }, { status: 401 });
      }

      // Simple password check (in production, use proper hashing!)
      if (lecturer.password_hash !== password) {
        return NextResponse.json({
          success: false,
          message: 'Invalid password'
        }, { status: 401 });
      }

      // Log the activity
      await logActivity({
        student_id: null,
        lecturer_id: lecturer.id,
        activity_type: 'Login',
        details: 'Lecturer logged in successfully'
      });

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