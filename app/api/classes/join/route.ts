import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const body = await request.json();
    const studentId = body.studentId;
    const classCode = body.classCode ? body.classCode.toUpperCase() : '';

    if (!studentId || !classCode) {
      return NextResponse.json({
        success: false,
        message: 'Mohon lengkapi Kode Kelas'
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Cari kelas berdasarkan kode
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, class_name, class_code')
      .eq('class_code', classCode)
      .single();

    if (classError || !classData) {
      return NextResponse.json({
        success: false,
        message: 'Kelas tidak ditemukan. Periksa kembali Kode Kelas Anda.'
      }, { status: 404 });
    }

    // 2. Cek apakah sudah terdaftar
    const { data: enrollment, error: enrollCheckError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classData.id)
      .maybeSingle();

    if (enrollment) {
      return NextResponse.json({
        success: false,
        message: `Anda sudah terdaftar di kelas ${classData.class_name}`
      }, { status: 409 });
    }

    // 3. Masukkan data ke enrollments
    const { error: insertError } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        class_id: classData.id,
        enrolled_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Enrollment error:', insertError);
      return NextResponse.json({
        success: false,
        message: 'Gagal bergabung ke kelas. Silakan coba lagi.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil bergabung ke kelas ${classData.class_name}`,
      class: classData
    });

  } catch (error) {
    console.error('Join class error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan sistem'
    }, { status: 500 });
  }
}
