'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon } from 'lucide-react';

interface UserInfoCardProps {
  user: {
    name: string;
    identifier: string;
    email?: string;
    program_study?: string;
    photo?: string;
  };
  subtitle?: string;
  className?: string;
}

export function UserInfoCard({ user, subtitle, className = '' }: UserInfoCardProps) {
  return (
    <Card className={`shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-4">
          {user.photo ? (
            <Image
              src={user.photo}
              alt={user.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-md">
              <UserIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-600 font-medium">
              {subtitle || `NIM: ${user.identifier}`}
            </p>
          </div>
        </CardTitle>
        {(user.email || user.program_study) && (
          <CardDescription className="text-sm mt-2">
            {[user.email, user.program_study].filter(Boolean).join(' • ')}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
