'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  ArrowLeft,
  Download,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Class, ScheduleItem } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClassDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [classData, setClassData] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  // State for tabs
  const [activeTab, setActiveTab] = useState<'schedules' | 'students' | 'attendance'>('schedules');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

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

    fetchClassDetails();
    fetchStudents(); // Load students by default
    fetchAttendance(); // Load attendance for stats
  }, [user, authLoading, router, classId]);

  const fetchClassDetails = async () => {
    try {
      console.log('[Class Detail] Fetching class:', classId);
      const response = await fetch(`/api/classes?classId=${classId}`);
      const data = await response.json();
      
      if (data.success && data.class) {
        setClassData(data.class);
        setStudentCount(data.class.student_count || 0);
      }
    } catch (error) {
      console.error('Error fetching class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students enrolled in this class
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch(`/api/enrollments?classId=${classId}`);
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.enrollments || []);
        setStudentCount(data.enrollments?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Fetch attendance for this class
  const fetchAttendance = async () => {
    setIsLoadingAttendance(true);
    try {
      const response = await fetch(`/api/attendance?classId=${classId}`);
      const data = await response.json();
      
      if (data.success) {
        setAttendance(data.attendance || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  // Export data to CSV
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Fetch both students and attendance
      const [studentsRes, attendanceRes] = await Promise.all([
        fetch(`/api/enrollments?classId=${classId}`),
        fetch(`/api/attendance?classId=${classId}`)
      ]);
      
      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();
      
      const studentsList = studentsData.enrollments || [];
      const attendanceList = attendanceData.attendance || [];
      
      // Build CSV content
      let csv = 'Data Kelas: ' + (classData?.class_name || '') + '\n';
      csv += 'Kode Kelas: ' + (classData?.class_code || '') + '\n\n';
      
      // Students section
      csv += 'DAFTAR MAHASISWA\n';
      csv += 'No,NIM,Nama,Program Studi,Email\n';
      studentsList.forEach((enrollment: any, index: number) => {
        const s = enrollment.students;
        if (s) {
          csv += `${index + 1},${s.nim || ''},${s.name || ''},${s.program_study || ''},${s.email || ''}\n`;
        }
      });
      
      csv += '\nRIWAYAT KEHADIRAN\n';
      csv += 'Tanggal,Nama Mahasiswa,Status,Waktu\n';
      attendanceList.forEach((att: any) => {
        const date = att.time ? new Date(att.time).toLocaleDateString('id-ID') : '-';
        const time = att.time ? new Date(att.time).toLocaleTimeString('id-ID') : '-';
        csv += `${date},${att.student_name || '-'},${att.status || '-'},${time}\n`;
      });
      
      // Download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${classData?.class_code || 'class'}_data.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengexport data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <LayoutWrapper 
        title="Loading..." 
        breadcrumbItems={[
          { label: 'Dashboard', href: '/lecturer/dashboard' },
          { label: 'Kelas', href: '/lecturer/classes' },
          { label: 'Loading...', current: true }
        ]}
      >
        <div className="space-y-6 animate-pulse">
          {/* Back Button Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Class Info Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between">
                <div className="space-y-2 w-1/2">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Tabs Skeleton */}
          <div className="space-y-4">
             <div className="flex gap-2">
               <Skeleton className="h-10 w-32" />
               <Skeleton className="h-10 w-32" />
               <Skeleton className="h-10 w-32" />
             </div>
             <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!user || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Kelas Tidak Ditemukan</h3>
          <Button onClick={() => router.push('/lecturer/classes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Kelas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LayoutWrapper 
      title={classData.class_name} 
      subtitle={classData.class_code}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/lecturer/dashboard' },
        { label: 'Kelas', href: '/lecturer/classes' },
        { label: classData.class_name, current: true }
      ]}
    >
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/lecturer/classes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Class Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{classData.class_name}</CardTitle>
              <CardDescription className="text-lg">{classData.class_code}</CardDescription>
            </div>
            <Badge variant="outline" className="text-base px-4 py-2">
              {classData.schedule}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{studentCount}</p>
                <p className="text-sm text-gray-600">Mahasiswa Terdaftar</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-lg font-semibold">{classData.schedule}</p>
                <p className="text-sm text-gray-600">Jadwal Kelas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-lg font-semibold">Kampus</p>
                <p className="text-sm text-gray-600">Lokasi</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Details Card */}
      {classData.schedule_details && classData.schedule_details.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Jadwal Pertemuan ({classData.schedule_details.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {[...classData.schedule_details]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((detail: ScheduleItem, index: number) => {
                const [year, month, day] = detail.date.split('-').map(Number);
                const dateObj = new Date(year, month - 1, day, 12, 0, 0);
                const formattedDate = dateObj.toLocaleDateString('id-ID', { 
                  day: 'numeric', 
                  month: 'short'
                });
                const isPast = new Date(year, month - 1, day) < new Date(new Date().setHours(0,0,0,0));
                const isToday = new Date(year, month - 1, day).toDateString() === new Date().toDateString();
                
                return (
                  <Badge 
                    key={index} 
                    variant={isToday ? 'default' : isPast ? 'secondary' : 'outline'}
                    className={`text-xs py-1 px-2 ${
                      isToday ? 'bg-blue-600' : isPast ? '' : 'border-green-500 text-green-700'
                    }`}
                  >
                    {formattedDate} • {detail.startTime}-{detail.endTime}
                    {isToday && ' (Hari Ini)'}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {(() => {
        // Compute stats from real data
        const scheduleDetails = classData.schedule_details || [];
        const totalMeetings = scheduleDetails.length;
        
        // Calculate completed meetings (dates that have passed)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedMeetings = scheduleDetails.filter((s: ScheduleItem) => {
          const [year, month, day] = s.date.split('-').map(Number);
          const meetingDate = new Date(year, month - 1, day);
          return meetingDate < today;
        }).length;
        
        // Calculate attendance rate
        const totalAttendance = attendance.length;
        const presentCount = attendance.filter((a: any) => a.status === 'Present' || a.status === 'Late').length;
        const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
        
        // Find next meeting
        const upcomingMeetings = scheduleDetails
          .filter((s: ScheduleItem) => {
            const [year, month, day] = s.date.split('-').map(Number);
            const meetingDate = new Date(year, month - 1, day);
            return meetingDate >= today;
          })
          .sort((a: ScheduleItem, b: ScheduleItem) => a.date.localeCompare(b.date));
        
        const nextMeeting = upcomingMeetings[0];
        let nextMeetingText = 'Tidak ada';
        let nextMeetingSubtext = 'Tidak ada jadwal';
        
        if (nextMeeting) {
          const [year, month, day] = nextMeeting.date.split('-').map(Number);
          const meetingDate = new Date(year, month - 1, day, 12, 0, 0);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          const meetingDateOnly = new Date(year, month - 1, day);
          
          if (meetingDateOnly.getTime() === todayDate.getTime()) {
            nextMeetingText = 'Hari Ini';
          } else {
            nextMeetingText = meetingDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
          }
          nextMeetingSubtext = `${nextMeeting.startTime} - ${nextMeeting.endTime}`;
        }
        
        const progress = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0;

        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pertemuan</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMeetings}</div>
                <p className="text-xs text-muted-foreground">Jadwal terdaftar</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pertemuan Selesai</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedMeetings}</div>
                <p className="text-xs text-muted-foreground">{progress}% progress</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata Kehadiran</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">{presentCount} dari {totalAttendance} hadir</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pertemuan Berikutnya</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nextMeetingText}</div>
                <p className="text-xs text-muted-foreground">{nextMeetingSubtext}</p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant={activeTab === 'schedules' ? 'default' : 'outline'}
              className="flex items-center gap-2"
              onClick={() => setActiveTab('schedules')}
            >
              <Calendar className="w-4 h-4" />
              Daftar Jadwal Pertemuan
            </Button>
            <Button 
              variant={activeTab === 'students' ? 'default' : 'outline'}
              className="flex items-center gap-2"
              onClick={() => {
                setActiveTab('students');
                if (students.length === 0) fetchStudents();
              }}
            >
              <Users className="w-4 h-4" />
              Daftar Mahasiswa
            </Button>
            <Button 
              variant={activeTab === 'attendance' ? 'default' : 'outline'}
              className="flex items-center gap-2"
              onClick={() => {
                setActiveTab('attendance');
                if (attendance.length === 0) fetchAttendance();
              }}
            >
              <Clock className="w-4 h-4" />
              Riwayat Kehadiran
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'schedules' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Daftar Jadwal Pertemuan
            </CardTitle>
            <CardDescription>
              {classData?.schedule_details?.length || 0} jadwal pertemuan terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!classData?.schedule_details || classData.schedule_details.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Belum ada jadwal pertemuan</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...classData.schedule_details]
                    .sort((a: ScheduleItem, b: ScheduleItem) => a.date.localeCompare(b.date))
                    .map((detail: ScheduleItem, index: number) => {
                      const [year, month, day] = detail.date.split('-').map(Number);
                      const scheduleDate = new Date(year, month - 1, day, 12, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dateToCheck = new Date(scheduleDate);
                      dateToCheck.setHours(0, 0, 0, 0);
                      const isPast = dateToCheck < today;
                      const isToday = dateToCheck.getTime() === today.getTime();
                      
                      return (
                        <TableRow key={index} className={isPast ? 'bg-gray-50' : ''}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            {scheduleDate.toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </TableCell>
                          <TableCell>
                            {scheduleDate.toLocaleDateString('id-ID', { weekday: 'long' })}
                          </TableCell>
                          <TableCell>{detail.startTime} - {detail.endTime}</TableCell>
                          <TableCell>
                            {isToday ? (
                              <Badge className="bg-blue-100 text-blue-700">Hari Ini</Badge>
                            ) : isPast ? (
                              <Badge variant="secondary">Selesai</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">Akan Datang</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'students' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daftar Mahasiswa
            </CardTitle>
            <CardDescription>
              {students.length} mahasiswa terdaftar di kelas ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Belum ada mahasiswa terdaftar di kelas ini</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Program Studi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((enrollment, index) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{enrollment.students?.nim || '-'}</TableCell>
                      <TableCell className="font-medium">{enrollment.students?.name || '-'}</TableCell>
                      <TableCell>{enrollment.students?.email || '-'}</TableCell>
                      <TableCell>{enrollment.students?.program_study || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Riwayat Kehadiran
            </CardTitle>
            <CardDescription>
              {attendance.length} catatan kehadiran
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAttendance ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Belum ada data kehadiran untuk kelas ini</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell>
                        {att.time ? new Date(att.time).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{att.student_name || '-'}</TableCell>
                      <TableCell>
                        {att.status === 'Present' ? (
                          <Badge className="bg-green-100 text-green-700 gap-1">
                            <CheckCircle className="w-3 h-3" /> Hadir
                          </Badge>
                        ) : att.status === 'Late' ? (
                          <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                            <Clock className="w-3 h-3" /> Terlambat
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 gap-1">
                            <XCircle className="w-3 h-3" /> Tidak Hadir
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {att.time ? new Date(att.time).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </LayoutWrapper>
  );
}