import { NextRequest, NextResponse } from 'next/server';
import { mockStudents, mockFaceRecognition, mockActivityLogs } from '@/lib/mockData';
import { extractFaceVector } from '@/lib/faceRecognition';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, class_id, face_images } = body;

    // Validate required fields
    if (!student_id || !class_id || !face_images || !Array.isArray(face_images)) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Check if student exists
    const student = mockStudents.find(s => s.id === student_id);
    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Student not found'
      }, { status: 404 });
    }

    // Check if face is already registered for this student
    const existingRegistration = mockFaceRecognition.find(fr => fr.student_id === student_id);
    
    // Process face images and create face vectors
    const faceVectors = face_images.map((imageData: string, index: number) => {
      return extractFaceVector(imageData);
    });

    // Combine all face vectors into a single profile
    const combinedFaceVector = faceVectors.join('|');

    if (existingRegistration) {
      // Update existing registration
      existingRegistration.face_vector = combinedFaceVector;
      existingRegistration.status = 'Matched';
      existingRegistration.confidence = 0.95; // High confidence for successful registration
    } else {
      // Create new face registration record
      const faceRegistration = {
        id: (mockFaceRecognition.length + 1).toString(),
        student_id,
        face_vector: combinedFaceVector,
        status: 'Matched' as const,
        confidence: 0.95
      };
      
      mockFaceRecognition.push(faceRegistration);
    }

    // Update student's face vector
    const studentIndex = mockStudents.findIndex(s => s.id === student_id);
    if (studentIndex !== -1) {
      mockStudents[studentIndex].face_vector = combinedFaceVector;
    }

    // Log the activity
    const activityLog = {
      id: Date.now().toString(),
      student_id,
      activity_type: 'Face_Registration' as const,
      time: new Date().toISOString(),
      details: `Face registration completed for class ${class_id} with ${face_images.length} images`
    };
    mockActivityLogs.push(activityLog);

    return NextResponse.json({
      success: true,
      message: 'Face registration completed successfully',
      registration: {
        student_id,
        images_processed: face_images.length,
        confidence: 0.95,
        status: 'Registered'
      }
    });

  } catch (error) {
    console.error('Face registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}