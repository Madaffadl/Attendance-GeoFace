'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { QuickActions } from '@/components/ui/quick-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Calendar, Clock, MapPin, User, TrendingUp, BookOpen } from 'lucide-react';
import { Class } from '@/types';
import { hasFaceData, getFaceDataStats } from '@/lib/faceStorage';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
  email: string;
  program_study: string;
  photo: string;
}

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [faceRegistrationStatus, setFaceRegistrationStatus] = useState<boolean>(false);
  const [classesWithFaceStatus, setClassesWithFaceStatus] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.userType !== 'student') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchClasses(parsedUser.id);

    const hasRegisteredFace = hasFaceData(parsedUser.id);
    setFaceRegistrationStatus(hasRegisteredFace);
  }, [router]);

  const fetchClasses = async (studentId: string) => {
    try {
      const response = await fetch(`/api/classes?studentId=${studentId}`);
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleAttendClass = (classId: string) => {
    router.push(`/student/attendance/${classId}`);
  };

  if (!user) {
    return null;
  }

  const todayClasses = classes.filter(cls => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    return cls.schedule.includes(today.charAt(0).toUpperCase() + today.slice(1));
  });

  return (
    <LayoutWrapper 
      title="Dashboard" 
      subtitle={`Selamat datang kembali, ${user.name}`}
      showSearch={true}
    >
      {/* User Info Card */}
      <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4">
            <Image
              src={user.photo}
              alt={user.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-base text-gray-600 font-medium">NIM: {user.identifier}</p>
            </div>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {user.email} • {user.program_study}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Face Registration Status Alert */}
      {!faceRegistrationStatus && (
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Registrasi Wajah Diperlukan</h3>
                <p className="text-gray-600 mb-3">Anda belum mendaftarkan wajah. Silakan daftar terlebih dahulu untuk dapat melakukan absensi.</p>
                <Button
                  onClick={() => {
                    const firstClass = classes[0];
                    if (firstClass) {
                      router.push(`/student/register-face/${firstClass.id}`);
                    }
                  }}
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={classes.length === 0}
                >
                  Registrasi Wajah Sekarang
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {faceRegistrationStatus && (
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Wajah Sudah Terdaftar</h3>
                <p className="text-gray-600">Anda sudah mendaftarkan wajah dan dapat melakukan absensi untuk semua kelas.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Kelas Terdaftar</CardTitle>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900">{classes.length}</div>
            <p className="text-sm text-gray-600 mt-1">Semester ini</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Kelas Hari Ini</CardTitle>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900">{todayClasses.length}</div>
            <p className="text-sm text-gray-600 mt-1">Jadwal hari ini</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Status Registrasi Wajah</CardTitle>
            <div className={`w-12 h-12 ${faceRegistrationStatus ? 'bg-green-100' : 'bg-orange-100'} rounded-full flex items-center justify-center`}>
              <User className={`h-6 w-6 ${faceRegistrationStatus ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{faceRegistrationStatus ? 'Terdaftar' : 'Belum Terdaftar'}</div>
            <p className="text-sm text-gray-600 mt-1">
              {faceRegistrationStatus ? 'Siap untuk absensi' : 'Perlu registrasi'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions user={user} faceRegistrationStatus={faceRegistrationStatus} classes={classes} />
      </div>

      {/* Classes Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Kelas Saya</h2>
          <Badge variant="secondary" className="px-4 py-2 text-base">
            {classes.length} Kelas Terdaftar
          </Badge>
        </div>
        {classes.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-3">Belum Ada Kelas</h3>
              <p className="text-gray-600 text-lg">Anda belum terdaftar di kelas manapun.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{classItem.class_name}</CardTitle>
                      <CardDescription className="text-base">{classItem.lecturer_name}</CardDescription>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 text-sm font-semibold">{classItem.class_code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-base text-gray-600">
                      <Clock className="w-5 h-5" />
                      {classItem.schedule}
                    </div>
                    <div className="flex items-center gap-3 text-base text-gray-600">
                      <MapPin className="w-5 h-5" />
                      Lokasi Kampus
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleAttendClass(classItem.id)}
                    className="w-full h-11 font-semibold"
                    disabled={!faceRegistrationStatus}
                  >
                    {faceRegistrationStatus ? 'Tandai Kehadiran' : 'Daftar Wajah Dulu'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}