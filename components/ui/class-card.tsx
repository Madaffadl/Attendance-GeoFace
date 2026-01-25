'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, Camera, Download } from 'lucide-react';
import { Class } from '@/types';

interface ClassCardProps {
  classItem: Class;
  variant?: 'student' | 'lecturer';
  hasFaceRegistered?: boolean;
  studentCount?: number;
  onAttendance?: () => void;
  onViewDetails?: () => void;
  onExport?: () => void;
  showAttendanceButton?: boolean;
  showExportButton?: boolean;
}

export function ClassCard({
  classItem,
  variant = 'student',
  hasFaceRegistered = true,
  studentCount,
  onAttendance,
  onViewDetails,
  onExport,
  showAttendanceButton = true,
  showExportButton = false,
}: ClassCardProps) {
  const router = useRouter();

  const handleAttendance = () => {
    if (onAttendance) {
      onAttendance();
    } else {
      router.push(`/student/attendance/${classItem.id}`);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      router.push(`/lecturer/classes/${classItem.id}`);
    }
  };

  const [timeStatus, setTimeStatus] = useState<{
    isOpen: boolean;
    message: string;
    nextSchedule?: string;
  }>({ isOpen: false, message: '' });

  useEffect(() => {
    // Function to check time status
    const checkTimeStatus = () => {
      // 0. Check if already attended (Priority 1)
      if (classItem.has_attended_today) {
        setTimeStatus({ isOpen: false, message: 'Sudah Absensi' });
        return;
      }

      const now = new Date();
      
      // 1. Check schedule_details if present (priority)
      if (classItem.schedule_details && classItem.schedule_details.length > 0) {
        const todayDetail = classItem.schedule_details.find(d => {
          const dDate = new Date(d.date);
          return dDate.toDateString() === now.toDateString();
        });
        
        if (todayDetail) {
          const [startH, startM] = todayDetail.startTime.split(':').map(Number);
          const [endH, endM] = todayDetail.endTime.split(':').map(Number);
          
          const startTime = new Date(now);
          startTime.setHours(startH, startM, 0);
          
          const endTime = new Date(now);
          endTime.setHours(endH, endM, 0);
          
          if (now >= startTime && now <= endTime) {
            setTimeStatus({ isOpen: true, message: 'Absensi Dibuka' });
            return;
          } else if (now < startTime) {
            setTimeStatus({ 
              isOpen: false, 
              message: 'Belum Dimulai', 
              nextSchedule: `${todayDetail.startTime}` 
            });
            return;
          } else {
            // Finished today, check for next detail
            const nextDetail = classItem.schedule_details
                .map(d => ({ ...d, dateObj: new Date(d.date) }))
                .filter(d => d.dateObj > now)
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];

            setTimeStatus({ 
                isOpen: false, 
                message: 'Selesai', 
                nextSchedule: nextDetail 
                    ? `${new Date(nextDetail.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} ${nextDetail.startTime}` 
                    : undefined 
            });
            return;
          }
        } else {
            // Not today, look for next suitable date
            const nextDetail = classItem.schedule_details
                .map(d => ({ ...d, dateObj: new Date(d.date) }))
                .filter(d => d.dateObj > now)
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];
            
            if (nextDetail) {
                setTimeStatus({ 
                    isOpen: false, 
                    message: 'Sesi Berikutnya',
                    nextSchedule: `${new Date(nextDetail.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} ${nextDetail.startTime}`
                });
                return;
            }
        }
      }

      // 2. Fallback to schedule string
      // Format: "Day HH:mm-HH:mm" (e.g., "Senin 08:00-10:00")
      
      const parts = classItem.schedule.toLowerCase().split(' ');
      const daysMap: { [key: string]: number } = {
        'minggu': 0, 'senin': 1, 'selasa': 2, 'rabu': 3, 'kamis': 4, 'jumat': 5, 'sabtu': 6
      };

      let dayName = '';
      let foundDay = false;

      // Find day in parts
      for (const part of parts) {
        const cleanPart = part.replace(/[^a-z]/g, '');
        if (daysMap.hasOwnProperty(cleanPart)) {
          dayName = cleanPart;
          foundDay = true;
          break;
        }
      }

      const timePart = parts.find(p => p.includes('-') && p.includes(':'));
      let startStr = '';
      if (timePart) {
          const splitTime = timePart.split('-');
          if (splitTime[0]) startStr = splitTime[0];
      }

      if (foundDay) {
        const currentDay = now.getDay();
        const displayDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        if (daysMap[dayName] !== currentDay) {
           // Not today
           setTimeStatus({ 
             isOpen: false, 
             message: `Jadwal: ${displayDay}`,
             nextSchedule: startStr ? startStr : undefined
           });
           return;
        }

        // Is Today
        if (timePart && startStr) {
            const [endStr] = timePart.split('-').slice(1);
            if (startStr && endStr) {
                const [startH, startM] = startStr.split(':').map(Number);
                const [endH, endM] = endStr.split(':').map(Number);
                
                const startTime = new Date(now);
                startTime.setHours(startH, startM, 0);
                
                const endTime = new Date(now);
                endTime.setHours(endH, endM, 0);
                
                if (now >= startTime && now <= endTime) {
                    setTimeStatus({ isOpen: true, message: 'Absensi Dibuka' });
                } else if (now < startTime) {
                    setTimeStatus({ 
                        isOpen: false, 
                        message: 'Belum Dimulai',
                        nextSchedule: startStr
                    });
                } else {
                    setTimeStatus({ isOpen: false, message: 'Selesai' });
                }
            } else {
                // Time parse issue, but matches day
                setTimeStatus({ isOpen: true, message: 'Absensi Dibuka' }); 
            }
        } else {
           // No time range, but matches day -> Open
           setTimeStatus({ isOpen: true, message: 'Absensi Dibuka' }); 
        }

      } else {
        // No day found (e.g. "1 Pertemuan")
        setTimeStatus({ 
          isOpen: false, 
          message: 'Belum Dijadwalkan',
          nextSchedule: undefined
        });
      }
    };

    checkTimeStatus();
    const interval = setInterval(checkTimeStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [classItem]);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {classItem.lecturer_name || classItem.class_code}
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-2 py-1 text-xs font-semibold">
            {classItem.class_code}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{classItem.schedule}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>Lokasi Kampus</span>
          </div>
          {studentCount !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{studentCount} mahasiswa terdaftar</span>
            </div>
          )}
          
          {/* Status Message based on Time */}
          {variant === 'student' && !timeStatus.isOpen && (
             <div className="p-3 bg-gray-100 rounded-md text-center text-xs font-medium text-gray-600">
               {timeStatus.message}
               {timeStatus.nextSchedule && (
                 <span className="block mt-1 text-gray-500">Mulai: {timeStatus.nextSchedule}</span>
               )}
             </div>
          )}
        </div>

        {variant === 'student' && showAttendanceButton && (
          <Button
            onClick={handleAttendance}
            className="w-full"
            disabled={!hasFaceRegistered || !timeStatus.isOpen}
          >
            <Camera className="mr-2 h-4 w-4" />
            {hasFaceRegistered 
              ? (timeStatus.isOpen 
                  ? 'Tandai Kehadiran' 
                  : (timeStatus.nextSchedule 
                      ? `${timeStatus.message} (${timeStatus.nextSchedule})` 
                      : timeStatus.message)
                )
              : 'Daftar Wajah Dulu'}
          </Button>
        )}

        {variant === 'lecturer' && (
          <div className="flex gap-2">
            <Button
              onClick={handleViewDetails}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Users className="mr-2 h-4 w-4" />
              Detail
            </Button>
            {showExportButton && onExport && (
              <Button
                onClick={onExport}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
