'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  CalendarIcon,
  Loader2
} from 'lucide-react';
import { Class, ScheduleItem as ScheduleItemType } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Schedule item for display
interface DisplayScheduleItem {
  date: string;
  day: string;
  time: string;
  class: Class;
}

interface NewSchedule {
  classId: string;
  date: Date | undefined;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  room: string;
}

// Time options for dropdowns
const hours = Array.from({ length: 15 }, (_, i) => String(i + 7).padStart(2, '0')); // 07-21
const minuteOptions = ['00', '15', '30', '45'];

export default function SchedulePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<{
    date: Date | null;
    schedules: DisplayScheduleItem[];
  }>({ date: null, schedules: [] });
  const [newSchedule, setNewSchedule] = useState<NewSchedule>({
    classId: '',
    date: undefined,
    startHour: '08',
    startMinute: '00',
    endHour: '10',
    endMinute: '00',
    room: ''
  });
  const router = useRouter();
  const { toast } = useToast();

  // Fetch classes from API
  const fetchClasses = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/classes?lecturerId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchClasses();
    }
  }, [authLoading, user, fetchClasses]);
  
  const lecturerClasses = classes;

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Get all schedule items from all classes
  const getAllScheduleItems = (): DisplayScheduleItem[] => {
    const items: DisplayScheduleItem[] = [];
    
    // Helper to parse date string as local timezone
    const parseLocalDate = (dateStr: string): Date => {
      // Parse YYYY-MM-DD as local timezone by adding time component
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid timezone issues
    };
    
    classes.forEach(cls => {
      // Check if class has schedule_details (new format)
      if (cls.schedule_details && cls.schedule_details.length > 0) {
        cls.schedule_details.forEach((detail: ScheduleItemType) => {
          const dateObj = parseLocalDate(detail.date);
          const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
          items.push({
            date: detail.date,
            day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            time: `${detail.startTime}-${detail.endTime}`,
            class: cls
          });
        });
      } else if (cls.schedule) {
        // Fallback: try to parse old format "Senin 08:00-10:00" or JSON
        try {
          const parsed = JSON.parse(cls.schedule);
          if (parsed.details) {
            parsed.details.forEach((detail: ScheduleItemType) => {
              const dateObj = parseLocalDate(detail.date);
              const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
              items.push({
                date: detail.date,
                day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                time: `${detail.startTime}-${detail.endTime}`,
                class: cls
              });
            });
          }
        } catch {
          // Legacy format: "Senin 08:00-10:00"
          const parts = cls.schedule.split(' ');
          if (parts.length >= 2) {
            items.push({
              date: '',
              day: parts[0],
              time: parts[1] || '',
              class: cls
            });
          }
        }
      }
    });
    
    return items;
  };

  // Get schedules for a specific date
  const getScheduleForDate = (date: Date): DisplayScheduleItem[] => {
    // Format date as YYYY-MM-DD using local timezone (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    return getAllScheduleItems()
      .filter(item => {
        // Match by specific date if available
        if (item.date) {
          return item.date === dateStr;
        }
        // Match by day name for legacy format
        return item.day === dayCapitalized;
      })
      // Sort by time ascending
      .sort((a, b) => {
        const timeA = a.time.split('-')[0] || '00:00';
        const timeB = b.time.split('-')[0] || '00:00';
        return timeA.localeCompare(timeB);
      });
  };



  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  // Get all days in a month for calendar view
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Monday of the week containing the first day
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);
    
    // Generate 6 weeks (42 days) to cover all possible month layouts
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getTotalClassesToday = () => {
    return getScheduleForDate(new Date()).length;
  };

  const getTotalClassesThisWeek = () => {
    return classes.length * 1; // Assuming each class meets once per week
  };

  const handleAddSchedule = async () => {
    // Validate fields
    if (!newSchedule.classId || !newSchedule.date || !newSchedule.startHour || !newSchedule.endHour) {
      toast({
        title: 'Field Belum Lengkap',
        description: 'Mohon lengkapi semua field (Kelas, Tanggal, Waktu Mulai, Waktu Selesai)',
        variant: 'warning',
      });
      return;
    }

    // Build time strings
    const startTime = `${newSchedule.startHour}:${newSchedule.startMinute}`;
    const endTime = `${newSchedule.endHour}:${newSchedule.endMinute}`;

    // Validate end time is after start time
    if (endTime <= startTime) {
      toast({
        title: 'Waktu Tidak Valid',
        description: 'Waktu selesai harus setelah waktu mulai.',
        variant: 'warning',
      });
      return;
    }

    // Find the selected class
    const selectedClass = classes.find(c => c.id === newSchedule.classId);
    if (!selectedClass) {
      toast({
        title: 'Error',
        description: 'Kelas tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }

    // Create new schedule item - use local date format
    const schedDate = newSchedule.date as Date;
    const year = schedDate.getFullYear();
    const month = String(schedDate.getMonth() + 1).padStart(2, '0');
    const day = String(schedDate.getDate()).padStart(2, '0');
    
    const newScheduleItem = {
      date: `${year}-${month}-${day}`,
      startTime: startTime,
      endTime: endTime
    };

    // Check for conflicts with existing schedules in the SAME class
    const existingDetails = selectedClass.schedule_details || [];
    const hasSameClassConflict = existingDetails.some((existing: ScheduleItemType) => {
      if (existing.date !== newScheduleItem.date) return false;
      return newScheduleItem.startTime < existing.endTime && newScheduleItem.endTime > existing.startTime;
    });

    if (hasSameClassConflict) {
      toast({
        title: 'Jadwal Bentrok',
        description: 'Jadwal bentrok dengan jadwal yang sudah ada di kelas ini.',
        variant: 'destructive',
      });
      return;
    }

    // Check for conflicts with OTHER classes from this lecturer
    const otherClassConflict = classes.find(cls => {
      if (cls.id === newSchedule.classId) return false; // Skip the same class
      const clsDetails = cls.schedule_details || [];
      return clsDetails.some((existing: ScheduleItemType) => {
        if (existing.date !== newScheduleItem.date) return false;
        return newScheduleItem.startTime < existing.endTime && newScheduleItem.endTime > existing.startTime;
      });
    });

    if (otherClassConflict) {
      toast({
        title: 'Jadwal Bentrok',
        description: `Jadwal bentrok dengan kelas "${otherClassConflict.class_name}" (${otherClassConflict.class_code}).`,
        variant: 'destructive',
      });
      return;
    }

    // Update class with new schedule
    const updatedDetails = [...existingDetails, newScheduleItem];
    const scheduleData = JSON.stringify({
      summary: `${updatedDetails.length} Pertemuan`,
      details: updatedDetails
    });

    try {
      const response = await fetch('/api/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newSchedule.classId,
          schedule: scheduleData
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh class list
        await fetchClasses();
        
        // Reset form and close dialog
        setNewSchedule({
          classId: '',
          date: undefined,
          startHour: '08',
          startMinute: '00',
          endHour: '10',
          endMinute: '00',
          room: ''
        });
        setIsAddDialogOpen(false);
        toast({
          title: 'Berhasil',
          description: 'Jadwal berhasil ditambahkan',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Gagal',
          description: data.message || 'Gagal menambah jadwal',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menambah jadwal',
        variant: 'destructive',
      });
    }
  };

  const weekDates = getWeekDates(currentWeek);

  return (
    <LayoutWrapper title="Jadwal Mengajar" subtitle="Kelola jadwal kelas dan pertemuan">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jadwal Mengajar</h1>
          <p className="text-muted-foreground">Kelola jadwal kelas dan pertemuan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSelectedView(selectedView === 'week' ? 'month' : 'week')}>
            {selectedView === 'week' ? 'Tampilan Bulan' : 'Tampilan Minggu'}
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Jadwal Baru</DialogTitle>
                <DialogDescription>
                  Pilih kelas, tanggal, dan waktu untuk membuat jadwal baru.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* Class Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="class">Kelas</Label>
                  <select
                    id="class"
                    value={newSchedule.classId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Pilih Kelas</option>
                    {lecturerClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.class_code} - {cls.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="grid gap-2">
                  <Label>Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newSchedule.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newSchedule.date ? (
                          format(newSchedule.date, "PPP", { locale: localeId })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={newSchedule.date}
                        onSelect={(date) => setNewSchedule({ ...newSchedule, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jam Mulai</Label>
                    <div className="flex items-center gap-1">
                      <Select value={newSchedule.startHour} onValueChange={(v) => setNewSchedule({ ...newSchedule, startHour: v })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Jam" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-gray-500 font-medium">:</span>
                      <Select value={newSchedule.startMinute} onValueChange={(v) => setNewSchedule({ ...newSchedule, startMinute: v })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Mnt" />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Jam Selesai</Label>
                    <div className="flex items-center gap-1">
                      <Select value={newSchedule.endHour} onValueChange={(v) => setNewSchedule({ ...newSchedule, endHour: v })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Jam" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-gray-500 font-medium">:</span>
                      <Select value={newSchedule.endMinute} onValueChange={(v) => setNewSchedule({ ...newSchedule, endMinute: v })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Mnt" />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Room */}
                <div className="grid gap-2">
                  <Label htmlFor="room">Ruangan</Label>
                  <Input
                    id="room"
                    placeholder="Contoh: R.A301"
                    value={newSchedule.room}
                    onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddSchedule}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Jadwal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
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
          ) : (() => {
            // Calculate monthly teaching hours from schedule_details
            const currentMonthSchedules = getAllScheduleItems().filter(item => {
              if (!item.date) return false;
              const [year, month] = item.date.split('-').map(Number);
              const now = new Date();
              return year === now.getFullYear() && month === (now.getMonth() + 1);
            });
            
            // Calculate total hours from time strings (e.g., "08:00-10:00" = 2 hours)
            let totalMonthlyHours = 0;
            currentMonthSchedules.forEach(schedule => {
              const [start, end] = schedule.time.split('-');
              if (start && end) {
                const [startH, startM] = start.split(':').map(Number);
                const [endH, endM] = end.split(':').map(Number);
                const hours = (endH + endM/60) - (startH + startM/60);
                totalMonthlyHours += hours;
              }
            });
            
            // Count unique locations
            const uniqueLocations = new Set(
              classes
                .filter(c => c.location?.latitude && c.location?.longitude)
                .map(c => `${c.location?.latitude?.toFixed(4)},${c.location?.longitude?.toFixed(4)}`)
            );
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getTotalClassesToday()}</div>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                    <p className="text-xs text-muted-foreground">Semester ini</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jam Mengajar</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(totalMonthlyHours)}</div>
                    <p className="text-xs text-muted-foreground">
                      Jam bulan {new Date().toLocaleDateString('id-ID', { month: 'long' })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lokasi Kelas</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{uniqueLocations.size}</div>
                    <p className="text-xs text-muted-foreground">Lokasi berbeda</p>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Week View */}
          {isLoading && (
            <Card className="mb-6">
              <CardHeader>
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-4">
                   {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Week View */}
          {!isLoading && selectedView === 'week' && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Jadwal Minggu Ini
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-4">
                      {weekDates[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {' '}
                      {weekDates[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-4">
                  {days.map((day, index) => {
                    const daySchedule = getScheduleForDate(weekDates[index]);
                    const isToday = weekDates[index].toDateString() === new Date().toDateString();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dateToCheck = new Date(weekDates[index]);
                    dateToCheck.setHours(0, 0, 0, 0);
                    const isPast = dateToCheck < today;
                    
                    return (
                      <div key={day} className={`border rounded-lg p-3 ${
                        isToday 
                          ? 'bg-blue-50 border-blue-200' 
                          : isPast 
                            ? 'bg-gray-100 border-gray-200' 
                            : 'bg-white'
                      }`}>
                        <div className="text-center mb-3">
                          <h3 className={`font-semibold ${
                            isToday 
                              ? 'text-blue-700' 
                              : isPast 
                                ? 'text-gray-400' 
                                : 'text-gray-900'
                          }`}>
                            {day}
                          </h3>
                          <p className={`text-sm ${
                            isToday 
                              ? 'text-blue-600' 
                              : isPast 
                                ? 'text-gray-400' 
                                : 'text-gray-600'
                          }`}>
                            {weekDates[index].getDate()}
                          </p>
                        </div>
                        
                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                          {daySchedule.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center">Tidak ada kelas</p>
                          ) : (
                            daySchedule.map((schedule: DisplayScheduleItem, idx: number) => (
                              <div key={idx} className={`border rounded p-2 hover:shadow-sm transition-shadow cursor-pointer ${
                                isPast ? 'bg-gray-50' : 'bg-white'
                              }`}>
                                <div className={`text-xs font-medium mb-1 ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {schedule.class.class_code}
                                </div>
                                <div className={`text-xs mb-1 ${isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {schedule.time}
                                </div>
                                <div className={`text-xs truncate ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {schedule.class.class_name}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">{schedule.class.student_count || 0} mhs</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Month View */}
          {!isLoading && selectedView === 'month' && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Jadwal Bulan Ini
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-4 min-w-[140px] text-center">
                      {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {days.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getMonthDates(currentMonth).map((date, index) => {
                    const daySchedule = getScheduleForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dateToCheck = new Date(date);
                    dateToCheck.setHours(0, 0, 0, 0);
                    const isPast = dateToCheck < today && isCurrentMonth;
                    const hasMoreSchedules = daySchedule.length > 2;
                    
                    const dateCell = (
                      <div 
                        className={`min-h-[100px] border rounded p-1 ${
                          hasMoreSchedules ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                        } ${
                          isToday 
                            ? 'bg-blue-50 border-blue-300' 
                            : !isCurrentMonth
                              ? 'bg-gray-200 border-gray-300'
                              : isPast
                                ? 'bg-gray-100 border-gray-200'
                                : 'bg-white'
                        }`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isToday 
                            ? 'text-blue-700' 
                            : isPast
                              ? 'text-gray-400'
                              : isCurrentMonth 
                                ? 'text-gray-900' 
                                : 'text-gray-400'
                        }`}>
                          {date.getDate()}
                        </div>
                        
                        <div className="space-y-1">
                          {daySchedule.length === 0 && isCurrentMonth ? (
                            <p className="text-xs text-gray-400 text-center mt-2">Tidak ada jadwal</p>
                          ) : (
                            <>
                              {daySchedule.slice(0, 2).map((schedule: DisplayScheduleItem, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={`rounded px-1 py-0.5 text-xs truncate ${
                                    isPast 
                                      ? 'bg-gray-200 text-gray-500' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                  title={`${schedule.class.class_name} (${schedule.time})`}
                                >
                                  {schedule.class.class_code}
                                </div>
                              ))}
                              {hasMoreSchedules && (
                                <div className="text-xs text-blue-600 text-center font-medium hover:underline">
                                  +{daySchedule.length - 2} lagi
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                    
                    // Wrap with Popover only if has more than 2 schedules
                    if (hasMoreSchedules) {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            {dateCell}
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3" align="center">
                            <div className="space-y-2">
                              <div className="font-medium text-sm border-b pb-2">
                                {date.toLocaleDateString('id-ID', { 
                                  weekday: 'short', 
                                  day: 'numeric', 
                                  month: 'short' 
                                })}
                                <span className="text-gray-500 font-normal ml-1">
                                  ({daySchedule.length} kelas)
                                </span>
                              </div>
                              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {daySchedule.map((schedule, idx) => (
                                  <div key={idx} className="border rounded p-2 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">{schedule.class.class_code}</span>
                                      <span className="text-gray-500">{schedule.time}</span>
                                    </div>
                                    <div className="text-gray-600 truncate">{schedule.class.class_name}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }
                    
                    return <div key={index}>{dateCell}</div>;
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Schedule List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kelas Lengkap</CardTitle>
              <CardDescription>Semua kelas yang Anda ampu semester ini</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                  <div className="space-y-4">
                     {[...Array(3)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-4">
                           <Skeleton className="h-6 w-1/3 mb-2" />
                           <Skeleton className="h-4 w-1/2 mb-4" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                     ))}
                  </div>
              ) : (
                <div className="space-y-4">
                {classes.map((cls) => {
                  // Get schedule summary from the class
                  const scheduleInfo = cls.schedule_details && cls.schedule_details.length > 0
                    ? `${cls.schedule_details.length} Pertemuan`
                    : cls.schedule || 'Tidak ada jadwal';
                  
                  return (
                    <div key={cls.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{cls.class_name}</h3>
                            <Badge variant="outline">{cls.class_code}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{scheduleInfo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>Lat: {cls.location?.latitude?.toFixed(4)}, Lng: {cls.location?.longitude?.toFixed(4)}</span>
                            </div>
                          </div>
                          
                          {/* Show schedule details if available */}
                          {cls.schedule_details && cls.schedule_details.length > 0 && (() => {
                            // Sort schedule details by date and time ascending
                            const sortedDetails = [...cls.schedule_details].sort((a: ScheduleItemType, b: ScheduleItemType) => {
                              if (a.date !== b.date) {
                                return a.date.localeCompare(b.date);
                              }
                              return a.startTime.localeCompare(b.startTime);
                            });
                            
                            return (
                              <div className="mt-3 space-y-1">
                                <p className="text-xs font-medium text-gray-500">Jadwal Pertemuan:</p>
                                <div className="flex flex-wrap gap-2">
                                  {sortedDetails.slice(0, 3).map((detail: ScheduleItemType, i: number) => {
                                    const [year, month, day] = detail.date.split('-').map(Number);
                                    const date = new Date(year, month - 1, day, 12, 0, 0);
                                    return (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {detail.startTime}-{detail.endTime}
                                      </Badge>
                                    );
                                  })}
                                  {sortedDetails.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{sortedDetails.length - 3} lainnya
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{cls.student_count || 0} mahasiswa terdaftar</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/lecturer/classes/${cls.id}`)}
                            className="flex items-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
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