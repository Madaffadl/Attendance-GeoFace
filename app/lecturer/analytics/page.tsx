'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppSection } from '@/components/ui/AppSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  Download,
  Filter,
} from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

// Mock data for demonstration
const mockStats = {
  totalClasses: 5,
  totalStudents: 127,
  averageAttendance: 87.5,
  attendanceChange: 2.3,
  todayAttendance: 42,
  weeklyAttendance: [85, 88, 82, 90, 87, 91, 88],
};

export default function LecturerAnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push(ROUTES.LOGIN);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.userType !== 'lecturer') {
        router.push(ROUTES.LOGIN);
        return;
      }
      setUser(parsedUser);
      // Simulate loading
      setTimeout(() => setIsLoading(false), 500);
    } catch {
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  if (!user) return null;

  return (
    <LayoutWrapper title="Analitik" subtitle="Statistik dan analisis kehadiran">
      <PageHeader
        title="Analitik Kehadiran"
        subtitle="Lihat statistik dan tren kehadiran mahasiswa"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.LECTURER.DASHBOARD },
          { label: 'Analitik', current: true },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-4 w-20" />
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">Semester ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Di semua kelas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata Kehadiran</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.averageAttendance}%</div>
                <div className="flex items-center gap-1 text-xs">
                  {mockStats.attendanceChange >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-success">+{mockStats.attendanceChange}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-destructive" />
                      <span className="text-destructive">{mockStats.attendanceChange}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground">dari minggu lalu</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kehadiran Hari Ini</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.todayAttendance}</div>
                <p className="text-xs text-muted-foreground">Mahasiswa hadir</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <AppSection title="Tren Kehadiran Mingguan" description="Persentase kehadiran 7 hari terakhir">
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Grafik kehadiran mingguan</p>
                  <p className="text-xs text-muted-foreground">(Memerlukan integrasi chart library)</p>
                </div>
              </div>
            </AppSection>

            <AppSection title="Distribusi Kehadiran per Kelas" description="Perbandingan kehadiran antar kelas">
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Grafik distribusi per kelas</p>
                  <p className="text-xs text-muted-foreground">(Memerlukan integrasi chart library)</p>
                </div>
              </div>
            </AppSection>
          </div>

          {/* TODO Section */}
          <Card className="border-dashed">
            <CardContent className="py-6">
              <h4 className="font-medium mb-2">🚧 Fitur dalam Pengembangan</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Grafik interaktif dengan Recharts / Chart.js</li>
                <li>• Filter berdasarkan rentang tanggal</li>
                <li>• Laporan kehadiran per mahasiswa</li>
                <li>• Export laporan ke PDF / Excel</li>
                <li>• Prediksi kehadiran dengan machine learning</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </LayoutWrapper>
  );
}
