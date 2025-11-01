import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, HelpCircle, Info } from "lucide-react";
import { walletManager } from '@/lib/walletManager';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

const SettingsSheet = ({ open, onOpenChange, userEmail }: SettingsSheetProps) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChangePassword = () => {
    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    try {
      walletManager.changePassword(oldPassword, newPassword);
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully',
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast({
        title: 'Failed to change password',
        description: 'Invalid current password',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] overflow-y-auto max-w-[414px] mx-auto left-0 right-0">
        <DrawerHeader className="pb-4">
          <DrawerTitle className="text-2xl">Settings</DrawerTitle>
        </DrawerHeader>

        <div className="px-6 pb-8 space-y-8">
          {/* Account Section */}
          {userEmail && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Account</h3>
                </div>
                <div className="pl-8">
                  <div className="flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{userEmail}</span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Security Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Security</h3>
            </div>
            
            <div className="pl-8 space-y-4">
              <h4 className="text-base font-medium mb-3">Change Password</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your current password, then your new password (minimum 8 characters)
              </p>
              
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="Current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="text-base h-12"
                />
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-base h-12"
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="text-base h-12"
                />
                <Button 
                  onClick={handleChangePassword}
                  className="w-full h-12 text-base"
                  disabled={!oldPassword || !newPassword || !confirmNewPassword}
                >
                  Update Password
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Help & Support Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Help & Support</h3>
            </div>
            
            <div className="pl-8 space-y-3">
              <a 
                href="mailto:support@simbawallet.com"
                className="flex items-center justify-between py-3 text-base hover:text-primary transition-colors"
              >
                <span>Contact Support</span>
              </a>
            </div>
          </div>

          <Separator />

          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">About</h3>
            </div>
            
            <div className="pl-8">
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Logout Button */}
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 text-base"
          >
            Log Out
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SettingsSheet;
