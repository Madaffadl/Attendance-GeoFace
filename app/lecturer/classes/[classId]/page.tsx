'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  ArrowLeft,
  User,
  Mail,
  GraduationCap,
  Download,
  BookOpen,
  Users
} from 'lucide-react';
import { Student, Attendance, Class } from '@/types';
import { mockStudents, mockAttendance, mockClasses, mockEnrollments } from '@/lib/mockData';

interface AuthUser {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function ClassDetailPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  useEffect(() => {
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

    const loadClassData = () => {
      const foundClass = mockClasses.find(c => c.id === classId);
      if (foundClass) {
        setClassData(foundClass);

        const enrolledStudentIds = Object.keys(mockEnrollments).filter(studentId =>
          mockEnrollments[studentId].includes(classId)
        );
        const classStudents = mockStudents.filter(student =>
          enrolledStudentIds.includes(student.id)
        );
        setStudents(classStudents);

        const classAttendance = mockAttendance.filter(att => att.class_id === classId);
        setAttendance(classAttendance);
      }

      setIsLoading(false);
    };

    loadClassData();
  }, [router, classId]);

  const getStudentAttendanceRate = (studentId: string) => {
    const studentAttendance = attendance.filter(att => att.student_id === studentId);
    const presentCount = studentAttendance.filter(att => att.status === 'Present').length;
    const totalSessions = new Set(attendance.map(a => a.time.split('T')[0])).size;
    
    if (totalSessions === 0) return 0;
    return Math.round((presentCount / totalSessions) * 100);
  };

  const handleExportClassData = () => {
    if (!classData) return;
    
    const csvContent = [
      ['NIM', 'Nama', 'Email', 'Tingkat Kehadiran'],
      ...students.map(student => [
        student.nim,
        student.name,
        student.email,
        `${getStudentAttendanceRate(student.id)}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daftar_mahasiswa_${classData.class_code}.csv`;
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

  if (!user || !classData) {
    return (
      <LayoutWrapper title="Error" subtitle="Kelas tidak ditemukan">
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kelas Tidak Ditemukan</h3>
            <p className="text-gray-600">Data kelas tidak dapat ditemukan.</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </CardContent>
        </Card>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      title={classData.class_name}
      subtitle={`${classData.class_code} - ${classData.schedule}`}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/lecturer/dashboard' },
        { label: 'Kelas', href: '/lecturer/classes' },
        { label: classData.class_name, current: true }
      ]}
    >
        <div className="flex justify-end mb-4">
            <Button onClick={handleExportClassData} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
        </div>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Mahasiswa ({students.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Mahasiswa</h3>
                  <p className="text-gray-600">Belum ada mahasiswa yang terdaftar di kelas ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => {
                    const attendanceRate = getStudentAttendanceRate(student.id);
                    
                    return (
                      <Card key={student.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/lecturer/students/${student.id}`)}
                            >
                              Lihat Detail
                            </Button>
                          </div>
                        </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
    </LayoutWrapper>
  );
}