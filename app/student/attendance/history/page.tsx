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

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

interface AttendanceRecord {
  id: string;
  class_name: string;
  class_code: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late';
  location: string;
}

// Mock data for demonstration
const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    class_name: 'Sistem Basis Data',
    class_code: 'CS201',
    date: '2025-12-21',
    time: '08:15',
    status: 'present',
    location: 'Kampus A',
  },
  {
    id: '2',
    class_name: 'Pemrograman Web',
    class_code: 'CS202',
    date: '2025-12-20',
    time: '10:05',
    status: 'late',
    location: 'Kampus A',
  },
  {
    id: '3',
    class_name: 'Struktur Data',
    class_code: 'CS101',
    date: '2025-12-19',
    time: '-',
    status: 'absent',
    location: '-',
  },
];

export default function AttendanceHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push(ROUTES.LOGIN);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.userType !== 'student') {
        router.push(ROUTES.LOGIN);
        return;
      }
      setUser(parsedUser);
      // Simulate loading
      setTimeout(() => {
        setAttendance(mockAttendance);
        setIsLoading(false);
      }, 500);
    } catch {
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

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
                    {new Date(record.date).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
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
