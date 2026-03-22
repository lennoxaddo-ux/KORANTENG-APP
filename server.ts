import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting server initialization...");

let db: any;
try {
  const dbPath = path.join(process.cwd(), "tasks.db");
  console.log("Opening database at:", dbPath);
  db = new Database(dbPath);
  console.log("Database opened successfully");
} catch (err) {
  console.error("Failed to open database file, falling back to in-memory:", err);
  db = new Database(":memory:");
}

// Initialize database
function initDb() {
  try {
    console.log("Initializing database tables...");
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

      CREATE TABLE IF NOT EXISTS project_aspects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        health TEXT DEFAULT 'green',
        next_milestone TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database tables initialized successfully");

    // Check if project_aspects table has data
    const aspectsCount = db.prepare("SELECT COUNT(*) as count FROM project_aspects").get() as { count: number };
    console.log(`Current project aspects count: ${aspectsCount.count}`);
    
    if (aspectsCount.count === 0) {
      console.log("Seeding initial project aspects...");
      const initialAspects = [
        { id: '1', name: 'Strategy', progress: 45, health: 'green', next_milestone: 'Q2 Roadmap Review' },
        { id: '2', name: 'Design', progress: 70, health: 'yellow', next_milestone: 'High-Fidelity Prototypes' },
        { id: '3', name: 'Development', progress: 30, health: 'green', next_milestone: 'Alpha Release' },
        { id: '4', name: 'Marketing', progress: 15, health: 'red', next_milestone: 'Brand Identity Launch' }
      ];
      
      const insertAspect = db.prepare("INSERT OR REPLACE INTO project_aspects (id, name, progress, health, next_milestone) VALUES (?, ?, ?, ?, ?)");
      
      db.transaction(() => {
        for (const a of initialAspects) {
          console.log(`Seeding aspect: ${a.name}`);
          insertAspect.run(a.id, a.name, a.progress, a.health, a.next_milestone);
        }
      })();
      console.log("Seeding complete");
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

initDb();

// Add columns if they don't exist (for existing databases)
try { db.exec("ALTER TABLE tasks ADD COLUMN notes TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN attachments TEXT"); } catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    try {
      const aspectsCount = db.prepare("SELECT COUNT(*) as count FROM project_aspects").get() as { count: number };
      res.json({ 
        status: "ok", 
        db: "connected", 
        env: process.env.NODE_ENV,
        cwd: process.cwd(),
        distExists: fs.existsSync(path.join(process.cwd(), "dist")),
        aspectsCount: aspectsCount.count
      });
    } catch (err) {
      res.status(500).json({ status: "error", error: String(err) });
    }
  });

  // API Routes
  app.get("/api/tasks", (req, res) => {
    try {
      const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
      const parsedTasks = tasks.map((t: any) => ({
        ...t,
        attachments: t.attachments ? JSON.parse(t.attachments) : []
      }));
      res.json(parsedTasks);
    } catch (err) {
      console.error("GET /api/tasks error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/tasks", (req, res) => {
    try {
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
    } catch (err) {
      console.error("POST /api/tasks error:", err);
      res.status(500).json({ error: "Internal server error" });
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
      stmt.run(...params);
      res.json({ success: true });
    } catch (err) {
      console.error("PUT /api/tasks error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/tasks/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/tasks error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Project Aspects API
  app.get("/api/aspects", (req, res) => {
    try {
      console.log("GET /api/aspects requested");
      let aspects = db.prepare("SELECT * FROM project_aspects ORDER BY name ASC").all();
      
      // Auto-seed if empty
      if (aspects.length === 0) {
        console.log("GET /api/aspects: Table empty, auto-seeding...");
        const initialAspects = [
          { id: '1', name: 'Strategy', progress: 45, health: 'green', next_milestone: 'Q2 Roadmap Review' },
          { id: '2', name: 'Design', progress: 70, health: 'yellow', next_milestone: 'High-Fidelity Prototypes' },
          { id: '3', name: 'Development', progress: 30, health: 'green', next_milestone: 'Alpha Release' },
          { id: '4', name: 'Marketing', progress: 15, health: 'red', next_milestone: 'Brand Identity Launch' }
        ];
        const insertAspect = db.prepare("INSERT OR REPLACE INTO project_aspects (id, name, progress, health, next_milestone) VALUES (?, ?, ?, ?, ?)");
        db.transaction(() => {
          initialAspects.forEach(a => insertAspect.run(a.id, a.name, a.progress, a.health, a.next_milestone));
        })();
        aspects = db.prepare("SELECT * FROM project_aspects ORDER BY name ASC").all();
      }
      
      console.log(`GET /api/aspects: Returning ${aspects.length} aspects`);
      res.json(aspects);
    } catch (err) {
      console.error("GET /api/aspects error:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/aspects", (req, res) => {
    try {
      const { id, name, progress, health, next_milestone } = req.body;
      const stmt = db.prepare(
        "INSERT INTO project_aspects (id, name, progress, health, next_milestone) VALUES (?, ?, ?, ?, ?)"
      );
      stmt.run(id, name, progress || 0, health || 'green', next_milestone || '');
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("POST /api/aspects error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/aspects/reset", (req, res) => {
    try {
      console.log("POST /api/aspects/reset requested");
      db.prepare("DELETE FROM project_aspects").run();
      console.log("Table project_aspects cleared");
      
      const initialAspects = [
        { id: '1', name: 'Strategy', progress: 45, health: 'green', next_milestone: 'Q2 Roadmap Review' },
        { id: '2', name: 'Design', progress: 70, health: 'yellow', next_milestone: 'High-Fidelity Prototypes' },
        { id: '3', name: 'Development', progress: 30, health: 'green', next_milestone: 'Alpha Release' },
        { id: '4', name: 'Marketing', progress: 15, health: 'red', next_milestone: 'Brand Identity Launch' }
      ];
      const insertAspect = db.prepare("INSERT INTO project_aspects (id, name, progress, health, next_milestone) VALUES (?, ?, ?, ?, ?)");
      db.transaction(() => {
        initialAspects.forEach(a => insertAspect.run(a.id, a.name, a.progress, a.health, a.next_milestone));
      })();
      
      console.log("Database reset and re-seeded successfully");
      res.json({ success: true, message: "Database reset complete" });
    } catch (err) {
      console.error("POST /api/aspects/reset error:", err);
      res.status(500).json({ error: String(err) });
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
        stmt.run(...params);
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("PUT /api/aspects error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/aspects/:id", (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare("DELETE FROM project_aspects WHERE id = ?");
      stmt.run(id);
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/aspects error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
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
