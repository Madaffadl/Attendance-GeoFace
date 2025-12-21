'use client';

import { useState, useEffect } from 'react';
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
  CalendarIcon
} from 'lucide-react';
import { Class } from '@/types';
import { useData } from '@/lib/dataContext';
import { cn } from '@/lib/utils';

interface ScheduleItem {
  day: string;
  time: string;
  class: Class;
}

interface NewSchedule {
  classId: string;
  date: Date | undefined;
  startTime: string;
  endTime: string;
  room: string;
}

export default function SchedulePage() {
  const { classes, schedules, addSchedule } = useData();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState<NewSchedule>({
    classId: '',
    date: undefined,
    startTime: '08:00',
    endTime: '10:00',
    room: ''
  });
  const router = useRouter();
  
  // Filter classes for current lecturer
  const lecturerClasses = classes.filter(cls => cls.lecturer_id === '1');

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const parseSchedule = (schedule: string): { day: string; time: string } => {
    // Parse schedule like "Senin 08:00-10:00"
    const parts = schedule.split(' ');
    const day = parts[0];
    const time = parts[1];
    return { day, time };
  };

  const getScheduleForDay = (day: string): ScheduleItem[] => {
    return classes
      .map(cls => {
        const parsed = parseSchedule(cls.schedule);
        if (parsed.day === day) {
          return {
            day: parsed.day,
            time: parsed.time,
            class: cls
          };
        }
        return null;
      })
      .filter(Boolean) as ScheduleItem[];
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

  const getTotalClassesToday = () => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    const todayInIndonesian = today.charAt(0).toUpperCase() + today.slice(1);
    return getScheduleForDay(todayInIndonesian).length;
  };

  const getTotalClassesThisWeek = () => {
    return classes.length * 1; // Assuming each class meets once per week
  };

  const handleAddSchedule = () => {
    // Validate fields
    if (!newSchedule.classId || !newSchedule.date || !newSchedule.startTime || !newSchedule.endTime) {
      return;
    }
    
    // Add the schedule using context
    addSchedule({
      classId: newSchedule.classId,
      date: newSchedule.date.toISOString(),
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      room: newSchedule.room
    });
    
    // Reset form and close dialog
    setNewSchedule({
      classId: '',
      date: undefined,
      startTime: '08:00',
      endTime: '10:00',
      room: ''
    });
    setIsAddDialogOpen(false);
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
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Jam Mulai</Label>
                    <select
                      id="startTime"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">Jam Selesai</Label>
                    <select
                      id="endTime"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
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
                <div className="text-2xl font-bold">{classes.length * 2}</div>
                <p className="text-xs text-muted-foreground">Jam per minggu</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ruang Kelas</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Ruang berbeda</p>
              </CardContent>
            </Card>
          </div>

          {/* Week Navigation */}
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
                  const daySchedule = getScheduleForDay(day);
                  const isToday = weekDates[index].toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={day} className={`border rounded-lg p-3 ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                      <div className="text-center mb-3">
                        <h3 className={`font-semibold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                          {day}
                        </h3>
                        <p className={`text-sm ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                          {weekDates[index].getDate()}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        {daySchedule.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center">Tidak ada kelas</p>
                        ) : (
                          daySchedule.map((schedule, idx) => (
                            <div key={idx} className="bg-white border rounded p-2 hover:shadow-sm transition-shadow cursor-pointer">
                              <div className="text-xs font-medium text-gray-900 mb-1">
                                {schedule.class.class_code}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {schedule.time}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {schedule.class.class_name}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-400">15 mhs</span>
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

          {/* Detailed Schedule List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Kelas Lengkap</CardTitle>
              <CardDescription>Semua kelas yang Anda ampu semester ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classes.map((cls) => {
                  const parsed = parseSchedule(cls.schedule);
                  
                  return (
                    <div key={cls.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{cls.class_name}</h3>
                            <Badge variant="outline">{cls.class_code}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{parsed.day}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{parsed.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>Ruang A{Math.floor(Math.random() * 10) + 1}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>15 mahasiswa terdaftar</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
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
            </CardContent>
          </Card>
    </LayoutWrapper>
  );
}