import React from 'react';

import { SaintsLockApp } from './src/app/SaintsLockApp';
import { AppProvider } from './src/context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <SaintsLockApp />
    </AppProvider>
  );
}

