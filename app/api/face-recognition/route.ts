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
    const { student_id, class_id, face_descriptor } = body;

    if (!student_id || !class_id || !face_descriptor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
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
        message: 'Student not found' 
      }, { status: 404 });
    }

    // Save or update face data in Supabase
    const { error: faceError } = await supabase
      .from('face_data')
      .upsert({
        student_id,
        face_descriptor,
        confidence_score: 0.98,
        photos_count: 5,
        registered_at: new Date().toISOString()
      }, { 
        onConflict: 'student_id' 
      });

    if (faceError) {
      console.error('Face data save error:', faceError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save face data' 
      }, { status: 500 });
    }

    // Log the activity
    await logActivity({
      student_id,
      lecturer_id: null,
      activity_type: 'Face_Registration',
      details: `Face registration completed for class ${class_id}`
    });

    return NextResponse.json({
      success: true,
      message: 'Registrasi wajah berhasil! Sekarang Anda dapat melakukan absensi dengan face recognition.',
    });

  } catch (error) {
    console.error('Face registration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}