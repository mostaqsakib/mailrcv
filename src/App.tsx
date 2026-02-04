import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAppUpdate } from "@/hooks/use-app-update";
import { UpdateDialog } from "@/components/UpdateDialog";
import { Capacitor } from "@capacitor/core";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const EmailDetailPage = lazy(() => import("./pages/EmailDetailPage"));
const SecureInboxPage = lazy(() => import("./pages/SecureInboxPage"));
const DomainsPage = lazy(() => import("./pages/DomainsPage"));
const DownloadPage = lazy(() => import("./pages/DownloadPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// App update checker component - only shows on native app
const AppUpdateChecker = () => {
  const [isNative, setIsNative] = useState(false);
  const {
    updateAvailable,
    latestVersion,
    dismissUpdate,
    goToDownload,
    isReady,
    isChecking,
    currentVersion,
    currentVersionCode,
  } = useAppUpdate();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // Only show update dialog on native app
  if (!isNative || !isReady || isChecking || !updateAvailable || !latestVersion) return null;

  return (
    <UpdateDialog
      open={updateAvailable}
      onClose={dismissUpdate}
      onUpdate={goToDownload}
      versionName={latestVersion.version_name}
      releaseNotes={latestVersion.release_notes}
      isForceUpdate={latestVersion.is_force_update}
      installedVersionName={currentVersion}
      installedVersionCode={currentVersionCode}
    />
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppUpdateChecker />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/inbox/:username" element={<InboxPage />} />
              <Route path="/inbox/:username/email/:emailId" element={<EmailDetailPage />} />
              <Route path="/secure/:username" element={<SecureInboxPage />} />
              <Route path="/domains" element={<DomainsPage />} />
              <Route path="/domain" element={<DomainsPage />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
