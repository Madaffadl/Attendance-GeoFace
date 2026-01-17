'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClassCard } from '@/components/ui/class-card';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Class } from '@/types';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function StudentClassesPage() {
  const { user, hasFaceRegistered, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) {
      return;
    }

    // Redirect if not logged in
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Redirect if not a student
    if (user.userType !== 'student') {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Only fetch if we haven't fetched yet
    if (!hasFetched) {
      fetchClasses(user.id);
      setHasFetched(true);
    }
  }, [user, authLoading, router, hasFetched]);

  const fetchClasses = async (studentId: string) => {
    try {
      console.log('Classes page: Fetching classes for student:', studentId);
      const response = await fetch(`/api/classes?studentId=${studentId}`);
      const data = await response.json();
      console.log('Classes page: API response:', data);
      
      if (data.success) {
        setClasses(data.classes);
      } else {
        console.error('Classes page: API returned error:', data.message);
      }
    } catch (error) {
      console.error('Classes page: Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !user) return;

    setIsJoining(true);
    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          classCode: joinCode.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Berhasil Bergabung",
          description: data.message,
          variant: "success",
        });
        setIsJoinDialogOpen(false);
        setJoinCode('');
        // Refresh classes list
        fetchClasses(user.id);
      } else {
        toast({
          title: "Gagal Bergabung",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Join class error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mencoba bergabung ke kelas",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Return null if redirecting
  if (!user) return null;

  return (
    <LayoutWrapper title="Kelas Saya" subtitle="Daftar kelas yang Anda ikuti">
      <PageHeader
        title="Kelas Saya"
        subtitle="Lihat semua kelas yang Anda ikuti semester ini"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
          { label: 'Kelas Saya', current: true },
        ]}
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum Ada Kelas"
          description="Anda belum terdaftar di kelas manapun semester ini. Gabung kelas menggunakan kode yang diberikan dosen."
          action={{
            label: 'Gabung Kelas Baru',
            onClick: () => setIsJoinDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              variant="student"
              hasFaceRegistered={hasFaceRegistered}
            />
          ))}
        </div>
      )}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gabung Kelas Baru</DialogTitle>
            <DialogDescription>
              Masukkan kode kelas yang diberikan oleh dosen Anda untuk bergabung.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinClass} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classCode">Kode Kelas</Label>
              <Input
                id="classCode"
                placeholder="CONTOH: CS101"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={isJoining}
                className="uppercase"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsJoinDialogOpen(false)} disabled={isJoining}>
                Batal
              </Button>
              <Button type="submit" disabled={!joinCode.trim() || isJoining}>
                {isJoining ? (
                  <>
                    <span className="mr-2"><LoadingSpinner size="sm" /></span>
                    Bergabung...
                  </>
                ) : (
                  'Gabung Kelas'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </LayoutWrapper>
  );
}
