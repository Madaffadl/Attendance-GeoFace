'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/ui/layout-wrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppSection } from '@/components/ui/AppSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Navigation, Clock } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: 'campus' | 'building' | 'room';
  isActive: boolean;
}

// Mock locations data
const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Kampus Utama',
    address: 'Jl. Pendidikan No. 1, Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    radius: 100,
    type: 'campus',
    isActive: true,
  },
  {
    id: '2',
    name: 'Gedung A - Fakultas Teknik',
    address: 'Jl. Pendidikan No. 1, Gedung A',
    latitude: -6.2089,
    longitude: 106.8457,
    radius: 50,
    type: 'building',
    isActive: true,
  },
  {
    id: '3',
    name: 'Gedung B - Fakultas Ekonomi',
    address: 'Jl. Pendidikan No. 1, Gedung B',
    latitude: -6.2087,
    longitude: 106.8458,
    radius: 50,
    type: 'building',
    isActive: true,
  },
  {
    id: '4',
    name: 'Lab Komputer Lt. 3',
    address: 'Gedung A, Lantai 3, Ruang 301',
    latitude: -6.2089,
    longitude: 106.8457,
    radius: 20,
    type: 'room',
    isActive: false,
  },
];

export default function StudentLocationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      // Simulate loading
      setTimeout(() => {
        setLocations(mockLocations);
        setIsLoading(false);
      }, 500);
    } catch {
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'campus':
        return <MapPin className="h-5 w-5" />;
      case 'building':
        return <Building className="h-5 w-5" />;
      default:
        return <Navigation className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'campus':
        return <Badge variant="default">Kampus</Badge>;
      case 'building':
        return <Badge variant="secondary">Gedung</Badge>;
      default:
        return <Badge variant="outline">Ruangan</Badge>;
    }
  };

  if (!user) return null;

  return (
    <LayoutWrapper title="Lokasi Kampus" subtitle="Daftar lokasi valid untuk absensi">
      <PageHeader
        title="Lokasi Kampus"
        subtitle="Lokasi yang valid untuk melakukan absensi dengan geolokasi"
        breadcrumbItems={[
          { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD },
          { label: 'Lokasi Kampus', current: true },
        ]}
      />

      {/* Map Placeholder */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Peta interaktif akan ditampilkan di sini
                </p>
                <p className="text-xs text-muted-foreground">
                  (Memerlukan integrasi Google Maps / Mapbox)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location List */}
      <AppSection
        title="Daftar Lokasi"
        description="Lokasi yang diizinkan untuk melakukan absensi"
      >
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {locations.map((location) => (
              <Card
                key={location.id}
                className={`transition-all ${
                  location.isActive ? 'hover:shadow-md' : 'opacity-60'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          location.isActive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {getLocationIcon(location.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{location.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {location.address}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getTypeBadge(location.type)}
                      {!location.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      Radius: {location.radius}m
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      24 Jam
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AppSection>

      {/* TODO Section */}
      <Card className="mt-6 border-dashed">
        <CardContent className="py-6">
          <h4 className="font-medium mb-2">🚧 Fitur dalam Pengembangan</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Peta interaktif dengan marker lokasi</li>
            <li>• Navigasi ke lokasi terdekat</li>
            <li>• Indikator jarak dari lokasi saat ini</li>
            <li>• Filter berdasarkan tipe lokasi</li>
          </ul>
        </CardContent>
      </Card>
    </LayoutWrapper>
  );
}
