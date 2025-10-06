'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, CircleCheck as CheckCircle, CircleAlert as AlertCircle, RefreshCw, User } from 'lucide-react';
import { Class } from '@/types';
import { loadModels, processMultipleFaceImages, descriptorToString, captureImageFromVideo } from '@/lib/faceRecognition';
import { saveFaceData } from '@/lib/faceStorage';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
  email: string;
  program_study: string;
  photo: string;
}

export default function RegisterFacePage() {
  const [user, setUser] = useState<User | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'camera' | 'processing' | 'success'>('camera');
  const [faceImages, setFaceImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [registrationProgress, setRegistrationProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const requiredImages = 5; // Butuh 5 foto untuk registrasi yang akurat

  useEffect(() => {
    const initializeModels = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face recognition models:', error);
        setError('Failed to load face recognition models. Please refresh the page.');
      }
    };

    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.userType !== 'student') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);

    // Initialize face recognition models
    initializeModels();

    const fetchClassData = async () => {
      try {
        const response = await fetch('/api/classes');
        const data = await response.json();

        if (data.success) {
          const foundClass = data.classes.find((cls: Class) => cls.id === classId);
          if (foundClass) {
            setClassData(foundClass);
          } else {
            setError('Class not found');
          }
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
        setError('Failed to load class data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [router, classId]);

  useEffect(() => {
    if (step === 'camera' && modelsLoaded && !streamRef.current) {
      startCamera();
    }
  }, [step, modelsLoaded]);

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        streamRef.current = stream;
      }
      
      setError('');
    } catch (error) {
      setError('Failed to access camera. Please allow camera permissions.');
      console.error('Camera access error:', error);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const imageData = captureImageFromVideo(videoRef.current);
      const newImages = [...faceImages, imageData];
      setFaceImages(newImages);
      setCurrentImageIndex(currentImageIndex + 1);
      
      if (newImages.length >= requiredImages) {
        // Stop the camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        processFaceRegistration(newImages);
      } else {
        setMessage(`Foto ${newImages.length}/${requiredImages} berhasil diambil. Ambil foto dari sudut yang berbeda.`);
      }
    } catch (error) {
      setError('Failed to capture photo. Please try again.');
    }
  };

  const processFaceRegistration = async (images: string[]) => {
    if (!user || !classData) return;

    setStep('processing');
    setIsProcessing(true);
    setMessage('Memproses registrasi wajah...');

    try {
      setMessage('Menganalisis wajah dari foto...');
      setRegistrationProgress(25);
      
      const faceProcessingResult = await processMultipleFaceImages(images);
      setRegistrationProgress(50);
      
      if (!faceProcessingResult.success || !faceProcessingResult.averageDescriptor) {
        setError(faceProcessingResult.message);
        setStep('camera');
        setFaceImages([]);
        setCurrentImageIndex(0);
        setRegistrationProgress(0);
        return;
      }
      
      setMessage('Menyimpan data wajah...');
      setRegistrationProgress(75);
      
      const descriptorString = descriptorToString(faceProcessingResult.averageDescriptor);

      const response = await fetch('/api/face-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user.id,
          class_id: classId,
          face_descriptor: descriptorString
        }),
      });

      const data = await response.json();

      setRegistrationProgress(100);
      
      if (data.success) {
        // Save face data to persistent storage
        if (user && data.face_descriptor) {
          saveFaceData(user.id, data.face_descriptor, 0.95, images.length);
          console.log('Face registration successful, data saved to persistent storage');
        }
        
        setStep('success');
        setMessage('Registrasi wajah berhasil!');
      } else {
        setError(data.message || 'Gagal mendaftarkan wajah');
        setStep('camera');
        setFaceImages([]);
        setCurrentImageIndex(0);
        setRegistrationProgress(0);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
      setStep('camera');
      setFaceImages([]);
      setCurrentImageIndex(0);
      setRegistrationProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const retryRegistration = () => {
    setError('');
    setFaceImages([]);
    setCurrentImageIndex(0);
    setRegistrationProgress(0);
    setStep('camera');
    startCamera();
  };

  const handleBack = () => {
    // Stop camera if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    router.push('/student/dashboard');
  };

  const handleDone = () => {
    console.log('Registration completed, navigating to dashboard');
    router.push('/student/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {!modelsLoaded ? 'Loading face recognition models...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600">{error || 'Failed to load data'}</p>
            <Button onClick={handleBack} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 mr-6 text-base">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Registrasi Wajah</h1>
              <p className="text-base text-gray-600">{classData.class_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Info Card */}
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

        {/* Main Content */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-10">
            {/* Camera Step */}
            {step === 'camera' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Registrasi Wajah untuk Kelas</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Ambil {requiredImages} foto wajah dari sudut yang berbeda untuk registrasi yang akurat.
                    Pastikan wajah terlihat jelas dan pencahayaan cukup.
                  </p>
                </div>

                {/* Progress */}
                <div className="max-w-lg mx-auto">
                  <div className="flex justify-between text-base text-gray-600 mb-3">
                    <span>Progress</span>
                    <span>{faceImages.length}/{requiredImages} foto</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(faceImages.length / requiredImages) * 100}%` }}
                    />
                  </div>
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

                {/* Instructions */}
                <div className="text-center text-base text-gray-600 max-w-lg mx-auto">
                  <p className="mb-3 font-semibold">
                    <strong>Petunjuk:</strong>
                  </p>
                  <ul className="text-left space-y-2 bg-gray-50 p-4 rounded-lg">
                    <li>• Pastikan wajah terlihat jelas</li>
                    <li>• Ambil foto dari sudut yang berbeda</li>
                    <li>• Hindari cahaya yang terlalu terang/gelap</li>
                    <li>• Jangan gunakan kacamata atau masker</li>
                  </ul>
                </div>

                <div className="text-center">
                  <Button onClick={capturePhoto} size="lg" className="flex items-center gap-3 px-8 py-4 text-lg font-semibold shadow-lg">
                    <Camera className="w-6 h-6" />
                    Ambil Foto ({faceImages.length + 1}/{requiredImages})
                  </Button>
                  
                  {!modelsLoaded && (
                    <p className="text-base text-yellow-600 mt-4">
                      Loading face recognition models...
                    </p>
                  )}
                </div>

                {message && (
                  <Alert className="max-w-lg mx-auto bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <LoadingSpinner />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-4">Memproses Registrasi Wajah</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {message}
                  </p>
                  <div className="max-w-lg mx-auto">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${registrationProgress}%` }}
                      />
                    </div>
                    <p className="text-base text-gray-500 mt-3">{Math.round(registrationProgress)}% selesai</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-green-800">Registrasi Berhasil!</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Wajah Anda telah berhasil didaftarkan untuk kelas {classData.class_name}.
                    Sekarang Anda dapat melakukan absensi menggunakan face recognition.
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-xl max-w-lg mx-auto border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 text-lg">Yang telah didaftarkan:</h4>
                  <ul className="text-base text-green-700 space-y-2">
                    <li>✓ {requiredImages} foto wajah dari berbagai sudut</li>
                    <li>✓ Data biometrik wajah</li>
                    <li>✓ Profil face recognition tersimpan</li>
                  </ul>
                </div>

                <Button onClick={handleDone} size="lg" className="px-8 py-4 text-lg font-semibold shadow-lg">
                  Selesai
                </Button>
              </div>
            )}

            {/* Error Alert */}
            {error && step !== 'success' && (
              <Alert className="mt-8 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {error && step === 'camera' && (
              <div className="mt-6 text-center">
                <Button 
                  onClick={retryRegistration} 
                  variant="outline" 
                  className="flex items-center gap-3 px-6 py-3 text-base font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Coba Lagi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}