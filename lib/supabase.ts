import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a function that returns the client, throwing error only at runtime when called
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Please create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Lazy init client
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient();
  }
  return client;
}

// Helper to check if Supabase is configured (can be used before calling getSupabase)
export const isSupabaseConfigured = () => !!supabaseUrl && !!supabaseAnonKey;

// Database Types
export interface DbStudent {
  id: string;
  nim: string;
  name: string;
  email: string;
  program_study: string;
  photo: string | null;
  created_at: string;
}

export interface DbLecturer {
  id: string;
  name: string;
  code: string;
  password_hash?: string;
  created_at: string;
}

export interface DbClass {
  id: string;
  class_code: string;
  class_name: string;
  schedule: string;
  lecturer_id: string;
  location_latitude: number;
  location_longitude: number;
  location_radius: number;
  created_at: string;
}

export interface DbEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
}

export interface DbAttendance {
  id: string;
  student_id: string;
  class_id: string;
  status: 'Present' | 'Absent' | 'Late';
  location_latitude: number | null;
  location_longitude: number | null;
  face_recognition_status: 'Matched' | 'Unmatched' | 'Pending';
  recorded_at: string;
}

export interface DbFaceData {
  id: string;
  student_id: string;
  face_descriptor: string;
  confidence_score: number;
  photos_count: number;
  registered_at: string;
}

export interface DbSchedule {
  id: string;
  class_id: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
}

export interface DbActivityLog {
  id: string;
  student_id: string | null;
  lecturer_id: string | null;
  activity_type: string;
  details: string | null;
  created_at: string;
}

// Log activity helper
export async function logActivity(log: Omit<DbActivityLog, 'id' | 'created_at'>) {
  try {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await getSupabase()
      .from('activity_logs')
      .insert(log);
    
    if (error) console.error('Failed to log activity:', error);
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}
