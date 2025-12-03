export const parseFilename = (contentDisposition) => {
  if (!contentDisposition) return null;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition);
  if (match) {
    return decodeURIComponent(match[1] || match[2]);
  }
  return null;
};

export async function downloadJsonResponse(response, fallbackFilename = 'accelmenu-backup.json') {
  const blob = await response.blob();
  const filename =
    parseFilename(response.headers.get('content-disposition')) || fallbackFilename;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
