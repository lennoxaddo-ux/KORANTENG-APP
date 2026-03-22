import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("tasks.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    quadrant INTEGER DEFAULT 0, -- 0: Backlog, 1: Do, 2: Schedule, 3: Delegate, 4: Eliminate
    completed INTEGER DEFAULT 0,
    deadline TEXT,
    notes TEXT,
    attachments TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_aspects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    health TEXT DEFAULT 'green',
    next_milestone TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial aspects if table is empty
const aspectsCount = db.prepare("SELECT COUNT(*) as count FROM project_aspects").get() as { count: number };
if (aspectsCount.count === 0) {
  const initialAspects = [
    { id: '1', name: 'Strategy', progress: 45, health: 'green', next_milestone: 'Q2 Roadmap Review' },
    { id: '2', name: 'Design', progress: 70, health: 'yellow', next_milestone: 'High-Fidelity Prototypes' },
    { id: '3', name: 'Development', progress: 30, health: 'green', next_milestone: 'Alpha Release' },
    { id: '4', name: 'Marketing', progress: 15, health: 'red', next_milestone: 'Brand Identity Launch' }
  ];
  const insertAspect = db.prepare("INSERT INTO project_aspects (id, name, progress, health, next_milestone) VALUES (?, ?, ?, ?, ?)");
  initialAspects.forEach(a => insertAspect.run(a.id, a.name, a.progress, a.health, a.next_milestone));
}

// Add columns if they don't exist (for existing databases)
try { db.exec("ALTER TABLE tasks ADD COLUMN notes TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN attachments TEXT"); } catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
    // Parse attachments JSON
    const parsedTasks = tasks.map((t: any) => ({
      ...t,
      attachments: t.attachments ? JSON.parse(t.attachments) : []
    }));
    res.json(parsedTasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { id, title, description, quadrant, deadline, notes, attachments } = req.body;
    const stmt = db.prepare(
      "INSERT INTO tasks (id, title, description, quadrant, deadline, notes, attachments) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run(
      id, 
      title, 
      description || "", 
      quadrant || 0, 
      deadline || null, 
      notes || "", 
      attachments ? JSON.stringify(attachments) : "[]"
    );
    res.status(201).json({ success: true });
  });

  app.put("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, quadrant, completed, deadline, notes, attachments } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (quadrant !== undefined) { updates.push("quadrant = ?"); params.push(quadrant); }
    if (completed !== undefined) { updates.push("completed = ?"); params.push(completed ? 1 : 0); }
    if (deadline !== undefined) { updates.push("deadline = ?"); params.push(deadline); }
    if (notes !== undefined) { updates.push("notes = ?"); params.push(notes); }
    if (attachments !== undefined) { updates.push("attachments = ?"); params.push(JSON.stringify(attachments)); }

    if (updates.length === 0) return res.status(400).json({ error: "No updates provided" });

    params.push(id);
    const stmt = db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`);
    stmt.run(...params);
    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Project Aspects API
  app.get("/api/aspects", (req, res) => {
    const aspects = db.prepare("SELECT * FROM project_aspects ORDER BY name ASC").all();
    res.json(aspects);
  });

  app.put("/api/aspects/:id", (req, res) => {
    const { id } = req.params;
    const { name, progress, health, next_milestone } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (progress !== undefined) { updates.push("progress = ?"); params.push(progress); }
    if (health !== undefined) { updates.push("health = ?"); params.push(health); }
    if (next_milestone !== undefined) { updates.push("next_milestone = ?"); params.push(next_milestone); }

    if (updates.length > 0) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      params.push(id);
      const stmt = db.prepare(`UPDATE project_aspects SET ${updates.join(", ")} WHERE id = ?`);
      stmt.run(...params);
    }
    
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
