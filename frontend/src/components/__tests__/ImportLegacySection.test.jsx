import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ImportLegacySection } from '../ImportLegacySection';

const createJsonFile = (data, name = 'legacy.json') =>
  new File([JSON.stringify(data)], name, { type: 'application/json' });

describe('ImportLegacySection', () => {
  it('uploads legacy data and shows success feedback', async () => {
    const onImport = vi.fn().mockResolvedValue();

    render(<ImportLegacySection onImport={onImport} isImporting={false} />);

    const file = createJsonFile({ slides: [] });
    const input = screen.getByLabelText(/legacy json file/i);

    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /import legacy data/i }));

    await waitFor(() => expect(onImport).toHaveBeenCalledWith({ slides: [] }));
    expect(await screen.findByText(/imported successfully/i)).toBeInTheDocument();
  });

  it('shows an error toast when the import request fails', async () => {
    const onImport = vi.fn().mockRejectedValue(new Error('Server error'));

    render(<ImportLegacySection onImport={onImport} isImporting={false} />);

    const file = createJsonFile({ slides: [] });
    await userEvent.upload(screen.getByLabelText(/legacy json file/i), file);
    await userEvent.click(screen.getByRole('button', { name: /import legacy data/i }));

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });
});
