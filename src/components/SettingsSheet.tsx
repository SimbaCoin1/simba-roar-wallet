import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
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
    </Drawer>
  );
};

export default SettingsSheet;
