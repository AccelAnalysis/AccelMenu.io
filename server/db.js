import Database from 'better-sqlite3';
import { seedData } from './seedData.js';

const db = new Database('data.sqlite');

db.pragma('journal_mode = WAL');

db.prepare(`
  CREATE TABLE IF NOT EXISTS slides (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    background TEXT DEFAULT '#0f172a'
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS screens (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    locationId TEXT,
    rotation INTEGER DEFAULT 5000
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    screenId TEXT NOT NULL,
    slideId TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    UNIQUE(screenId, slideId)
  );
`).run();

const hasSlides = db.prepare('SELECT COUNT(*) as count FROM slides').get().count > 0;
if (!hasSlides) {
  const insertSlide = db.prepare('INSERT INTO slides (id, name, background) VALUES (@id, @name, @background)');
  const insertScreen = db.prepare('INSERT INTO screens (id, name, locationId, rotation) VALUES (@id, @name, @locationId, @rotation)');
  const insertPlaylist = db.prepare('INSERT INTO playlists (screenId, slideId, position) VALUES (@screenId, @slideId, @position)');

  const slideTx = db.transaction(() => {
    seedData.slides.forEach((slide) => insertSlide.run(slide));
    seedData.locations.forEach((loc) => {
      loc.screens.forEach((screen) => {
        insertScreen.run({ ...screen, locationId: loc.id });
        screen.slides.forEach((slideId, index) => {
          insertPlaylist.run({ screenId: screen.id, slideId, position: index });
        });
      });
    });
  });

  slideTx();
}

export function getDb() {
  return db;
}
