import React from 'react';
import { Layout, Upload, Download } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Dashboard } from './views/Dashboard';
import { SlideEditor } from './views/SlideEditor';
import { DisplayPlayer } from './views/DisplayPlayer';

function AppShell() {
  const {
    data,
    setData,
    currentLocationId,
    setCurrentLocationId,
    view,
    goDashboard,
  } = useAppContext();

  const handleExport = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'restaurant_design.json';
    link.click();
  };

  const handleImport = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], 'UTF-8');
    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        setData(parsed);
      } catch (err) {
        alert('Invalid design file');
      }
    };
  };

  return (
    <div className="w-full h-screen bg-neutral-900 text-white overflow-hidden font-sans">
      {view !== 'display' && (
        <header className="h-14 border-b border-neutral-700 flex items-center justify-between px-4 bg-neutral-800">
          <div className="flex items-center gap-4">
            <Layout className="text-orange-500" />
            <h1 className="font-bold text-lg">AccelMenu <span className="text-xs font-normal text-neutral-400">Manager v2.0</span></h1>

            <div className="h-6 w-px bg-neutral-600 mx-2" />

            <select
              className="bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-sm outline-none focus:border-orange-500"
              value={currentLocationId}
              onChange={(e) => setCurrentLocationId(e.target.value)}
            >
              {data.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => document.getElementById('file-upload').click()}
              className="p-2 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
              title="Import"
            >
              <Upload size={18} />
              <input id="file-upload" type="file" className="hidden" onChange={handleImport} accept=".json" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
              title="Export"
            >
              <Download size={18} />
            </button>
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
