// Lightweight client placeholder for future API integration
// In a real app, swap these stubs with fetch/axios calls.

export async function fetchDesign() {
  return Promise.resolve(null);
}

export async function saveDesign(payload) {
  console.info('Saving design', payload);
  return Promise.resolve({ ok: true });
}
