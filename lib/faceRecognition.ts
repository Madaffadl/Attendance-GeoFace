import * as faceapi from 'face-api.js';

let modelsLoaded = false;

// Muat model face-api.js
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
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

// Ambil descriptor wajah dari data gambar base64
export async function getFaceDescriptor(imageData: string): Promise<Float32Array | null> {
  try {
    const img = new Image();
    img.src = imageData;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });

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

// Hitung jarak Euclidean antar descriptor
export function compareFaces(descriptor1: Float32Array, descriptor2: Float32Array): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

/**
 * Validasi kecocokan berbasis persentase (confidence).
 * Rumus: confidence = max(0, 1 - distance).
 * Lolos jika confidence >= minConfidence.
 * Default 6% (0.06) agar sangat longgar.
 */
export function validateFaceMatch(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  minConfidence: number = 0.06
): {
  isMatch: boolean;
  distance: number;
  confidence: number;
} {
  const distance = compareFaces(descriptor1, descriptor2);
  const confidence = Math.max(0, 1 - distance);
  const isMatch = confidence >= minConfidence;
  return { isMatch, distance, confidence };
}

/**
 * Alternatif: validasi berbasis jarak maksimum.
 * 6% confidence ≙ maxDistance ≈ 0.94.
 */
export function validateFaceMatchByDistance(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  maxDistance: number = 0.94
): {
  isMatch: boolean;
  distance: number;
  confidence: number;
} {
  const distance = compareFaces(descriptor1, descriptor2);
  const confidence = Math.max(0, 1 - distance);
  const isMatch = distance <= maxDistance;
  return { isMatch, distance, confidence };
}

// Proses banyak foto untuk registrasi dan hasilkan rata-rata descriptor
export async function processMultipleFaceImages(imageDataArray: string[]): Promise<{
  success: boolean;
  averageDescriptor?: Float32Array;
  message: string;
}> {
  try {
    const descriptors: Float32Array[] = [];

    for (const imageData of imageDataArray) {
      const descriptor = await getFaceDescriptor(imageData);
      if (descriptor) descriptors.push(descriptor);
    }

    if (descriptors.length === 0) {
      return { success: false, message: 'No faces detected in any of the provided images' };
    }

    if (descriptors.length < imageDataArray.length * 0.6) {
      return {
        success: false,
        message: 'Too few faces detected. Please ensure your face is clearly visible in all photos'
      };
    }

    const averageDescriptor = calculateAverageDescriptor(descriptors);
    return {
      success: true,
      averageDescriptor,
      message: `Successfully processed ${descriptors.length} face images`
    };
  } catch (error) {
    console.error('Error processing face images:', error);
    return { success: false, message: 'Error processing face images' };
  }
}

// Hitung rata-rata descriptor
function calculateAverageDescriptor(descriptors: Float32Array[]): Float32Array {
  const descriptorLength = descriptors[0].length;
  const averageDescriptor = new Float32Array(descriptorLength);

  for (let i = 0; i < descriptorLength; i++) {
    let sum = 0;
    for (const descriptor of descriptors) sum += descriptor[i];
    averageDescriptor[i] = sum / descriptors.length;
  }
  return averageDescriptor;
}

// Serialisasi descriptor ke string
export function descriptorToString(descriptor: Float32Array): string {
  return Array.from(descriptor).join(',');
}

// Parse string ke Float32Array
export function stringToDescriptor(descriptorString: string): Float32Array {
  const values = descriptorString.split(',').map(Number);
  return new Float32Array(values);
}

// Ambil frame dari elemen video sebagai gambar base64
export function captureImageFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}

/** Contoh pemakaian absensi sangat longgar (6%)
 * const res = validateFaceMatch(descA, descB, 0.06);
 * if (res.isMatch) // tandai hadir
 */
