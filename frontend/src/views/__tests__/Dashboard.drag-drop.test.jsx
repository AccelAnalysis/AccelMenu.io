/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Dashboard } from '../Dashboard';

const mockCreateScreen = vi.fn();
const mockAddSlide = vi.fn();
const mockUpdateScreen = vi.fn();
let screensMock = [];
const slidesMock = [
  { id: 'slide-1', name: 'Promo', background: '#000', elements: [] },
];

vi.mock('../../context/AppContext', () => ({
  useAppContext: () => ({
    openEditor: vi.fn(),
    openDisplay: vi.fn(),
  }),
}));

vi.mock('../../hooks/useSlides', () => ({
  useSlides: () => ({
    data: slidesMock,
    isLoading: false,
    createSlide: vi.fn(),
  }),
}));

vi.mock('../../hooks/useScreens', () => ({
  useScreens: () => ({
    data: screensMock,
    createScreen: mockCreateScreen,
    updateScreen: mockUpdateScreen,
    deleteScreen: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePlaylist', () => ({
  usePlaylist: () => ({
    data: [],
    addSlide: mockAddSlide,
    removeFromPlaylist: vi.fn(),
    reorderPlaylist: vi.fn(),
  }),
}));

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    addToPlaylist: vi.fn(),
    exportData: vi.fn(),
    exportLegacyBackup: vi.fn(),
    importData: vi.fn(),
    importLegacyData: vi.fn(),
  };
});

class DataTransferMock {
  constructor() {
    this.data = {};
  }
  setData(key, value) {
    this.data[key] = value;
  }
  getData(key) {
    return this.data[key];
  }
}

const renderDashboard = () => {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <Dashboard />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  screensMock = [];
  mockCreateScreen.mockReset();
  mockAddSlide.mockReset();
  mockUpdateScreen.mockReset();
});

describe('Dashboard drag-and-drop behavior', () => {
  it('creates a new screen when a slide is dropped on empty canvas', async () => {
    mockCreateScreen.mockResolvedValue({ id: 'new-screen' });
    renderDashboard();

    const layout = screen.getByTestId('screen-layout');
    layout.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 });

    const slideCard = screen.getByText('Promo').closest('[draggable="true"]');
    const dataTransfer = new DataTransferMock();

    fireEvent.dragStart(slideCard, { dataTransfer });
    fireEvent.dragOver(layout, { dataTransfer, clientX: 200, clientY: 150 });

    expect(screen.getByTestId('new-screen-preview')).toBeInTheDocument();

    fireEvent.drop(layout, { dataTransfer, clientX: 200, clientY: 150 });

    await waitFor(() => expect(mockCreateScreen).toHaveBeenCalled());
    expect(mockCreateScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        slides: ['slide-1'],
        x: expect.closeTo(136),
        y: expect.closeTo(102),
      })
    );
  });

  it('adds a slide to an existing screen when dropped directly onto it', async () => {
    screensMock = [
      {
        id: 'screen-1',
        name: 'Lobby',
        slides: [],
        x: 0,
        y: 0,
        location: 'Lobby',
      },
    ];

    renderDashboard();

    const screenTile = screen.getByText('Lobby').closest('[data-screen-id]');
    const dataTransfer = new DataTransferMock();

    fireEvent.dragStart(screen.getByText('Promo').closest('[draggable="true"]'), { dataTransfer });
    fireEvent.dragOver(screenTile, { dataTransfer });
    fireEvent.drop(screenTile, { dataTransfer });

    await waitFor(() => expect(mockAddSlide).toHaveBeenCalledWith({ screenId: 'screen-1', slideId: 'slide-1' }));
    expect(mockCreateScreen).not.toHaveBeenCalled();
  });
});
