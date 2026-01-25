import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Helper function to parse schedule data (handles both legacy string and new JSON format)
function parseScheduleData(scheduleRaw: string): { schedule: string; schedule_details: any[] } {
  try {
    const scheduleObj = JSON.parse(scheduleRaw);
    return {
      schedule: scheduleObj.summary || scheduleRaw,
      schedule_details: scheduleObj.details || []
    };
  } catch {
    // Not JSON, use as-is (legacy format)
    return { schedule: scheduleRaw, schedule_details: [] };
  }
}

// Helper to transform class data from DB to API response
function transformClassData(cls: any, attendanceMap?: Set<string>): any {
  if (!cls) return null;
  
  const { schedule, schedule_details } = parseScheduleData(cls.schedule || '');
  return {
    id: cls.id,
    class_code: cls.class_code,
    class_name: cls.class_name,
    schedule,
    schedule_details,
    lecturer_id: cls.lecturer_id,
    lecturer_name: cls.lecturers?.name || '',
    student_count: cls.student_count,
    location: {
      latitude: cls.location_latitude ? parseFloat(cls.location_latitude) : 0,
      longitude: cls.location_longitude ? parseFloat(cls.location_longitude) : 0,
      radius: cls.location_radius || 100
    },
    has_attended_today: attendanceMap ? attendanceMap.has(cls.id) : false
  };
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
    const studentId = searchParams.get('studentId');
    const lecturerId = searchParams.get('lecturerId');
    const classId = searchParams.get('classId');

    const supabase = getSupabase();

    // Return a single class by ID
    if (classId) {
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          lecturers (id, name),
          enrollments (count)
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

      // If studentId is also present, check single class attendance? 
      // User flow usually fetches list, but let's be safe.
      // For now, keep single class simple or check if needed.
      // Actually, dashboard uses list. Let's focus on list.
      
      let hasAttended = false;
      if (studentId) {
         const todayStart = new Date();
         todayStart.setHours(0,0,0,0);
         const todayEnd = new Date();
         todayEnd.setHours(23,59,59,999);
         
         const { data: att } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .gte('time', todayStart.toISOString())
            .lte('time', todayEnd.toISOString())
            .maybeSingle();
         
         if (att) hasAttended = true;
      }

      const classData = transformClassData(data);
      classData.has_attended_today = hasAttended;
      // Add student count from aggregation
      classData.student_count = data.enrollments?.[0]?.count || 0;

      return NextResponse.json({
        success: true,
        class: classData
      });
    }

    if (studentId) {

      // Return classes for a specific student via enrollments
      
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

      
      if (enrollError) {
        console.error('Enrollment fetch error:', enrollError);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch classes'
        }, { status: 500 });
      }

      // Fetch today's attendance for this student to mark "done" classes
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('class_id')
        .eq('student_id', studentId)
        .gte('time', todayStart.toISOString())
        .lte('time', todayEnd.toISOString());
      
      const attendedClassIds = new Set(attendanceData?.map((a: any) => a.class_id) || []);

      // Transform to expected format
      const classes = enrollments?.map((e: any) => transformClassData(e.classes, attendedClassIds)) || [];
      
      return NextResponse.json({
        success: true,
        classes
      });

    } else if (lecturerId) {
      // Return classes for a specific lecturer with student count
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          lecturers (id, name),
          enrollments (count)
        `)
        .eq('lecturer_id', lecturerId);

      if (error) {
        console.error('Classes fetch error:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch classes'
        }, { status: 500 });
      }

      const classes = data?.map((cls: any) => {
        const transformed = transformClassData(cls);
        // Fix student_count from enrollments aggregate
        return {
          ...transformed,
          student_count: cls.enrollments?.[0]?.count || 0
        };
      }) || [];
      
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

      const classes = data?.map((cls: any) => transformClassData(cls)) || [];

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
    let { class_code, class_name, schedule, schedule_details, lecturer_id, location } = body;

    // Enforce uppercase
    if (class_code) class_code = class_code.toUpperCase();

    // Validate required fields
    if (!class_code || !class_name || !lecturer_id) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate that we have schedule info
    if (!schedule && (!schedule_details || schedule_details.length === 0)) {
      return NextResponse.json({
        success: false,
        message: 'Schedule is required'
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check if class code already exists
    const { data: existingClass, error: existingError } = await supabase
      .from('classes')
      .select('id')
      .eq('class_code', class_code)
      .maybeSingle();

    // Only fail if class actually exists (not on query error for no results)
    if (existingClass) {
      return NextResponse.json({
        success: false,
        message: 'Kode kelas sudah digunakan'
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

    // Prepare schedule data - store schedule_details as JSON string in schedule column
    // IMPORTANT: Database column 'schedule' must be TEXT type (not VARCHAR(100))
    let scheduleData = schedule || '';
    if (schedule_details && schedule_details.length > 0) {
      scheduleData = JSON.stringify({
        summary: schedule || `${schedule_details.length} Pertemuan`,
        details: schedule_details
      });
    }

    // Create new class
    const { data: newClass, error: createError } = await supabase
      .from('classes')
      .insert({
        class_code,
        class_name,
        schedule: scheduleData,
        lecturer_id,
        location_latitude: location?.latitude || -6.2088,
        location_longitude: location?.longitude || 106.8456,
        location_radius: location?.radius || 100
      })
      .select()
      .single();

    if (createError) {
      console.error('Class creation error:', createError);
      console.error('Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });
      return NextResponse.json({
        success: false,
        message: `Failed to create class: ${createError.message || 'Unknown error'}`
      }, { status: 500 });
    }

    // Parse schedule back for response
    let parsedSchedule = newClass.schedule;
    let parsedScheduleDetails: any[] = [];
    try {
      const scheduleObj = JSON.parse(newClass.schedule);
      if (scheduleObj.summary) {
        parsedSchedule = scheduleObj.summary;
        parsedScheduleDetails = scheduleObj.details || [];
      }
    } catch {
      // Not JSON, use as-is (legacy format)
    }

    return NextResponse.json({
      success: true,
      class: {
        ...newClass,
        schedule: parsedSchedule,
        schedule_details: parsedScheduleDetails,
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
        message: `Failed to update class: ${error.message || 'Unknown error'}`
      }, { status: 500 });
    }

    // Use transformClassData to properly parse schedule_details
    const transformedClass = transformClassData(updatedClass);

    return NextResponse.json({
      success: true,
      class: transformedClass,
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