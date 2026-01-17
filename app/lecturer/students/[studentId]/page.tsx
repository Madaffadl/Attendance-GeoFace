'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Mail,
  GraduationCap,
  User,
  Calendar,
  BookOpen
} from 'lucide-react';
import { Student } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface StudentDetail extends Student {
  stats: {
    totalClasses: number;
    totalAttendance: number;
    attendanceRate: number;
  };
  history: any[];
}
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function StudentDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

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

    fetchStudentDetails();
  }, [user, authLoading, router, studentId]);

  const fetchStudentDetails = async () => {
    try {
      console.log('[Student Detail] Fetching student:', studentId);
      const response = await fetch(`/api/students?studentId=${studentId}`);
      const data = await response.json();
      
      if (data.success && data.student) {
        setStudent(data.student);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Mahasiswa Tidak Ditemukan</h3>
          <Button onClick={() => router.push('/lecturer/students')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Mahasiswa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LayoutWrapper 
      title={student.name} 
      subtitle={student.nim}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/lecturer/dashboard' },
        { label: 'Mahasiswa', href: '/lecturer/students' },
        { label: student.name, current: true }
      ]}
    >
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/lecturer/students')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Student Profile Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Image
              src={student.photo || '/placeholder-avatar.png'}
              alt={student.name}
              width={128}
              height={128}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <Badge variant="outline" className="text-base">{student.nim}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <GraduationCap className="w-5 h-5" />
                  <span>{student.program_study}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kehadiran</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.stats.totalAttendance}</div>
            <p className="text-xs text-muted-foreground">Kali hadir</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Persentase kehadiran</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Terdaftar</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Kelas aktif diambil</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Aktif</div>
            <p className="text-xs text-muted-foreground">Mahasiswa aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kehadiran</CardTitle>
          <CardDescription>Daftar kehadiran mahasiswa di kelas Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {student.history.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kelas</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Waktu</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Metode</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {student.history.map((record: any) => (
                    <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        {record.classes?.class_name} <span className="text-xs text-muted-foreground">({record.classes?.class_code})</span>
                      </td>
                      <td className="p-4 align-middle">
                        {new Date(record.time).toLocaleDateString('id-ID', {
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 align-middle capitalize">{record.method}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={record.status === 'Hadir' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Belum ada riwayat kehadiran</p>
            </div>
          )}
        </CardContent>
      </Card>
    </LayoutWrapper>
  );
}