import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [view, setView] = useState('dashboard');
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [displayScreenId, setDisplayScreenId] = useState(null);

  const openEditor = (slideId) => {
    setEditingSlideId(slideId);
    setView('editor');
  };

  const openDisplay = (screenId) => {
    setDisplayScreenId(screenId);
    setView('display');
  };

  const goDashboard = () => setView('dashboard');

  const value = {
    view,
    editingSlideId,
    displayScreenId,
    openEditor,
    openDisplay,
    goDashboard,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
