import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mailrcv.app',
  appName: 'MailRCV',
  webDir: 'dist',
  server: {
    url: 'https://5b514b77-50f6-4ca2-a898-3ad7f05c46f1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
