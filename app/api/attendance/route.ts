import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, logActivity, isSupabaseConfigured } from '@/lib/supabase';
import { validateLocation } from '@/lib/geolocation';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { student_id, class_id, location, face_recognition_result } = body;

    // Validate required fields
    if (!student_id || !class_id || !location) {
      return NextResponse.json({ 
        success: false, 
        message: 'Data tidak lengkap' 
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // Find class data from Supabase
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kelas tidak ditemukan' 
      }, { status: 404 });
    }

    // Find student data from Supabase
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

    // Validate location
    const classLocation = {
      latitude: parseFloat(classData.location_latitude),
      longitude: parseFloat(classData.location_longitude),
      radius: classData.location_radius
    };

    const locationValidation = validateLocation(
      location, 
      classLocation, 
      classLocation.radius
    );
    
    if (!locationValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        message: locationValidation.message 
      }, { status: 400 });
    }

    // Check if face recognition was successful
    if (!face_recognition_result || !face_recognition_result.success) {
      return NextResponse.json({
        success: false,
        message: face_recognition_result?.message || "Face recognition failed"
      }, { status: 400 });
    }

    // Check if student already marked attendance for this class today
    // Use local timezone for date comparison
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', student_id)
      .eq('class_id', class_id)
      .gte('recorded_at', `${today}T00:00:00`)
      .lt('recorded_at', `${today}T23:59:59`)
      .single();

    if (existingAttendance) {
      return NextResponse.json({
        success: false,
        message: 'Anda sudah melakukan absensi untuk kelas ini hari ini'
      }, { status: 409 });
    }

    // Create attendance record in Supabase
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        student_id,
        class_id,
        status: 'Present',
        location_latitude: location.latitude,
        location_longitude: location.longitude,
        face_recognition_status: 'Matched'
      })
      .select()
      .single();

    if (attendanceError) {
      console.error('Attendance insert error:', attendanceError);
      return NextResponse.json({ 
        success: false, 
        message: 'Gagal menyimpan absensi' 
      }, { status: 500 });
    }

    // Log the activity
    await logActivity({
      student_id,
      lecturer_id: null,
      activity_type: 'Attendance',
      details: `Attendance marked for ${classData.class_name} with face recognition (${(face_recognition_result.confidence * 100).toFixed(1)}% confidence)`
    });

    return NextResponse.json({
      success: true,
      attendance: {
        ...attendance,
        time: attendance.recorded_at,
        location: {
          latitude: attendance.location_latitude,
          longitude: attendance.location_longitude
        }
      },
      message: `Absensi berhasil dicatat! Tingkat kemiripan wajah: ${(face_recognition_result.confidence * 100).toFixed(1)}%`
    });

  } catch (error) {
    console.error('Attendance error:', error);
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
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    const supabase = getSupabase();

    let query = supabase
      .from('attendance')
      .select(`
        *,
        students (id, nim, name, photo),
        classes (id, class_code, class_name)
      `)
      .order('recorded_at', { ascending: false });

    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Attendance fetch error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch attendance'
      }, { status: 500 });
    }

    // Transform data to match expected format
    const attendance = data.map((att: any) => ({
      id: att.id,
      student_id: att.student_id,
      class_id: att.class_id,
      status: att.status,
      location: att.location_latitude && att.location_longitude ? {
        latitude: parseFloat(att.location_latitude),
        longitude: parseFloat(att.location_longitude)
      } : null,
      location_latitude: att.location_latitude,
      location_longitude: att.location_longitude,
      time: att.recorded_at,
      recorded_at: att.recorded_at,
      face_recognition_status: att.face_recognition_status,
      students: att.students,
      classes: att.classes,
      student_name: att.students?.name || '-'
    }));

    return NextResponse.json({
      success: true,
      attendance
    });

  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Remove attendance records for a student (for testing)
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
      .from('attendance')
      .delete()
      .eq('student_id', studentId);

    if (error) {
      console.error('Attendance delete error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete attendance data'
      }, { status: 500 });
    }

    console.log(`Attendance data deleted for student: ${studentId}`);

    return NextResponse.json({
      success: true,
      message: 'Attendance data deleted successfully'
    });

  } catch (error) {
    console.error('Attendance delete error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}