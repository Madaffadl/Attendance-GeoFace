'use client';

import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const variantIcons = {
  default: null,
  destructive: <XCircle className="h-5 w-5 text-red-600" />,
  success: <CheckCircle className="h-5 w-5 text-green-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variant ? variantIcons[variant as keyof typeof variantIcons] : null;
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
