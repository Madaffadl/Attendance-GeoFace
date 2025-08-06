import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users,
  BookOpen,
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarItemProps {
  href: string;
  icon: any;
  label: string;
  isActive?: boolean;
}

function SidebarItem({ href, icon: Icon, label, isActive }: SidebarItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

export function LecturerSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Portal Dosen</h2>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <div className="px-4">
          <nav className="space-y-2">
            <SidebarItem 
              href="/lecturer/dashboard" 
              icon={LayoutDashboard} 
              label="Dashboard" 
              isActive={pathname === '/lecturer/dashboard'}
            />
            <SidebarItem 
              href="/lecturer/classes" 
              icon={BookOpen} 
              label="Kelas Saya" 
              isActive={pathname.startsWith('/lecturer/classes')}
            />
            <SidebarItem 
              href="/lecturer/students" 
              icon={Users} 
              label="Mahasiswa" 
              isActive={pathname.startsWith('/lecturer/students')}
            />
            <SidebarItem 
              href="/lecturer/schedule" 
              icon={Calendar} 
              label="Jadwal" 
              isActive={pathname.startsWith('/lecturer/schedule')}
            />
            <SidebarItem 
              href="/lecturer/analytics" 
              icon={BarChart3} 
              label="Analitik" 
              isActive={pathname.startsWith('/lecturer/analytics')}
            />
            <SidebarItem 
              href="/lecturer/settings" 
              icon={Settings} 
              label="Pengaturan" 
              isActive={pathname.startsWith('/lecturer/settings')}
            />
          </nav>
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback>DS</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Dr. Sarah Johnson</p>
            <p className="text-xs text-muted-foreground truncate">sarah.johnson@university.edu</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}