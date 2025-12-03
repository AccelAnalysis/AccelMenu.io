import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Play, Plus, Trash2, Settings, X, Download, Upload, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../context/AppContext';
import { SlideCard } from '../components/SlideCard';
import { ImportLegacySection } from '../components/ImportLegacySection';
import { useSlides } from '../hooks/useSlides';
import { useScreens } from '../hooks/useScreens';
import { usePlaylist } from '../hooks/usePlaylist';
import { addToPlaylist, exportData, exportLegacyBackup, importData, importLegacyData } from '../services/api';
import { downloadJsonResponse } from '../utils/download';

export function Dashboard() {
  const { openEditor, openDisplay } = useAppContext();
  const { data: slides = [], createSlide, isLoading: slidesLoading } = useSlides();
  const { data: screens = [], createScreen, updateScreen, deleteScreen } = useScreens();
  const queryClient = useQueryClient();
  const [draggedScreen, setDraggedScreen] = useState(null);
  const [draggedSlideId, setDraggedSlideId] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);
  const [selectedScreenId, setSelectedScreenId] = useState(null);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenLocation, setNewScreenLocation] = useState('');
  const [screenDetails, setScreenDetails] = useState({ name: '', location: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isLegacyExporting, setIsLegacyExporting] = useState(false);
  const [legacyExportError, setLegacyExportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isLegacyImporting, setIsLegacyImporting] = useState(false);
  const fileInputRef = useRef(null);
  const playlist = usePlaylist(selectedScreenId);
  const layoutRef = useRef(null);

  const SCREEN_WIDTH = 128;
  const SCREEN_HEIGHT = 96;

  const selectedScreen = screens.find((s) => s.id === selectedScreenId);
  const selectedPlaylist = playlist.data || selectedScreen?.slides || [];

  useEffect(() => {
    if (screens.length === 0) {
      setSelectedScreenId(null);
      return;
    }

    if (!selectedScreenId || !screens.some((screen) => screen.id === selectedScreenId)) {
      setSelectedScreenId(screens[0].id);
    }
  }, [screens, selectedScreenId]);

  useEffect(() => {
    if (selectedScreen) {
      setScreenDetails({
        name: selectedScreen.name || '',
        location: selectedScreen.location || '',
      });
    }
  }, [selectedScreen]);

  const handleDragStart = (screenId) => {
    setDraggedScreen(screenId);
  };

  const handleSlideDragStart = (slideId) => {
    setDraggedSlideId(slideId);
  };

  const handleSlideDragEnd = () => {
    setDraggedSlideId(null);
    setDropPreview(null);
  };

  const handleDropScreen = (e) => {
    e.preventDefault();
    const slideId = draggedSlideId || e.dataTransfer.getData('slideId');

    if (slideId && dropPreview?.type === 'new') {
      handleCreateScreenFromDrop(slideId, dropPreview);
      handleSlideDragEnd();
      return;
    }

    setDropPreview(null);
    if (!draggedScreen) return;

    const canvasPosition = getCanvasPosition(e);
    if (!canvasPosition) return;

    updateScreen({ id: draggedScreen, updates: canvasPosition });
    setDraggedScreen(null);
  };

  const getCanvasPosition = (e) => {
    const rect = layoutRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: e.clientX - rect.left - SCREEN_WIDTH / 2,
      y: e.clientY - rect.top - SCREEN_HEIGHT / 2,
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const slideId = draggedSlideId || e.dataTransfer.getData('slideId');
    if (!slideId) {
      setDropPreview(null);
      return;
    }

    const screenTarget = e.target.closest('[data-screen-id]');
    if (screenTarget) {
      setDropPreview({ type: 'screen', screenId: screenTarget.dataset.screenId });
      return;
    }

    const canvasPosition = getCanvasPosition(e);
    if (!canvasPosition) return;
    setDropPreview({ type: 'new', ...canvasPosition });
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDropPreview(null);
  };

  const handleCreateScreenFromDrop = async (slideId, position) => {
    const slideName = slides.find((s) => s.id === slideId)?.name || 'New';
    try {
      const created = await createScreen({
        name: `${slideName} Screen`,
        location: 'Unassigned',
        rotation: 15000,
        slides: [slideId],
        x: position.x,
        y: position.y,
      });

      if (created?.id) {
        setSelectedScreenId(created.id);
        queryClient.setQueryData(['playlist', created.id], (existing) => existing || [slideId]);
        await addToPlaylist(created.id, { slideId });
        queryClient.invalidateQueries({ queryKey: ['playlist', created.id] });
      }

      queryClient.setQueryData(['screens'], (prev = []) =>
        prev.map((screen) => (screen.id === created?.id ? { ...screen, slides: [slideId] } : screen))
      );
    } catch (error) {
      console.error('Failed to create screen from slide', error);
    }
  };

  const addSlideToScreen = (screenId, slideId) => {
    playlist.addSlide({ screenId, slideId });
  };

  const handleCreateScreen = async (event) => {
    event.preventDefault();
    if (!newScreenName.trim() || !newScreenLocation.trim()) return;

    try {
      const created = await createScreen({
        name: newScreenName.trim(),
        location: newScreenLocation.trim(),
        rotation: 15000,
      });
      setSelectedScreenId(created.id);
      setNewScreenName('');
      setNewScreenLocation('');
    } catch (error) {
      console.error('Failed to create screen', error);
    }
  };

  const handleDeleteScreen = async (screenId) => {
    const remainingScreens = screens.filter((screen) => screen.id !== screenId);
    try {
      await deleteScreen(screenId);
      if (selectedScreenId === screenId) {
        setSelectedScreenId(remainingScreens[0]?.id ?? null);
      }
    } catch (error) {
      console.error('Failed to delete screen', error);
    }
  };

  const handleSaveScreenDetails = async () => {
    if (!selectedScreen) return;
    try {
      await updateScreen({
        id: selectedScreen.id,
        updates: {
          name: screenDetails.name.trim() || 'Untitled Screen',
          location: screenDetails.location.trim(),
        },
      });
    } catch (error) {
      console.error('Failed to update screen', error);
    }
  };

  const getPlaylistsForExport = () => {
    return (queryClient.getQueryData(['screens']) || screens).map((screen) => {
      const cachedPlaylist = queryClient.getQueryData(['playlist', screen.id]);
      return {
        screenId: screen.id,
        slides: cachedPlaylist || screen.slides || [],
      };
    });
  };

  const buildLocalExport = () => ({
    exportedAt: new Date().toISOString(),
    slides: queryClient.getQueryData(['slides']) || slides,
    screens: queryClient.getQueryData(['screens']) || screens,
    playlists: getPlaylistsForExport(),
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let payload;

      try {
        payload = await exportData();
      } catch (error) {
        console.warn('API export failed, falling back to local data', error);
        payload = buildLocalExport();
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `accelmenu-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLegacyExport = async () => {
    setLegacyExportError('');
    setIsLegacyExporting(true);

    try {
      const response = await exportLegacyBackup();
      await downloadJsonResponse(
        response,
        `accelmenu-backup-${new Date().toISOString().slice(0, 10)}.json`
      );
    } catch (error) {
      console.error('Failed to export backup', error);
      setLegacyExportError(error.message || 'Export failed. Please try again.');
    } finally {
      setIsLegacyExporting(false);
    }
  };

  const extractPlaylists = (payload) => {
    if (Array.isArray(payload?.playlists)) {
      return payload.playlists.map((p) => ({
        screenId: p.screenId,
        slides: p.slides || p.slideIds || [],
      }));
    }

    if (Array.isArray(payload?.playlistEntries)) {
      const grouped = payload.playlistEntries.reduce((acc, entry) => {
        if (!acc[entry.screenId]) acc[entry.screenId] = [];
        acc[entry.screenId].push(entry);
        return acc;
      }, {});

      return Object.entries(grouped).map(([screenId, entries]) => ({
        screenId,
        slides: entries
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((entry) => entry.slideId),
      }));
    }

    return [];
  };

  const applyImportLocally = (payload) => {
    const playlists = extractPlaylists(payload);
    const slidesToSet = payload?.slides || [];

    const screensWithPlaylists = (payload?.screens || []).map((screen) => {
      const playlistForScreen = playlists.find((p) => p.screenId === screen.id);
      return playlistForScreen ? { ...screen, slides: playlistForScreen.slides } : screen;
    });

    queryClient.setQueryData(['slides'], slidesToSet);
    queryClient.setQueryData(['screens'], screensWithPlaylists);

    playlists.forEach((pl) => {
      queryClient.setQueryData(['playlist', pl.screenId], pl.slides || []);
    });

    queryClient.invalidateQueries({ queryKey: ['slides'] });
    queryClient.invalidateQueries({ queryKey: ['screens'] });
    playlists.forEach((pl) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', pl.screenId] });
    });
  };

  const handleImportPayload = async (payload) => {
    setIsImporting(true);
    try {
      try {
        await importData(payload);
        queryClient.invalidateQueries({ queryKey: ['slides'] });
        queryClient.invalidateQueries({ queryKey: ['screens'] });
        queryClient.invalidateQueries({ queryKey: ['playlist'] });
        (payload?.playlists || []).forEach((pl) => {
          queryClient.invalidateQueries({ queryKey: ['playlist', pl.screenId] });
        });
      } catch (error) {
        console.warn('API import failed, applying locally', error);
        applyImportLocally(payload);
      }

      alert('Import completed successfully');
    } catch (error) {
      console.error('Failed to import data', error);
      alert('Import failed. Please check the file and try again.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLegacyImport = async (payload) => {
    setIsLegacyImporting(true);
    try {
      await importLegacyData(payload);
      queryClient.invalidateQueries({ queryKey: ['slides'] });
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      queryClient.invalidateQueries({ queryKey: ['playlist'] });
      (payload?.screens || []).forEach((screen) => {
        queryClient.invalidateQueries({ queryKey: ['playlist', screen.id] });
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLegacyImporting(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await handleImportPayload(parsed);
    } catch (error) {
      console.error('Invalid import file', error);
      alert('Unable to parse the selected file. Ensure it is valid JSON.');
    }
  };

  const createNewSlide = () => {
    createSlide({
      name: 'New Slide',
      background: '#111111',
      elements: [],
    });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="absolute top-16 right-4 z-20 flex gap-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-sm border border-neutral-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={14} /> {isExporting ? 'Exporting...' : 'Export JSON'}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-sm border border-neutral-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Upload size={14} /> {isImporting ? 'Importing...' : 'Import JSON'}
        </button>
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="font-semibold text-neutral-300">Slide Library</h2>
          <button onClick={createNewSlide} className="p-1 hover:bg-neutral-700 rounded"><Plus size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {slidesLoading && <div className="text-xs text-neutral-500">Loading slides...</div>}
          {!slidesLoading && slides.map((slide) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              onEdit={openEditor}
              onDragStart={handleSlideDragStart}
              onDragEnd={handleSlideDragEnd}
            />
          ))}
        </div>
        <ImportLegacySection
          onImport={handleLegacyImport}
          isImporting={isLegacyImporting}
          onExport={handleLegacyExport}
          isExporting={isLegacyExporting}
          errorMessage={legacyExportError}
        />
      </div>

      <div className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-neutral-300">Locations</h2>
              <p className="text-xs text-neutral-500">Create and manage display screens.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateScreen} className="p-4 border-b border-neutral-800 space-y-2">
          <input
            type="text"
            placeholder="Screen name"
            value={newScreenName}
            onChange={(e) => setNewScreenName(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Location (e.g. Lobby)"
            value={newScreenLocation}
            onChange={(e) => setNewScreenLocation(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={!newScreenName.trim() || !newScreenLocation.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-semibold disabled:opacity-60"
          >
            <Plus size={16} /> Add Screen
          </button>
        </form>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {screens.length === 0 && (
            <div className="text-xs text-neutral-500">No screens yet. Create one to begin.</div>
          )}
          {screens.map((screen) => {
            const isSelected = selectedScreenId === screen.id;
            return (
              <div
                key={screen.id}
                className={`p-3 rounded border ${
                  isSelected ? 'border-orange-500 bg-neutral-800' : 'border-neutral-800 bg-neutral-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedScreenId(screen.id)}
                    className="text-left flex-1"
                  >
                    <div className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                      <Monitor size={16} className="text-neutral-500" />
                      <span className="truncate" title={screen.name}>{screen.name}</span>
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1 mt-1" title={screen.location}>
                      <MapPin size={12} />
                      <span className="truncate">{screen.location || 'Unassigned location'}</span>
                    </div>
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openDisplay(screen.id)}
                      className="p-1 rounded hover:bg-neutral-800 text-green-400"
                      title="Open player"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteScreen(screen.id)}
                      className="p-1 rounded hover:bg-neutral-800 text-red-400"
                      title="Delete screen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="flex-1 bg-neutral-950 relative overflow-hidden"
        ref={layoutRef}
        onDrop={handleDropScreen}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        data-testid="screen-layout"
      >
        <div className="absolute top-4 left-4 bg-neutral-800/80 p-2 rounded text-xs text-neutral-400 backdrop-blur">
          Screen Layout View
        </div>

        {dropPreview?.type === 'new' && draggedSlideId && (
          <div
            data-testid="new-screen-preview"
            className="absolute w-32 h-24 border-2 border-dashed border-orange-400/70 bg-orange-500/10 rounded-lg pointer-events-none flex items-center justify-center text-[11px] text-orange-300"
            style={{ left: dropPreview.x, top: dropPreview.y }}
          >
            New screen here
          </div>
        )}

        {screens.map((screen) => (
          <div
            key={screen.id}
            data-screen-id={screen.id}
            draggable
            onDragStart={() => handleDragStart(screen.id)}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedSlideId) {
                setDropPreview({ type: 'screen', screenId: screen.id });
              }
            }}
            onDrop={(e) => {
              const slideId = e.dataTransfer.getData('slideId');
              if (slideId) {
                e.stopPropagation();
                addSlideToScreen(screen.id, slideId);
                handleSlideDragEnd();
                return;
              }
            }}
            onClick={() => setSelectedScreenId(screen.id)}
            style={{
              left: screen.x ?? 0,
              top: screen.y ?? 0,
              borderWidth: selectedScreenId === screen.id ? '2px' : '1px',
            }}
            className={`absolute w-32 h-24 bg-neutral-800 rounded-lg shadow-xl cursor-move border-neutral-600 flex flex-col items-center justify-center transition-colors hover:border-orange-400 ${selectedScreenId === screen.id ? 'border-orange-500 bg-neutral-800' : ''} ${
              dropPreview?.type === 'screen' && dropPreview.screenId === screen.id ? 'border-green-500 ring-2 ring-green-500/30' : ''
            }`}
          >
            <Monitor className="text-neutral-500 mb-1" size={20} />
            <span className="text-xs font-medium text-center px-1 truncate w-full">{screen.name}</span>
            <span className="text-[10px] text-neutral-500">{(screen.slides || []).length} Slides</span>
            <span className="text-[10px] text-neutral-600">{screen.location}</span>

            <button
              onClick={(e) => { e.stopPropagation(); openDisplay(screen.id); }}
              className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full p-1 shadow-lg hover:bg-green-500 hover:scale-110 transition-all"
            >
              <Play size={10} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>

      <div className={`w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col transition-all duration-300 ${selectedScreenId ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
        {selectedScreen && (
          <>
            <div className="p-4 border-b border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">{selectedScreen.name}</h2>
                <button onClick={() => setSelectedScreenId(null)}><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase">Name</label>
                    <input
                      type="text"
                      value={screenDetails.name}
                      onChange={(e) => setScreenDetails((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase">Location</label>
                    <input
                      type="text"
                      value={screenDetails.location}
                      onChange={(e) => setScreenDetails((prev) => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 mt-1 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveScreenDetails}
                      className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-semibold"
                    >
                      Save Details
                    </button>
                    <button
                      onClick={() => handleDeleteScreen(selectedScreen.id)}
                      className="px-3 py-2 bg-red-900/50 hover:bg-red-800/70 rounded text-sm text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Rotation (ms)</label>
                  <input
                    type="number"
                    value={selectedScreen.rotation ?? 15000}
                    onChange={(e) => {
                      updateScreen({ id: selectedScreen.id, updates: { rotation: parseInt(e.target.value, 10) } });
                    }}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 mt-1 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-3">Slide Stack</h3>
              <div className="space-y-2">
                {selectedPlaylist.map((sId, idx) => {
                  const slideObj = slides.find((s) => s.id === sId);
                  if (!slideObj) return null;
                  return (
                    <div key={`${sId}-${idx}`} className="bg-neutral-800 p-2 rounded flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 w-4">{idx + 1}</span>
                        <span className="text-sm">{slideObj.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditor(sId)}
                          className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={() => playlist.removeFromPlaylist({ screenId: selectedScreen.id, itemId: idx })}
                          className="p-1 hover:bg-red-900/50 rounded text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {selectedPlaylist.length === 0 && (
                  <div className="text-center py-8 text-neutral-600 text-sm border-2 border-dashed border-neutral-800 rounded">
                    Drag slides here from the library
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
