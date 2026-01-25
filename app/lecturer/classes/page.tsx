'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  Locate,
  Loader2,
} from 'lucide-react';
import { Class, ScheduleItem } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function LecturerClassesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  // Location state
  const [locationLatitude, setLocationLatitude] = useState<string>('');
  const [locationLongitude, setLocationLongitude] = useState<string>('');
  const [locationRadius, setLocationRadius] = useState<string>('100');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  // Schedule state (new format: multiple dates)
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>([]);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newScheduleStartHour, setNewScheduleStartHour] = useState('');
  const [newScheduleStartMinute, setNewScheduleStartMinute] = useState('00');
  const [newScheduleEndHour, setNewScheduleEndHour] = useState('');
  const [newScheduleEndMinute, setNewScheduleEndMinute] = useState('00');

  // Time options for dropdowns
  const hours = Array.from({ length: 15 }, (_, i) => String(i + 7).padStart(2, '0')); // 07-21
  const minutes = ['00', '15', '30', '45'];
  const router = useRouter();
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

    fetchClasses(user.id);
  }, [user, authLoading, router]);

  const fetchClasses = async (lecturerId: string) => {
    try {
      console.log('[Lecturer Classes] Fetching classes for lecturer:', lecturerId);
      const response = await fetch(`/api/classes?lecturerId=${lecturerId}`);
      const data = await response.json();
      console.log('[Lecturer Classes] API response:', data);
      
      if (data.success) {
        setClasses(data.classes);
      } else {
        console.error('[Lecturer Classes] API error:', data.message);
      }
    } catch (error) {
      console.error('[Lecturer Classes] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterClasses = useCallback(() => {
    let filtered = classes;

    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.class_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClasses(filtered);
  }, [classes, searchTerm]);

  useEffect(() => {
    filterClasses();
  }, [filterClasses]);

  // Handle getting current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser Anda.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLatitude(position.coords.latitude.toFixed(6));
        setLocationLongitude(position.coords.longitude.toFixed(6));
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError('Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.');
        setIsGettingLocation(false);
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Add schedule to list
  const handleAddSchedule = () => {
    if (!newScheduleDate || !newScheduleStartHour || !newScheduleEndHour) {
      toast({
        title: 'Field Belum Lengkap',
        description: 'Mohon lengkapi tanggal dan waktu.',
        variant: 'warning',
      });
      return;
    }

    const newScheduleStartTime = `${newScheduleStartHour}:${newScheduleStartMinute}`;
    const newScheduleEndTime = `${newScheduleEndHour}:${newScheduleEndMinute}`;

    // Validate end time is after start time
    if (newScheduleEndTime <= newScheduleStartTime) {
      toast({
        title: 'Waktu Tidak Valid',
        description: 'Waktu selesai harus setelah waktu mulai.',
        variant: 'warning',
      });
      return;
    }

    // Check for schedule conflicts (same date with overlapping times)
    const hasConflict = scheduleList.some(existing => {
      if (existing.date !== newScheduleDate) return false;
      
      // Check if time ranges overlap
      // Overlap exists if: new.start < existing.end AND new.end > existing.start
      const newStart = newScheduleStartTime;
      const newEnd = newScheduleEndTime;
      const existingStart = existing.startTime;
      const existingEnd = existing.endTime;
      
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      toast({
        title: 'Jadwal Bentrok',
        description: 'Sudah ada jadwal pada tanggal dan waktu yang sama.',
        variant: 'destructive',
      });
      return;
    }

    const newItem: ScheduleItem = {
      date: newScheduleDate,
      startTime: newScheduleStartTime,
      endTime: newScheduleEndTime,
    };

    setScheduleList([...scheduleList, newItem]);
    setNewScheduleDate('');
    setNewScheduleStartHour('');
    setNewScheduleStartMinute('00');
    setNewScheduleEndHour('');
    setNewScheduleEndMinute('00');
  };

  // Remove schedule from list
  const handleRemoveSchedule = (index: number) => {
    setScheduleList(scheduleList.filter((_, i) => i !== index));
  };

  // Format date for display
  const formatScheduleDate = (dateStr: string) => {
    // Parse YYYY-MM-DD as local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleAddClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (scheduleList.length === 0) {
      toast({
        title: 'Jadwal Kosong',
        description: 'Mohon tambahkan minimal 1 jadwal pertemuan.',
        variant: 'warning',
      });
      return;
    }

    if (!locationLatitude || !locationLongitude) {
      toast({
        title: 'Lokasi Belum Ditentukan',
        description: 'Mohon tentukan lokasi kelas.',
        variant: 'warning',
      });
      return;
    }

    setIsAddingClass(true);

    const formData = new FormData(e.currentTarget);
    // Generate summary schedule string
    const scheduleSummary = `${scheduleList.length} Pertemuan`;
    
    const classData = {
      class_code: classCodeInput, // Already uppercased by state
      class_name: formData.get('class_name') as string,
      schedule: scheduleSummary,
      schedule_details: scheduleList,
      lecturer_id: user?.id,
      location: {
        latitude: parseFloat(locationLatitude),
        longitude: parseFloat(locationLongitude),
        radius: parseInt(locationRadius) || 100,
      }
    };

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData),
      });

      const data = await response.json();

      if (data.success) {
        setClasses([...classes, data.class]);
        setIsDialogOpen(false);
        (e.target as HTMLFormElement).reset();
        // Reset all state
        setClassCodeInput('');
        setScheduleList([]);
        setLocationLatitude('');
        setLocationLongitude('');
        setLocationRadius('100');
        toast({
          title: 'Berhasil',
          description: 'Kelas berhasil dibuat',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Gagal',
          description: data.message || 'Gagal membuat kelas',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingClass(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <LayoutWrapper 
      title="Kelas Saya" 
      subtitle="Kelola semua kelas yang Anda ampu"

      breadcrumbItems={[
        { label: 'Dashboard', href: '/lecturer/dashboard' },
        { label: 'Kelas', current: true }
      ]}
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Kelola Kelas</h2>
          <p className="text-sm text-gray-600">Total {classes.length} kelas aktif</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Kelas Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Kelas Baru</DialogTitle>
              <DialogDescription>
                Buat kelas baru untuk mahasiswa bergabung.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddClass} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class_code">Kode Kelas *</Label>
                <Input
                  id="class_code"
                  name="class_code"
                  placeholder="CONTOH: CS301"
                  className="uppercase"
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                  required
                  disabled={isAddingClass}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="class_name">Nama Kelas</Label>
                <Input
                  id="class_name"
                  name="class_name"
                  placeholder="contoh: Sistem Basis Data Lanjut"
                  required
                  disabled={isAddingClass}
                />
              </div>
              
              {/* Location Section */}
              <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                <Label className="text-base font-medium">Lokasi Kelas</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetCurrentLocation}
                    disabled={isAddingClass || isGettingLocation}
                    className="flex-1"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mendapatkan Lokasi...
                      </>
                    ) : (
                      <>
                        <Locate className="mr-2 h-4 w-4" />
                        Gunakan Lokasi Saya Saat Ini
                      </>
                    )}
                  </Button>
                </div>
                {locationError && (
                  <p className="text-sm text-red-600">{locationError}</p>
                )}
                {locationLatitude && locationLongitude && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Latitude</Label>
                      <Input value={locationLatitude} readOnly className="bg-white text-xs h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Longitude</Label>
                      <Input value={locationLongitude} readOnly className="bg-white text-xs h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Radius (m)</Label>
                      <Input 
                        type="number" 
                        value={locationRadius} 
                        onChange={(e) => setLocationRadius(e.target.value)}
                        className="bg-white text-xs h-8" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule Section */}
              <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                <Label className="text-base font-medium">Jadwal Pertemuan</Label>
                
                {/* Add new schedule */}
                <div className="space-y-3">
                  {/* Date row */}
                  <div>
                    <Label className="text-xs text-gray-500">Tanggal</Label>
                    <Input
                      type="date"
                      value={newScheduleDate}
                      onChange={(e) => setNewScheduleDate(e.target.value)}
                      disabled={isAddingClass}
                      className="h-9"
                    />
                  </div>
                  
                  {/* Time row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Jam Mulai</Label>
                      <div className="flex items-center gap-1">
                        <Select value={newScheduleStartHour} onValueChange={setNewScheduleStartHour} disabled={isAddingClass}>
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Jam" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map(h => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-500 font-medium">:</span>
                        <Select value={newScheduleStartMinute} onValueChange={setNewScheduleStartMinute} disabled={isAddingClass}>
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Mnt" />
                          </SelectTrigger>
                          <SelectContent>
                            {minutes.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Jam Selesai</Label>
                      <div className="flex items-center gap-1">
                        <Select value={newScheduleEndHour} onValueChange={setNewScheduleEndHour} disabled={isAddingClass}>
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Jam" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map(h => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-500 font-medium">:</span>
                        <Select value={newScheduleEndMinute} onValueChange={setNewScheduleEndMinute} disabled={isAddingClass}>
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Mnt" />
                          </SelectTrigger>
                          <SelectContent>
                            {minutes.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSchedule}
                  disabled={isAddingClass}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Jadwal
                </Button>

                {/* Schedule list */}
                {scheduleList.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {scheduleList.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                        <div>
                          <span className="font-medium">{formatScheduleDate(item.date)}</span>
                          <span className="text-gray-500 ml-2">{item.startTime} - {item.endTime}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSchedule(index)}
                          className="text-red-600 hover:text-red-800 h-7 w-7 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {scheduleList.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">Belum ada jadwal. Tambahkan minimal 1 jadwal.</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isAddingClass}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isAddingClass || scheduleList.length === 0 || !locationLatitude}>
                  {isAddingClass ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    'Buat Kelas'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{classes.length}</div>
                <p className="text-xs text-muted-foreground">Semester ini</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {classes.reduce((total, cls) => total + (cls.student_count || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Di semua kelas</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(() => {
                    const now = new Date();
                    const todayDayName = now.toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
                    let count = 0;
                    classes.forEach((cls: any) => {
                      // Check schedule_details for specific dates
                      if (cls.schedule_details && Array.isArray(cls.schedule_details) && cls.schedule_details.length > 0) {
                        count += cls.schedule_details.filter((d: any) => {
                          const dDate = new Date(d.date);
                          return dDate.getDate() === now.getDate() &&
                                 dDate.getMonth() === now.getMonth() &&
                                 dDate.getFullYear() === now.getFullYear();
                        }).length;
                      } else if (cls.schedule?.toLowerCase().includes(todayDayName)) {
                        count++;
                      }
                    });
                    return count;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">Jadwal mengajar</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jam Mengajar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(() => {
                    // Calculate teaching hours for this month
                    const now = new Date();
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    startOfMonth.setHours(0, 0, 0, 0);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    endOfMonth.setHours(23, 59, 59, 999);
                    
                    let totalMinutes = 0;
                    
                    classes.forEach((cls: any) => {
                      if (cls.schedule_details && Array.isArray(cls.schedule_details)) {
                        cls.schedule_details.forEach((d: any) => {
                          const sessionDate = new Date(d.date);
                          if (sessionDate >= startOfMonth && sessionDate <= endOfMonth) {
                            // Parse start and end time
                            if (d.startTime && d.endTime) {
                              const [startH, startM] = d.startTime.split(':').map(Number);
                              const [endH, endM] = d.endTime.split(':').map(Number);
                              const duration = (endH * 60 + endM) - (startH * 60 + startM);
                              if (duration > 0) totalMinutes += duration;
                            } else {
                              // Default 2 hours if no time specified
                              totalMinutes += 120;
                            }
                          }
                        });
                      } else {
                        // Legacy format: assume 2 hours per class, 4 weeks per month
                        totalMinutes += 120 * 4;
                      }
                    });
                    
                    return Math.round(totalMinutes / 60);
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">Jam bulan ini</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Cari Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari berdasarkan nama kelas atau kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? <Skeleton className="h-6 w-32" /> : `Daftar Kelas (${filteredClasses.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border border-gray-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Tidak Ada Kelas Ditemukan' : 'Belum Ada Kelas'}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Mulai dengan membuat kelas pertama Anda.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredClasses.map((classItem) => {
                return (
                  <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                          <CardDescription>{classItem.class_code}</CardDescription>
                        </div>
                        <Badge variant="outline">{classItem.class_code}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {classItem.schedule}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          {classItem.student_count || 0} mahasiswa terdaftar
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          Kampus
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => router.push(`/lecturer/classes/${classItem.id}`)}
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2 flex-1"
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </Button>

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