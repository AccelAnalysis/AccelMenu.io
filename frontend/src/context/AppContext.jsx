import React, { createContext, useContext, useMemo, useState } from 'react';
import { generateId } from '../services/id';

const AppContext = createContext(null);

const INITIAL_DATA = {
  locations: [
    {
      id: 'loc1',
      name: 'Downtown Burger Bar',
      screens: [
        {
          id: 'screen1',
          name: 'Main Menu Board',
          x: 100,
          y: 100,
          slides: ['slide1', 'slide2'],
          rotation: 8000
        },
        {
          id: 'screen2',
          name: 'Promo Vertical',
          x: 400,
          y: 100,
          slides: ['slide3'],
          rotation: 5000
        }
      ]
    }
  ],
  slides: [
    {
      id: 'slide1',
      name: 'Burger Specials',
      background: '#1a1a1a',
      elements: [
        { id: 'el1', type: 'text', content: 'CLASSIC BURGER', x: 50, y: 50, width: 400, height: 60, fontSize: 40, color: '#ffffff', fontFamily: 'sans-serif', zIndex: 2 },
        { id: 'el2', type: 'price', content: '$12.99', x: 500, y: 50, width: 150, height: 60, fontSize: 40, color: '#fbbf24', fontFamily: 'sans-serif', zIndex: 2 },
        { id: 'el3', type: 'shape', content: '', x: 20, y: 20, width: 600, height: 120, backgroundColor: '#333333', zIndex: 1, opacity: 0.8 },
      ]
    },
    {
      id: 'slide2',
      name: 'Drinks Menu',
      background: '#2d1b1b',
      elements: [
        { id: 'el4', type: 'text', content: 'Cold Drinks', x: 100, y: 100, width: 300, height: 50, fontSize: 32, color: '#fff', zIndex: 1 }
      ]
    },
    {
      id: 'slide3',
      name: 'Weekend Promo',
      background: '#0f172a',
      elements: []
    }
  ]
};

export function AppProvider({ children }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [currentLocationId, setCurrentLocationId] = useState(INITIAL_DATA.locations[0].id);
  const [view, setView] = useState('dashboard');
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [displayScreenId, setDisplayScreenId] = useState(null);

  const activeLocation = useMemo(
    () => data.locations.find((loc) => loc.id === currentLocationId),
    [currentLocationId, data.locations]
  );

  const openEditor = (slideId) => {
    setEditingSlideId(slideId);
    setView('editor');
  };

  const openDisplay = (screenId) => {
    setDisplayScreenId(screenId);
    setView('display');
  };

  const goDashboard = () => setView('dashboard');

  const createSlide = () => ({
    id: generateId(),
    name: 'New Slide',
    background: '#111111',
    elements: []
  });

  const value = {
    data,
    setData,
    currentLocationId,
    setCurrentLocationId,
    view,
    editingSlideId,
    displayScreenId,
    activeLocation,
    openEditor,
    openDisplay,
    goDashboard,
    createSlide,
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
