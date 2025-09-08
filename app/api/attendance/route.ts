import { NextRequest, NextResponse } from 'next/server';
import { mockAttendance, mockClasses, mockStudents, mockActivityLogs } from '@/lib/mockData';
import { validateLocation } from '@/lib/geolocation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, class_id, location, face_recognition_result } = body;

    // Validate required fields
    if (!student_id || !class_id || !location) {
      return NextResponse.json({ 
        success: false, 
        message: 'Data tidak lengkap' 
      }, { status: 400 });
    }

    // Find class data
    const classData = mockClasses.find(cls => cls.id === class_id);
    if (!classData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kelas tidak ditemukan' 
      }, { status: 404 });
    }

    // Find student data
    const student = mockStudents.find(s => s.id === student_id);
    if (!student) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mahasiswa tidak ditemukan' 
      }, { status: 404 });
    }

    // Validate location
    const locationValidation = validateLocation(
      location, 
      classData.location, 
      classData.location.radius
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
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = mockAttendance.find(att => 
      att.student_id === student_id && 
      att.class_id === class_id && 
      att.time.startsWith(today)
    );

    if (existingAttendance) {
      return NextResponse.json({
        success: false,
        message: 'Anda sudah melakukan absensi untuk kelas ini hari ini'
      }, { status: 409 });
    }

    // Create attendance record
    const attendance = {
      id: (mockAttendance.length + 1).toString(),
      student_id,
      class_id,
      status: 'Present' as const,
      location,
      time: new Date().toISOString(),
      face_recognition_status: 'Matched' as const
    };

    mockAttendance.push(attendance);

    // Log the activity
    mockActivityLogs.push({
      id: Date.now().toString(),
      student_id,
      activity_type: 'Attendance',
      time: new Date().toISOString(),
      details: `Attendance marked for ${classData.class_name} with face recognition (${(face_recognition_result.confidence * 100).toFixed(1)}% confidence)`
    });

    return NextResponse.json({
      success: true,
      attendance,
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