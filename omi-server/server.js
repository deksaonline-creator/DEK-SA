// Omi signaling server: random matchmaking + WebRTC signaling + text chat relay.
// Self-hosted (no external services). Video/audio flows peer-to-peer via WebRTC.
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 5100;
const MAX_MSG = 500;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, online: wss.clients.size }));
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: '/omi-ws', maxPayload: 64 * 1024 });

let waiting = null; // single waiting socket (FIFO of one is enough for 1:1 pairing)

const send = (ws, data) => {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(data));
};

const broadcastOnline = () => {
  const msg = JSON.stringify({ type: 'online', count: wss.clients.size });
  wss.clients.forEach((c) => c.readyState === 1 && c.send(msg));
};

const unpair = (ws, notify = true) => {
  if (waiting === ws) waiting = null;
  const p = ws.partner;
  if (p) {
    ws.partner = null;
    p.partner = null;
    if (notify) send(p, { type: 'partner-left' });
  }
};

const findPartner = (ws) => {
  unpair(ws);
  if (waiting && waiting !== ws && waiting.readyState === 1) {
    const other = waiting;
    waiting = null;
    ws.partner = other;
    other.partner = ws;
    send(other, { type: 'matched', initiator: true });
    send(ws, { type: 'matched', initiator: false });
  } else {
    waiting = ws;
    send(ws, { type: 'waiting' });
  }
};

wss.on('connection', (ws) => {
  ws.partner = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  broadcastOnline();

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    switch (m.type) {
      case 'find': findPartner(ws); break;
      case 'leave': unpair(ws); break;
      case 'signal': if (ws.partner) send(ws.partner, { type: 'signal', data: m.data }); break;
      case 'chat': {
        const text = String(m.text || '').slice(0, MAX_MSG).trim();
        if (text && ws.partner) send(ws.partner, { type: 'chat', text });
        break;
      }
    }
  });

  ws.on('close', () => { unpair(ws); broadcastOnline(); });
  ws.on('error', () => {});
});

// Drop dead connections
setInterval(() => {
  wss.clients.forEach((c) => {
    if (!c.isAlive) return c.terminate();
    c.isAlive = false;
    c.ping();
  });
}, 30000);

server.listen(PORT, () => console.log(`[omi] signaling on :${PORT}`));
