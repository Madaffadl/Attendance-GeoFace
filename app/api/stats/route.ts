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
    const lecturerId = searchParams.get('lecturerId');
    const classId = searchParams.get('classId');

    const supabase = getSupabase();

    if (lecturerId) {
      // Get stats for a specific lecturer
      
      // Get all classes for this lecturer
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('lecturer_id', lecturerId);

      if (classError) {
        console.error('Classes fetch error:', classError);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch stats'
        }, { status: 500 });
      }

      const classIds = classes?.map(c => c.id) || [];
      const totalClasses = classIds.length;

      // Get unique students enrolled in lecturer's classes
      let totalStudents = 0;
      let totalAttendance = 0;
      let totalPossibleAttendance = 0;

      if (classIds.length > 0) {
        // Count unique students
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .in('class_id', classIds);

        const uniqueStudents = new Set(enrollments?.map(e => e.student_id) || []);
        totalStudents = uniqueStudents.size;

        // Count attendance records
        const { data: attendanceRecords } = await supabase
          .from('attendance')
          .select('id, status')
          .in('class_id', classIds);

        totalAttendance = attendanceRecords?.filter(a => a.status === 'Present').length || 0;
        totalPossibleAttendance = attendanceRecords?.length || 0;
      }

      const attendanceRate = totalPossibleAttendance > 0 
        ? Math.round((totalAttendance / totalPossibleAttendance) * 100) 
        : 0;

      // Count today's classes
      const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
      const { data: allClasses } = await supabase
        .from('classes')
        .select('schedule')
        .eq('lecturer_id', lecturerId);

      const todayClasses = allClasses?.filter(cls => 
        cls.schedule.toLowerCase().includes(today.toLowerCase())
      ).length || 0;

      return NextResponse.json({
        success: true,
        stats: {
          totalClasses,
          totalStudents,
          todayClasses,
          attendanceRate,
          totalAttendance,
        }
      });

    } else if (classId) {
      // Get stats for a specific class
      
      // Count enrolled students
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id')
        .eq('class_id', classId);

      const studentCount = enrollments?.length || 0;

      // Count attendance records
      const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select('id, status')
        .eq('class_id', classId);

      const presentCount = attendanceRecords?.filter(a => a.status === 'Present').length || 0;
      const totalRecords = attendanceRecords?.length || 0;
      const attendanceRate = totalRecords > 0 
        ? Math.round((presentCount / totalRecords) * 100) 
        : 0;

      return NextResponse.json({
        success: true,
        stats: {
          studentCount,
          presentCount,
          totalRecords,
          attendanceRate,
        }
      });

    } else {
      // General stats
      const { data: students } = await supabase
        .from('students')
        .select('id');

      const { data: classes } = await supabase
        .from('classes')
        .select('id');

      const { data: lecturers } = await supabase
        .from('lecturers')
        .select('id');

      return NextResponse.json({
        success: true,
        stats: {
          totalStudents: students?.length || 0,
          totalClasses: classes?.length || 0,
          totalLecturers: lecturers?.length || 0,
        }
      });
    }

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
