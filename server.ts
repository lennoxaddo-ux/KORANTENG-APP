import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting server initialization...");

// Constants
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "tasks.db");

const INITIAL_ASPECTS = [
  { id: '1', name: 'Strategy', progress: 45, health: 'green', next_milestone: 'Q2 Roadmap Review' },
  { id: '2', name: 'Design', progress: 70, health: 'yellow', next_milestone: 'High-Fidelity Prototypes' },
  { id: '3', name: 'Development', progress: 30, health: 'green', next_milestone: 'Alpha Release' },
  { id: '4', name: 'Marketing', progress: 15, health: 'red', next_milestone: 'Brand Identity Launch' }
];

// Database Setup
let db: Database.Database;
try {
  console.log("Opening database at:", DB_PATH);
  db = new Database(DB_PATH);
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  console.log("Database opened successfully");
} catch (err) {
  console.error("Failed to open database file, falling back to in-memory:", err);
  db = new Database(":memory:");
}

// Initialize database tables
function initDb() {
  try {
    console.log("Initializing database tables...");
    
    // Tasks Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        quadrant INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        deadline TEXT,
        notes TEXT,
        attachments TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Project Aspects Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS project_aspects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        health TEXT DEFAULT 'green',
        next_milestone TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrations / Column Checks for tasks
    const taskColumns = db.prepare("PRAGMA table_info(tasks)").all() as any[];
    const hasNotes = taskColumns.some(c => c.name === 'notes');
    const hasAttachments = taskColumns.some(c => c.name === 'attachments');

    if (!hasNotes) {
      console.log("Adding 'notes' column to tasks table...");
      db.exec("ALTER TABLE tasks ADD COLUMN notes TEXT");
    }
    if (!hasAttachments) {
      console.log("Adding 'attachments' column to tasks table...");
      db.exec("ALTER TABLE tasks ADD COLUMN attachments TEXT");
    }

    // Migrations / Column Checks for project_aspects
    const aspectColumns = db.prepare("PRAGMA table_info(project_aspects)").all() as any[];
    const hasNextMilestone = aspectColumns.some(c => c.name === 'next_milestone');
    const hasUpdatedAt = aspectColumns.some(c => c.name === 'updated_at');

    if (!hasNextMilestone) {
      console.log("Adding 'next_milestone' column to project_aspects table...");
      db.exec("ALTER TABLE project_aspects ADD COLUMN next_milestone TEXT");
    }
    if (!hasUpdatedAt) {
      console.log("Adding 'updated_at' column to project_aspects table...");
      db.exec("ALTER TABLE project_aspects ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
    }

    // Seed Initial Data if empty
    const aspectsCount = db.prepare("SELECT COUNT(*) as count FROM project_aspects").get() as { count: number };
    console.log(`Current project aspects count: ${aspectsCount.count}`);
    
    if (aspectsCount.count === 0) {
      seedAspects();
    }

    console.log("Database initialization complete");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

function seedAspects() {
  console.log("Seeding initial project aspects...");
  const insertAspect = db.prepare(`
    INSERT OR REPLACE INTO project_aspects (id, name, progress, health, next_milestone) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((aspects) => {
    for (const a of aspects) {
      insertAspect.run(a.id, a.name, a.progress, a.health, a.next_milestone);
    }
  });

  transaction(INITIAL_ASPECTS);
  console.log("Seeding complete");
}

initDb();

async function startServer() {
  const app = express();

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Health Check
  app.get("/api/health", (req, res) => {
    try {
      const aspectsCount = db.prepare("SELECT COUNT(*) as count FROM project_aspects").get() as { count: number };
      const tasksCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };
      
      res.json({ 
        status: "ok", 
        db: "connected", 
        counts: {
          tasks: tasksCount.count,
          aspects: aspectsCount.count
        },
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ status: "error", error: String(err) });
    }
  });

  // --- Tasks API ---
  app.get("/api/tasks", (req, res) => {
    try {
      const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
      const parsedTasks = tasks.map((t: any) => ({
        ...t,
        completed: !!t.completed,
        attachments: t.attachments ? JSON.parse(t.attachments) : []
      }));
      res.json(parsedTasks);
    } catch (err) {
      console.error("GET /api/tasks error:", err);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const { id, title, description, quadrant, deadline, notes, attachments } = req.body;
      if (!id || !title) return res.status(400).json({ error: "ID and Title are required" });

      const stmt = db.prepare(`
        INSERT INTO tasks (id, title, description, quadrant, deadline, notes, attachments) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id, 
        title, 
        description || "", 
        quadrant || 0, 
        deadline || null, 
        notes || "", 
        attachments ? JSON.stringify(attachments) : "[]"
      );
      res.status(201).json({ success: true, id });
    } catch (err) {
      console.error("POST /api/tasks error:", err);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", (req, res) => {
    try {
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
      const result = stmt.run(...params);
      
      if (result.changes === 0) return res.status(404).json({ error: "Task not found" });
      
      res.json({ success: true });
    } catch (err) {
      console.error("PUT /api/tasks error:", err);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", (req, res) => {
    try {
      const { id } = req.params;
      const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
      if (result.changes === 0) return res.status(404).json({ error: "Task not found" });
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/tasks error:", err);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // --- Project Aspects API ---
  app.get("/api/aspects", (req, res) => {
    try {
      let aspects = db.prepare("SELECT * FROM project_aspects ORDER BY name ASC").all();
      
      // Auto-seed if empty
      if (aspects.length === 0) {
        console.log("GET /api/aspects: Table empty, auto-seeding...");
        seedAspects();
        aspects = db.prepare("SELECT * FROM project_aspects ORDER BY name ASC").all();
      }
      
      res.json(aspects);
    } catch (err) {
      console.error("GET /api/aspects error:", err);
      res.status(500).json({ error: "Failed to fetch project aspects" });
    }
  });

  app.post("/api/aspects", (req, res) => {
    try {
      const { id, name, progress, health, next_milestone } = req.body;
      if (!id || !name) return res.status(400).json({ error: "ID and Name are required" });

      const stmt = db.prepare(`
        INSERT INTO project_aspects (id, name, progress, health, next_milestone) 
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(id, name, progress || 0, health || 'green', next_milestone || '');
      res.status(201).json({ success: true, id });
    } catch (err) {
      console.error("POST /api/aspects error:", err);
      res.status(500).json({ error: "Failed to create project aspect" });
    }
  });

  app.post("/api/aspects/reset", (req, res) => {
    try {
      console.log("Resetting project aspects...");
      db.transaction(() => {
        db.prepare("DELETE FROM project_aspects").run();
        seedAspects();
      })();
      
      const aspects = db.prepare("SELECT * FROM project_aspects ORDER BY name ASC").all();
      res.json({ success: true, message: "Database reset complete", aspects });
    } catch (err) {
      console.error("POST /api/aspects/reset error:", err);
      res.status(500).json({ error: "Failed to reset project aspects" });
    }
  });

  app.put("/api/aspects/:id", (req, res) => {
    try {
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
        const result = stmt.run(...params);
        if (result.changes === 0) return res.status(404).json({ error: "Aspect not found" });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("PUT /api/aspects error:", err);
      res.status(500).json({ error: "Failed to update project aspect" });
    }
  });

  app.delete("/api/aspects/:id", (req, res) => {
    try {
      const { id } = req.params;
      const result = db.prepare("DELETE FROM project_aspects WHERE id = ?").run(id);
      if (result.changes === 0) return res.status(404).json({ error: "Aspect not found" });
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/aspects error:", err);
      res.status(500).json({ error: "Failed to delete project aspect" });
    }
  });

  // --- Vite / Static Files ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode with Vite middleware");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    console.log("Running in production mode, serving from:", distPath);
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.error("DIST FOLDER NOT FOUND!");
      app.get("*", (req, res) => {
        res.status(500).send("Build artifacts not found. Please rebuild the application.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

