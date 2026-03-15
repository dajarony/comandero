import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dajarony.comandero',
  appName: 'Comandero Digital',
  webDir: 'dist',
  server: {
    // En desarrollo, conectar al backend local
    // En produccion, usar la URL real
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0d3b2e',
    },
  },
};

export default config;
