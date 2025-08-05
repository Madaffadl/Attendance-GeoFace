'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Download,
  TrendingUp,
  Users,
  Calendar,
  BookOpen,
  FileText,
  Filter,
  Eye
} from 'lucide-react';
import { mockClasses, mockAttendance, mockStudents, mockEnrollments } from '@/lib/mockData';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedClass, setSelectedClass] = useState('all');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.userType !== 'lecturer') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Get lecturer's classes
  const lecturerClasses = mockClasses.filter(cls => cls.lecturer_id === '1');
  const lecturerClassIds = lecturerClasses.map(cls => cls.id);

  // Get attendance data for lecturer's classes
  const lecturerAttendance = mockAttendance.filter(att => 
    lecturerClassIds.includes(att.class_id)
  );

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    const totalSessions = lecturerAttendance.length;
    const presentSessions = lecturerAttendance.filter(att => att.status === 'Present').length;
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
    return lecturerClasses.map(cls => {
      const classAttendance = lecturerAttendance.filter(att => att.class_id === cls.id);
      const present = classAttendance.filter(att => att.status === 'Present').length;
      const total = classAttendance.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        name: cls.class_code,
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
      const dateStr = date.toISOString().split('T')[0];
      
      const dayAttendance = lecturerAttendance.filter(att => 
        att.time.startsWith(dateStr)
      );
      
      const present = dayAttendance.filter(att => att.status === 'Present').length;
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
  const getStudentPerformance = () => {
    const enrolledStudentIds = Object.keys(mockEnrollments).filter(studentId => 
      mockEnrollments[studentId].some(classId => lecturerClassIds.includes(classId))
    );

    return enrolledStudentIds.map(studentId => {
      const student = mockStudents.find(s => s.id === studentId);
      const studentAttendance = lecturerAttendance.filter(att => att.student_id === studentId);
      const present = studentAttendance.filter(att => att.status === 'Present').length;
      const total = studentAttendance.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        id: studentId,
        name: student?.name || 'Unknown',
        nim: student?.nim || 'Unknown',
        present,
        total,
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
          ['Tanggal', 'Kelas', 'Mahasiswa', 'Status', 'Waktu'],
          ...lecturerAttendance.map(att => {
            const student = mockStudents.find(s => s.id === att.student_id);
            const cls = mockClasses.find(c => c.id === att.class_id);
            return [
              new Date(att.time).toLocaleDateString('id-ID'),
              cls?.class_code || 'Unknown',
              student?.name || 'Unknown',
              att.status,
              new Date(att.time).toLocaleTimeString('id-ID')
            ];
          })
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
          ['Kode Kelas', 'Hadir', 'Tidak Hadir', 'Total', 'Persentase'],
          ...classData.map(cls => [
            cls.name,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = getAttendanceStats();
  const classData = getAttendanceByClass();
  const trendData = getAttendanceTrend();
  const studentPerformance = getStudentPerformance();

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Laporan & Analisis</h1>
                <p className="text-gray-600">Analisis kehadiran dan performa mahasiswa</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Minggu Ini</option>
                  <option value="month">Bulan Ini</option>
                  <option value="semester">Semester Ini</option>
                </select>
                <Button className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Semua
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Stats Overview */}
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
                <div className="text-2xl font-bold">{lecturerClasses.length}</div>
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
                <div className="text-2xl font-bold">{studentPerformance.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total terdaftar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Attendance by Class */}
            <Card>
              <CardHeader>
                <CardTitle>Kehadiran per Kelas</CardTitle>
                <CardDescription>Perbandingan tingkat kehadiran antar kelas</CardDescription>
              </CardHeader>
              <CardContent>
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

          {/* Export Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExportReport('attendance')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Laporan Absensi
                </CardTitle>
                <CardDescription>Export data absensi lengkap</CardDescription>
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
                <CardDescription>Performa kehadiran mahasiswa</CardDescription>
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
                <CardDescription>Statistik per kelas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Student Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performa Mahasiswa</CardTitle>
              <CardDescription>Ranking kehadiran mahasiswa di semua kelas</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}