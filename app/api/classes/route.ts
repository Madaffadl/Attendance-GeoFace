import { NextRequest, NextResponse } from 'next/server';
import { mockClasses, mockEnrollments } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const lecturerId = searchParams.get('lecturerId');

    if (studentId) {
      // Return classes for a specific student
      const enrolledClassIds = mockEnrollments[studentId] || [];
      const studentClasses = mockClasses.filter(cls => enrolledClassIds.includes(cls.id));
      
      return NextResponse.json({
        success: true,
        classes: studentClasses
      });
    } else if (lecturerId) {
      // Return classes for a specific lecturer
      const lecturerClasses = mockClasses.filter(cls => cls.lecturer_id === lecturerId);
      
      return NextResponse.json({
        success: true,
        classes: lecturerClasses
      });
    } else {
      // Return all classes
      return NextResponse.json({
        success: true,
        classes: mockClasses
      });
    }
  } catch (error) {
    console.error('Classes fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { class_code, class_name, schedule, lecturer_id, location } = body;

    // Validate required fields
    if (!class_code || !class_name || !schedule || !lecturer_id) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Check if class code already exists
    const existingClass = mockClasses.find(cls => cls.class_code === class_code);
    if (existingClass) {
      return NextResponse.json({
        success: false,
        message: 'Class code already exists'
      }, { status: 409 });
    }

    // Create new class
    const newClass = {
      id: (mockClasses.length + 1).toString(),
      class_code,
      class_name,
      schedule,
      lecturer_id,
      location: location || {
        latitude: -6.2088,
        longitude: 106.8456,
        radius: 50
      }
    };

    mockClasses.push(newClass);

    return NextResponse.json({
      success: true,
      class: newClass,
      message: 'Class created successfully'
    });

  } catch (error) {
    console.error('Class creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}