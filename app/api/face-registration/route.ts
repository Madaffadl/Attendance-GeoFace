import { NextRequest, NextResponse } from 'next/server';
import { mockStudents, mockFaceRecognition, mockActivityLogs } from '@/lib/mockData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, class_id, face_descriptor } = body;

    if (!student_id || !class_id || !face_descriptor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Data tidak lengkap' 
      }, { status: 400 });
    }

    const student = mockStudents.find(s => s.id === student_id);
    if (!student) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mahasiswa tidak ditemukan' 
      }, { status: 404 });
    }

    // Update student's face vector
    const studentIndex = mockStudents.findIndex(s => s.id === student_id);
    if (studentIndex !== -1) {
      mockStudents[studentIndex].face_vector = face_descriptor;
      console.log(`Face vector saved for student ${student_id}:`, face_descriptor.substring(0, 50) + '...');
    }

    // Update or create face recognition record
    const existingRegistration = mockFaceRecognition.find(fr => fr.student_id === student_id);
    if (existingRegistration) {
      existingRegistration.face_vector = face_descriptor;
      existingRegistration.status = 'Matched';
      existingRegistration.confidence = 0.95;
    } else {
      mockFaceRecognition.push({
        id: (mockFaceRecognition.length + 1).toString(),
        student_id,
        face_vector: face_descriptor,
        status: 'Matched',
        confidence: 0.95
      });
    }

    // Log the activity
    mockActivityLogs.push({
      id: Date.now().toString(),
      student_id,
      activity_type: 'Face_Registration',
      time: new Date().toISOString(),
      details: `Face registration completed for class ${class_id}`
    });

    return NextResponse.json({
      success: true,
      message: 'Registrasi wajah berhasil! Sekarang Anda dapat melakukan absensi dengan face recognition.',
      student: mockStudents[studentIndex] // Return updated student data
    });

  } catch (error) {
    console.error('Face registration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    }, { status: 500 });
  }
}