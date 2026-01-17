'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Clock, MapPin, Save, ArrowLeft, Info } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function NewClassPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    class_code: '',
    class_name: '',
    schedule: '',
    day: '',
    start_time: '',
    end_time: '',
    room: '',
    description: '',
  });

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push(ROUTES.LOGIN);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.userType !== 'lecturer') {
        router.push(ROUTES.LOGIN);
        return;
      }
      setUser(parsedUser);
    } catch {
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine day and times into schedule string
      const schedule = `${formData.day} ${formData.start_time}-${formData.end_time}`;

      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_code: formData.class_code,
          class_name: formData.class_name,
          schedule,
          lecturer_id: user?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Kelas berhasil dibuat',
          variant: 'success',
        });
        router.push(ROUTES.LECTURER.CLASSES);
      } else {
        toast({
          title: 'Gagal',
          description: data.message || 'Gagal membuat kelas',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <LayoutWrapper title="Tambah Kelas" subtitle="Buat kelas baru">
      <PageHeader
        title="Tambah Kelas Baru"
        subtitle="Buat kelas baru untuk mahasiswa"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.LECTURER.DASHBOARD },
          { label: 'Kelas', href: ROUTES.LECTURER.CLASSES },
          { label: 'Tambah Kelas', current: true },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        }
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Informasi Kelas
            </CardTitle>
            <CardDescription>
              Isi informasi kelas yang akan dibuat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="class_code">Kode Kelas *</Label>
                  <Input
                    id="class_code"
                    placeholder="CONTOH: CS301"
                    className="uppercase"
                    value={formData.class_code}
                    onChange={(e) =>
                      setFormData({ ...formData, class_code: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_name">Nama Kelas *</Label>
                  <Input
                    id="class_name"
                    placeholder="contoh: Sistem Basis Data Lanjut"
                    value={formData.class_name}
                    onChange={(e) =>
                      setFormData({ ...formData, class_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Jadwal
                </Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="day">Hari *</Label>
                    <Select
                      value={formData.day}
                      onValueChange={(value) =>
                        setFormData({ ...formData, day: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hari" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Jam Mulai *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Jam Selesai *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="room" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ruangan
                </Label>
                <Input
                  id="room"
                  placeholder="contoh: Ruang 301, Gedung A"
                  value={formData.room}
                  onChange={(e) =>
                    setFormData({ ...formData, room: e.target.value })
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi singkat tentang kelas..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Setelah kelas dibuat, Anda dapat mengundang mahasiswa menggunakan kode kelas.
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Menyimpan...' : 'Buat Kelas'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}
