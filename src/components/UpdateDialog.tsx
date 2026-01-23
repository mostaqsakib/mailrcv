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
import { Download, Sparkles } from "lucide-react";

interface UpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  versionName: string;
  releaseNotes: string | null;
  isForceUpdate: boolean;
  installedVersionName?: string;
  installedVersionCode?: number;
}

export const UpdateDialog = ({
  open,
  onClose,
  onUpdate,
  versionName,
  releaseNotes,
  isForceUpdate,
  installedVersionName,
  installedVersionCode,
}: UpdateDialogProps) => {
  const showInstalled =
    Boolean(installedVersionName) || typeof installedVersionCode === 'number';

  return (
    <AlertDialog open={open} onOpenChange={isForceUpdate ? undefined : onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                New version available
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground">v{versionName}</p>
            </div>
          </div>
          <AlertDialogDescription className="text-left">
            {releaseNotes || "A new release is available with improvements and bug fixes."}
          </AlertDialogDescription>

          {showInstalled && (
            <p className="mt-2 text-xs text-muted-foreground text-left">
              Installed: {installedVersionName ? `v${installedVersionName}` : 'unknown'}
              {typeof installedVersionCode === 'number' ? ` (build ${installedVersionCode})` : ''}
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {!isForceUpdate && (
            <AlertDialogCancel className="w-full sm:w-auto">
              Later
            </AlertDialogCancel>
          )}
          <AlertDialogAction 
            onClick={onUpdate}
            className="w-full sm:w-auto gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
