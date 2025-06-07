
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f281ea4933dc4356a0c4976b8f0bc548',
  appName: 'En Sugame',
  webDir: 'dist',
  server: {
    url: 'https://f281ea49-33dc-4356-a0c4-976b8f0bc548.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
