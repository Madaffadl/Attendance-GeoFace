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
    const studentId = searchParams.get('studentId');

    const supabase = getSupabase();

    // Get a single student by ID with expanded stats
    if (studentId) {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error || !student) {
        console.error('Student fetch error:', error);
        return NextResponse.json({
          success: false,
          message: 'Student not found'
        }, { status: 404 });
      }

      // Get enrollment count
      const { count: classCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId);

      // Get attendance detailed history
      const { data: history } = await supabase
        .from('attendance')
        .select(`
          id,
          status,
          time,
          method,
          classes (class_name, class_code)
        `)
        .eq('student_id', studentId)
        .order('time', { ascending: false });

      // Calculate simple stats based on recorded attendance
      const totalAttendance = history?.length || 0;
      const presentCount = history?.filter((h: any) => h.status === 'Hadir').length || 0;
      // This rate is (Present / Total Records). 
      // Ideally should be (Present / Total Scheduled). But for now this shows "punctuality" of records.
      const attendanceRate = totalAttendance > 0 
        ? Math.round((presentCount / totalAttendance) * 100) 
        : 0;

      return NextResponse.json({
        success: true,
        student: {
          id: student.id,
          nim: student.nim,
          name: student.name,
          email: student.email,
          program_study: student.program_study,
          photo: student.photo,
          stats: {
            totalClasses: classCount || 0,
            totalAttendance: totalAttendance,
            attendanceRate: attendanceRate
          },
          history: history || []
        }
      });
    }

    if (lecturerId) {

      // Get classes taught by this lecturer
      const { data: lecturerClasses, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('lecturer_id', lecturerId);

      if (classError) {
        console.error('Classes fetch error:', classError);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch classes'
        }, { status: 500 });
      }

      const lecturerClassIds = lecturerClasses?.map(cls => cls.id) || [];

      if (lecturerClassIds.length === 0) {
        return NextResponse.json({
          success: true,
          students: []
        });
      }

      // Get all students enrolled in these classes
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          students (*)
        `)
        .in('class_id', lecturerClassIds);

      if (enrollError) {
        console.error('Enrollments fetch error:', enrollError);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch students'
        }, { status: 500 });
      }

      // Get unique students
      const studentsMap = new Map();
      enrollments?.forEach((enrollment: any) => {
        const student = enrollment.students;
        if (student && !studentsMap.has(student.id)) {
          studentsMap.set(student.id, {
            id: student.id,
            nim: student.nim,
            name: student.name,
            email: student.email,
            program_study: student.program_study,
            photo: student.photo
          });
        }
      });

      return NextResponse.json({
        success: true,
        students: Array.from(studentsMap.values())
      });

    } else {
      // Return all students
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) {
        console.error('Students fetch error:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch students'
        }, { status: 500 });
      }

      const students = data?.map(student => ({
        id: student.id,
        nim: student.nim,
        name: student.name,
        email: student.email,
        program_study: student.program_study,
        photo: student.photo
      })) || [];

      return NextResponse.json({
        success: true,
        students
      });
    }
  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}