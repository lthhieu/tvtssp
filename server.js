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
let allCheckins = []; // {name, phone, image, descriptor, time, buffet,gym,spa,zoo}

let buffetLogs = [];
let gymLogs = [];
let spaLogs = [];
let zooLogs = [];

// ===== UTILS =====
function faceDistance(a,b){
  let sum=0;
  for(let i=0;i<a.length;i++){
    const d=a[i]-b[i];
    sum+=d*d;
  }
  return Math.sqrt(sum);
}

const THRESHOLD = 0.68;

// ===== SOCKET =====
io.on('connection', socket => {
  console.log('🖥️ Client connected:', socket.id);

  socket.on('checkin', data => {
    if(!data.descriptor || !data.image){
      console.log("⚠️ Invalid checkin ignored");
      return;
    }

    const entry = {
      name: data.name,
      phone: data.phone,
      image: data.image,
      descriptor: data.descriptor,
      time: Date.now(),
      buffet:false,
      gym:false,
      spa:false,
      zoo:false
    };

    allCheckins.push(entry);
    totalCheckins++;

    last3.unshift(entry);
    last3 = last3.slice(0,3);

    io.emit('dashboard-update', {
      total: totalCheckins,
      last3
    });

    console.log("📸 Checkin OK:", entry.name);
  });

  socket.on("action_try", data => {
    if(!data.descriptor){
      socket.emit("action_result",{ok:false,reason:"NO_FACE"});
      return;
    }

    const action = data.action;
    const flag = action;

    const match = allCheckins.find(c => !c[flag] && faceDistance(c.descriptor, data.descriptor) < THRESHOLD);

    if(!match){
      socket.emit("action_result",{ok:false,reason:"NO_MATCH"});
      return;
    }

    match[flag] = true;

    const logEntry = {
      name: match.name,
      phone: match.phone,
      time: Date.now()
    };

    if(action==="buffet") buffetLogs.push(logEntry);
    if(action==="gym") gymLogs.push(logEntry);
    if(action==="spa") spaLogs.push(logEntry);
    if(action==="zoo") zooLogs.push(logEntry);

    io.emit("action_screen", {
      action,
      image: match.image,
      name: match.name,
      phone: match.phone
    });

    socket.emit("action_result",{ok:true});
    console.log(`📺 ${action} OK:`, match.name);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ===== API =====
app.get('/api/dashboard-state', (req, res) => {
  res.json({ total: totalCheckins, last3 });
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
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + header + rows);
}

// ===== START =====
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ HTTPS TVTS server running at https://<IP-PC>:${PORT}`);
});
