import React from 'react';
import { Layout } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Dashboard } from './views/Dashboard';
import { SlideEditor } from './views/SlideEditor';
import { DisplayPlayer } from './views/DisplayPlayer';

function AppShell() {
  const { view, goDashboard } = useAppContext();

  return (
    <div className="w-full h-screen bg-neutral-900 text-white overflow-hidden font-sans">
      {view !== 'display' && (
        <header className="h-14 border-b border-neutral-700 flex items-center justify-between px-4 bg-neutral-800">
          <div className="flex items-center gap-4">
            <Layout className="text-orange-500" />
            <h1 className="font-bold text-lg">AccelMenu <span className="text-xs font-normal text-neutral-400">Manager v2.0</span></h1>
          </div>

          <div className="flex items-center gap-2">
            {view === 'editor' && (
              <button
                onClick={goDashboard}
                className="ml-4 px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </header>
      )}

      <main className="h-full relative">
        {view === 'dashboard' && <Dashboard />}
        {view === 'editor' && <SlideEditor />}
        {view === 'display' && <DisplayPlayer />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
