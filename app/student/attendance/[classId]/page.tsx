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
import { loadModels, captureImageFromVideo, processAttendanceWithFace } from '@/lib/faceRecognition';
import { mockStudents, mockClasses } from '@/lib/mockData';

// Interface for logged in user
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

      try {
        setMessage("Memuat model face recognition...");
        await loadModels();
        setModelsLoaded(true);
      } catch (e) {
        console.error("Failed to load face recognition models:", e);
        setError('Gagal memuat model face recognition. Silakan refresh halaman.');
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

      const locationValidation = validateLocation(
        currentLocation, 
        classData.location, 
        classData.location.radius
      );
      
      setTimeout(() => {
        if (locationValidation.isValid) {
          setLocationStatus('valid');
          setMessage(`Lokasi terverifikasi! Anda berada ${locationValidation.distance}m dari kelas.`);
        } else {
          setLocationStatus('invalid');
          setMessage(locationValidation.message);
        }
      }, 1500);
      
    } catch (err) {
      console.error('Location check failed:', err);
      setLocationStatus('invalid');
      setError('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.');
    }
  };

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        streamRef.current = stream;
      }
      setStep('camera');
      setError('');
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };
  
  const processAttendanceFlow = async () => {
    if (!user || !location || !studentData) {
      setError("Data tidak lengkap untuk memproses absensi.");
      return;
    }

    console.log('Processing attendance for student:', studentData.id);
    console.log('Student face vector exists:', !!studentData.face_vector);
    console.log('Face vector length:', studentData.face_vector?.length || 0);
    // Check if student has registered face
    if (!studentData.face_vector || studentData.face_vector.length < 50) {
      console.log('Face not registered, redirecting to registration');
      setError("Anda belum mendaftarkan wajah. Silakan daftarkan wajah terlebih dahulu.");
      setTimeout(() => {
        router.push(`/student/register-face/${classId}`);
      }, 2000);
      return;
    }

    setStep('processing');
    setIsProcessing(true);
    setMessage('Menganalisis wajah Anda...');
    setError('');

    try {
      // Capture image from video
      if (!videoRef.current) {
        throw new Error('Video tidak tersedia');
      }

      const imageData = captureImageFromVideo(videoRef.current);

      // Stop camera if running
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setMessage('Memproses pengenalan wajah...');

      // Process face recognition
      const faceResult = await processAttendanceWithFace(imageData, studentData.face_vector);
      
      if (!faceResult.success) {
        setError(faceResult.message);
        setStep('camera');
        setTimeout(() => startCamera(), 1000);
        return;
      }

      setFaceAccuracy(faceResult.confidence * 100);

      setMessage('Mengirim data absensi...');
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          class_id: classId,
          location,
          face_recognition_result: faceResult
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStep('success');
        setMessage(data.message);
      } else {
        setError(data.message);
        setStep('camera');
        setTimeout(() => startCamera(), 1000);
      }
      
    } catch (err) {
      console.error('Attendance processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses absensi';
      setError(errorMessage);
      setStep('camera');
      setTimeout(() => startCamera(), 1000);
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
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {!modelsLoaded ? 'Memuat model face recognition...' : 'Memuat...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <ContextualNav
        title="Tandai Kehadiran"
        subtitle={classData?.class_name || 'Memuat...'}
        backUrl="/student/dashboard"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {classData && (
          <Card className="mb-10 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{classData.class_name}</h2>
                  <p className="text-base text-gray-600 mt-1">{classData.class_code}</p>
                </div>
                <Badge variant="outline" className="px-4 py-2 text-base">{classData.schedule}</Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-3 text-base mt-3">
                <User className="w-5 h-5" />
                {classData.lecturer_name}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="shadow-xl border-0">
          <CardContent className="p-10">
            {step === 'location' && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  {locationStatus === 'checking' ? (
                    <LoadingSpinner />
                  ) : locationStatus === 'valid' ? (
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  ) : (
                    <MapPin className="w-10 h-10 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">
                    {locationStatus === 'checking' 
                      ? 'Memverifikasi Lokasi' 
                      : locationStatus === 'valid' 
                        ? 'Lokasi Terverifikasi' 
                        : 'Pengecekan Lokasi Gagal'
                    }
                  </h3>
                  <p className="text-gray-600 text-lg">{message || error}</p>
                </div>
                {locationStatus === 'valid' && (
                  <Button onClick={startCamera} size="lg" className="px-8 py-4 text-lg font-semibold shadow-lg">
                    Lanjutkan ke Pindai Wajah
                  </Button>
                )}
                {locationStatus === 'invalid' && (
                  <Button onClick={retryLocation} variant="outline" className="flex items-center gap-3 px-6 py-3 text-base font-semibold">
                    <RefreshCw className="w-4 h-4" />
                    Coba Lagi
                  </Button>
                )}
              </div>
            )}

            {step === 'camera' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Pindai Wajah</h3>
                  <p className="text-gray-600 text-lg">Posisikan wajah Anda di dalam bingkai.</p>
                </div>
                <div className="relative max-w-lg mx-auto">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-80 object-cover rounded-xl bg-black shadow-lg" 
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white rounded-xl m-6 flex items-center justify-center">
                    <div className="w-40 h-48 border-3 border-white rounded-full opacity-60" />
                  </div>
                </div>
                <div className="text-center">
                  <Button 
                    onClick={processAttendanceFlow} 
                    size="lg"
                    className="flex items-center gap-3 px-8 py-4 text-lg font-semibold shadow-lg" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                    {isProcessing ? 'Memproses...' : 'Tandai Kehadiran'}
                  </Button>
                </div>
              </div>
            )}
            
            {step === 'processing' && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <LoadingSpinner />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">Memproses Absensi</h3>
                  <p className="text-gray-600 text-lg">{message}</p>
                  <div className="mt-6 max-w-md mx-auto bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full animate-pulse" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-green-800">Absensi Berhasil!</h3>
                  <p className="text-gray-600 text-lg">{message}</p>
                </div>
                {faceAccuracy !== null && (
                   <Card className="border-green-200 bg-green-50 max-w-md mx-auto shadow-lg">
                     <CardContent className="p-6">
                       <p className="text-base font-semibold text-green-800">
                         Tingkat Kemiripan: <span className="font-bold">{faceAccuracy.toFixed(1)}%</span>
                       </p>
                       <p className="text-sm text-green-600 mt-2">
                         Status: Wajah terverifikasi ✓
                       </p>
                     </CardContent>
                   </Card>
                )}
                <div className="flex items-center justify-center gap-3 text-base text-gray-500">
                  <Clock className="w-5 h-5" />
                  {new Date().toLocaleString('id-ID')}
                </div>
                <Button onClick={handleDone} size="lg" className="px-8 py-4 text-lg font-semibold shadow-lg">Selesai</Button>
              </div>
            )}
            
            {error && step !== 'success' && (
              <Alert className="mt-8 border-red-200 bg-red-50">
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