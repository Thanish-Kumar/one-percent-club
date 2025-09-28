'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

export function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) return user.firstName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Profile</h1>

          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center space-y-6">
                {/* Profile Image */}
                <Avatar className="h-32 w-32">
                  <AvatarImage src={user?.photoURL || undefined} alt={getUserDisplayName()} />
                  <AvatarFallback className="text-3xl">
                    {getInitials(getUserDisplayName())}
                  </AvatarFallback>
                </Avatar>

                {/* Name */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">{getUserDisplayName()}</h2>
                </div>

                {/* Company/Organization */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-1">Company/Organization</h3>
                  <p className="text-foreground">1% Club Member</p>
                </div>

                {/* Idea/Industry */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-1">Idea/Industry Working On</h3>
                  <p className="text-foreground">Business Development & Growth</p>
                </div>

                {/* Technology */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-1">Technology Working On</h3>
                  <p className="text-foreground">Web Development, Business Tools, Productivity Solutions</p>
                </div>

                {/* Sign Out Button */}
                <div className="pt-4">
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    disabled={isLoading || isLoggingOut}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
