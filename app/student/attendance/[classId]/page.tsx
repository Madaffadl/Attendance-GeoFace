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
  Loader2
} from 'lucide-react';
import { Class } from '@/types';
import { getCurrentLocation, LocationCoordinates, validateLocation } from '@/lib/geolocation';
import { loadModels, captureImageFromVideo, processAttendanceWithFace, getModelsStatus } from '@/lib/faceRecognition';
import { getFaceDataWithFallback } from '@/lib/faceStorage';
import { useAuth } from '@/lib/auth-context';
import { 
  createInitialLivenessState, 
  processChallengeFrame, 
  detectFaceWithLandmarks, 
  getLivenessStatusMessage,
  LivenessState,
  LivenessChallenge
} from '@/lib/livenessDetection';

export default function AttendancePage() {
  const { user, hasFaceRegistered, modelsReady, isLoading: authLoading } = useAuth();
  const [classData, setClassData] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState('');
  const [step, setStep] = useState<'location' | 'liveness' | 'camera' | 'processing' | 'success'>('location');
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [faceAccuracy, setFaceAccuracy] = useState<number | null>(null);
  const [livenessState, setLivenessState] = useState<LivenessState>(createInitialLivenessState());
  const livenessIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.userType !== 'student') {
      router.push('/login');
      return;
    }

    // Initialize - fetch class data (don't wait for models)
    const initialize = async () => {
      try {
        // Fetch class data from API
        console.log('Fetching class data for:', classId);
        const classResponse = await fetch(`/api/classes?classId=${classId}`);
        const classResult = await classResponse.json();
        
        if (classResult.success && classResult.class) {
          setClassData(classResult.class);
        } else {
          setError('Kelas tidak ditemukan');
        }

      } catch (e) {
        console.error("Initialization failed:", e);
        setError('Gagal memuat data. Silakan refresh halaman.');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (livenessIntervalRef.current) {
        clearInterval(livenessIntervalRef.current);
      }
    };
  }, [user, authLoading, router, classId]);

  // Start location check when class data is ready
  useEffect(() => {
    if (step === 'location' && classData && !isLoading) {
      checkLocation();
    }
  }, [step, classData, isLoading]);

  // Reattach video stream when step changes to 'camera' (after liveness)
  useEffect(() => {
    if (step === 'camera' && streamRef.current && videoRef.current) {
      console.log('[Camera] Reattaching stream after step change');
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('[Camera] Play error:', e));
      setCameraReady(true);
    }
  }, [step]);

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
      }, 1000);
      
    } catch (err) {
      console.error('Location check failed:', err);
      setLocationStatus('invalid');
      setError('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.');
    }
  };

  const startCamera = async () => {
    try {
      setCameraReady(false);
      setStep('camera');
      setError('');
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera metadata loaded, playing...');
          videoRef.current?.play().then(() => {
            console.log('Camera playing');
            setCameraReady(true);
          }).catch(e => {
            console.error('Camera play failed:', e);
            setError('Gagal memulai kamera.');
          });
        };
        streamRef.current = stream;
      }

      // Start loading models in parallel if not ready
      if (!modelsReady) {
        console.log('Loading face models...');
        loadModels((progress, msg) => {
          setModelLoadingProgress(msg);
        }).catch(e => {
          console.error('Model loading failed:', e);
        });
      }
      
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  // Start liveness detection (blink check)
  const startLivenessCheck = async () => {
    try {
      setError('');
      setCameraReady(false);
      setStep('liveness');
      setLivenessState(createInitialLivenessState());
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Clear any existing interval
      if (livenessIntervalRef.current) {
        clearInterval(livenessIntervalRef.current);
      }

      console.log('[Liveness] Starting liveness check...');
      
      // Ensure models are loaded first
      if (!modelsReady) {
        setMessage('Memuat model pengenalan wajah...');
        await loadModels((progress, msg) => {
          setModelLoadingProgress(msg);
        });
      }

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          if (video.readyState >= 2) {
            resolve();
            return;
          }
          video.onloadedmetadata = () => {
            video.play().then(() => resolve());
          };
        });
        
        setCameraReady(true);
        setMessage('Kedipkan mata Anda 2 kali');
        console.log('[Liveness] Camera ready, starting blink detection...');
        
        // Start blink detection loop
        let currentState = createInitialLivenessState();
        
        livenessIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || currentState.isComplete) return;
          
          const landmarks = await detectFaceWithLandmarks(videoRef.current);
          
          if (landmarks) {
            const newState = processChallengeFrame(landmarks, currentState);
            currentState = newState;
            setLivenessState(newState);
            
            if (newState.isComplete) {
              console.log('[Liveness] Liveness check passed!');
              if (livenessIntervalRef.current) {
                clearInterval(livenessIntervalRef.current);
              }
              // Move to camera step after a short delay
              // Keep camera running - stream is already active
              setTimeout(() => {
                setStep('camera');
                setMessage('');
                // Re-ensure video is playing after step change
                if (videoRef.current && streamRef.current) {
                  videoRef.current.srcObject = streamRef.current;
                  videoRef.current.play().catch(e => console.warn('Video play:', e));
                }
              }, 500);
            }
          }
        }, 150); // Check every 150ms
      }
      
    } catch (err) {
      console.error('[Liveness] Error:', err);
      setError('Gagal memulai verifikasi liveness. Pastikan izin kamera diberikan.');
      setStep('location');
    }
  };
  
  const processAttendanceFlow = async () => {
    if (!user || !location) {
      setError("Data tidak lengkap untuk memproses absensi.");
      return;
    }

    console.log('Processing attendance for student:', user.id);
    
    // Check if student has registered face data
    if (!hasFaceRegistered) {
      console.log('Face not registered, redirecting to registration');
      setError("Anda belum mendaftarkan wajah. Silakan daftarkan wajah terlebih dahulu.");
      setTimeout(() => {
        router.push('/student/face-registration');
      }, 2000);
      return;
    }

    // Get face data from storage (server first, then localStorage)
    const faceData = await getFaceDataWithFallback(user.id);
    if (!faceData) {
      setError("Data wajah tidak ditemukan. Silakan daftarkan wajah terlebih dahulu.");
      setTimeout(() => {
        router.push('/student/face-registration');
      }, 2000);
      return;
    }
    
    console.log('Face data retrieved:', { 
      descriptorLength: faceData.face_descriptor?.length,
      registrationDate: faceData.registration_date 
    });

    // Make sure models are loaded before processing
    const status = getModelsStatus();
    if (!status.loaded) {
      setMessage('Menunggu model selesai dimuat...');
      setModelLoadingProgress('Memuat model...');
      await loadModels((progress, msg) => {
        setModelLoadingProgress(msg);
      });
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
      const faceResult = await processAttendanceWithFace(imageData, faceData.face_descriptor);
      
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

  const handleDone = () => {
    router.push('/student/dashboard');
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Memuat data kelas...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

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
                {classData.lecturer_name || 'Dosen'}
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
                  <Button onClick={startLivenessCheck} size="lg" className="px-8 py-4 text-lg font-semibold shadow-lg">
                    Lanjutkan ke Verifikasi Wajah
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

            {step === 'liveness' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Verifikasi Liveness</h3>
                  <p className="text-gray-600 text-lg">{getLivenessStatusMessage(livenessState)}</p>
                  {modelLoadingProgress && !modelsReady && (
                    <p className="text-blue-600 text-sm mt-2">{modelLoadingProgress}</p>
                  )}
                </div>
                <div className="relative max-w-lg mx-auto">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted 
                    className="w-full h-80 object-cover rounded-xl bg-gray-900 shadow-lg"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Memuat kamera...</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 border-2 border-dashed border-white rounded-xl m-6 flex items-center justify-center">
                    <div className="w-40 h-48 border-3 border-white rounded-full opacity-60" />
                  </div>
                </div>
                {/* Challenge Display */}
                <div className="flex flex-col items-center justify-center gap-6">
                  {/* Progress Indicator */}
                  <div className="flex gap-2">
                    {livenessState.challenges.map((challenge: LivenessChallenge, idx: number) => (
                      <div 
                        key={challenge.id}
                        className={`h-2 w-16 rounded-full transition-all ${
                          idx < livenessState.currentChallengeIndex || (idx === livenessState.currentChallengeIndex && challenge.isComplete)
                            ? 'bg-green-500' 
                            : idx === livenessState.currentChallengeIndex 
                              ? 'bg-blue-500 animate-pulse' 
                              : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Current Activity Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <span className="text-6xl mb-4 animate-bounce">
                      {livenessState.challenges[livenessState.currentChallengeIndex].icon}
                    </span>
                    <h4 className="text-2xl font-bold text-gray-800 text-center">
                      {livenessState.challenges[livenessState.currentChallengeIndex].label}
                    </h4>
                    <p className="text-gray-500 mt-2 text-sm">
                      {livenessState.currentChallengeIndex + 1} dari {livenessState.challenges.length} Tantangan
                    </p>
                  </div>
                </div>
                {livenessState.isComplete && (
                  <div className="text-center">
                    <p className="text-green-600 font-semibold text-lg">✓ Verifikasi berhasil! Melanjutkan...</p>
                  </div>
                )}
              </div>
            )}

            {step === 'camera' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Pindai Wajah</h3>
                  <p className="text-gray-600 text-lg">Posisikan wajah Anda di dalam bingkai.</p>
                  {!modelsReady && modelLoadingProgress && (
                    <p className="text-blue-600 text-sm mt-2">{modelLoadingProgress}</p>
                  )}
                </div>
                <div className="relative max-w-lg mx-auto">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted 
                    className="w-full h-80 object-cover rounded-xl bg-gray-900 shadow-lg"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Memuat kamera...</p>
                      </div>
                    </div>
                  )}
                  {/* Face guide overlay with background mask */}
                  <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                    {/* Semi-transparent overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Top mask */}
                      <div className="absolute top-0 left-0 right-0 h-[15%] bg-black/50" />
                      {/* Bottom mask */}
                      <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-black/50" />
                      {/* Left mask */}
                      <div className="absolute left-0 top-[15%] bottom-[15%] w-[20%] bg-black/50" />
                      {/* Right mask */}
                      <div className="absolute right-0 top-[15%] bottom-[15%] w-[20%] bg-black/50" />
                    </div>
                    
                    {/* Face oval guide */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-44 h-56 border-4 border-green-400 rounded-[50%] shadow-[0_0_0_4px_rgba(34,197,94,0.3)]" />
                        {/* Corner guides */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-green-400 rounded" />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-green-400 rounded" />
                        <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-1 h-8 bg-green-400 rounded" />
                        <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-1 h-8 bg-green-400 rounded" />
                      </div>
                    </div>
                    
                    {/* Instructions text */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Posisikan wajah di dalam oval
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Button 
                    onClick={processAttendanceFlow} 
                    size="lg"
                    className="flex items-center gap-3 px-8 py-4 text-lg font-semibold shadow-lg" 
                    disabled={isProcessing || !cameraReady}
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
                  {modelLoadingProgress && (
                    <p className="text-blue-600 text-sm mt-2">{modelLoadingProgress}</p>
                  )}
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