'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LecturerSidebar as Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User,
  Lock,
  Bell,
  MapPin,
  Camera,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    attendanceAlerts: true,
    weeklyReports: false
  });
  
  const [systemSettings, setSystemSettings] = useState({
    faceRecognitionThreshold: 85,
    locationRadius: 50,
    autoMarkAbsent: true,
    requireFaceRegistration: true
  });

  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.userType !== 'lecturer') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    
    // Load user profile data
    setProfileData({
      name: parsedUser.name || '',
      email: 'sarah.wilson@university.edu',
      phone: '+62 812-3456-7890',
      department: 'Computer Science'
    });
    
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!user) return;
      // Update user data in localStorage
      const updatedUser: User = { ...user, name: profileData.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil. Silakan coba lagi.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak cocok.' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru harus minimal 6 karakter.' });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Password berhasil diubah!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengubah password. Silakan coba lagi.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan. Silakan coba lagi.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
              <p className="text-gray-600">Kelola profil dan preferensi sistem</p>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Success/Error Message */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profil Pengguna
                </CardTitle>
                <CardDescription>Perbarui informasi profil Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Departemen</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan Profil
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Password Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Ubah Password
                </CardTitle>
                <CardDescription>Perbarui password untuk keamanan akun</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        disabled={isSaving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isSaving} className="w-full">
                    {isSaving ? <LoadingSpinner size="sm" /> : <Lock className="w-4 h-4 mr-2" />}
                    Ubah Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Pengaturan Notifikasi
                </CardTitle>
                <CardDescription>Kelola preferensi notifikasi Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Notifikasi Email</Label>
                    <p className="text-sm text-gray-600">Terima notifikasi melalui email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Notifikasi langsung di browser</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="attendanceAlerts">Alert Kehadiran</Label>
                    <p className="text-sm text-gray-600">Notifikasi saat ada absensi baru</p>
                  </div>
                  <Switch
                    id="attendanceAlerts"
                    checked={notificationSettings.attendanceAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, attendanceAlerts: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyReports">Laporan Mingguan</Label>
                    <p className="text-sm text-gray-600">Ringkasan kehadiran setiap minggu</p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, weeklyReports: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Pengaturan Sistem
                </CardTitle>
                <CardDescription>Konfigurasi sistem absensi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="faceThreshold">Threshold Face Recognition (%)</Label>
                  <Input
                    id="faceThreshold"
                    type="number"
                    min="50"
                    max="100"
                    value={systemSettings.faceRecognitionThreshold}
                    onChange={(e) => 
                      setSystemSettings({ 
                        ...systemSettings, 
                        faceRecognitionThreshold: parseInt(e.target.value) 
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">Minimum akurasi untuk verifikasi wajah</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="locationRadius">Radius Lokasi (meter)</Label>
                  <Input
                    id="locationRadius"
                    type="number"
                    min="10"
                    max="200"
                    value={systemSettings.locationRadius}
                    onChange={(e) => 
                      setSystemSettings({ 
                        ...systemSettings, 
                        locationRadius: parseInt(e.target.value) 
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">Jarak maksimal dari lokasi kelas</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoMarkAbsent">Auto Mark Absent</Label>
                    <p className="text-sm text-gray-600">Otomatis tandai tidak hadir setelah kelas berakhir</p>
                  </div>
                  <Switch
                    id="autoMarkAbsent"
                    checked={systemSettings.autoMarkAbsent}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, autoMarkAbsent: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireFaceRegistration">Wajibkan Registrasi Wajah</Label>
                    <p className="text-sm text-gray-600">Mahasiswa harus registrasi wajah sebelum absen</p>
                  </div>
                  <Switch
                    id="requireFaceRegistration"
                    checked={systemSettings.requireFaceRegistration}
                    onCheckedChange={(checked) => 
                      setSystemSettings({ ...systemSettings, requireFaceRegistration: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save All Settings Button */}
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              size="lg"
              className="px-8"
            >
              {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Semua Pengaturan
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}