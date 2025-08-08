'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { LecturerSidebar as Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  BookOpen
} from 'lucide-react';
import { Student, Attendance } from '@/types';
import { mockStudents, mockAttendance, mockClasses, mockEnrollments } from '@/lib/mockData';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function StudentDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

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

    const loadStudentData = () => {
      // Find student
      const foundStudent = mockStudents.find(s => s.id === studentId);
      if (foundStudent) {
        setStudent(foundStudent);

        // Get attendance records for this student
        const studentAttendance = mockAttendance.filter(att => att.student_id === studentId);
        setAttendanceRecords(studentAttendance);
      }

      setIsLoading(false);
    };

    loadStudentData();
  }, [router, studentId]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getStudentClasses = () => {
    const studentClassIds = mockEnrollments[studentId] || [];
    return mockClasses.filter(cls => studentClassIds.includes(cls.id));
  };

  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(att => att.status === 'Present').length;
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, rate };
  };

  const handleExportStudentData = () => {
    if (!student) return;
    
    const csvContent = [
      ['Tanggal', 'Kelas', 'Status', 'Waktu', 'Lokasi'],
      ...attendanceRecords.map(record => {
        const cls = mockClasses.find(c => c.id === record.class_id);
        return [
          new Date(record.time).toLocaleDateString('id-ID'),
          cls?.class_code || 'Unknown',
          record.status,
          new Date(record.time).toLocaleTimeString('id-ID'),
          record.location ? `${record.location.latitude}, ${record.location.longitude}` : 'N/A'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `absensi_${student.nim}_${student.name.replace(/\s+/g, '_')}.csv`;
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

  if (!user || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Mahasiswa Tidak Ditemukan</h3>
            <p className="text-gray-600">Data mahasiswa tidak dapat ditemukan.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentClasses = getStudentClasses();
  const stats = getAttendanceStats();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detail Mahasiswa</h1>
                <p className="text-gray-600">{student.name} - {student.nim}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Student Profile */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start gap-6">
                <Image
                  src={student.photo}
                  alt={student.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{student.name}</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-500" />
                      <span><strong>NIM:</strong> {student.nim}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span><strong>Email:</strong> {student.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span><strong>Program Studi:</strong> {student.program_study}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span><strong>Kelas Diambil:</strong> {studentClasses.length} kelas</span>
                    </div>
                  </div>
                </div>
                <Button onClick={handleExportStudentData} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pertemuan</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Semua kelas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hadir</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <p className="text-xs text-muted-foreground">Pertemuan hadir</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tidak Hadir</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <p className="text-xs text-muted-foreground">Pertemuan tidak hadir</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
                <Badge variant={stats.rate >= 80 ? "default" : stats.rate >= 60 ? "secondary" : "destructive"}>
                  {stats.rate}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rate}%</div>
                <p className="text-xs text-muted-foreground">Persentase kehadiran</p>
              </CardContent>
            </Card>
          </div>

          {/* Classes Enrolled */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Kelas yang Diambil</CardTitle>
              <CardDescription>Daftar kelas yang diikuti mahasiswa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentClasses.map((cls) => (
                  <div key={cls.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{cls.class_name}</h4>
                      <Badge variant="outline">{cls.class_code}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {cls.schedule}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {cls.lecturer_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Kehadiran</CardTitle>
              <CardDescription>Detail kehadiran mahasiswa per pertemuan</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Kehadiran</h3>
                  <p className="text-gray-600">Mahasiswa belum pernah melakukan absensi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendanceRecords.map((record) => {
                    const cls = mockClasses.find(c => c.id === record.class_id);
                    
                    return (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${record.status === 'Present' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <h4 className="font-medium">{cls?.class_name || 'Unknown Class'}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(record.time).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            variant={record.status === 'Present' ? "default" : "destructive"}
                            className={record.status === 'Present' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {record.status === 'Present' ? 'Hadir' : 'Tidak Hadir'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(record.time).toLocaleTimeString('id-ID')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}