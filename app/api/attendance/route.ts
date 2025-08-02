import { NextRequest, NextResponse } from 'next/server';
import { mockAttendance, mockClasses, mockActivityLogs } from '@/lib/mockData';
import { validateLocation } from '@/lib/geolocation';
import { simulateFaceRecognition, validateFaceImage } from '@/lib/faceRecognition';
import { AttendanceRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: AttendanceRequest = await request.json();
    const { student_id, class_id, location, face_data } = body;

    // Find the class
    const classData = mockClasses.find(cls => cls.id === class_id);
    if (!classData) {
      return NextResponse.json({
        success: false,
        message: 'Class not found'
      }, { status: 404 });
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
        message: 'Attendance already marked for today'
      }, { status: 409 });
    }

    // Validate location
    const locationValidation = validateLocation(
      location,
      {
        latitude: classData.location.latitude,
        longitude: classData.location.longitude
      },
      classData.location.radius
    );

    if (!locationValidation.isValid) {
      return NextResponse.json({
        success: false,
        message: locationValidation.message,
        distance: locationValidation.distance
      }, { status: 400 });
    }

    // Validate face image
    const faceValidation = validateFaceImage(face_data);
    if (!faceValidation.isValid) {
      return NextResponse.json({
        success: false,
        message: faceValidation.message
      }, { status: 400 });
    }

    // Perform face recognition
    const faceRecognitionResult = await simulateFaceRecognition(face_data, student_id);
    
    if (!faceRecognitionResult.success) {
      return NextResponse.json({
        success: false,
        message: faceRecognitionResult.message,
        faceRecognition: faceRecognitionResult
      }, { status: 400 });
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
    const activityLog = {
      id: Date.now().toString(),
      student_id,
      activity_type: 'Attendance' as const,
      time: new Date().toISOString(),
      details: `Attendance marked for ${classData.class_name}`
    };
    mockActivityLogs.push(activityLog);

    return NextResponse.json({
      success: true,
      attendance,
      message: 'Attendance marked successfully',
      faceRecognition: faceRecognitionResult,
      locationValidation
    });

  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    let filteredAttendance = mockAttendance;

    if (classId) {
      filteredAttendance = filteredAttendance.filter(att => att.class_id === classId);
    }

    if (studentId) {
      filteredAttendance = filteredAttendance.filter(att => att.student_id === studentId);
    }

    return NextResponse.json({
      success: true,
      attendance: filteredAttendance
    });

  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}