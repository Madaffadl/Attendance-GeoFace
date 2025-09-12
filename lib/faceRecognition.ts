import * as faceapi from 'face-api.js';

let modelsLoaded = false;

// Load face-api.js models
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = '/models';
    
    console.log('Loading face-api.js models...');
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
    ]);
    
    modelsLoaded = true;
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    modelsLoaded = false;
    throw new Error('Failed to load face recognition models');
  }
}

// Get face descriptor from image data
export async function getFaceDescriptor(imageData: string): Promise<Float32Array | null> {
  try {
    if (!modelsLoaded) {
      await loadModels();
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!detection) {
            console.warn('No face detected in image');
            resolve(null);
            return;
          }

          resolve(detection.descriptor);
        } catch (error) {
          console.error('Error processing face:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image');
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageData;
    });
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
}

// Process multiple face images for registration
export async function processMultipleFaceImages(imageDataArray: string[]): Promise<{
  success: boolean;
  averageDescriptor?: Float32Array;
  message: string;
}> {
  try {
    const descriptors: Float32Array[] = [];

    for (const imageData of imageDataArray) {
      const descriptor = await getFaceDescriptor(imageData);
      if (descriptor) {
        descriptors.push(descriptor);
      }
    }

    if (descriptors.length === 0) {
      return { 
        success: false, 
        message: 'Tidak ada wajah yang terdeteksi dalam foto. Pastikan wajah terlihat jelas.' 
      };
    }

    if (descriptors.length < 2) {
      return { 
        success: false, 
        message: 'Minimal 2 foto wajah harus berhasil diproses. Coba ambil foto dengan pencahayaan yang lebih baik.' 
      };
    }

    const averageDescriptor = calculateAverageDescriptor(descriptors);
    return {
      success: true,
      averageDescriptor,
      message: `Registrasi berhasil! ${descriptors.length} foto wajah berhasil diproses.`
    };
  } catch (error) {
    console.error('Error processing face images:', error);
    return { 
      success: false, 
      message: 'Terjadi kesalahan saat memproses foto wajah.' 
    };
  }
}

// Calculate average descriptor from multiple descriptors
function calculateAverageDescriptor(descriptors: Float32Array[]): Float32Array {
  const descriptorLength = descriptors[0].length;
  const averageDescriptor = new Float32Array(descriptorLength);

  for (let i = 0; i < descriptorLength; i++) {
    let sum = 0;
    for (const descriptor of descriptors) {
      sum += descriptor[i];
    }
    averageDescriptor[i] = sum / descriptors.length;
  }
  
  return averageDescriptor;
}

// Compare two face descriptors
export function compareFaces(descriptor1: Float32Array, descriptor2: Float32Array): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

// Validate face match for attendance
export function validateFaceMatch(
  currentDescriptor: Float32Array,
  registeredDescriptor: Float32Array,
  threshold: number = 0.6
): {
  isMatch: boolean;
  distance: number;
  confidence: number;
} {
  const distance = compareFaces(currentDescriptor, registeredDescriptor);
  const confidence = Math.max(0, 1 - distance);
  
  return { 
    isMatch: distance < threshold,
    distance, 
    confidence
  };
}

// Convert descriptor to string for storage
export function descriptorToString(descriptor: Float32Array): string {
  return Array.from(descriptor).join(',');
}

// Parse string back to Float32Array
export function stringToDescriptor(descriptorString: string): Float32Array {
  const values = descriptorString.split(',').map(Number);
  return new Float32Array(values);
}

// Capture image from video element
export function captureImageFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}

// Process attendance with face recognition
export async function processAttendanceWithFace(
  imageData: string,
  registeredDescriptorString: string
): Promise<{
  success: boolean;
  confidence: number;
  message: string;
}> {
  try {
    // Get current face descriptor
    const currentDescriptor = await getFaceDescriptor(imageData);
    if (!currentDescriptor) {
      return {
        success: false,
        confidence: 0,
        message: 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas di kamera.'
      };
    }

    // Parse registered descriptor
    const registeredDescriptor = stringToDescriptor(registeredDescriptorString);

    // Compare faces
    const validation = validateFaceMatch(currentDescriptor, registeredDescriptor);

    if (validation.isMatch) {
      return {
        success: true,
        confidence: validation.confidence,
        message: `Wajah terverifikasi! Tingkat kemiripan: ${(validation.confidence * 100).toFixed(1)}%`
      };
    } else {
      return {
        success: false,
        confidence: validation.confidence,
        message: `Wajah tidak cocok. Tingkat kemiripan: ${(validation.confidence * 100).toFixed(1)}% (minimal 60%)`
      };
    }
  } catch (error) {
    console.error('Error processing attendance:', error);
    return {
      success: false,
      confidence: 0,
      message: 'Terjadi kesalahan saat memproses pengenalan wajah.'
    };
  }
}