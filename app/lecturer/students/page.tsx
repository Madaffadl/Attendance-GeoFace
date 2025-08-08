'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LecturerSidebar as Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Search,
  Users,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { Student } from '@/types';
import { mockStudents, mockEnrollments, mockClasses, mockAttendance } from '@/lib/mockData';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function StudentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
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
    loadStudents();
  }, [router]);

  const loadStudents = () => {
    // Get students enrolled in lecturer's classes
    const lecturerClasses = mockClasses.filter(cls => cls.lecturer_id === '1'); // Assuming lecturer ID 1
    const lecturerClassIds = lecturerClasses.map(cls => cls.id);
    
    const enrolledStudentIds = Object.keys(mockEnrollments).filter(studentId => 
      mockEnrollments[studentId].some(classId => lecturerClassIds.includes(classId))
    );
    
    const lecturerStudents = mockStudents.filter(student => 
      enrolledStudentIds.includes(student.id)
    );
    
    setStudents(lecturerStudents);
    setIsLoading(false);
  };

  const filterStudents = useCallback(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedProgram !== 'all') {
      filtered = filtered.filter(student => student.program_study === selectedProgram);
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, selectedProgram]);

  useEffect(() => {
    filterStudents();
  }, [filterStudents]);

  const getStudentAttendanceRate = (studentId: string) => {
    const studentAttendance = mockAttendance.filter(att => att.student_id === studentId);
    const presentCount = studentAttendance.filter(att => att.status === 'Present').length;
    const totalClasses = studentAttendance.length;
    
    if (totalClasses === 0) return 0;
    return Math.round((presentCount / totalClasses) * 100);
  };

  const getStudentClasses = (studentId: string) => {
    const studentClassIds = mockEnrollments[studentId] || [];
    return mockClasses.filter(cls => studentClassIds.includes(cls.id));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleExportStudents = () => {
    const csvContent = [
      ['NIM', 'Nama', 'Email', 'Program Studi', 'Tingkat Kehadiran'],
      ...filteredStudents.map(student => [
        student.nim,
        student.name,
        student.email,
        student.program_study,
        `${getStudentAttendanceRate(student.id)}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daftar_mahasiswa_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const programs = students
    .map(s => s.program_study)
    .filter((program, index, self) => self.indexOf(program) === index);

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Daftar Mahasiswa</h1>
                <p className="text-gray-600">Kelola dan pantau mahasiswa di kelas Anda</p>
              </div>
              <Button onClick={handleExportStudents} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground">Di semua kelas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Program Studi</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programs.length}</div>
                <p className="text-xs text-muted-foreground">Program berbeda</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kehadiran Rata-rata</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(students.reduce((acc, student) => acc + getStudentAttendanceRate(student.id), 0) / students.length || 0)}%
                </div>
                <p className="text-xs text-muted-foreground">Semua mahasiswa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Hari Ini</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockAttendance.filter(att => 
                    att.time.startsWith(new Date().toISOString().split('T')[0]) && 
                    att.status === 'Present'
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">Hadir hari ini</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari berdasarkan nama, NIM, atau email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Program</option>
                    {programs.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Mahasiswa ({filteredStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Mahasiswa</h3>
                  <p className="text-gray-600">Tidak ada mahasiswa yang sesuai dengan filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => {
                    const attendanceRate = getStudentAttendanceRate(student.id);
                    const studentClasses = getStudentClasses(student.id);
                    
                    return (
                      <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <Image
                              src={student.photo}
                              alt={student.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{student.name}</h3>
                                <Badge variant="outline">{student.nim}</Badge>
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {student.email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4" />
                                  {student.program_study}
                                </div>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  {studentClasses.length} kelas terdaftar
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="mb-2">
                              <Badge 
                                variant={attendanceRate >= 80 ? "default" : attendanceRate >= 60 ? "secondary" : "destructive"}
                                className={
                                  attendanceRate >= 80 ? "bg-green-100 text-green-800" :
                                  attendanceRate >= 60 ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }
                              >
                                {attendanceRate}% Kehadiran
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-gray-500 mb-3">
                              Kelas: {studentClasses.map(cls => cls.class_code).join(', ')}
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/lecturer/students/${student.id}`)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Detail
                            </Button>
                          </div>
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