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
      let totalClasses = 0;
      let totalStudents = 0;
      let totalAttendance = 0;
      let attendanceRate = 0;

      // Try using RPC function first (fastest)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_lecturer_stats', { p_lecturer_id: lecturerId });

      if (!rpcError && rpcData && rpcData.success) {
        // Use data from RPC
        totalClasses = rpcData.stats.totalClasses;
        totalStudents = rpcData.stats.totalStudents;
        totalAttendance = rpcData.stats.totalAttendance;
        attendanceRate = rpcData.stats.attendanceRate;
      } else {
        // Fallback: Legacy manual fetch (multiple queries)
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
        totalClasses = classIds.length;

        // Get unique students enrolled in lecturer's classes
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

        attendanceRate = totalPossibleAttendance > 0 
          ? Math.round((totalAttendance / totalPossibleAttendance) * 100) 
          : 0;
      }

      // Count today's classes
      const now = new Date();
      const todayDayName = now.toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
      // YYYY-MM-DD in local time
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayDateStr = `${year}-${month}-${day}`;

      const { data: allClasses } = await supabase
        .from('classes')
        .select('schedule')
        .eq('lecturer_id', lecturerId);

      let todayClassesCount = 0;

      if (allClasses) {

        for (const cls of allClasses) {
          try {
            // Try as JSON (new format)
            const scheduleObj = JSON.parse(cls.schedule);
            let handled = false;

            if (scheduleObj.details && Array.isArray(scheduleObj.details)) {
               handled = true;
               // Count ALL sessions for today with robust Date comparison
               // Parse today items carefully matching local day/month/year
               const sessions = scheduleObj.details.filter((d: any) => {
                  const itemDate = new Date(d.date);
                  return itemDate.getDate() === now.getDate() && 
                         itemDate.getMonth() === now.getMonth() &&
                         itemDate.getFullYear() === now.getFullYear();
               });
               
               // Also check input matches if simple yyyy-mm-dd string comparison works (fallback)
               const stringMatches = scheduleObj.details.filter((d: any) => d.date === todayDateStr);
               
               // Use maximum to avoid double counting if logic overlaps, but filter is safest
               const count = Math.max(sessions.length, stringMatches.length);

               if (count > 0) {

                 todayClassesCount += count;
               }
            } else if (scheduleObj.summary) {
               handled = true;
               if (scheduleObj.summary.toLowerCase().includes(todayDayName)) {

                 todayClassesCount++;
               }
            }

            // Fallback for unknown JSON structures
            if (!handled) {
               if (cls.schedule.toLowerCase().includes(todayDayName)) {

                   todayClassesCount++;
               }
            }
          } catch {
             // Not JSON (legacy string)
             if (cls.schedule.toLowerCase().includes(todayDayName)) {

               todayClassesCount++;
             }
          }
        }

      }
      
      const todayClasses = todayClassesCount;

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
