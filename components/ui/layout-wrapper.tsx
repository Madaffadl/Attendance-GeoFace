'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { MobileHeader } from '@/components/ui/mobile-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
  email?: string;
  program_study?: string;
  photo?: string;
}

interface LayoutWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}

export function LayoutWrapper({ 
  children, 
  title, 
  subtitle, 
  showSearch = false,
  breadcrumbItems 
}: LayoutWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader
        user={user}
        title={title}
        subtitle={subtitle}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        showSearch={showSearch}
      />

      <div className="flex">
        {/* Navigation */}
        <Navigation 
          user={user} 
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="text-gray-600">{subtitle}</p>
                  )}
                </div>
              </div>
              
              {/* Breadcrumbs */}
              <div className="mt-4">
                <BreadcrumbNav items={breadcrumbItems} />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}