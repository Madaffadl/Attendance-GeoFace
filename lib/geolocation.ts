export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationValidationResult {
  isValid: boolean;
  distance: number;
  message: string;
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  pos1: LocationCoordinates,
  pos2: LocationCoordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (pos1.latitude * Math.PI) / 180;
  const φ2 = (pos2.latitude * Math.PI) / 180;
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Validate if student is within allowed radius of class location
export function validateLocation(
  studentLocation: LocationCoordinates,
  classLocation: LocationCoordinates,
  allowedRadius: number
): LocationValidationResult {
  const distance = calculateDistance(studentLocation, classLocation);
  
  return {
    isValid: distance <= allowedRadius,
    distance: Math.round(distance),
    message: distance <= allowedRadius 
      ? `You are ${Math.round(distance)}m from the classroom. Attendance allowed.`
      : `You are ${Math.round(distance)}m from the classroom. You must be within ${allowedRadius}m to mark attendance.`
  };
}

// Get current user location
export function getCurrentLocation(): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let message = 'An unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timeout';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}