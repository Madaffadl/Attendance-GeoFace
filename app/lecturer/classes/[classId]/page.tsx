'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LecturerSidebar } from '@/components/ui/sidebar';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Download, 
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Class, Student, Attendance } from '@/types';
import { mockStudents, mockEnrollments } from '@/lib/mockData';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

interface AttendanceRecord extends Attendance {
  student_name?: string;
  date: string;
}

export default function ClassDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

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
    fetchClassData();
  }, [router, classId]);

  const fetchClassData = async () => {
    try {
      // Fetch class data
      const classResponse = await fetch('/api/classes');
      const classData = await classResponse.json();
      
      if (classData.success) {
        const foundClass = classData.classes.find((cls: Class) => cls.id === classId);
        if (foundClass) {
          setClassData(foundClass);
          
          // Get enrolled students
          const enrolledStudentIds = Object.keys(mockEnrollments).filter(
            studentId => mockEnrollments[studentId].includes(classId)
          );
          const enrolledStudents = mockStudents.filter(
            student => enrolledStudentIds.includes(student.id)
          );
          setStudents(enrolledStudents);
        }
      }

      // Fetch attendance records
      const attendanceResponse = await fetch(`/api/attendance?classId=${classId}`);
      const attendanceData = await attendanceResponse.json();
      
      if (attendanceData.success) {
        const recordsWithNames = attendanceData.attendance.map((record: Attendance) => {
          const student = mockStudents.find(s => s.id === record.student_id);
          return {
            ...record,
            student_name: student?.name || 'Unknown',
            date: new Date(record.time).toISOString().split('T')[0]
          };
        });
        setAttendanceRecords(recordsWithNames);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleExportAttendance = async (date?: string) => {
    try {
      let filteredRecords = attendanceRecords;
      
      if (date) {
        filteredRecords = attendanceRecords.filter(record => record.date === date);
      }

      // Create CSV content
      const csvContent = [
        ['Tanggal', 'NIM', 'Nama Mahasiswa', 'Status', 'Waktu', 'Lokasi'],
        ...filteredRecords.map((record) => [
          record.date,
          mockStudents.find(s => s.id === record.student_id)?.nim || '',
          record.student_name,
          record.status,
          new Date(record.time).toLocaleTimeString(),
          record.location ? `${record.location.latitude}, ${record.location.longitude}` : 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = date 
        ? `absensi_${classData?.class_code}_${date}.csv`
        : `absensi_${classData?.class_code}_semua.csv`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Gagal mengexport data absensi');
    }
  };

  const getAttendanceForDate = (date: string) => {
    return attendanceRecords.filter(record => record.date === date);
  };

  const getAttendanceStatus = (studentId: string, date: string) => {
    const record = attendanceRecords.find(
      r => r.student_id === studentId && r.date === date
    );
    return record?.status || 'Absent';
  };

  const getUniqueAttendanceDates = () => {
    const dates = [...new Set(attendanceRecords.map(record => record.date))];
    return dates.sort().reverse(); // Latest first
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600">Kelas tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attendanceDates = getUniqueAttendanceDates();
  const todayAttendance = getAttendanceForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <LecturerSidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classData.class_name}</h1>
                <p className="text-gray-600">{classData.class_code} • {classData.schedule}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Class Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground">
                  Terdaftar di kelas ini
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pertemuan</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceDates.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total pertemuan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kehadiran Hari Ini</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayAttendance.length}</div>
                <p className="text-xs text-muted-foreground">
                  Dari {students.length} mahasiswa
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Class Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Informasi Kelas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm"><strong>Jadwal:</strong> {classData.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm"><strong>Dosen:</strong> {classData.lecturer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm"><strong>Lokasi:</strong> Kampus</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm"><strong>Kapasitas:</strong> {students.length} mahasiswa</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Mahasiswa</CardTitle>
                <Badge variant="secondary">{students.length} Mahasiswa</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <img 
                        src={student.photo} 
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-gray-600">NIM: {student.nim}</p>
                        <p className="text-xs text-gray-500">{student.program_study}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAttendanceStatus(student.id, selectedDate) === 'Present' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Hadir
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Tidak Hadir
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Riwayat Absensi</CardTitle>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  />
                  <Button
                    onClick={() => handleExportAttendance(selectedDate)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Hari Ini
                  </Button>
                  <Button
                    onClick={() => handleExportAttendance()}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Semua
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {attendanceDates.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Absensi</h3>
                  <p className="text-gray-600">Data absensi akan muncul setelah mahasiswa mulai absen.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendanceDates.map((date) => {
                    const dateAttendance = getAttendanceForDate(date);
                    const presentCount = dateAttendance.filter(r => r.status === 'Present').length;
                    
                    return (
                      <div key={date} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">
                              {new Date(date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {presentCount} dari {students.length} mahasiswa hadir
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={presentCount === students.length ? "default" : "secondary"}>
                              {Math.round((presentCount / students.length) * 100)}% Kehadiran
                            </Badge>
                            <Button
                              onClick={() => handleExportAttendance(date)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Export
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {dateAttendance.map((record) => (
                            <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{record.student_name}</span>
                              <Badge 
                                variant={record.status === 'Present' ? "default" : "secondary"}
                                className={record.status === 'Present' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {record.status === 'Present' ? 'Hadir' : 'Tidak Hadir'}
                              </Badge>
                            </div>
                          ))}
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