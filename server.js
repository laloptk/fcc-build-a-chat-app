import http from 'http';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3001;


const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    const isScript = pathname === '/script.js';
    const file = isScript ? './public/script.js' : './public/index.html';
    const type = isScript ? 'text/javascript' : 'text/html';
    
    fs.readFile(file, (err, data) => {
        if(err) {
            console.log(err);
            res.writeHead(500);
            res.end('Server error');
            return;
        }
        res.writeHead(200, { 'Content-Type': type });
        res.end(data);
    });
});

const wss = new WebSocketServer({ server });

function broadcast(msg) {
    const payload = JSON.stringify(msg);
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
}

wss.on('connection', (socket, req) => {
    console.log('Client connected!');

    const username = new URL(req.url, "http://localhost").searchParams.get(
        "username",
    );

    broadcast({type: 'system', text: `${username} joined`});

    socket.on('message', (data) => {
        const { username, text } = JSON.parse(data.toString());
        broadcast({ type: 'chat', username, text });
    });

    socket.on('close', () => {
        broadcast({ type: 'system', text: `${username} left` });
    });
});

server.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});