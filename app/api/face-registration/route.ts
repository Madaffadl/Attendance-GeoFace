import { NextRequest, NextResponse } from 'next/server';
import { mockStudents, mockFaceRecognition, mockActivityLogs } from '@/lib/mockData';
// Kita tidak lagi menggunakan fungsi simulasi, jadi hapus importnya

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, class_id, face_images } = body;

    if (!student_id || !class_id || !face_images || !Array.isArray(face_images) || face_images.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const student = mockStudents.find(s => s.id === student_id);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    // Untuk sistem nyata, Anda akan memproses face_images di sini dengan face-api.js
    // Namun, karena face-api.js berjalan di client, kita asumsikan client sudah mengirimkan deskriptor.
    // Mari kita modifikasi flow: client akan mengirim deskriptor, bukan gambar.
    // Untuk saat ini, kita akan simpan gambar pertama sebagai "representasi".
    // DALAM IMPLEMENTASI NYATA: Anda akan menyimpan deskriptor wajah (Float32Array).
    const faceVector = face_images[0]; // Simpan base64 dari gambar utama sebagai representasi

    const existingRegistration = mockFaceRecognition.find(fr => fr.student_id === student_id);

    if (existingRegistration) {
      existingRegistration.face_vector = faceVector; // Update dengan data baru
    } else {
      mockFaceRecognition.push({
        id: (mockFaceRecognition.length + 1).toString(),
        student_id,
        face_vector: faceVector,
        status: 'Matched',
        confidence: 0.98
      });
    }

    const studentIndex = mockStudents.findIndex(s => s.id === student_id);
    if (studentIndex !== -1) {
      mockStudents[studentIndex].face_vector = faceVector;
    }

    mockActivityLogs.push({
      id: Date.now().toString(),
      student_id,
      activity_type: 'Face_Registration',
      time: new Date().toISOString(),
      details: `Face registration completed for class ${class_id}`
    });

    return NextResponse.json({
      success: true,
      message: 'Face registration completed successfully',
    });

  } catch (error) {
    console.error('Face registration error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}