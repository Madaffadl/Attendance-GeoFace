'use client';

import { useRouter } from 'next/navigation';
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
        </div>

        {variant === 'student' && showAttendanceButton && (
          <Button
            onClick={handleAttendance}
            className="w-full"
            disabled={!hasFaceRegistered}
          >
            <Camera className="mr-2 h-4 w-4" />
            {hasFaceRegistered ? 'Tandai Kehadiran' : 'Daftar Wajah Dulu'}
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
