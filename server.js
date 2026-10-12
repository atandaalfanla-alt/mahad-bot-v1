const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || false
}));
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({
    name: "MAHAD BOT V1",
    status: "online",
    message: "Welcome to MAHAD BOT V1 API"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "MAHAD BOT V1 API",
    status: "online"
  });
});

async function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({
      error: "Please sign in first"
    });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({
      error: "Invalid or expired login session"
    });
  }

  req.user = data.user;

  req.db = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  next();
}

app.get("/api/bots", requireUser, async (req, res) => {
  const { data, error } = await req.db
    .from("bots")
    .select("id, name, platform, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load bots failed:", error.message);
    return res.status(500).json({
      error: "Could not load bots"
    });
  }

  res.json({ bots: data });
});

app.post("/api/bots", requireUser, async (req, res) => {
  const name = typeof req.body.name === "string"
    ? req.body.name.trim()
    : "";

  const platform = req.body.platform;

  if (!name || name.length > 60) {
    return res.status(400).json({
      error: "Bot name must be 1–60 characters"
    });
  }

  if (!["WhatsApp", "Telegram", "Discord"].includes(platform)) {
    return res.status(400).json({
      error: "Unsupported platform"
    });
  }

  const { data, error } = await req.db
    .from("bots")
    .insert({
      user_id: req.user.id,
      name,
      platform,
      status: "Not connected"
    })
    .select("id, name, platform, status, created_at")
    .single();

  if (error) {
    console.error("Create bot failed:", error.message);
    return res.status(500).json({
      error: "Could not create bot"
    });
  }

  res.status(201).json({ bot: data });
});

app.delete("/api/bots/:id", requireUser, async (req, res) => {
  const { data, error } = await req.db
    .from("bots")
    .delete()
    .eq("id", req.params.id)
    .select("id");

  if (error) {
    console.error("Delete bot failed:", error.message);
    return res.status(500).json({
      error: "Could not delete bot"
    });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({
      error: "Bot not found"
    });
  }

  res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MAHAD BOT V1 running on port ${PORT}`);
});
                                
