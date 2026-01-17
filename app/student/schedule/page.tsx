'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Class } from '@/types';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';

interface ScheduleSession {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  date: string;
  startTime: string;
  endTime: string;
  dayName: string;
}

export default function StudentSchedulePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Start week from Sunday (Indonesian standard)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - day);
    startDate.setHours(0, 0, 0, 0);
    return startDate;
  });
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

    fetchClasses(user.id);
  }, [user, authLoading, router]);

  const fetchClasses = async (studentId: string) => {
    try {
      const response = await fetch(`/api/classes?studentId=${studentId}`);
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate week dates
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Get all schedule sessions for the week
  const getWeekSchedule = (): ScheduleSession[] => {
    const weekDates = getWeekDates();
    const sessions: ScheduleSession[] = [];
    
    // Create date strings for easy comparison
    const weekDateStrings = weekDates.map(d => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    
    classes.forEach((cls: any) => {
      if (cls.schedule_details && Array.isArray(cls.schedule_details) && cls.schedule_details.length > 0) {
        cls.schedule_details.forEach((d: any) => {
          // Normalize date string
          const sessionDateStr = d.date;
          // Check if session is in current week
          if (weekDateStrings.includes(sessionDateStr)) {
            const sessionDate = new Date(d.date + 'T00:00:00');
            sessions.push({
              id: `${cls.id}-${d.date}`,
              classId: cls.id,
              className: cls.class_name,
              classCode: cls.class_code,
              date: d.date,
              startTime: d.startTime || '08:00',
              endTime: d.endTime || '10:00',
              dayName: sessionDate.toLocaleDateString('id-ID', { weekday: 'long' })
            });
          }
        });
      } else {
        // Legacy format - check if day matches any day in week
        weekDates.forEach(weekDate => {
          const dayName = weekDate.toLocaleDateString('id-ID', { weekday: 'long' });
          if (cls.schedule?.toLowerCase().includes(dayName.toLowerCase())) {
            const year = weekDate.getFullYear();
            const month = String(weekDate.getMonth() + 1).padStart(2, '0');
            const day = String(weekDate.getDate()).padStart(2, '0');
            
            // Parse time from legacy schedule
            const timeMatch = cls.schedule.match(/(\d{1,2})[:\.](\d{2})/);
            const startTime = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '08:00';
            
            sessions.push({
              id: `${cls.id}-${year}-${month}-${day}`,
              classId: cls.id,
              className: cls.class_name,
              classCode: cls.class_code,
              date: `${year}-${month}-${day}`,
              startTime,
              endTime: '10:00',
              dayName
            });
          }
        });
      }
    });
    
    // Sort by date and time
    return sessions.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newStart);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const weekDates = getWeekDates();
  const weekSchedule = getWeekSchedule();

  // Group sessions by date
  const sessionsByDate = weekDates.map(date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return {
      date,
      dateStr,
      sessions: weekSchedule.filter(s => s.date === dateStr)
    };
  });

  const formatWeekRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <LayoutWrapper title="Jadwal Kuliah" subtitle="Lihat jadwal kelas Anda">
      <PageHeader
        title="Jadwal Kuliah"
        subtitle="Semua jadwal kelas yang Anda ikuti"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
          { label: 'Jadwal', current: true },
        ]}
      />

      {/* Week Navigation */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{formatWeekRange()}</h3>
              <p className="text-sm text-muted-foreground">
                {weekSchedule.length} jadwal minggu ini
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ringkasan Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
              <div className="text-xs text-muted-foreground">Total Kelas</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{weekSchedule.length}</div>
              <div className="text-xs text-muted-foreground">Jadwal Minggu Ini</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {sessionsByDate.find(d => isToday(d.date))?.sessions.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Jadwal Hari Ini</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(weekSchedule.reduce((acc, s) => {
                  const [sh, sm] = s.startTime.split(':').map(Number);
                  const [eh, em] = s.endTime.split(':').map(Number);
                  return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
                }, 0))}
              </div>
              <div className="text-xs text-muted-foreground">Jam Minggu Ini</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Jadwal</h3>
            <p className="text-gray-600 mb-4">Anda belum terdaftar di kelas manapun.</p>
            <Button onClick={() => router.push(ROUTES.STUDENT.CLASSES)}>
              Gabung Kelas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessionsByDate.map(({ date, dateStr, sessions }) => (
            <Card key={dateStr} className={isToday(date) ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {date.toLocaleDateString('id-ID', { weekday: 'long' })}
                      {isToday(date) && (
                        <Badge variant="default" className="ml-2">Hari Ini</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{sessions.length} kelas</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Tidak ada jadwal</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map(session => (
                      <div 
                        key={session.id} 
                        className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium min-w-[100px]">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {session.startTime} - {session.endTime}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{session.className}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <BookOpen className="h-3 w-3" />
                            {session.classCode}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/student/attendance/${session.classId}`)}
                        >
                          Absen
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </LayoutWrapper>
  );
}
