'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Edit,
  Share,
  Download,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ContextualNavProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  actions?: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }>;
  status?: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive';
  };
}

export function ContextualNav({ 
  title, 
  subtitle, 
  backUrl, 
  actions = [],
  status 
}: ContextualNavProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {status && (
                <Badge variant={status.variant}>
                  {status.label}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Show first 2 actions on mobile, all on desktop */}
            {actions.slice(0, 2).map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className="flex items-center gap-2"
              >
                <action.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            ))}
            
            {/* More actions dropdown for mobile */}
            {actions.length > 2 && (
              <Button variant="outline" size="sm" className="sm:hidden">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            )}
            
            {/* Additional actions for desktop */}
            {actions.slice(2).map((action, index) => (
              <Button
                key={index + 2}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className="hidden sm:flex items-center gap-2"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}