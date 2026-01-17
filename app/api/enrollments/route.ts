import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// GET - Get enrollments for a student
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    const supabase = getSupabase();

    if (studentId) {
      // Get all enrollments for a student
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          classes (
            id,
            class_code,
            class_name,
            schedule,
            lecturer_id,
            lecturers (name)
          )
        `)
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching enrollments:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch enrollments'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        enrollments
      });
    }

    if (classId) {
      // Get all students enrolled in a class
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          students (
            id,
            nim,
            name,
            email,
            program_study
          )
        `)
        .eq('class_id', classId);

      if (error) {
        console.error('Error fetching enrollments:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch enrollments'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        enrollments
      });
    }

    return NextResponse.json({
      success: false,
      message: 'studentId or classId is required'
    }, { status: 400 });

  } catch (error) {
    console.error('Enrollment GET error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Enroll a student in a class using class code
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { student_id, class_code } = body;

    if (!student_id || !class_code) {
      return NextResponse.json({
        success: false,
        message: 'student_id dan class_code diperlukan'
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // Find the class by class_code
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, class_code, class_name, lecturer_id')
      .eq('class_code', class_code.toUpperCase())
      .maybeSingle();

    if (classError) {
      console.error('Error finding class:', classError);
      return NextResponse.json({
        success: false,
        message: 'Gagal mencari kelas'
      }, { status: 500 });
    }

    if (!classData) {
      return NextResponse.json({
        success: false,
        message: 'Kode kelas tidak ditemukan'
      }, { status: 404 });
    }

    // Check if student is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', student_id)
      .eq('class_id', classData.id)
      .maybeSingle();

    if (existingEnrollment) {
      return NextResponse.json({
        success: false,
        message: 'Anda sudah terdaftar di kelas ini'
      }, { status: 409 });
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id,
        class_id: classData.id,
        enrolled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (enrollError) {
      console.error('Error creating enrollment:', enrollError);
      return NextResponse.json({
        success: false,
        message: `Gagal mendaftar ke kelas: ${enrollError.message || 'Unknown error'}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil bergabung ke kelas ${classData.class_name}`,
      enrollment: {
        ...enrollment,
        class: classData
      }
    });

  } catch (error) {
    console.error('Enrollment POST error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Remove enrollment
export async function DELETE(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    if (!studentId || !classId) {
      return NextResponse.json({
        success: false,
        message: 'studentId dan classId diperlukan'
      }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId);

    if (error) {
      console.error('Error deleting enrollment:', error);
      return NextResponse.json({
        success: false,
        message: 'Gagal menghapus pendaftaran'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil keluar dari kelas'
    });

  } catch (error) {
    console.error('Enrollment DELETE error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
