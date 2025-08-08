'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  User,
} from 'lucide-react';
import { Class } from '@/types';

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
    if (step === 'camera') {
      startCamera();
    }
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setError('');
    } catch (error) {
      setError('Failed to access camera. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
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
    }
  };

  const processFaceRegistration = async (images: string[]) => {
    if (!user || !classData) return;

    setStep('processing');
    setIsProcessing(true);
    setMessage('Memproses registrasi wajah...');

    try {
      // Simulate processing each image
      for (let i = 0; i < images.length; i++) {
        setRegistrationProgress(((i + 1) / images.length) * 100);
        setMessage(`Memproses foto ${i + 1}/${images.length}...`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await fetch('/api/face-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user.id,
          class_id: classId,
          face_images: images
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        setMessage('Registrasi wajah berhasil!');
      } else {
        setError(data.message || 'Failed to register face');
        setStep('camera');
        setFaceImages([]);
        setCurrentImageIndex(0);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setStep('camera');
      setFaceImages([]);
      setCurrentImageIndex(0);
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
    router.push('/student/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 mr-4">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Registrasi Wajah</h1>
              <p className="text-sm text-gray-600">{classData.class_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Info Card */}
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

        {/* Main Content */}
        <Card>
          <CardContent className="p-8">
            {/* Camera Step */}
            {step === 'camera' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Registrasi Wajah untuk Kelas</h3>
                  <p className="text-gray-600">
                    Ambil {requiredImages} foto wajah dari sudut yang berbeda untuk registrasi yang akurat
                  </p>
                </div>

                {/* Progress */}
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{faceImages.length}/{requiredImages} foto</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(faceImages.length / requiredImages) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="relative max-w-md mx-auto">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover rounded-lg bg-black"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white rounded-lg m-4 flex items-center justify-center">
                    <div className="w-32 h-40 border-2 border-white rounded-full opacity-50" />
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center text-sm text-gray-600 max-w-md mx-auto">
                  <p className="mb-2">
                    <strong>Petunjuk:</strong>
                  </p>
                  <ul className="text-left space-y-1">
                    <li>• Pastikan wajah terlihat jelas</li>
                    <li>• Ambil foto dari sudut yang berbeda</li>
                    <li>• Hindari cahaya yang terlalu terang/gelap</li>
                    <li>• Jangan gunakan kacamata atau masker</li>
                  </ul>
                </div>

                <div className="text-center">
                  <Button onClick={capturePhoto} size="lg" className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Ambil Foto ({faceImages.length + 1}/{requiredImages})
                  </Button>
                </div>

                {message && (
                  <Alert className="max-w-md mx-auto">
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
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <LoadingSpinner />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">Memproses Registrasi Wajah</h3>
                  <p className="text-gray-600 mb-4">
                    {message}
                  </p>
                  <div className="max-w-md mx-auto">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${registrationProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{Math.round(registrationProgress)}% selesai</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-green-800">Registrasi Berhasil!</h3>
                  <p className="text-gray-600">
                    Wajah Anda telah berhasil didaftarkan untuk kelas {classData.class_name}.
                    Sekarang Anda dapat melakukan absensi menggunakan face recognition.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg max-w-md mx-auto">
                  <h4 className="font-medium text-green-800 mb-2">Yang telah didaftarkan:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ {requiredImages} foto wajah dari berbagai sudut</li>
                    <li>✓ Data biometrik wajah</li>
                    <li>✓ Profil face recognition untuk kelas ini</li>
                  </ul>
                </div>

                <Button onClick={handleDone} size="lg">
                  Selesai
                </Button>
              </div>
            )}

            {/* Error Alert */}
            {error && step !== 'success' && (
              <Alert className="mt-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                  {step === 'camera' && (
                    <Button 
                      onClick={retryRegistration} 
                      variant="outline" 
                      size="sm" 
                      className="ml-4 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Coba Lagi
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}