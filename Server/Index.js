const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;
const SECRET = "supersecretkey"; // change this later

// Upload folder
const upload = multer({ dest: path.join(__dirname, "../uploads/") });

// Serve frontend
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

// Load users
const usersFile = path.join(__dirname, "../data/users.json");
let users = {};
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile));
}

// --- Auth helpers ---
function saveUsers() {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function authenticate(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    return users[decoded.username] || null;
  } catch {
    return null;
  }
}

// --- REST APIs ---
// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) return res.status(401).json({ error: "User not found" });
  if (!bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "1d" });
  res.json({ token, permissions: user.permissions });
});

// File upload
app.post("/upload", upload.single("file"), (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const user = authenticate(token);
  if (!user || !user.permissions.upload)
    return res.status(403).json({ error: "No permission" });

  res.json({ filename: req.file.filename, original: req.file.originalname });
});

// File list
app.get("/files", (req, res) => {
  const files = fs.readdirSync(path.join(__dirname, "../uploads/"));
  res.json(files);
});

// --- WebSocket chat ---
let messages = [];

wss.on("connection", (ws, req) => {
  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw);

      // auth
      const user = authenticate(data.token);
      if (!user) return;

      if (data.type === "message") {
        const msg = {
          id: "msg_" + Date.now(),
          user: user.username,
          text: data.text,
          time: new Date().toISOString(),
          deleted: false
        };
        messages.push(msg);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify({ type: "message", message: msg }));
        });
      }

      if (data.type === "delete") {
        const msg = messages.find((m) => m.id === data.id);
        if (!msg) return;
        // allow delete own or admin delete
        if (msg.user === user.username || user.permissions.delete_messages) {
          msg.text = "Message Deleted";
          msg.deleted = true;
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN)
              client.send(JSON.stringify({ type: "update", message: msg }));
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  // Send existing messages
  ws.send(JSON.stringify({ type: "init", messages }));
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
