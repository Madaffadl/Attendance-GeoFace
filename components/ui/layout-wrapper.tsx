'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { MobileHeader } from '@/components/ui/mobile-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/auth-context';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { resetToDefaults } = useData();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = () => {
    // Reset all data to defaults before logout
    resetToDefaults();
    // Call auth context logout (clears localStorage and state)
    logout();
    // Then redirect to login
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
    // Redirect to login if not authenticated
    router.push('/login');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
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

      <div className="flex min-h-screen">
        {/* Navigation */}
        <Navigation
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <div className="flex-1 w-full lg">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-white shadow-sm border-b sticky top-0 z-10">
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
              {breadcrumbItems && breadcrumbItems.length > 0 && (
                <div className="mt-4">
                  <BreadcrumbNav items={breadcrumbItems} />
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6 w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}