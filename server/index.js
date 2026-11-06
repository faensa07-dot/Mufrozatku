import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CLIENT_ORIGIN || '*').split(',').map((origin) => origin.trim());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin tidak diizinkan oleh CORS.'));
  }
}));
app.use(express.json({ limit: '1mb' }));

async function readDb() {
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(data) {
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempPath, DB_PATH);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Mufradat Ceria API aktif.' });
});

app.get('/api/categories', async (_req, res, next) => {
  try {
    const db = await readDb();
    res.json(db.categories);
  } catch (error) { next(error); }
});

app.get('/api/vocabulary', async (req, res, next) => {
  try {
    const db = await readDb();
    const { category, search } = req.query;
    let items = db.vocabulary;
    if (category) items = items.filter((item) => item.category === category);
    if (search) {
      const needle = String(search).toLocaleLowerCase('id');
      items = items.filter((item) => [item.arabic, item.latin, item.meaning].some((value) => value.toLocaleLowerCase('id').includes(needle)));
    }
    res.json(items);
  } catch (error) { next(error); }
});

app.get('/api/vocabulary/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const item = db.vocabulary.find((entry) => entry.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Kosakata tidak ditemukan.' });
    return res.json(item);
  } catch (error) { return next(error); }
});

app.post('/api/scores', async (req, res, next) => {
  try {
    const { studentName, mode, category, score, total } = req.body || {};
    const cleanName = String(studentName || '').trim().slice(0, 40);
    const cleanMode = String(mode || '').trim().slice(0, 30);
    const cleanCategory = String(category || '').trim().slice(0, 30);
    const numericScore = Number(score);
    const numericTotal = Number(total);
    if (!cleanName || !cleanMode || !Number.isFinite(numericScore) || !Number.isFinite(numericTotal) || numericTotal < 1 || numericScore < 0 || numericScore > numericTotal) {
      return res.status(400).json({ message: 'Data nilai tidak valid.' });
    }
    const db = await readDb();
    const record = {
      id: randomUUID(),
      studentName: cleanName,
      mode: cleanMode,
      category: cleanCategory || 'semua',
      score: Math.round(numericScore),
      total: Math.round(numericTotal),
      percentage: Math.round((numericScore / numericTotal) * 100),
      createdAt: new Date().toISOString()
    };
    db.scores.push(record);
    await writeDb(db);
    return res.status(201).json(record);
  } catch (error) { return next(error); }
});

app.get('/api/scores', async (req, res, next) => {
  try {
    const db = await readDb();
    const student = String(req.query.student || '').trim().toLocaleLowerCase('id');
    let scores = [...db.scores].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (student) scores = scores.filter((item) => item.studentName.toLocaleLowerCase('id') === student);
    res.json(scores.slice(0, 50));
  } catch (error) { next(error); }
});

app.get('/api/leaderboard', async (req, res, next) => {
  try {
    const db = await readDb();
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const bestByStudent = new Map();
    for (const item of db.scores) {
      const key = item.studentName.toLocaleLowerCase('id');
      const previous = bestByStudent.get(key);
      if (!previous || item.percentage > previous.percentage || (item.percentage === previous.percentage && new Date(item.createdAt) > new Date(previous.createdAt))) {
        bestByStudent.set(key, item);
      }
    }
    const result = [...bestByStudent.values()].sort((a, b) => b.percentage - a.percentage || b.score - a.score).slice(0, limit);
    res.json(result);
  } catch (error) { next(error); }
});

app.get('/api/stats', async (_req, res, next) => {
  try {
    const db = await readDb();
    const uniqueStudents = new Set(db.scores.map((item) => item.studentName.toLocaleLowerCase('id')));
    const average = db.scores.length ? Math.round(db.scores.reduce((sum, item) => sum + item.percentage, 0) / db.scores.length) : 0;
    res.json({
      categories: db.categories.length,
      vocabulary: db.vocabulary.length,
      attempts: db.scores.length,
      students: uniqueStudents.size,
      averageScore: average
    });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, () => {
  console.log(`Mufradat Ceria API berjalan di http://localhost:${PORT}`);
});
