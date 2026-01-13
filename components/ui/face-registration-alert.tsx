'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface FaceRegistrationAlertProps {
  isRegistered: boolean;
  onRefresh?: () => void;
  showRefreshButton?: boolean;
  className?: string;
}

export function FaceRegistrationAlert({
  isRegistered,
  onRefresh,
  showRefreshButton = false,
  className = '',
}: FaceRegistrationAlertProps) {
  const router = useRouter();

  if (isRegistered) {
    return (
      <Card className={`border-0 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500 ${className}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Wajah Sudah Terdaftar</p>
              <p className="text-sm text-gray-600">Anda dapat melakukan absensi menggunakan pengenalan wajah.</p>
            </div>
            {showRefreshButton && onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Perbarui
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-orange-500 ${className}`}>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Registrasi Wajah Diperlukan</p>
            <p className="text-sm text-gray-600">Daftarkan wajah Anda terlebih dahulu untuk dapat melakukan absensi.</p>
          </div>
          <Button 
            onClick={() => router.push(ROUTES.STUDENT.FACE_REGISTRATION)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Daftar Sekarang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
