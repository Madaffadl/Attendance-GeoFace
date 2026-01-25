import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, logActivity, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const body = await request.json();
    // Support both camelCase (from client) and snake_case
    const student_id = body.studentId || body.student_id;
    const face_descriptor = body.faceDescriptor || body.face_descriptor;
    const confidence_score = body.confidenceScore || body.confidence_score || 0.95;
    const photos_count = body.photosCount || body.photos_count || 5;

    if (!student_id || !face_descriptor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Data tidak lengkap (student_id dan face_descriptor diperlukan)' 
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mahasiswa tidak ditemukan' 
      }, { status: 404 });
    }

    // Save or update face data in Supabase
    const { error: faceError } = await supabase
      .from('face_data')
      .upsert({
        student_id,
        face_descriptor,
        confidence_score: 0.95,
        photos_count: 5,
        registered_at: new Date().toISOString()
      }, { 
        onConflict: 'student_id' 
      });

    if (faceError) {
      console.error('Face data save error:', faceError);
      return NextResponse.json({ 
        success: false, 
        message: 'Gagal menyimpan data wajah' 
      }, { status: 500 });
    }

    // Log the activity
    await logActivity({
      student_id,
      lecturer_id: null,
      activity_type: 'Face_Registration',
      details: `Face registration completed for student ${student_id}`
    });

    return NextResponse.json({
      success: true,
      message: 'Registrasi wajah berhasil! Sekarang Anda dapat melakukan absensi dengan face recognition.',
      student: {
        id: student.id,
        nim: student.nim,
        name: student.name,
        email: student.email,
        program_study: student.program_study,
        photo: student.photo
      },
      face_descriptor: face_descriptor
    });

  } catch (error) {
    console.error('Face registration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    }, { status: 500 });
  }
}

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

    if (!studentId) {
      return NextResponse.json({
        success: false,
        message: 'Student ID is required'
      }, { status: 400 });
    }

    const { data: faceData, error } = await getSupabase()
      .from('face_data')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Face data fetch error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch face data'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hasFaceData: !!faceData,
      faceData: faceData ? {
        student_id: faceData.student_id,
        face_descriptor: faceData.face_descriptor,
        registration_date: faceData.registered_at,
        confidence_score: faceData.confidence_score,
        photos_count: faceData.photos_count
      } : null
    });

  } catch (error) {
    console.error('Face data fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Remove face data for a student
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

    if (!studentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Student ID is required' 
      }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('face_data')
      .delete()
      .eq('student_id', studentId);

    if (error) {
      console.error('Face data delete error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete face data'
      }, { status: 500 });
    }


    return NextResponse.json({
      success: true,
      message: 'Face data deleted successfully'
    });

  } catch (error) {
    console.error('Face data delete error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}