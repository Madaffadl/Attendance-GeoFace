'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Users,
  GraduationCap,
  Mail,
  Calendar,
  BookOpen,
  Filter,
  Download,
  Eye,
  Loader2
} from 'lucide-react';
import { Student, Class } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';

interface EnrolledStudent extends Student {
  class_id?: string;
  class_name?: string;
  class_code?: string;
}

export default function StudentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<EnrolledStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const router = useRouter();

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

    fetchClassesAndStudents(user.id);
  }, [user, authLoading, router]);

  const fetchClassesAndStudents = async (lecturerId: string) => {
    try {
      setIsLoading(true);
      
      // First fetch all classes for this lecturer
      const classesRes = await fetch(`/api/classes?lecturerId=${lecturerId}`);
      const classesData = await classesRes.json();
      
      if (classesData.success && classesData.classes) {
        setClasses(classesData.classes);
        
        // Fetch students from all classes
        const allStudents: EnrolledStudent[] = [];
        
        for (const cls of classesData.classes) {
          const enrollmentsRes = await fetch(`/api/enrollments?classId=${cls.id}`);
          const enrollmentsData = await enrollmentsRes.json();
          
          if (enrollmentsData.success && enrollmentsData.enrollments) {
            enrollmentsData.enrollments.forEach((enrollment: any) => {
              if (enrollment.students) {
                // Check if student already exists (might be in multiple classes)
                const existingIndex = allStudents.findIndex(s => s.id === enrollment.students.id);
                if (existingIndex === -1) {
                  allStudents.push({
                    ...enrollment.students,
                    class_id: cls.id,
                    class_name: cls.class_name,
                    class_code: cls.class_code,
                  });
                }
              }
            });
          }
        }
        
        setStudents(allStudents);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentsByClass = async (classId: string) => {
    if (classId === 'all') {
      // Refetch all students from all classes
      if (user) {
        fetchClassesAndStudents(user.id);
      }
      return;
    }
    
    setIsLoadingStudents(true);
    try {
      const enrollmentsRes = await fetch(`/api/enrollments?classId=${classId}`);
      const enrollmentsData = await enrollmentsRes.json();
      
      if (enrollmentsData.success && enrollmentsData.enrollments) {
        const classInfo = classes.find(c => c.id === classId);
        const classStudents: EnrolledStudent[] = enrollmentsData.enrollments
          .filter((e: any) => e.students)
          .map((enrollment: any) => ({
            ...enrollment.students,
            class_id: classId,
            class_name: classInfo?.class_name,
            class_code: classInfo?.class_code,
          }));
        
        setStudents(classStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
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

    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  useEffect(() => {
    filterStudents();
  }, [filterStudents]);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    fetchStudentsByClass(classId);
  };

  const handleExportStudents = () => {
    const csvContent = [
      ['NIM', 'Nama', 'Email', 'Program Studi', 'Kelas'],
      ...filteredStudents.map(student => [
        student.nim,
        student.name,
        student.email,
        student.program_study,
        student.class_name || '-',
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <LayoutWrapper title="Daftar Mahasiswa" subtitle="Kelola dan pantau mahasiswa di kelas Anda">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daftar Mahasiswa</h1>
          <p className="text-muted-foreground">Kelola dan pantau mahasiswa di kelas Anda</p>
        </div>
        <Button onClick={handleExportStudents} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedClass === 'all' ? 'Di semua kelas' : 'Di kelas ini'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Kelas Anda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hasil Pencarian</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStudents.length}</div>
            <p className="text-xs text-muted-foreground">Mahasiswa ditemukan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Dipilih</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {selectedClass === 'all' ? 'Semua' : classes.find(c => c.id === selectedClass)?.class_code || '-'}
            </div>
            <p className="text-xs text-muted-foreground">Filter aktif</p>
          </CardContent>
        </Card>
      </div>
      )}

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
            <div className="w-full md:w-64">
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.class_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Daftar Mahasiswa ({filteredStudents.length})
            {isLoadingStudents && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
               {[...Array(5)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 flex gap-4 items-center">
                     <Skeleton className="w-16 h-16 rounded-full" />
                     <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                     </div>
                  </div>
               ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Mahasiswa</h3>
              <p className="text-gray-600">
                {selectedClass === 'all' 
                  ? 'Belum ada mahasiswa yang terdaftar di kelas Anda.'
                  : 'Tidak ada mahasiswa yang terdaftar di kelas ini.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => {
                return (
                  <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Image
                          src={student.photo || '/placeholder-avatar.png'}
                          alt={student.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{student.name}</h3>
                            <Badge variant="outline">{student.nim}</Badge>
                            {student.class_code && selectedClass === 'all' && (
                              <Badge className="bg-blue-100 text-blue-700">{student.class_code}</Badge>
                            )}
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
    </LayoutWrapper>
  );
}