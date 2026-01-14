import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let modelsLoading = false;
let loadProgress = 0;

// Model loading progress callback type
type ProgressCallback = (progress: number, message: string) => void;

// Get current loading status
export function getModelsStatus(): { loaded: boolean; loading: boolean; progress: number } {
  return { loaded: modelsLoaded, loading: modelsLoading, progress: loadProgress };
}

// Load face-api.js models with progress tracking
export async function loadModels(onProgress?: ProgressCallback): Promise<void> {
  if (modelsLoaded) {
    onProgress?.(100, 'Model sudah dimuat');
    return;
  }

  if (modelsLoading) {
    // Wait for existing load to complete
    while (modelsLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  modelsLoading = true;
  loadProgress = 0;

  try {
    const MODEL_URL = '/models';
    
    console.log('Loading face-api.js models...');
    
    // Load models one by one for progress tracking
    onProgress?.(10, 'Memuat model deteksi wajah (SSD)...');
    loadProgress = 10;
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    
    onProgress?.(30, 'Memuat model deteksi wajah (Tiny)...');
    loadProgress = 30;
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    
    onProgress?.(50, 'Memuat model landmark wajah...');
    loadProgress = 50;
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    
    onProgress?.(80, 'Memuat model pengenalan wajah...');
    loadProgress = 80;
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    
    // Using ssdMobilenetv1 for better accuracy
    
    loadProgress = 100;
    modelsLoaded = true;
    modelsLoading = false;
    onProgress?.(100, 'Semua model berhasil dimuat!');
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    modelsLoaded = false;
    modelsLoading = false;
    loadProgress = 0;
    throw new Error('Failed to load face recognition models');
  }
}

// Pre-load models in background (called after login)
export function preloadModelsInBackground(): void {
  if (modelsLoaded || modelsLoading) return;
  
  console.log('Pre-loading face recognition models in background...');
  loadModels().catch(err => {
    console.warn('Background model pre-load failed:', err);
  });
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
          // Using SSD model for better accuracy
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
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
// Returns both individual descriptors (for best-match) and average (for fallback)
export async function processMultipleFaceImages(imageDataArray: string[]): Promise<{
  success: boolean;
  averageDescriptor?: Float32Array;
  allDescriptors?: Float32Array[];  // New: all individual descriptors for best-match
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
      allDescriptors: descriptors,  // Return all individual descriptors
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
// Threshold 0.30 = 70% minimum similarity
export function validateFaceMatch(
  currentDescriptor: Float32Array,
  registeredDescriptor: Float32Array,
  threshold: number = 0.30
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

// Validate face match using best-of strategy (compare against all registered descriptors)
// Returns the best match (highest confidence) among all comparisons
export function validateFaceMatchBestOf(
  currentDescriptor: Float32Array,
  registeredDescriptors: Float32Array[],
  threshold: number = 0.30
): {
  isMatch: boolean;
  distance: number;
  confidence: number;
  bestMatchIndex: number;
} {
  if (registeredDescriptors.length === 0) {
    return { isMatch: false, distance: 1, confidence: 0, bestMatchIndex: -1 };
  }

  let bestDistance = Infinity;
  let bestIndex = 0;

  for (let i = 0; i < registeredDescriptors.length; i++) {
    const distance = compareFaces(currentDescriptor, registeredDescriptors[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  const confidence = Math.max(0, 1 - bestDistance);
  console.log(`[BestMatch] Best distance: ${bestDistance.toFixed(4)}, confidence: ${(confidence * 100).toFixed(1)}%, index: ${bestIndex}`);
  
  return { 
    isMatch: bestDistance < threshold,
    distance: bestDistance, 
    confidence,
    bestMatchIndex: bestIndex
  };
}

// Convert single descriptor to string for storage
export function descriptorToString(descriptor: Float32Array): string {
  return Array.from(descriptor).join(',');
}

// Convert multiple descriptors to string for storage (separated by |)
export function descriptorsToString(descriptors: Float32Array[]): string {
  return descriptors.map(d => descriptorToString(d)).join('|');
}

// Parse string back to Float32Array
export function stringToDescriptor(descriptorString: string): Float32Array {
  const values = descriptorString.split(',').map(Number);
  return new Float32Array(values);
}

// Parse string back to multiple Float32Arrays
export function stringToDescriptors(descriptorsString: string): Float32Array[] {
  if (!descriptorsString || !descriptorsString.includes('|')) {
    // Fallback: single descriptor format
    return [stringToDescriptor(descriptorsString)];
  }
  return descriptorsString.split('|').map(d => stringToDescriptor(d));
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

// Helper to generate augmented versions of an image
async function generateAugmentedImages(originalImageData: string): Promise<string[]> {
  const images = [originalImageData]; // Always include original
  
  // Create an image element to draw to canvas
  const img = new Image();
  img.src = originalImageData;
  
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return images;

  // Define augmentations: [brightness, contrast]
  // 100% is normal. We vary ±20%
  const variations = [
    { filter: 'brightness(120%)' }, // Brighter
    { filter: 'brightness(80%)' },  // Darker
    { filter: 'contrast(120%)' },   // High contrast
    // { filter: 'contrast(80%)' }, // Low contrast (often less helpful for face rec)
  ];

  for (const variation of variations) {
    ctx.filter = variation.filter;
    ctx.drawImage(img, 0, 0);
    images.push(canvas.toDataURL('image/jpeg', 0.9));
    
    // Clear filter for next iteration (though we redraw image anyway, good practice)
    ctx.filter = 'none';
  }
  
  return images;
}

// Process attendance with face recognition (using best-match strategy + TTA)
export async function processAttendanceWithFace(
  imageData: string,
  registeredDescriptorString: string
): Promise<{
  success: boolean;
  confidence: number;
  message: string;
}> {
  try {
    // 1. Generate augmented images (original + variations)
    const augmentedImages = await generateAugmentedImages(imageData);
    console.log(`[TTA] Generated ${augmentedImages.length} image variations for checking`);

    // 2. Extract descriptors for ALL augmented images
    const currentDescriptors: Float32Array[] = [];
    
    for (const imgData of augmentedImages) {
      const descriptor = await getFaceDescriptor(imgData);
      if (descriptor) {
        currentDescriptors.push(descriptor);
      }
    }

    if (currentDescriptors.length === 0) {
      return {
        success: false,
        confidence: 0,
        message: 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas di kamera.'
      };
    }

    console.log(`[TTA] Valid descriptors found: ${currentDescriptors.length}/${augmentedImages.length}`);

    // Parse registered descriptors
    const registeredDescriptors = stringToDescriptors(registeredDescriptorString);
    console.log(`[Attendance] Comparing against ${registeredDescriptors.length} registered descriptors`);

    // 3. Compare EVERY valid current descriptor against ALL registered descriptors
    // Find the global best match
    let globalBestMatch = { 
      isMatch: false, 
      distance: 1, 
      confidence: 0 
    };

    for (const currDesc of currentDescriptors) {
      const match = validateFaceMatchBestOf(currDesc, registeredDescriptors);
      if (match.confidence > globalBestMatch.confidence) {
        globalBestMatch = match;
      }
    }

    console.log(`[TTA] Global best match confidence: ${(globalBestMatch.confidence * 100).toFixed(1)}%`);

    if (globalBestMatch.isMatch) {
      return {
        success: true,
        confidence: globalBestMatch.confidence,
        message: `Wajah terverifikasi! Tingkat kemiripan: ${(globalBestMatch.confidence * 100).toFixed(1)}%`
      };
    } else {
      return {
        success: false,
        confidence: globalBestMatch.confidence,
        message: `Wajah tidak cocok. Tingkat kemiripan: ${(globalBestMatch.confidence * 100).toFixed(1)}% (minimal 70%)`
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

// ==========================================
// QUALITY CONTROL FUNCTIONS
// ==========================================

// Calculate image sharpness to detect blur
// Returns score 0-100 (Higher is sharper)
export async function calculateImageSharpness(imageData: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(0);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and calculate simple edge variance
      // This is a simplified "Laplacian variant"
      let sum = 0;
      let count = 0;
      const width = canvas.width;
      
      // Skip edges
      for (let y = 1; y < canvas.height - 1; y += 2) { // Skip lines for speed
        for (let x = 1; x < width - 1; x += 2) {
          const i = (y * width + x) * 4;
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // Neighbors
          const left = (y * width + (x - 1)) * 4;
          const right = (y * width + (x + 1)) * 4;
          const top = ((y - 1) * width + x) * 4;
          const bottom = ((y + 1) * width + x) * 4;
          
          const grayLeft = 0.299 * data[left] + 0.587 * data[left + 1] + 0.114 * data[left + 2];
          const grayRight = 0.299 * data[right] + 0.587 * data[right + 1] + 0.114 * data[right + 2];
          const grayTop = 0.299 * data[top] + 0.587 * data[top + 1] + 0.114 * data[top + 2];
          const grayBottom = 0.299 * data[bottom] + 0.587 * data[bottom + 1] + 0.114 * data[bottom + 2];
          
          // Edge magnitude (Laplacian kernel)
          const edge = Math.abs(4 * gray - grayLeft - grayRight - grayTop - grayBottom);
          sum += edge;
          count++;
        }
      }
      
      const avgEdge = sum / count;
      // Normalize: simple heuristic, typically sharp images have avgEdge > 10-15
      // Map 0-30 to 0-100
      const score = Math.min(100, Math.max(0, (avgEdge / 20) * 100));
      resolve(score);
    };
    img.src = imageData;
  });
}

// Estimate Head Pose from landmarks
// Returns direction 'Center', 'Left', 'Right', 'Up', 'Down'
export function estimateHeadPose(landmarks: faceapi.FaceLandmarks68): {
  yaw: number; // Left/Right (- is Right, + is Left)
  pitch: number; // Up/Down (- is Up, + is Down)
  direction: string;
} {
  const nose = landmarks.getNose()[0];
  const jaw = landmarks.getJawOutline();
  const leftJaw = jaw[0];
  const rightJaw = jaw[16];
  
  // Calculate Yaw (Left/Right)
  // Compare distance nose-to-left-cheek vs nose-to-right-cheek
  const distToLeft = Math.abs(nose.x - leftJaw.x);
  const distToRight = Math.abs(nose.x - rightJaw.x);
  const yawRatio = (distToRight - distToLeft) / (distToRight + distToLeft);
  
  // Calculate Pitch (Up/Down) using MOUTH (more effective/stable than Chin)
  // Ratio: (Nose - EyeCenter) / (MouthCenter - EyeCenter)
  // Normal ~ 0.4 - 0.5
  // Up (Nose closer to Eyes) < 0.35
  // Down (Nose closer to Mouth) > 0.55
  
  const mouth = landmarks.getMouth();
  // Simply average some mouth points to get center
  const mouthTop = mouth[3]; // Top lip center-ish
  const mouthBottom = mouth[9]; // Bottom lip center-ish
  const mouthCenterY = (mouthTop.y + mouthBottom.y) / 2;

  const leftEye = landmarks.getLeftEye()[0];
  const rightEye = landmarks.getRightEye()[3];
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  
  const faceCoreHeight = Math.abs(mouthCenterY - eyeCenterY);
  // REMOVED Math.abs to allow signed pitch detection
  // Negative = Nose above eyes (Look Up / Tilting Back)
  // Positive = Nose below eyes (Normal / Look Down)
  const nosePos = nose.y - eyeCenterY; 
  const pitchRatio = nosePos / faceCoreHeight;

  // Thresholds
  let direction = 'Depan';
  
  // Yaw Check
  // Fix for Mirrored Camera (Selfie Mode):
  // User Look Left -> Raw Camera sees Face Turn Right -> Yaw is Negative
  // User Look Right -> Raw Camera sees Face Turn Left -> Yaw is Positive
  if (yawRatio > 0.2) direction = 'Kanan'; // Was Kiri
  else if (yawRatio < -0.2) direction = 'Kiri'; // Was Kanan
  
  // Pitch Check (Only if yaw is relatively center)
  if (Math.abs(yawRatio) < 0.30) {
      // NOTE: Signed Metric Calibration
      // User data: Front ~ 0.02, Down > 0.12
      // Up was registering as 0.13/0.22 absolute, which means it was -0.13/-0.22 signed.
      
      if (pitchRatio < 0.00) direction = 'Atas'; // Negative = Nose went above eyes
      else if (pitchRatio > 0.12) direction = 'Bawah'; // Large Positive = Nose went far down
  }

  return { yaw: yawRatio, pitch: pitchRatio, direction };
}

// Validate image quality and pose for registration
export async function validateImageQuality(
  imageData: string, 
  currentStepIndex: number
): Promise<{
  isValid: boolean;
  message: string;
  debugValues?: { pitch: number; yaw: number; sharpness: number; direction: string };
}> {
  try {
    // 1. Check Sharpness
    const sharpness = await calculateImageSharpness(imageData);
    console.log(`[Quality] Sharpness score: ${sharpness.toFixed(1)}`);
    
    // Threshold: > 10 is lenient
    if (sharpness < 10) {
      return { 
        isValid: false, 
        message: 'Foto terlalu buram. Mohon stabilkan kamera.',
        debugValues: { pitch: 0, yaw: 0, sharpness, direction: 'Blurry' }
      };
    }

    // 2. Load image for detection
    const img = new Image();
    img.src = imageData;
    await new Promise((resolve) => { img.onload = resolve; });

    // 3. Detect Landmarks for Pose
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks();

    if (!detection) {
      return { 
        isValid: false, 
        message: 'Wajah tidak terdeteksi. Pastikan wajah masuk frame.',
        debugValues: { pitch: 0, yaw: 0, sharpness, direction: 'No Face' }
      };
    }

    // 4. Estimate and Check Pose
    const pose = estimateHeadPose(detection.landmarks);
    console.log(`[Quality] Detected Pose: ${pose.direction} (Yaw: ${pose.yaw.toFixed(2)}, Pitch: ${pose.pitch.toFixed(2)})`);

    const expectedPose = getExpectedPose(currentStepIndex);
    
    // Logic to validate pose
    let isPoseCorrect = false;
    
    // Strictness: relax for diagonals but enforcing main direction
    if (expectedPose === 'Depan') {
      // Allow slight deviations but prevent extreme turns
      // "Depan" Range: -0.05 to +0.12
      // Allows slightly Up (-0.05) to slightly Down (+0.12)
      isPoseCorrect = ['Depan'].includes(pose.direction) || 
                      (Math.abs(pose.yaw) < 0.25 && (pose.pitch > -0.05 && pose.pitch <= 0.12));
    } else {
      isPoseCorrect = pose.direction === expectedPose;
    }

    // Overrides for "Senyum" and "Netral" which are effectively "Depan"
    if (currentStepIndex >= 5) { 
       isPoseCorrect = ['Depan', 'Atas', 'Bawah'].includes(pose.direction);
       if (Math.abs(pose.yaw) > 0.3) isPoseCorrect = false;
    }

    if (!isPoseCorrect) {
      return { 
        isValid: false, 
        message: `Arah wajah salah. Terdeteksi: ${pose.direction}, Diminta: ${expectedPose}`,
        debugValues: { ...pose, sharpness }
      };
    }

    return { 
      isValid: true, 
      message: 'OK',
      debugValues: { ...pose, sharpness } 
    };

  } catch (error) {
    console.error('Quality check error:', error);
    return { isValid: false, message: 'Gagal memvalidasi kualitas foto.' };
  }
}

function getExpectedPose(stepIndex: number): string {
  switch (stepIndex) {
    case 0: return 'Depan';
    case 1: return 'Kiri';
    case 2: return 'Kanan';
    case 3: return 'Atas';
    case 4: return 'Bawah';
    case 5: return 'Depan'; // Front
    case 6: return 'Depan'; // Smile (Front)
    case 7: return 'Depan'; // Neutral (Front)
    default: return 'Depan';
  }
}