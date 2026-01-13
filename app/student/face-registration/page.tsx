'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CheckCircle, AlertCircle, RefreshCw, Info, Loader2, Save } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function FaceRegistrationPage() {
  const { user, hasFaceRegistered, isLoading: authLoading, refreshFaceStatus } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState<'instructions' | 'capture' | 'saving' | 'complete'>('instructions');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (user && user.userType !== 'student') {
      router.push(ROUTES.LOGIN);
      return;
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [user, authLoading, router]);

  const startCamera = async () => {
    try {
      setError(null);
      setCameraReady(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          console.log('Camera ready');
        };
      }
      
      setStep('capture');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera.');
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !cameraReady) {
      setError('Kamera belum siap. Silakan tunggu sebentar.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const newImages = [...capturedImages, imageData];
      setCapturedImages(newImages);
      console.log(`Captured image ${newImages.length}/5`);

      // Auto-complete when we have 5 images
      if (newImages.length >= 5) {
        handleComplete(newImages);
      }
    }
  };

  const handleComplete = async (images: string[]) => {
    if (!user || images.length < 5) return;
    
    // Stop camera first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setStep('saving');
    setIsSaving(true);
    setError(null);
    setSaveProgress(10);
    setSaveStatus('Mempersiapkan data...');

    try {
      // Create face descriptor from images
      setSaveProgress(30);
      setSaveStatus('Memproses foto wajah...');
      
      const faceDescriptor = JSON.stringify({ 
        images: images, 
        timestamp: Date.now() 
      });

      // Simulate progress
      await new Promise(r => setTimeout(r, 500));
      setSaveProgress(50);
      setSaveStatus('Mengunggah ke server...');

      // Save to Supabase via API
      console.log('Saving face data to server for user:', user.id);
      const response = await fetch('/api/face-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: user.id,
          faceDescriptor: faceDescriptor,
          confidenceScore: 0.95,
          photosCount: images.length
        }),
      });

      setSaveProgress(80);
      setSaveStatus('Menyimpan data...');

      const result = await response.json();
      console.log('Face registration API response:', result);

      if (result.success) {
        setSaveProgress(90);
        setSaveStatus('Memperbarui status...');
        
        // Refresh auth context face status
        await refreshFaceStatus();
        
        setSaveProgress(100);
        setSaveStatus('Selesai!');
        
        await new Promise(r => setTimeout(r, 500));
        setStep('complete');
      } else {
        setError(result.message || 'Gagal menyimpan data wajah. Silakan coba lagi.');
        setStep('capture');
        setCapturedImages([]);
        startCamera();
      }
    } catch (err) {
      console.error('Error saving face data:', err);
      setError('Terjadi kesalahan saat menyimpan data wajah. Silakan coba lagi.');
      setStep('capture');
      setCapturedImages([]);
      startCamera();
    } finally {
      setIsSaving(false);
    }
  };

  const resetCapture = () => {
    setCapturedImages([]);
    setCameraReady(false);
    setStep('instructions');
    setError(null);
    setSaveProgress(0);
    setSaveStatus('');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
              hasFaceRegistered ? 'bg-green-100' : 'bg-amber-100'
            }`}
          >
            {hasFaceRegistered ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {hasFaceRegistered ? 'Wajah Sudah Terdaftar' : 'Wajah Belum Terdaftar'}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasFaceRegistered
                ? 'Anda dapat melakukan absensi menggunakan pengenalan wajah.'
                : 'Silakan daftarkan wajah Anda untuk dapat melakukan absensi.'}
            </p>
          </div>
          {hasFaceRegistered && (
            <Button variant="outline" onClick={resetCapture}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Perbarui Wajah
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Instructions Step */}
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

      {/* Capture Step */}
      {step === 'capture' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ambil Foto Wajah</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {capturedImages.length} / 5
              </Badge>
            </CardTitle>
            <CardDescription>
              Ambil 5 foto wajah Anda dari sudut yang sedikit berbeda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Camera View */}
            <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-900 shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
                    <p className="text-lg">Memuat kamera...</p>
                  </div>
                </div>
              )}
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 border-4 border-dashed border-blue-400 rounded-full opacity-70" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progress Pengambilan Foto</span>
                <span className="text-sm font-bold text-blue-600">{capturedImages.length * 20}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${capturedImages.length * 20}%` }}
                >
                  {capturedImages.length > 0 && (
                    <span className="text-xs font-bold text-white">{capturedImages.length}/5</span>
                  )}
                </div>
              </div>
              
              {/* Photo indicators */}
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      num <= capturedImages.length 
                        ? 'bg-green-500 text-white scale-110' 
                        : num === capturedImages.length + 1
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {num <= capturedImages.length ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      num
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetCapture} className="flex-1">
                Batal
              </Button>
              <Button 
                onClick={captureImage} 
                className="flex-[2]" 
                size="lg" 
                disabled={!cameraReady || isSaving}
              >
                <Camera className="mr-2 h-5 w-5" />
                Ambil Foto {capturedImages.length + 1}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saving Step */}
      {step === 'saving' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-6 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <Save className="h-10 w-10 text-blue-600 animate-pulse" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-2">Menyimpan Data Wajah</h3>
                <p className="text-gray-600">{saveStatus}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-bold text-blue-600">{saveProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
              </div>

              {/* Steps indicator */}
              <div className="flex justify-center gap-2">
                {['Persiapan', 'Proses', 'Unggah', 'Simpan'].map((label, i) => {
                  const stepProgress = (i + 1) * 25;
                  const isComplete = saveProgress >= stepProgress;
                  const isCurrent = saveProgress >= stepProgress - 25 && saveProgress < stepProgress;
                  
                  return (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isComplete 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-blue-500 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isComplete ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-xs ${isComplete || isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-green-800">Registrasi Berhasil!</h3>
            <p className="mb-6 text-gray-600 max-w-md mx-auto">
              Wajah Anda telah berhasil didaftarkan. Sekarang Anda dapat melakukan absensi dengan pengenalan wajah.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={resetCapture}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Perbarui Wajah
              </Button>
              <Button onClick={() => router.push(ROUTES.STUDENT.DASHBOARD)}>
                Kembali ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </LayoutWrapper>
  );
}
