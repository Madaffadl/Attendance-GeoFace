// Face data storage utilities
export interface FaceData {
  student_id: string;
  face_descriptor: string;
  registration_date: string;
  confidence_score: number;
  photos_count: number;
}

export interface FaceStorageData {
  [student_id: string]: FaceData;
}

const FACE_STORAGE_KEY = 'attendance_face_data';

// Save face data to localStorage
export function saveFaceData(studentId: string, faceDescriptor: string, confidenceScore: number = 0.95, photosCount: number = 5): void {
  try {
    const existingData = getFaceStorageData();
    
    const faceData: FaceData = {
      student_id: studentId,
      face_descriptor: faceDescriptor,
      registration_date: new Date().toISOString(),
      confidence_score: confidenceScore,
      photos_count: photosCount
    };
    
    existingData[studentId] = faceData;
    
    localStorage.setItem(FACE_STORAGE_KEY, JSON.stringify(existingData));
    console.log(`Face data saved for student ${studentId}:`, {
      descriptorLength: faceDescriptor.length,
      registrationDate: faceData.registration_date,
      confidenceScore: confidenceScore
    });
  } catch (error) {
    console.error('Error saving face data:', error);
  }
}

// Get face data for specific student
export function getFaceData(studentId: string): FaceData | null {
  try {
    const storageData = getFaceStorageData();
    const faceData = storageData[studentId];
    
    if (faceData) {
      console.log(`Face data found for student ${studentId}:`, {
        registrationDate: faceData.registration_date,
        descriptorLength: faceData.face_descriptor.length,
        confidenceScore: faceData.confidence_score
      });
      return faceData;
    }
    
    console.log(`No face data found for student ${studentId}`);
    return null;
  } catch (error) {
    console.error('Error getting face data:', error);
    return null;
  }
}

// Get all face storage data
export function getFaceStorageData(): FaceStorageData {
  try {
    const data = localStorage.getItem(FACE_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error parsing face storage data:', error);
    return {};
  }
}

// Check if student has registered face data
export function hasFaceData(studentId: string): boolean {
  const faceData = getFaceData(studentId);
  return faceData !== null && faceData.face_descriptor.length > 50;
}

// Remove face data for specific student
export function removeFaceData(studentId: string): void {
  try {
    const existingData = getFaceStorageData();
    delete existingData[studentId];
    localStorage.setItem(FACE_STORAGE_KEY, JSON.stringify(existingData));
    console.log(`Face data removed for student ${studentId}`);
  } catch (error) {
    console.error('Error removing face data:', error);
  }
}

// Get face data statistics
export function getFaceDataStats(): {
  totalRegistered: number;
  registrationDates: string[];
  averageConfidence: number;
} {
  try {
    const storageData = getFaceStorageData();
    const faceDataArray = Object.values(storageData);
    
    return {
      totalRegistered: faceDataArray.length,
      registrationDates: faceDataArray.map(data => data.registration_date),
      averageConfidence: faceDataArray.length > 0 
        ? faceDataArray.reduce((sum, data) => sum + data.confidence_score, 0) / faceDataArray.length 
        : 0
    };
  } catch (error) {
    console.error('Error getting face data stats:', error);
    return { totalRegistered: 0, registrationDates: [], averageConfidence: 0 };
  }
}

// Migrate old face data from mockData to localStorage (for backward compatibility)
export function migrateFaceDataFromMock(mockStudents: any[]): void {
  try {
    const existingData = getFaceStorageData();
    let migrated = 0;
    
    mockStudents.forEach(student => {
      if (student.face_vector && student.face_vector.length > 50 && !existingData[student.id]) {
        saveFaceData(student.id, student.face_vector, 0.95, 5);
        migrated++;
      }
    });
    
    if (migrated > 0) {
      console.log(`Migrated ${migrated} face data records from mock data to localStorage`);
    }
  } catch (error) {
    console.error('Error migrating face data:', error);
  }
}