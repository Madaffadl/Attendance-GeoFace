'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GraduationCap, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, login, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (user.userType === 'student') {
        router.push('/student/dashboard');
      } else if (user.userType === 'lecturer') {
        router.push('/lecturer/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleStudentLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const nim = formData.get('nim') as string;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: nim,
          userType: 'student'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Use auth context login function
        login(data.user);
        router.push('/student/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLecturerLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const code = formData.get('code') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: code,
          password,
          userType: 'lecturer'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Use auth context login function
        login(data.user);
        router.push('/lecturer/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Student Attendance</h1>
          <p className="text-gray-600 text-lg">Face Recognition & Geolocation System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login to Your Account</CardTitle>
            <CardDescription className="text-center text-lg">
              Choose your account type and enter your credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="student" className="w-full space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="student" className="flex items-center gap-2 text-base">
                  <GraduationCap className="w-4 h-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="lecturer" className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  Lecturer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="space-y-6">
                <form onSubmit={handleStudentLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nim" className="text-base font-medium">NIM (Student ID)</Label>
                    <Input
                      id="nim"
                      name="nim"
                      type="text"
                      placeholder="Enter your NIM"
                      className="h-12 text-base"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Login as Student'}
                  </Button>
                </form>

                <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <strong>Demo NIMs:</strong><br />
                  2021001 (John Doe)<br />
                  2021002 (Jane Smith)<br />
                  2021003 (Mike Johnson)
                </div>
              </TabsContent>

              <TabsContent value="lecturer" className="space-y-6">
                <form onSubmit={handleLecturerLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-base font-medium">Lecturer Code</Label>
                    <Input
                      id="code"
                      name="code"
                      type="text"
                      placeholder="Enter your lecturer code"
                      className="h-12 text-base"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base font-medium">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      className="h-12 text-base"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Login as Lecturer'}
                  </Button>
                </form>

                <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <strong>Demo Credentials:</strong><br />
                  Code: LEC001, Password: password123<br />
                  Code: LEC002, Password: password456
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}