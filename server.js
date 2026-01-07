const fs = require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const socketIO = require('socket.io');

const app = express();
const server = https.createServer({
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
}, app);

const io = socketIO(server);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== STATE =====
let totalCheckins = 0;
let last3 = [];
let allCheckins = [];

let buffetLogs = [];
let gymLogs = [];
let spaLogs = [];
let zooLogs = [];

// ===== SOCKET =====
io.on('connection', socket => {
  console.log('🖥️ Client connected:', socket.id);

  socket.on('checkin', data => {
    console.log('📸 Check-in received:', data.name);

    totalCheckins++;

    const entry = {
      name: data.name,
      phone: data.phone,
      image: data.image,
      time: Date.now()
    };

    last3.unshift(entry);
    last3 = last3.slice(0, 3);
    allCheckins.push(entry);

    io.emit('dashboard-update', {
      total: totalCheckins,
      last3
    });
  });

  socket.on("action_try", data => {
    console.log("🎯 Action try:", data.action);

    const last = allCheckins[allCheckins.length - 1];

    if (!last) {
      console.log("⚠️ No checkin data available");
      return;
    }

    const entry = {
      name: last.name,
      phone: last.phone,
      time: Date.now()
    };

    if (data.action === "buffet") {
      buffetLogs.push(entry);
      emitAction("buffet", last);
      console.log("📺 Buffet logged:", entry.name);
    }

    if (data.action === "gym") {
      gymLogs.push(entry);
      emitAction("gym", last);
      console.log("📺 Gym logged:", entry.name);
    }

    if (data.action === "spa") {
      spaLogs.push(entry);
      emitAction("spa", last);
      console.log("📺 Spa logged:", entry.name);
    }

    if (data.action === "zoo") {
      zooLogs.push(entry);
      emitAction("zoo", last);
      console.log("📺 Zoo logged:", entry.name);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ===== HELPER =====
function emitAction(action, last) {
  io.emit("action_screen", {
    action,
    image: last.image,
    name: last.name,
    phone: last.phone
  });
}

// ===== API =====
app.get('/api/dashboard-state', (req, res) => {
  res.json({
    total: totalCheckins,
    last3
  });
});

app.get('/api/export-excel', (req, res) => {
  exportCsv(res, allCheckins, "checkin.csv");
});

app.get('/api/export-buffet', (req, res) => {
  exportCsv(res, buffetLogs, "buffet.csv");
});

app.get('/api/export-gym', (req, res) => {
  exportCsv(res, gymLogs, "gym.csv");
});

app.get('/api/export-spa', (req, res) => {
  exportCsv(res, spaLogs, "spa.csv");
});

app.get('/api/export-zoo', (req, res) => {
  exportCsv(res, zooLogs, "zoo.csv");
});

// ===== CSV EXPORT =====
function exportCsv(res, list, filename) {
  const header = 'STT;Tên;SĐT;Thời gian\n';

  const rows = list.map((c, i) =>
    `${i + 1};"${c.name}";"${c.phone}";"${new Date(c.time).toLocaleString()}"`
  ).join('\n');

  const csv = header + rows;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv);
}

// ===== START =====
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ HTTPS TVTS server running at https://<IP-PC>:${PORT}`);
});
