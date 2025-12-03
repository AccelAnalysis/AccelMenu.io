import { test, equal } from 'node:test';
import { getDb } from '../db.js';

const db = getDb();

test('slides table is seeded', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM slides').get().count;
  equal(typeof count, 'number');
});

test('screens include playlist rows', () => {
  const screens = db.prepare('SELECT id FROM screens').all();
  screens.forEach((screen) => {
    const playlistRows = db.prepare('SELECT COUNT(*) as count FROM playlists WHERE screenId = ?').get(screen.id).count;
    equal(playlistRows >= 0, true);
  });
});
