'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ContextualNav } from '@/components/ui/contextual-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Clock,
  Target,
  ArrowLeft
} from 'lucide-react';
import { Class, Student } from '@/types';
import { getCurrentLocation, LocationCoordinates, validateLocation } from '@/lib/geolocation';
import { loadModels, getFaceDescriptor, compareFaces } from '@/lib/faceRecognition';
import { mockStudents, mockClasses } from '@/lib/mockData';

// Antarmuka untuk pengguna yang sedang login
interface AuthUser {
  id: string;
  name: string;
  userType: string;
  identifier: string;
  email: string;
  program_study: string;
  photo: string;
}

export default function AttendancePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'location' | 'camera' | 'processing' | 'success'>('location');
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [faceAccuracy, setFaceAccuracy] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  useEffect(() => {
    const initialize = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }
      const parsedUser = JSON.parse(userData) as AuthUser;
      setUser(parsedUser);

      setMessage("Memuat model AI, mohon tunggu...");
      try {
        await loadModels();
        setModelsLoaded(true);
        setMessage("");
      } catch (e) {
        setError("Gagal memuat model AI. Silakan muat ulang halaman.");
        setIsLoading(false);
        return;
      }

      const foundClass = mockClasses.find((cls: Class) => cls.id === classId);
      const foundStudent = mockStudents.find((s: Student) => s.id === parsedUser.id);

      if (foundClass) setClassData(foundClass);
      else setError('Kelas tidak ditemukan');

      if (foundStudent) setStudentData(foundStudent);
      else setError('Data mahasiswa tidak ditemukan');
      
      setIsLoading(false);
    };

    initialize();
  }, [router, classId]);

  useEffect(() => {
    if (step === 'location' && modelsLoaded) {
      checkLocation();
    }
  }, [step, modelsLoaded]);

  const checkLocation = async () => {
    if (!classData) return;
    try {
      setLocationStatus('checking');
      setMessage('Memverifikasi lokasi Anda...');
      setError('');
      
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);

      const locationValidation = validateLocation(currentLocation, classData.location, classData.location.radius);
      
      setTimeout(() => {
        if(locationValidation.isValid) {
          setLocationStatus('valid');
          setMessage(`Lokasi terverifikasi! Anda berada ${locationValidation.distance}m dari kelas.`);
        } else {
          setLocationStatus('invalid');
          setError(locationValidation.message);
        }
      }, 1500);
      
    } catch (err) {
      setLocationStatus('invalid');
      setError(err instanceof Error ? err.message : 'Gagal mendapatkan lokasi');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setStep('camera');
      setError('');
    } catch (err) {
      setError('Gagal mengakses kamera. Mohon izinkan akses kamera di browser Anda.');
    }
  };
  
  const processAttendance = async () => {
    if (!videoRef.current || !user || !studentData || !studentData.face_vector || !location) {
      setError("Data tidak lengkap untuk memproses absensi. Pastikan Anda sudah registrasi wajah.");
      return;
    }

    setStep('processing');
    setIsProcessing(true);
    setMessage('Menganalisis wajah Anda...');
    setError('');

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    streamRef.current?.getTracks().forEach(track => track.stop());

    try {
      const currentDescriptor = await getFaceDescriptor(imageData);
      if (!currentDescriptor) {
        throw new Error("Wajah tidak terdeteksi. Pastikan wajah Anda terlihat jelas dan terang.");
      }

      const registeredDescriptor = await getFaceDescriptor(studentData.face_vector);
      if (!registeredDescriptor) {
        throw new Error("Data wajah terdaftar tidak ditemukan. Silakan lakukan registrasi wajah ulang.");
      }

      const distance = compareFaces(currentDescriptor, registeredDescriptor);
      const MATCH_THRESHOLD = 0.5;
      const accuracy = Math.max(0, 100 - (distance / MATCH_THRESHOLD) * 100);
      setFaceAccuracy(accuracy);

      const recognitionResult = {
        success: distance < MATCH_THRESHOLD,
        message: distance < MATCH_THRESHOLD ? "Wajah terverifikasi" : "Wajah tidak cocok",
        confidence: 1 - distance
      };
      
      if (!recognitionResult.success) {
        throw new Error(`Wajah tidak cocok. Tingkat kemiripan: ${accuracy.toFixed(1)}%.`);
      }

      setMessage('Mengirim data absensi...');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          class_id: classId,
          location,
          recognitionResult
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStep('success');
        setMessage('Absensi berhasil dicatat!');
      } else {
        throw new Error(data.message || 'Gagal menyimpan data absensi.');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('camera');
      startCamera(); // Coba mulai ulang kamera jika gagal
    } finally {
      setIsProcessing(false);
    }
  };
  
  const retryLocation = () => {
    setError('');
    setLocationStatus('checking');
    checkLocation();
  };

  const handleBack = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    router.push('/student/dashboard');
  };

  const handleDone = () => {
    router.push('/student/dashboard');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextualNav
        title="Tandai Kehadiran"
        subtitle={classData?.class_name || 'Memuat...'}
        backUrl="/student/dashboard"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {classData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl">{classData.class_name}</h2>
                  <p className="text-sm text-gray-600">{classData.class_code}</p>
                </div>
                <Badge variant="outline">{classData.schedule}</Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {classData.lecturer_name}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardContent className="p-8">
            {step === 'location' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  {locationStatus === 'checking' ? <LoadingSpinner /> : locationStatus === 'valid' ? <CheckCircle className="w-8 h-8 text-green-600" /> : <MapPin className="w-8 h-8 text-blue-600" />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {locationStatus === 'checking' ? 'Memverifikasi Lokasi' : locationStatus === 'valid' ? 'Lokasi Terverifikasi' : 'Pengecekan Lokasi Gagal'}
                  </h3>
                  <p className="text-gray-600">{message || error}</p>
                </div>
                {locationStatus === 'valid' && (
                  <Button onClick={startCamera} size="lg">Lanjutkan ke Pindai Wajah</Button>
                )}
                {locationStatus === 'invalid' && (
                  <Button onClick={retryLocation} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Coba Lagi
                  </Button>
                )}
              </div>
            )}

            {step === 'camera' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Pindai Wajah</h3>
                  <p className="text-gray-600">Posisikan wajah Anda di dalam bingkai.</p>
                </div>
                <div className="relative max-w-md mx-auto">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover rounded-lg bg-black" />
                  <div className="absolute inset-0 border-2 border-dashed border-white rounded-lg m-4 flex items-center justify-center">
                    <div className="w-32 h-40 border-2 border-white rounded-full opacity-50" />
                  </div>
                </div>
                <div className="text-center">
                  <Button onClick={processAttendance} size="lg" className="flex items-center gap-2" disabled={isProcessing}>
                    {isProcessing ? <LoadingSpinner size="sm" /> : <Camera className="w-5 h-5" />}
                    Tandai Kehadiran
                  </Button>
                </div>
              </div>
            )}
            
            {step === 'processing' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto"><LoadingSpinner /></div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Memproses Absensi</h3>
                  <p className="text-gray-600">{message}</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8 text-green-600" /></div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-green-800">Absensi Berhasil!</h3>
                  <p className="text-gray-600">{message}</p>
                </div>
                {faceAccuracy !== null && (
                   <Card className="border-green-200 bg-green-50 max-w-sm mx-auto">
                     <CardContent className="p-4">
                       <p className="text-sm font-medium text-green-800">Tingkat Kemiripan: <span className="font-bold">{faceAccuracy.toFixed(1)}%</span></p>
                     </CardContent>
                   </Card>
                )}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500"><Clock className="w-4 h-4" />{new Date().toLocaleString('id-ID')}</div>
                <Button onClick={handleDone} size="lg">Selesai</Button>
              </div>
            )}
            
            {error && step !== 'success' && (
              <Alert className="mt-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}