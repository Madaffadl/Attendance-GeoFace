'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CheckCircle, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { hasFaceData, saveFaceData } from '@/lib/faceStorage';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function FaceRegistrationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'instructions' | 'capture' | 'complete'>('instructions');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
      setIsRegistered(hasFaceData(parsedUser.id));
    } catch {
      router.push(ROUTES.LOGIN);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [router]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep('capture');
      setError(null);
    } catch (err) {
      setError('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera.');
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImages((prev) => [...prev, imageData]);

      if (capturedImages.length >= 4) {
        handleComplete();
      }
    }
  };

  const handleComplete = () => {
    if (user && capturedImages.length >= 4) {
      // Store face data - convert images array to JSON string as face descriptor
      const faceDescriptor = JSON.stringify({ images: capturedImages, timestamp: Date.now() });
      saveFaceData(user.id, faceDescriptor, 0.95, capturedImages.length);
      setIsRegistered(true);
      setStep('complete');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const resetCapture = () => {
    setCapturedImages([]);
    setStep('instructions');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  if (!user) return null;

  return (
    <LayoutWrapper title="Registrasi Wajah" subtitle="Daftarkan wajah untuk absensi">
      <PageHeader
        title="Registrasi Wajah"
        subtitle="Daftarkan wajah Anda untuk sistem absensi dengan pengenalan wajah"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
          { label: 'Registrasi Wajah', current: true },
        ]}
      />

      {/* Status Card */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 py-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              isRegistered ? 'bg-success/20' : 'bg-warning/20'
            }`}
          >
            {isRegistered ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <AlertCircle className="h-6 w-6 text-warning" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {isRegistered ? 'Wajah Sudah Terdaftar' : 'Wajah Belum Terdaftar'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRegistered
                ? 'Anda dapat melakukan absensi menggunakan pengenalan wajah.'
                : 'Silakan daftarkan wajah Anda untuk dapat melakukan absensi.'}
            </p>
          </div>
          {isRegistered && (
            <Button variant="outline" onClick={resetCapture}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Perbarui Wajah
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      {step === 'instructions' && (
        <Card>
          <CardHeader>
            <CardTitle>Petunjuk Registrasi Wajah</CardTitle>
            <CardDescription>Ikuti langkah-langkah berikut untuk mendaftarkan wajah Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Badge variant="secondary" className="h-6 w-6 justify-center rounded-full p-0">1</Badge>
                <div>
                  <p className="font-medium">Pencahayaan yang Baik</p>
                  <p className="text-sm text-muted-foreground">Pastikan wajah Anda terlihat jelas dan tidak ada bayangan.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Badge variant="secondary" className="h-6 w-6 justify-center rounded-full p-0">2</Badge>
                <div>
                  <p className="font-medium">Posisi Wajah</p>
                  <p className="text-sm text-muted-foreground">Hadapkan wajah langsung ke kamera.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Badge variant="secondary" className="h-6 w-6 justify-center rounded-full p-0">3</Badge>
                <div>
                  <p className="font-medium">Tanpa Aksesori</p>
                  <p className="text-sm text-muted-foreground">Lepaskan kacamata hitam, topi, atau masker.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Badge variant="secondary" className="h-6 w-6 justify-center rounded-full p-0">4</Badge>
                <div>
                  <p className="font-medium">5 Foto Diperlukan</p>
                  <p className="text-sm text-muted-foreground">Sistem akan mengambil 5 foto dari berbagai sudut.</p>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Data wajah Anda disimpan dengan aman dan hanya digunakan untuk verifikasi kehadiran.
              </AlertDescription>
            </Alert>

            <Button onClick={startCamera} className="w-full" size="lg">
              <Camera className="mr-2 h-5 w-5" />
              Mulai Registrasi
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'capture' && (
        <Card>
          <CardHeader>
            <CardTitle>Ambil Foto Wajah</CardTitle>
            <CardDescription>Foto {capturedImages.length + 1} dari 5</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-dashed border-primary/50 m-8 rounded-lg pointer-events-none" />
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    i < capturedImages.length ? 'bg-success' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetCapture} className="flex-1">
                Batal
              </Button>
              <Button onClick={captureImage} className="flex-1" size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Ambil Foto ({capturedImages.length + 1}/5)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Registrasi Berhasil!</h3>
            <p className="mb-6 text-muted-foreground">
              Wajah Anda telah berhasil didaftarkan. Sekarang Anda dapat melakukan absensi dengan pengenalan wajah.
            </p>
            <Button onClick={() => router.push(ROUTES.STUDENT.DASHBOARD)}>
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </LayoutWrapper>
  );
}
