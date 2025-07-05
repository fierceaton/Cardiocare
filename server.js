const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = new require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Endpoint for desktop client to post data
app.post('/data', (req, res) => {
    const { value } = req.body;
    // console.log('Received data from desktop:', value);
    broadcast(value); // Broadcast to WebSocket clients
    res.sendStatus(200);
});

// WebSocket broadcast function
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify({ type: 'ecgData', value: data }));
            } catch (e) {
                console.error('Error sending data to a client:', e);
            }
        }
    });
}

wss.on('connection', ws => {
    console.log('Mobile client connected to WebSocket');
    ws.on('message', message => {
        console.log('Received message from mobile client: %s', message);
        // Can handle messages from mobile if needed in the future
    });
    ws.on('close', () => {
        console.log('Mobile client disconnected');
    });
    ws.on('error', (error) => {
        console.error('WebSocket error with a client:', error);
    });
});

server.listen(PORT, () => {
    console.log(`ECG Relay Server started on port ${PORT}`);
    console.log('Access the main ECG monitor (desktop) at: http://localhost:${PORT}/index.html');
    
    const interfaces = os.networkInterfaces();
    console.log('\nTo access the mobile viewer from another device on the same network, use one of the following URLs:');
    Object.keys(interfaces).forEach(ifaceName => {
        interfaces[ifaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`- http://${iface.address}:${PORT}/mobile.html`);
            }
        });
    });
    console.log('\nMake sure your firewall allows connections to port ${PORT}.');
    console.log('Ensure Arduino is connected to the desktop running this server.');
    console.log('The desktop browser will use Web Serial to get data from Arduino and send it to this server.');
    console.log('Mobile devices will connect to this server via WebSocket to receive the data.');
});
