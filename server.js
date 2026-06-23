import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('civic_watch.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    city TEXT,
    date TEXT,
    summary TEXT,
    transcription TEXT,
    transcriptionLink TEXT,
    absentees TEXT,
    user_id TEXT
  );

  CREATE TABLE IF NOT EXISTS overallElections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    ballot_link TEXT,
    voting_locations TEXT
  );

  CREATE TABLE IF NOT EXISTS seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id INTEGER,
    seat_name TEXT,
    incumbent TEXT,
    challengers TEXT
  );
`);

const supabaseJWK = {
  kty: "EC",
  crv: "P-256",
  x: "3t_nPoX-iBS-5d15FT-HRkr_XIg-xC-_Feq7PGuaIZw",
  y: "z7KKXgMbNjvZiNyrhWUh6PWvXKJy0BzIVBu7eaJPvDg"
};

const SUPABASE_PUBLIC_KEY = crypto.createPublicKey({ key: supabaseJWK, format: 'jwk' }).export({ type: 'spki', format: 'pem' });

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, SUPABASE_PUBLIC_KEY, { algorithms: ['ES256'] }, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

app.get('/api/wakeup', (req, res) => {
  res.status(200).send("Awake!");
});

app.get('/api/summaries', (req, res) => {
  const stmt = db.prepare('SELECT * FROM summaries ORDER BY date DESC');
  res.json(stmt.all());
});

app.get('/api/summaries/me', authenticateToken, (req, res) => {
  const { dateLimit } = req.query;
  const stmt = db.prepare('SELECT * FROM summaries WHERE user_id = ? AND date >= ? ORDER BY date DESC');
  res.json(stmt.all(req.user.sub, dateLimit));
});

app.get('/api/summaries/:id', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM summaries WHERE id = ?');
  res.json(stmt.get(req.params.id));
});

app.post('/api/summaries', authenticateToken, (req, res) => {
  const { city, date, summary, transcription, transcriptionLink, absentees } = req.body;
  const rightNow = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO summaries (created_at, city, date, summary, transcription, transcriptionLink, absentees, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const info = stmt.run(rightNow, city, date, summary, transcription, transcriptionLink, JSON.stringify(absentees), req.user.sub);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/summaries/:id', authenticateToken, (req, res) => {
  const { city, date, summary, transcription, transcriptionLink, absentees } = req.body;
  const stmt = db.prepare(`
    UPDATE summaries 
    SET city = ?, date = ?, summary = ?, transcription = ?, transcriptionLink = ?, absentees = ?
    WHERE id = ? AND user_id = ?
  `);
  
  stmt.run(city, date, summary, transcription, transcriptionLink, JSON.stringify(absentees), req.params.id, req.user.sub);
  res.json({ success: true });
});

app.delete('/api/summaries/:id', authenticateToken, (req, res) => {
  const stmt = db.prepare('DELETE FROM summaries WHERE id = ? AND user_id = ?');
  stmt.run(req.params.id, req.user.sub);
  res.json({ success: true });
});

app.get('/api/elections/next', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const stmt = db.prepare(`
      SELECT * FROM overallElections 
      WHERE date >= ? 
      ORDER BY date ASC 
      LIMIT 1
    `);
    
    const nextElection = stmt.get(today);
    
    if (!nextElection) {
      return res.json({ message: "No upcoming elections found." });
    }
    
    res.json(nextElection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/elections/:id/seats', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM seats WHERE election_id = ?');
    const seats = stmt.all(req.params.id);
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/elections', authenticateToken, (req, res) => {
  const { date, ballot_link } = req.body;
  
  try {
    const stmt = db.prepare('INSERT INTO overallElections (date, ballot_link) VALUES (?, ?)');
    const info = stmt.run(date, ballot_link);
    res.json({ success: true, electionId: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/seats', authenticateToken, (req, res) => {
  const { election_id, seat_name, incumbent, challengers } = req.body;
  
  try {
    const stmt = db.prepare('INSERT INTO seats (election_id, seat_name, incumbent, challengers) VALUES (?, ?, ?, ?)');
    const info = stmt.run(election_id, seat_name, incumbent, JSON.stringify(challengers));
    res.json({ success: true, seatId: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));