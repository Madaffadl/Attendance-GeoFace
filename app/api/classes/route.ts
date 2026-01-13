import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const lecturerId = searchParams.get('lecturerId');
    const classId = searchParams.get('classId');

    const supabase = getSupabase();

    // Return a single class by ID
    if (classId) {
      console.log('[API] GET /api/classes - classId:', classId);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          lecturers (id, name)
        `)
        .eq('id', classId)
        .single();

      if (error || !data) {
        console.error('Class fetch error:', error);
        return NextResponse.json({
          success: false,
          message: 'Class not found'
        }, { status: 404 });
      }

      const classData = {
        id: data.id,
        class_code: data.class_code,
        class_name: data.class_name,
        schedule: data.schedule,
        lecturer_id: data.lecturer_id,
        lecturer_name: data.lecturers?.name || '',
        location: {
          latitude: parseFloat(data.location_latitude),
          longitude: parseFloat(data.location_longitude),
          radius: data.location_radius
        }
      };

      return NextResponse.json({
        success: true,
        class: classData
      });
    }

    if (studentId) {

      // Return classes for a specific student via enrollments
      console.log('[API] GET /api/classes - studentId:', studentId);
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          class_id,
          classes (
            id,
            class_code,
            class_name,
            schedule,
            lecturer_id,
            location_latitude,
            location_longitude,
            location_radius,
            lecturers (id, name)
          )
        `)
        .eq('student_id', studentId);

      console.log('[API] Enrollments found:', enrollments?.length || 0);
      
      if (enrollError) {
        console.error('Enrollment fetch error:', enrollError);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch classes'
        }, { status: 500 });
      }


      // Transform to expected format
      const classes = enrollments?.map((e: any) => {
        const cls = e.classes;
        return {
          id: cls.id,
          class_code: cls.class_code,
          class_name: cls.class_name,
          schedule: cls.schedule,
          lecturer_id: cls.lecturer_id,
          lecturer_name: cls.lecturers?.name || '',
          location: {
            latitude: parseFloat(cls.location_latitude),
            longitude: parseFloat(cls.location_longitude),
            radius: cls.location_radius
          }
        };
      }) || [];
      
      return NextResponse.json({
        success: true,
        classes
      });

    } else if (lecturerId) {
      // Return classes for a specific lecturer
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          lecturers (id, name)
        `)
        .eq('lecturer_id', lecturerId);

      if (error) {
        console.error('Classes fetch error:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch classes'
        }, { status: 500 });
      }

      const classes = data?.map((cls: any) => ({
        id: cls.id,
        class_code: cls.class_code,
        class_name: cls.class_name,
        schedule: cls.schedule,
        lecturer_id: cls.lecturer_id,
        lecturer_name: cls.lecturers?.name || '',
        location: {
          latitude: parseFloat(cls.location_latitude),
          longitude: parseFloat(cls.location_longitude),
          radius: cls.location_radius
        }
      })) || [];
      
      return NextResponse.json({
        success: true,
        classes
      });

    } else {
      // Return all classes
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          lecturers (id, name)
        `);

      if (error) {
        console.error('Classes fetch error:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch classes'
        }, { status: 500 });
      }

      const classes = data?.map((cls: any) => ({
        id: cls.id,
        class_code: cls.class_code,
        class_name: cls.class_name,
        schedule: cls.schedule,
        lecturer_id: cls.lecturer_id,
        lecturer_name: cls.lecturers?.name || '',
        location: {
          latitude: parseFloat(cls.location_latitude),
          longitude: parseFloat(cls.location_longitude),
          radius: cls.location_radius
        }
      })) || [];

      return NextResponse.json({
        success: true,
        classes
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
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { class_code, class_name, schedule, lecturer_id, location } = body;

    // Validate required fields
    if (!class_code || !class_name || !schedule || !lecturer_id) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check if class code already exists
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id')
      .eq('class_code', class_code)
      .single();

    if (existingClass) {
      return NextResponse.json({
        success: false,
        message: 'Class code already exists'
      }, { status: 409 });
    }

    // Validate lecturer exists
    const { data: lecturer, error: lecturerError } = await supabase
      .from('lecturers')
      .select('id, name')
      .eq('id', lecturer_id)
      .single();

    if (lecturerError || !lecturer) {
      return NextResponse.json({
        success: false,
        message: 'Lecturer not found'
      }, { status: 404 });
    }

    // Create new class
    const { data: newClass, error: createError } = await supabase
      .from('classes')
      .insert({
        class_code,
        class_name,
        schedule,
        lecturer_id,
        location_latitude: location?.latitude || -6.2088,
        location_longitude: location?.longitude || 106.8456,
        location_radius: location?.radius || 50
      })
      .select()
      .single();

    if (createError) {
      console.error('Class creation error:', createError);
      return NextResponse.json({
        success: false,
        message: 'Failed to create class'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      class: {
        ...newClass,
        lecturer_name: lecturer.name,
        location: {
          latitude: parseFloat(newClass.location_latitude),
          longitude: parseFloat(newClass.location_longitude),
          radius: newClass.location_radius
        }
      },
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

export async function PUT(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const body = await request.json();
    const { id, class_code, class_name, schedule, location } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Class ID is required'
      }, { status: 400 });
    }

    const supabase = getSupabase();

    const updateData: any = {};
    if (class_code) updateData.class_code = class_code;
    if (class_name) updateData.class_name = class_name;
    if (schedule) updateData.schedule = schedule;
    if (location) {
      updateData.location_latitude = location.latitude;
      updateData.location_longitude = location.longitude;
      updateData.location_radius = location.radius;
    }

    const { data: updatedClass, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        lecturers (id, name)
      `)
      .single();

    if (error) {
      console.error('Class update error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update class'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      class: {
        ...updatedClass,
        lecturer_name: (updatedClass.lecturers as any)?.name || '',
        location: {
          latitude: parseFloat(updatedClass.location_latitude),
          longitude: parseFloat(updatedClass.location_longitude),
          radius: updatedClass.location_radius
        }
      },
      message: 'Class updated successfully'
    });

  } catch (error) {
    console.error('Class update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not configured' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Class ID is required'
      }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Class delete error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete class'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Class delete error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}