import { NextRequest, NextResponse } from 'next/server';
import { simulateFaceRecognition, validateFaceImage, extractFaceVector } from '@/lib/faceRecognition';
import { mockFaceRecognition } from '@/lib/mockData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, face_data } = body;

    // Validate face image
    const validation = validateFaceImage(face_data);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: validation.message
      }, { status: 400 });
    }

    // Process face recognition
    const result = await simulateFaceRecognition(face_data, student_id);
    
    // Extract face vector for storage
    const faceVector = extractFaceVector(face_data);
    
    // Store face recognition result
    const faceRecognitionRecord = {
      id: (mockFaceRecognition.length + 1).toString(),
      student_id,
      face_vector: faceVector,
      status: result.success ? 'Matched' as const : 'Unmatched' as const,
      confidence: result.confidence
    };
    
    mockFaceRecognition.push(faceRecognitionRecord);

    return NextResponse.json({
      success: true,
      result,
      record: faceRecognitionRecord
    });

  } catch (error) {
    console.error('Face recognition error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}