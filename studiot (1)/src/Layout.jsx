import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  LayoutGrid, 
  Settings, 
  Users, 
  Building2,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Bell,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { Skeleton } from "@/components/ui/skeleton";

function LayoutContent({ children, currentPageName }) {
  const { user, userRole, loading, isAdmin, isClient, assignedAccounts, workspaceMemberships } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => base44.entities.Workspace.list(),
    enabled: !loading && isAdmin()
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const getNavItems = () => {
    const items = [];
    
    if (isAdmin()) {
      items.push(
        { label: 'Dashboard', icon: LayoutGrid, href: createPageUrl('Dashboard') },
        { label: 'Calendar', icon: Calendar, href: createPageUrl('Calendar') },
        { label: 'Workspaces', icon: Building2, href: createPageUrl('Workspaces') },
        { label: 'Team', icon: Users, href: createPageUrl('Team') },
        { label: 'Settings', icon: Settings, href: createPageUrl('Settings') }
      );
    } else if (isClient()) {
      items.push(
        { label: 'Calendar', icon: Calendar, href: createPageUrl('ClientCalendar') },
        { label: 'Feed Preview', icon: LayoutGrid, href: createPageUrl('ClientFeed') }
      );
    } else {
      // Account Manager
      items.push(
        { label: 'Dashboard', icon: LayoutGrid, href: createPageUrl('Dashboard') },
        { label: 'Calendar', icon: Calendar, href: createPageUrl('Calendar') }
      );
    }
    
    return items;
  };

  const navItems = getNavItems();
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const NavLinks = () => (
    <nav className="flex flex-col lg:flex-row gap-1 lg:gap-0.5">
      {navItems.map((item) => {
        const isActive = currentPageName === item.label.replace(' ', '');
        return (
          <Link
            key={item.label}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to={createPageUrl(isClient() ? 'ClientCalendar' : 'Dashboard')} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg text-slate-900 hidden sm:block">Studio T</span>
              </Link>
              
              {/* Desktop Nav */}
              <div className="hidden lg:block">
                <NavLinks />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                <span className="text-xs font-medium text-slate-600 capitalize">
                  {userRole?.replace('_', ' ')}
                </span>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-slate-700">
                      {user?.full_name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="mt-8">
                    <NavLinks />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <AuthProvider>
      <LayoutContent currentPageName={currentPageName}>
        {children}
      </LayoutContent>
    </AuthProvider>
  );
}