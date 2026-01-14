import * as faceapi from 'face-api.js';
import { estimateHeadPose } from './faceRecognition';

// Eye Aspect Ratio (EAR) calculation for blink detection
const LEFT_EYE_INDICES = [36, 37, 38, 39, 40, 41];
const RIGHT_EYE_INDICES = [42, 43, 44, 45, 46, 47];

// Thresholds
const EAR_THRESHOLD = 0.24;
const BLINK_CONSEC_FRAMES = 1;
const SMILE_THRESHOLD = 0.48; // Ratio of mouth width to jaw width

export type ChallengeAction = 'blink' | 'smile' | 'turnLeft' | 'turnRight' | 'lookUp' | 'lookDown';

export interface LivenessChallenge {
  id: string;
  action: ChallengeAction;
  label: string;
  isComplete: boolean;
  progress: number; // 0-100
  icon: string;
}

export interface LivenessState {
  currentChallengeIndex: number;
  challenges: LivenessChallenge[];
  isComplete: boolean;
  
  // Internal tracking
  blinkCount: number;
  consecutiveClosedFrames: number;
  lastActionTimestamp: number;
}

export function createInitialChallenges(): LivenessChallenge[] {
  // Always start with a random specialized challenge, end with blink?
  // Let's generate 3 random challenges
  const pool: { action: ChallengeAction; label: string; icon: string }[] = [
    { action: 'smile', label: 'Senyum Lebar! 😄', icon: '😄' },
    { action: 'turnLeft', label: 'Tengok Kiri ⬅️', icon: '⬅️' },
    { action: 'turnRight', label: 'Tengok Kanan ➡️', icon: '➡️' },
    { action: 'lookUp', label: 'Lihat Atas ⬆️', icon: '⬆️' },
    { action: 'blink', label: 'Kedipkan Mata 😉', icon: '😉' }
  ];

  // Shuffle and pick 3 unique
  const challenges: LivenessChallenge[] = [];
  const usedActions = new Set<string>();
  
  while (challenges.length < 3) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!usedActions.has(pick.action)) {
      usedActions.add(pick.action);
      challenges.push({
        id: Math.random().toString(36).substr(2, 9),
        action: pick.action,
        label: pick.label,
        icon: pick.icon,
        isComplete: false,
        progress: 0
      });
    }
  }

  return challenges;
}

export function createInitialLivenessState(): LivenessState {
  return {
    currentChallengeIndex: 0,
    challenges: createInitialChallenges(),
    isComplete: false,
    blinkCount: 0,
    consecutiveClosedFrames: 0,
    lastActionTimestamp: Date.now(),
  };
}

// Helper: Calculate distance
function distance(p1: faceapi.Point, p2: faceapi.Point): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Helper: EAR
function calculateEAR(eyeLandmarks: faceapi.Point[]): number {
  const p2_p6 = distance(eyeLandmarks[1], eyeLandmarks[5]);
  const p3_p5 = distance(eyeLandmarks[2], eyeLandmarks[4]);
  const p1_p4 = distance(eyeLandmarks[0], eyeLandmarks[3]);
  return (p2_p6 + p3_p5) / (2.0 * p1_p4);
}

// Helper: Detect Smile
function detectSmile(landmarks: faceapi.FaceLandmarks68): boolean {
  const mouth = landmarks.getMouth();
  const jaw = landmarks.getJawOutline();
  
  // Mouth Width
  const mouthLeft = mouth[0];
  const mouthRight = mouth[6];
  const mouthWidth = distance(mouthLeft, mouthRight);
  
  // Jaw Width (at mouth level - approx indices 4 and 12)
  const jawLeft = jaw[4];
  const jawRight = jaw[12];
  const jawWidth = distance(jawLeft, jawRight);
  
  const ratio = mouthWidth / jawWidth;
  return ratio > SMILE_THRESHOLD;
}

// Process Frame based on Current Challenge
export function processChallengeFrame(
  landmarks: faceapi.FaceLandmarks68,
  state: LivenessState
): LivenessState {
  if (state.isComplete) return state;

  const currentChallenge = state.challenges[state.currentChallengeIndex];
  const action = currentChallenge.action;
  let isActionDetected = false;
  
  const newState = { ...state };
  
  // 1. Check Action
  if (action === 'blink') {
    // Blink Logic
    const eyes = {
        left: LEFT_EYE_INDICES.map(i => landmarks.positions[i]),
        right: RIGHT_EYE_INDICES.map(i => landmarks.positions[i])
    };
    const avgEAR = (calculateEAR(eyes.left) + calculateEAR(eyes.right)) / 2;
    
    if (avgEAR < EAR_THRESHOLD) {
      newState.consecutiveClosedFrames++;
    } else {
      if (newState.consecutiveClosedFrames >= BLINK_CONSEC_FRAMES) {
        newState.blinkCount++;
        newState.consecutiveClosedFrames = 0;
        if (newState.blinkCount >= 1) isActionDetected = true; // Just 1 blink needed for challenge
      }
      newState.consecutiveClosedFrames = 0;
    }
  } 
  else if (action === 'smile') {
    if (detectSmile(landmarks)) isActionDetected = true;
  }
  else {
    // Head Pose Actions
    const pose = estimateHeadPose(landmarks);
    
    // Map internal directions to challenge actions
    if (action === 'turnLeft' && pose.direction === 'Kiri') isActionDetected = true;
    if (action === 'turnRight' && pose.direction === 'Kanan') isActionDetected = true;
    if (action === 'lookUp' && pose.direction === 'Atas') isActionDetected = true;
    if (action === 'lookDown' && pose.direction === 'Bawah') isActionDetected = true;
  }

  // 2. Update Progress if detected
  if (isActionDetected) {
    // Mark current as complete
    newState.challenges[state.currentChallengeIndex].isComplete = true;
    newState.challenges[state.currentChallengeIndex].progress = 100;
    
    // Move to next
    if (state.currentChallengeIndex < state.challenges.length - 1) {
      newState.currentChallengeIndex++;
      // Reset internal counters for next challenge
      newState.blinkCount = 0;
      newState.consecutiveClosedFrames = 0;
      newState.lastActionTimestamp = Date.now();
    } else {
      // All done!
      newState.isComplete = true;
    }
  }

  return newState;
}

export function getLivenessStatusMessage(state: LivenessState): string {
  if (state.isComplete) return "Verifikasi Selesai!";
  return state.challenges[state.currentChallengeIndex].label;
}

// Face detection helper re-exported or redefined here if needed for independent usage
// But typically we use faceRecognition's or just faceapi directly.
// For liveness, we need landmarks.
export async function detectFaceWithLandmarks(
  video: HTMLVideoElement
): Promise<faceapi.FaceLandmarks68 | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })) // Use SSD for consistency
      .withFaceLandmarks();
    
    if (!detection) return null;
    return detection.landmarks;
  } catch (error) {
    console.error('[Liveness] Detection error:', error);
    return null;
  }
}
