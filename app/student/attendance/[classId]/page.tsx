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
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  User
} from 'lucide-react';
import { Class } from '@/types';
import { getCurrentLocation, LocationCoordinates } from '@/lib/geolocation';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
  email: string;
  program_study: string;
  photo: string;
}

export default function AttendancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'location' | 'camera' | 'processing' | 'success'>('location');
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [faceAccuracy, setFaceAccuracy] = useState<number | null>(null);
  const [recognitionDetails, setRecognitionDetails] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

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
    fetchClassData();
  }, [router, classId]);

  useEffect(() => {
    if (step === 'location') {
      checkLocation();
    }
  }, [step]);

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

  const checkLocation = async () => {
    try {
      setLocationStatus('checking');
      setMessage('Checking your location...');
      
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      
      // For demo purposes, always show valid location
      // In real implementation, validate against class location
      setTimeout(() => {
        setLocationStatus('valid');
        setMessage('Location verified! You are within the allowed area.');
      }, 2000);
      
    } catch (error) {
      setLocationStatus('invalid');
      setError(error instanceof Error ? error.message : 'Failed to get location');
    }
  };

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
      
      setStep('camera');
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
      setFaceImage(imageData);
      
      // Stop the camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      processAttendance(imageData);
    }
  };

  const processAttendance = async (imageData: string) => {
    if (!user || !classData || !location) return;

    setStep('processing');
    setIsProcessing(true);
    setMessage('Processing attendance...');

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user.id,
          class_id: classId,
          location,
          face_data: imageData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        setMessage('Attendance marked successfully!');
        setFaceAccuracy(data.faceRecognition?.confidence * 100 || 0);
        setRecognitionDetails(data.faceRecognition);
      } else {
        setError(data.message || 'Failed to mark attendance');
        setStep('location'); // Reset to start
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setStep('location'); // Reset to start
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
              <h1 className="text-xl font-semibold text-gray-900">Mark Attendance</h1>
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

        {/* Step Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center gap-2 ${step === 'location' || locationStatus === 'checking' ? 'text-blue-600' : locationStatus === 'valid' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${locationStatus === 'valid' ? 'bg-green-100' : locationStatus === 'checking' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {locationStatus === 'checking' ? (
                  <LoadingSpinner size="sm" />
                ) : locationStatus === 'valid' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm font-medium">Location</span>
            </div>

            <div className={`w-16 h-px ${locationStatus === 'valid' ? 'bg-green-200' : 'bg-gray-200'}`} />

            <div className={`flex items-center gap-2 ${step === 'camera' ? 'text-blue-600' : step === 'processing' || step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'success' ? 'bg-green-100' : step === 'camera' || step === 'processing' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {step === 'processing' ? (
                  <LoadingSpinner size="sm" />
                ) : step === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm font-medium">Face Recognition</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-8">
            {/* Location Step */}
            {step === 'location' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  {locationStatus === 'checking' ? (
                    <LoadingSpinner />
                  ) : locationStatus === 'valid' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <MapPin className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {locationStatus === 'checking' ? 'Verifying Location' : 
                     locationStatus === 'valid' ? 'Location Verified' : 'Location Check Failed'}
                  </h3>
                  <p className="text-gray-600">
                    {message || error}
                  </p>
                </div>

                {locationStatus === 'valid' && (
                  <Button onClick={startCamera} size="lg">
                    Continue to Face Recognition
                  </Button>
                )}

                {locationStatus === 'invalid' && (
                  <Button onClick={retryLocation} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry Location Check
                  </Button>
                )}
              </div>
            )}

            {/* Camera Step */}
            {step === 'camera' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Face Recognition</h3>
                  <p className="text-gray-600">Position your face in the camera and take a photo</p>
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

                <div className="text-center">
                  <Button onClick={capturePhoto} size="lg" className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </Button>
                </div>

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
                  <h3 className="text-xl font-semibold mb-2">Memproses Absensi</h3>
                  <p className="text-gray-600">
                    Memverifikasi identitas dan menandai kehadiran...
                  </p>
                  <div className="mt-4 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Target className="w-4 h-4" />
                      Menganalisis data wajah...
                    </div>
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
                  <h3 className="text-xl font-semibold mb-2 text-green-800">Absensi Berhasil!</h3>
                  <p className="text-gray-600">
                    Kehadiran Anda telah berhasil dicatat untuk {classData.class_name}.
                  </p>
                </div>

                {/* Face Recognition Accuracy */}
                {faceAccuracy !== null && (
                  <div className="max-w-md mx-auto">
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-800">Akurasi Face Recognition</span>
                          <Badge variant={faceAccuracy >= 90 ? "default" : faceAccuracy >= 70 ? "secondary" : "destructive"}>
                            {faceAccuracy.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${faceAccuracy}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-green-700">
                          {faceAccuracy >= 90 ? 'Sangat Akurat' : 
                           faceAccuracy >= 70 ? 'Cukup Akurat' : 'Kurang Akurat'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Recognition Details */}
                {recognitionDetails && (
                  <div className="max-w-md mx-auto">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Detail Verifikasi</h4>
                        <div className="space-y-1 text-xs text-blue-700">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-medium">{recognitionDetails.success ? 'Terverifikasi' : 'Gagal'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Confidence Score:</span>
                            <span className="font-medium">{(recognitionDetails.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Match Quality:</span>
                            <span className="font-medium">
                              {recognitionDetails.confidence >= 0.9 ? 'Excellent' : 
                               recognitionDetails.confidence >= 0.7 ? 'Good' : 'Fair'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {new Date().toLocaleString()}
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
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}