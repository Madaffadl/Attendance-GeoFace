import * as faceapi from 'face-api.js';

let modelsLoaded = false;

// Load face-api.js models
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    // Load models from public/models directory
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      faceapi.nets.ageGenderNet.loadFromUri('/models'),
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    ]);
    
    modelsLoaded = true;
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    throw new Error('Failed to load face recognition models');
  }
}

// Get face descriptor from image
export async function getFaceDescriptor(imageData: string): Promise<Float32Array | null> {
  try {
    // Create image element from base64 data
    const img = new Image();
    img.src = imageData;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Detect face and get descriptor
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in image');
    }

    return detection.descriptor;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
}

// Compare two face descriptors
export function compareFaces(descriptor1: Float32Array, descriptor2: Float32Array): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

// Validate if two faces match
export function validateFaceMatch(descriptor1: Float32Array, descriptor2: Float32Array, threshold: number = 0.6): {
  isMatch: boolean;
  distance: number;
  confidence: number;
} {
  const distance = compareFaces(descriptor1, descriptor2);
  const isMatch = distance < threshold;
  const confidence = Math.max(0, 1 - distance);

  return {
    isMatch,
    distance,
    confidence
  };
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
        message: 'No faces detected in any of the provided images'
      };
    }

    if (descriptors.length < imageDataArray.length * 0.6) {
      return {
        success: false,
        message: 'Too few faces detected. Please ensure your face is clearly visible in all photos'
      };
    }

    // Calculate average descriptor for better accuracy
    const averageDescriptor = calculateAverageDescriptor(descriptors);

    return {
      success: true,
      averageDescriptor,
      message: `Successfully processed ${descriptors.length} face images`
    };
  } catch (error) {
    console.error('Error processing face images:', error);
    return {
      success: false,
      message: 'Error processing face images'
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

// Convert Float32Array to string for storage
export function descriptorToString(descriptor: Float32Array): string {
  return Array.from(descriptor).join(',');
}

// Convert string back to Float32Array
export function stringToDescriptor(descriptorString: string): Float32Array {
  const values = descriptorString.split(',').map(Number);
  return new Float32Array(values);
}

// Capture image from video element
export function captureImageFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}