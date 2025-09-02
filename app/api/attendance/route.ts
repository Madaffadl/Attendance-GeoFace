import { NextRequest, NextResponse } from 'next/server';
import { mockAttendance, mockClasses, mockStudents, mockActivityLogs } from '@/lib/mockData';
import { validateLocation } from '@/lib/geolocation';
// Hapus import simulasi, kita akan melakukan validasi di client-side.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, class_id, location, recognitionResult } = body; // Kita akan terima hasil dari client

    const classData = mockClasses.find(cls => cls.id === class_id);
    if (!classData) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    const locationValidation = validateLocation(location, classData.location, classData.location.radius);
    if (!locationValidation.isValid) {
      return NextResponse.json({ success: false, message: locationValidation.message }, { status: 400 });
    }

    // Verifikasi hasil face recognition yang dikirim dari client
    if (!recognitionResult || !recognitionResult.success) {
      return NextResponse.json({
        success: false,
        message: recognitionResult?.message || "Face recognition failed.",
      }, { status: 400 });
    }

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

    mockActivityLogs.push({
      id: Date.now().toString(),
      student_id,
      activity_type: 'Attendance' as const,
      time: new Date().toISOString(),
      details: `Attendance marked for ${classData.class_name}`
    });

    return NextResponse.json({
      success: true,
      attendance,
      message: 'Attendance marked successfully',
    });

  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}