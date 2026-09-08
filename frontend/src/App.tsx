import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Explorer } from './pages/Explorer';
import { DataHub } from './pages/DataHub';
import { Methodology } from './pages/Methodology';

export const App: React.FC = () => {
  const currentView = useSelector((state: RootState) => state.explorer.currentView);

  return (
    <div className="min-h-screen bg-deep text-ice flex flex-col font-sans selection:bg-brand selection:text-deep">
      <Navbar />

      <main className="flex-1 overflow-hidden">
        {currentView === 'landing' && <LandingPage />}
        {currentView === 'explorer' && <Explorer />}
        {currentView === 'data' && <DataHub />}
        {currentView === 'about' && <Methodology />}
      </main>
    </div>
  );
};

export default App;