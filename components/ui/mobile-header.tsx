'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  Bell,
  Search,
  User,
  GraduationCap
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  userType: string;
  identifier: string;
  photo?: string;
}

interface MobileHeaderProps {
  user: User;
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  showSearch?: boolean;
}

export function MobileHeader({ 
  user, 
  title, 
  subtitle, 
  onMenuToggle, 
  showSearch = false 
}: MobileHeaderProps) {
  const [showSearchInput, setShowSearchInput] = useState(false);

  return (
    <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchInput(!showSearchInput)}
                className="p-2"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="p-2 relative">
              <Bell className="w-4 h-4" />
              <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500" />
            </Button>
            
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
            </div>
          </div>
        </div>

        {/* Search Input */}
        {showSearchInput && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}