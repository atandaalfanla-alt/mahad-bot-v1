
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || false
}));
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({
    name: "MAHAD BOT V1",
    message: "Backend is running!",
    status: "online"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "MAHAD BOT V1 API",
    status: "online"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MAHAD BOT V1 server running on port ${PORT}`);
});
  
