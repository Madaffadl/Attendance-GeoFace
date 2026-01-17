'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Download,
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  Loader2
} from 'lucide-react';
import { Class } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  status: string;
  time: string;
  students?: {
    id: string;
    name: string;
    nim: string;
  };
  classes?: {
    class_code: string;
    class_name: string;
  };
}

interface StudentPerformance {
  id: string;
  name: string;
  nim: string;
  present: number;
  total: number;
  rate: number;
  status: string;
}

export default function ReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.userType !== 'lecturer') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, authLoading, router]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch all classes for this lecturer
      const classesRes = await fetch(`/api/classes?lecturerId=${user.id}`);
      const classesData = await classesRes.json();
      
      if (classesData.success && classesData.classes) {
        setClasses(classesData.classes);
        
        // Fetch attendance and enrollments for all classes
        const allAttendance: AttendanceRecord[] = [];
        const allEnrollments: any[] = [];
        
        for (const cls of classesData.classes) {
          // Fetch attendance
          const attRes = await fetch(`/api/attendance?classId=${cls.id}`);
          const attData = await attRes.json();
          if (attData.success && attData.attendance) {
            allAttendance.push(...attData.attendance);
          }
          
          // Fetch enrollments
          const enrollRes = await fetch(`/api/enrollments?classId=${cls.id}`);
          const enrollData = await enrollRes.json();
          if (enrollData.success && enrollData.enrollments) {
            allEnrollments.push(...enrollData.enrollments);
          }
        }
        setAttendance(allAttendance);
        
        // Get unique students from enrollments
        const uniqueStudents = new Map();
        allEnrollments.forEach(enrollment => {
          if (enrollment.students) {
            uniqueStudents.set(enrollment.students.id, enrollment.students);
          }
        });
        setEnrolledStudents(Array.from(uniqueStudents.values()));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter attendance based on selected period
  const getFilteredAttendance = () => {
    const now = new Date();
    
    return attendance.filter(att => {
      if (!att.time) return false;
      const attDate = new Date(att.time);
      
      switch (selectedPeriod) {
        case 'week': {
          // Get start of current week (Monday)
          const startOfWeek = new Date(now);
          const day = startOfWeek.getDay();
          const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          return attDate >= startOfWeek;
        }
        case 'month': {
          // Get start of current month
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          return attDate >= startOfMonth;
        }
        case 'semester': {
          // Assume semester is 6 months
          const startOfSemester = new Date(now);
          startOfSemester.setMonth(startOfSemester.getMonth() - 6);
          startOfSemester.setHours(0, 0, 0, 0);
          return attDate >= startOfSemester;
        }
        default:
          return true;
      }
    });
  };

  // Get filtered attendance
  const filteredAttendance = getFilteredAttendance();

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    const totalSessions = filteredAttendance.length;
    const presentSessions = filteredAttendance.filter(att => 
      att.status === 'Present' || att.status === 'Late'
    ).length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    return {
      totalSessions,
      presentSessions,
      absentSessions: totalSessions - presentSessions,
      attendanceRate
    };
  };

  // Get attendance by class
  const getAttendanceByClass = () => {
    return classes.map(cls => {
      const classAttendance = filteredAttendance.filter(att => att.class_id === cls.id);
      const present = classAttendance.filter(att => 
        att.status === 'Present' || att.status === 'Late'
      ).length;
      const total = classAttendance.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        name: cls.class_code,
        fullName: cls.class_name,
        present,
        absent: total - present,
        rate,
        total
      };
    });
  };

  // Get attendance trend over time
  const getAttendanceTrend = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayAttendance = attendance.filter(att => 
        att.time && att.time.startsWith(dateStr)
      );
      
      const present = dayAttendance.filter(att => 
        att.status === 'Present' || att.status === 'Late'
      ).length;
      const total = dayAttendance.length;
      
      last7Days.push({
        date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        present,
        absent: total - present,
        rate: total > 0 ? Math.round((present / total) * 100) : 0
      });
    }
    return last7Days;
  };

  // Get student performance
  const getStudentPerformance = (): StudentPerformance[] => {
    const studentMap = new Map<string, { name: string; nim: string; present: number; total: number }>();
    
    filteredAttendance.forEach(att => {
      if (!att.students) return;
      
      const studentId = att.student_id;
      const existing = studentMap.get(studentId) || {
        name: att.students.name,
        nim: att.students.nim,
        present: 0,
        total: 0
      };
      
      existing.total += 1;
      if (att.status === 'Present' || att.status === 'Late') {
        existing.present += 1;
      }
      
      studentMap.set(studentId, existing);
    });
    
    return Array.from(studentMap.entries()).map(([id, data]) => {
      const rate = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
      return {
        id,
        name: data.name,
        nim: data.nim,
        present: data.present,
        total: data.total,
        rate,
        status: rate >= 80 ? 'Baik' : rate >= 60 ? 'Cukup' : 'Kurang'
      };
    }).sort((a, b) => b.rate - a.rate);
  };

  const handleExportReport = (type: string) => {
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'attendance':
        csvContent = [
          ['Tanggal', 'Kelas', 'Mahasiswa', 'NIM', 'Status', 'Waktu'],
          ...attendance.map(att => [
            att.time ? new Date(att.time).toLocaleDateString('id-ID') : '-',
            att.classes?.class_code || '-',
            att.students?.name || '-',
            att.students?.nim || '-',
            att.status,
            att.time ? new Date(att.time).toLocaleTimeString('id-ID') : '-'
          ])
        ].map(row => row.join(',')).join('\n');
        filename = 'laporan_absensi.csv';
        break;

      case 'students':
        const studentPerf = getStudentPerformance();
        csvContent = [
          ['NIM', 'Nama', 'Hadir', 'Total', 'Persentase', 'Status'],
          ...studentPerf.map(student => [
            student.nim,
            student.name,
            student.present,
            student.total,
            `${student.rate}%`,
            student.status
          ])
        ].map(row => row.join(',')).join('\n');
        filename = 'laporan_mahasiswa.csv';
        break;

      case 'classes':
        const classData = getAttendanceByClass();
        csvContent = [
          ['Kode Kelas', 'Nama Kelas', 'Hadir', 'Tidak Hadir', 'Total', 'Persentase'],
          ...classData.map(cls => [
            cls.name,
            cls.fullName,
            cls.present,
            cls.absent,
            cls.total,
            `${cls.rate}%`
          ])
        ].map(row => row.join(',')).join('\n');
        filename = 'laporan_kelas.csv';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const stats = getAttendanceStats();
  const classData = getAttendanceByClass();
  const trendData = getAttendanceTrend();
  const studentPerformance = getStudentPerformance();

  return (
    <LayoutWrapper title="Laporan & Analisis" subtitle="Analisis kehadiran dan performa mahasiswa">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan & Analisis</h1>
          <p className="text-muted-foreground">Analisis kehadiran dan performa mahasiswa</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="semester">Semester Ini</option>
          </select>
          <Button 
            className="flex items-center gap-2"
            onClick={() => handleExportReport('attendance')}
          >
            <Download className="w-4 h-4" />
            Export Semua
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-16 mb-2"/>
                  <Skeleton className="h-4 w-24"/>
                </CardContent>
              </Card>
           ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kehadiran</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentSessions}</div>
            <p className="text-xs text-muted-foreground">
              Dari {stats.totalSessions} sesi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata semua kelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Aktif</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">
              Semester ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mahasiswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Total terdaftar
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Charts Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
           <Card>
             <CardHeader><Skeleton className="h-6 w-48 mb-2"/><Skeleton className="h-4 w-64"/></CardHeader>
             <CardContent className="h-[300px] flex items-center justify-center"><Skeleton className="w-full h-full rounded-md"/></CardContent>
           </Card>
           <Card>
             <CardHeader><Skeleton className="h-6 w-48 mb-2"/><Skeleton className="h-4 w-64"/></CardHeader>
             <CardContent className="h-[300px] flex items-center justify-center"><Skeleton className="w-full h-full rounded-md"/></CardContent>
           </Card>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance by Class */}
        <Card>
          <CardHeader>
            <CardTitle>Kehadiran per Kelas</CardTitle>
            <CardDescription>Perbandingan tingkat kehadiran antar kelas</CardDescription>
          </CardHeader>
          <CardContent>
            {classData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Belum ada data kehadiran
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="present" fill="#3B82F6" name="Hadir" />
                  <Bar dataKey="absent" fill="#EF4444" name="Tidak Hadir" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Kehadiran 7 Hari Terakhir</CardTitle>
            <CardDescription>Perkembangan tingkat kehadiran harian</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2} name="Tingkat Kehadiran %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Export Buttons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-32 mb-2"/><Skeleton className="h-4 w-48"/></CardHeader>
                <CardContent><Skeleton className="h-10 w-full"/></CardContent>
              </Card>
           ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExportReport('attendance')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Laporan Absensi
            </CardTitle>
            <CardDescription>Export data absensi lengkap ({attendance.length} record)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExportReport('students')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Laporan Mahasiswa
            </CardTitle>
            <CardDescription>Performa kehadiran mahasiswa ({studentPerformance.length} mahasiswa)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExportReport('classes')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Laporan Kelas
            </CardTitle>
            <CardDescription>Statistik per kelas ({classes.length} kelas)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Student Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performa Mahasiswa</CardTitle>
          <CardDescription>Ranking kehadiran mahasiswa di semua kelas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
               {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex gap-4 items-center">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                          </div>
                      </div>
                      <Skeleton className="h-8 w-24" />
                  </div>
               ))}
            </div>
          ) : studentPerformance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada data performa mahasiswa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentPerformance.slice(0, 10).map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-gray-600">NIM: {student.nim}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{student.present}/{student.total}</p>
                      <p className="text-xs text-gray-600">Hadir/Total</p>
                    </div>
                    <Badge 
                      variant={student.rate >= 80 ? "default" : student.rate >= 60 ? "secondary" : "destructive"}
                      className={
                        student.rate >= 80 ? "bg-green-100 text-green-800" :
                        student.rate >= 60 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }
                    >
                      {student.rate}%
                    </Badge>
                    <Badge variant="outline">
                      {student.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </LayoutWrapper>
  );
}