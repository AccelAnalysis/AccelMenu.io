import { describe, expect, it, vi } from 'vitest';
import { downloadJsonResponse, parseFilename } from './download';

describe('parseFilename', () => {
  it('extracts filename from content-disposition header', () => {
    expect(parseFilename('attachment; filename="backup.json"')).toBe('backup.json');
    expect(parseFilename("attachment; filename*=UTF-8''export.json"))
      .toBe('export.json');
    expect(parseFilename(null)).toBeNull();
  });
});

describe('downloadJsonResponse', () => {
  it('creates a downloadable link using response headers', async () => {
    const response = new Response(JSON.stringify({ hello: 'world' }), {
      headers: {
        'Content-Disposition': 'attachment; filename="backup.json"',
        'Content-Type': 'application/json',
      },
    });

    const originalAppendChild = document.body.appendChild;
    const appendSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => originalAppendChild.call(document.body, node));

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(function mockRemove() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    await downloadJsonResponse(response, 'fallback.json');

    const anchor = appendSpy.mock.calls[0][0];
    expect(anchor.download).toBe('backup.json');
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    const blobArg = createObjectURLSpy.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(await blobArg.text()).toContain('hello');
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock');
  });
});
