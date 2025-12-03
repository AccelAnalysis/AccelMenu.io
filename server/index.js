import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';

const app = express();
const db = getDb();

app.use(cors());
app.use(express.json());

app.get('/api/slides', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY name').all();
  res.json(slides);
});

app.post('/api/slides', (req, res) => {
  const { id, name, background } = req.body;
  if (!id || !name) {
    return res.status(400).json({ message: 'id and name are required' });
  }
  db.prepare('INSERT INTO slides (id, name, background) VALUES (?, ?, ?)').run(id, name, background || '#0f172a');
  res.status(201).json({ id, name, background: background || '#0f172a' });
});

app.put('/api/slides/:id', (req, res) => {
  const { name, background } = req.body;
  const existing = db.prepare('SELECT * FROM slides WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Slide not found' });
  }
  db.prepare('UPDATE slides SET name = ?, background = ? WHERE id = ?').run(name || existing.name, background || existing.background, req.params.id);
  res.json({ ...existing, name: name || existing.name, background: background || existing.background });
});

app.delete('/api/slides/:id', (req, res) => {
  db.prepare('DELETE FROM playlists WHERE slideId = ?').run(req.params.id);
  const result = db.prepare('DELETE FROM slides WHERE id = ?').run(req.params.id);
  if (!result.changes) {
    return res.status(404).json({ message: 'Slide not found' });
  }
  res.status(204).send();
});

app.get('/api/screens', (req, res) => {
  const screens = db.prepare('SELECT * FROM screens ORDER BY name').all();
  const playlists = db.prepare('SELECT screenId, slideId, position FROM playlists ORDER BY position').all();
  const merged = screens.map((screen) => ({
    ...screen,
    slides: playlists.filter((p) => p.screenId === screen.id).map((p) => p.slideId)
  }));
  res.json(merged);
});

app.post('/api/screens/:id/playlist', (req, res) => {
  const { slides } = req.body;
  if (!Array.isArray(slides)) {
    return res.status(400).json({ message: 'slides must be an array' });
  }
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM playlists WHERE screenId = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO playlists (screenId, slideId, position) VALUES (?, ?, ?)');
    slides.forEach((slideId, index) => stmt.run(req.params.id, slideId, index));
  });
  tx();
  res.json({ screenId: req.params.id, slides });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
