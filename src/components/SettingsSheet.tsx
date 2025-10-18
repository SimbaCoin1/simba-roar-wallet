import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronRight, Eye, Key, Trash2, AlertTriangle } from "lucide-react";
import { walletManager } from '@/lib/walletManager';
import { toast } from '@/hooks/use-toast';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletDeleted?: () => void;
}

const SettingsSheet = ({ open, onOpenChange, onWalletDeleted }: SettingsSheetProps) => {
  const [showSeed, setShowSeed] = useState(false);
  const [seedPassword, setSeedPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleViewSeed = () => {
    try {
      const wallet = walletManager.unlockWallet(seedPassword);
      setMnemonic(wallet.mnemonic);
      setShowSeed(true);
      setSeedPassword('');
    } catch (error) {
      toast({
        title: 'Failed to view seed',
        description: 'Invalid password',
        variant: 'destructive',
      });
    }
  };

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

  const handleDeleteWallet = () => {
    walletManager.deleteWallet();
    toast({
      title: 'Wallet deleted',
      description: 'Your wallet has been removed from this device',
    });
    setDeleteDialogOpen(false);
    onOpenChange(false);
    if (onWalletDeleted) {
      onWalletDeleted();
    }
  };
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[100vh] overflow-y-auto max-w-[414px] mx-auto left-0 right-0">
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
        </DrawerHeader>

        <Tabs defaultValue="security" className="mt-6 px-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-4">Biometrics</h3>
              <div className="flex items-center justify-between py-3">
                <Label htmlFor="faceid" className="text-base">Use FaceID</Label>
                <Switch id="faceid" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                FaceID will be used to confirm your identity before making a transaction, unlocking, exporting, or deleting a wallet. FaceID will not be used to unlock encrypted storage.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                If FaceID is not enabled, or fails to unlock, you can use your device passcode as an alternative.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold text-destructive mb-4">Storage</h3>
              <div className="flex items-center justify-between py-3">
                <Label htmlFor="encrypted" className="text-base">Encrypted and Password Protected</Label>
                <Switch id="encrypted" />
              </div>
            </div>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 mt-6">
            <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-accent rounded-md px-2">
              <span className="text-base text-destructive">On Launch</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            
            <Separator />

            <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-accent rounded-md px-2">
              <span className="text-base text-destructive">Privacy</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <Separator />

            <div className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-base text-destructive">Notifications</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Off</span>
            </div>

            <Separator />

            <div className="py-3">
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="continuity" className="text-base text-destructive">Continuity</Label>
                <Switch id="continuity" />
              </div>
              <p className="text-sm text-destructive/80">
                When enabled, you will be able to view selected wallets, and transactions, using your other Apple iCloud connected devices.
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-3">
              <Label htmlFor="legacy" className="text-base text-destructive">Legacy URv1 QR</Label>
              <Switch id="legacy" />
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4 mt-6">
            <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-accent rounded-md px-2">
              <span className="text-base text-destructive">Is it my address?</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <Separator />

            <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-accent rounded-md px-2">
              <span className="text-base text-destructive">Broadcast Transaction</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <Separator />

            <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-accent rounded-md px-2">
              <span className="text-base text-destructive">Generate the final mnemonic word</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </TabsContent>
        </Tabs>
      </DrawerContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Wallet
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Make sure you have backed up your seed phrase.
              Without it, you will lose access to your funds permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWallet} className="bg-destructive hover:bg-destructive/90">
              Delete Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  );
};

export default SettingsSheet;
