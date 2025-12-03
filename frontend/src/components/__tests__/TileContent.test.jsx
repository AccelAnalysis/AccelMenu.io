/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TileContent } from '../TileContent';
import '@testing-library/jest-dom';

describe('TileContent', () => {
  it('shows weather defaults with location and units', () => {
    render(<TileContent data={{ type: 'weather', location: 'Austin, TX', units: 'metric' }} />);

    expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    expect(screen.getByText('Celsius forecast')).toBeInTheDocument();
  });

  it('renders social handle and feed url', () => {
    render(<TileContent data={{ type: 'social', platform: 'twitter', handle: '@accel', feedUrl: 'https://example.com' }} />);

    expect(screen.getByText('@accel')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('renders QR code url and label', () => {
    render(<TileContent data={{ type: 'qr', url: 'https://accelmenu.io', label: 'Scan Me' }} />);

    expect(screen.getByText('https://accelmenu.io')).toBeInTheDocument();
    expect(screen.getByText('Scan Me')).toBeInTheDocument();
  });
});
