import { Button } from "@/ui";
import { MapPin, Settings, User, LogOut } from "lucide-react";
import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bone">
      {/* Top Navigation */}
      <nav className="border-b border-clay/20 bg-bone">
        <div className="mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/app/trips" className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-olive" />
              <span className="font-serif text-xl font-bold">Trailwright</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href="/app/trips" 
                className="text-sm font-medium text-olive hover:text-ink transition-colors"
              >
                Trips
              </Link>
              {/* TODO: enable when pages exist
              <Link 
                href="/app/calendar" 
                className="text-sm font-medium text-olive hover:text-ink transition-colors"
              >
                Calendar
              </Link>
              <Link 
                href="/app/shared" 
                className="text-sm font-medium text-olive hover:text-ink transition-colors"
              >
                Shared with Me
              </Link>
              */}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Demo Mode Indicator */}
            <div className="hidden md:block">
              <span className="inline-flex items-center rounded-full bg-clay/20 px-2.5 py-0.5 text-xs font-medium text-olive">
                Demo Mode
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
}