'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Class, Student, Attendance } from '@/types';
import { mockClasses, mockStudents, mockAttendance, mockEnrollments } from '@/lib/mockData';

// Storage key prefix
const STORAGE_KEY_PREFIX = 'attendance_app_';

// Data types for the context
export interface Schedule {
  id: string;
  classId: string;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  room: string;
  createdAt: string;
}

export interface DataContextType {
  classes: Class[];
  students: Student[];
  attendance: Attendance[];
  enrollments: Record<string, string[]>;
  schedules: Schedule[];
  
  // Class actions
  addClass: (classData: Omit<Class, 'id'>) => Class;
  updateClass: (id: string, classData: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  
  // Schedule actions
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt'>) => Schedule;
  deleteSchedule: (id: string) => void;
  
  // Attendance actions
  addAttendance: (attendance: Omit<Attendance, 'id'>) => Attendance;
  
  // Reset all data to defaults
  resetToDefaults: () => void;
  
  // Refresh data from storage
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Storage helpers
const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, string[]>>({});
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data from localStorage or defaults
  const initializeData = useCallback(() => {
    const storedClasses = getStorageItem<Class[]>('classes', mockClasses);
    const storedStudents = getStorageItem<Student[]>('students', mockStudents);
    const storedAttendance = getStorageItem<Attendance[]>('attendance', mockAttendance);
    const storedEnrollments = getStorageItem<Record<string, string[]>>('enrollments', mockEnrollments);
    const storedSchedules = getStorageItem<Schedule[]>('schedules', []);

    setClasses(storedClasses);
    setStudents(storedStudents);
    setAttendance(storedAttendance);
    setEnrollments(storedEnrollments);
    setSchedules(storedSchedules);
    setIsInitialized(true);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isInitialized) return;
    setStorageItem('classes', classes);
  }, [classes, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    setStorageItem('students', students);
  }, [students, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    setStorageItem('attendance', attendance);
  }, [attendance, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    setStorageItem('enrollments', enrollments);
  }, [enrollments, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    setStorageItem('schedules', schedules);
  }, [schedules, isInitialized]);

  // Class actions
  const addClass = useCallback((classData: Omit<Class, 'id'>): Class => {
    const newClass: Class = {
      ...classData,
      id: generateId(),
    };
    setClasses(prev => [...prev, newClass]);
    return newClass;
  }, []);

  const updateClass = useCallback((id: string, classData: Partial<Class>) => {
    setClasses(prev => prev.map(cls => 
      cls.id === id ? { ...cls, ...classData } : cls
    ));
  }, []);

  const deleteClass = useCallback((id: string) => {
    setClasses(prev => prev.filter(cls => cls.id !== id));
  }, []);

  // Schedule actions
  const addSchedule = useCallback((scheduleData: Omit<Schedule, 'id' | 'createdAt'>): Schedule => {
    const newSchedule: Schedule = {
      ...scheduleData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setSchedules(prev => [...prev, newSchedule]);
    return newSchedule;
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  // Attendance actions
  const addAttendance = useCallback((attendanceData: Omit<Attendance, 'id'>): Attendance => {
    const newAttendance: Attendance = {
      ...attendanceData,
      id: generateId(),
    };
    setAttendance(prev => [...prev, newAttendance]);
    return newAttendance;
  }, []);

  // Reset all data to defaults
  const resetToDefaults = useCallback(() => {
    // Clear localStorage
    removeStorageItem('classes');
    removeStorageItem('students');
    removeStorageItem('attendance');
    removeStorageItem('enrollments');
    removeStorageItem('schedules');

    // Reset to mock data
    setClasses(mockClasses);
    setStudents(mockStudents);
    setAttendance(mockAttendance);
    setEnrollments(mockEnrollments);
    setSchedules([]);
  }, []);

  // Refresh data from storage
  const refreshData = useCallback(() => {
    initializeData();
  }, [initializeData]);

  const value: DataContextType = {
    classes,
    students,
    attendance,
    enrollments,
    schedules,
    addClass,
    updateClass,
    deleteClass,
    addSchedule,
    deleteSchedule,
    addAttendance,
    resetToDefaults,
    refreshData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Hook to reset data on logout
export function useLogout() {
  const { resetToDefaults } = useData();
  
  const logout = useCallback(() => {
    resetToDefaults();
    localStorage.removeItem('user');
  }, [resetToDefaults]);
  
  return logout;
}
