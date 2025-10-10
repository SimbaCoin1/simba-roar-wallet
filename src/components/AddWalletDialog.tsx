import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

interface AddWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddWalletDialog = ({ open, onOpenChange }: AddWalletDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Wallet</DialogTitle>
          <DialogDescription>
            Create a new wallet or import an existing one
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button className="w-full h-14 text-base" variant="default">
            <Plus className="w-5 h-5 mr-2" />
            Create New Wallet
          </Button>
          
          <Button className="w-full h-14 text-base" variant="outline">
            <Download className="w-5 h-5 mr-2" />
            Import Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddWalletDialog;
