'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppSection } from '@/components/ui/AppSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Download, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AttendanceRecord {
  id: string;
  class_name: string;
  class_code: string;
  date: string;
  time: string;
  status: string;
  location: string;
}

export default function AttendanceHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (user.userType !== 'student') {
      router.push(ROUTES.LOGIN);
      return;
    }

    fetchAttendanceHistory(user.id);
  }, [user, authLoading, router]);

  const fetchAttendanceHistory = async (studentId: string) => {
    try {
      const response = await fetch(`/api/attendance?studentId=${studentId}`);
      const data = await response.json();
      
      if (data.success && data.attendance) {
        const transformedData = data.attendance.map((record: any) => {
          // Use recorded_at from database
          const timestamp = record.recorded_at || record.time;
          
          // Parse date
          let dateStr = '-';
          let timeStr = '-';
          if (timestamp) {
            const dateObj = new Date(timestamp);
            if (dateObj.toString() !== 'Invalid Date') {
              dateStr = dateObj.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              });
              timeStr = dateObj.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
            }
          }
          
          return {
            id: record.id,
            class_name: record.classes?.class_name || '-',
            class_code: record.classes?.class_code || '-',
            date: dateStr,
            time: timeStr,
            status: record.status?.toLowerCase() || 'absent',
            location: record.location?.latitude && record.location?.longitude 
              ? `${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(4)}`
              : '-'
          };
        });
        setAttendance(transformedData);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch =
      record.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.class_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Hadir
          </Badge>
        );
      case 'late':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Terlambat
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Tidak Hadir
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) return null;

  return (
    <LayoutWrapper title="Riwayat Absensi" subtitle="Lihat catatan kehadiran Anda">
      <PageHeader
        title="Riwayat Absensi"
        subtitle="Lihat rekap kehadiran Anda di semua kelas"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
          { label: 'Absensi', href: ROUTES.STUDENT.ATTENDANCE },
          { label: 'Riwayat', current: true },
        ]}
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      <AppSection
        title="Catatan Kehadiran"
        description="Riwayat absensi Anda di semua kelas"
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="present">Hadir</SelectItem>
                <SelectItem value="late">Terlambat</SelectItem>
                <SelectItem value="absent">Tidak Hadir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : filteredAttendance.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Tidak Ada Riwayat"
            description="Belum ada catatan kehadiran yang ditemukan."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.date}
                  </TableCell>
                  <TableCell>{record.class_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.class_code}</Badge>
                  </TableCell>
                  <TableCell>{record.time}</TableCell>
                  <TableCell>{record.location}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AppSection>
    </LayoutWrapper>
  );
}
