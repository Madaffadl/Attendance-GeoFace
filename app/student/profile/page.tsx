'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, GraduationCap, Hash, Camera, Save } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface UserData {
  id: string;
  name: string;
  userType: string;
  identifier: string;
  email: string;
  program_study: string;
  photo: string;
}

export default function StudentProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push(ROUTES.LOGIN);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.userType !== 'student') {
        router.push(ROUTES.LOGIN);
        return;
      }
      setUser(parsedUser);
    } catch {
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  if (!user) return null;

  return (
    <LayoutWrapper title="Profil" subtitle="Lihat dan kelola informasi profil Anda">
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola informasi akun dan preferensi Anda"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
          { label: 'Profil', current: true },
        ]}
        actions={
          <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'default' : 'outline'}>
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </>
            ) : (
              'Edit Profil'
            )}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photo} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="mt-2">
                Mahasiswa
              </Badge>
            </div>

            <div className="mt-6 space-y-4 border-t pt-6">
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">NIM:</span>
                <span className="font-medium">{user.identifier}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Program Studi:</span>
                <span className="font-medium">{user.program_study}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit informasi profil Anda di bawah ini' : 'Detail informasi akun Anda'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={user.name}
                  disabled={!isEditing}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nim">NIM</Label>
                <Input
                  id="nim"
                  value={user.identifier}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled={!isEditing}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program Studi</Label>
                <Input
                  id="program"
                  value={user.program_study}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* TODO Section */}
            <div className="mt-6 rounded-lg border border-dashed border-warning bg-warning/10 p-4">
              <h4 className="font-medium text-warning-foreground">🚧 Fitur dalam Pengembangan</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Fitur edit profil dan upload foto akan segera tersedia. Untuk saat ini, hubungi administrator untuk mengubah data profil.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}
