
const wsStatusSpan = document.getElementById('ws-status');
const ecgChartSVGMobile = document.getElementById('ecg-chart-mobile');
const ecgWaveformPolylineMobile = document.getElementById('ecg-waveform-mobile');
const chartPlaceholderTextMobile = ecgChartSVGMobile?.querySelector('.chart-placeholder-mobile');
const serverIpInput = document.getElementById('server-ip');
const connectWsButton = document.getElementById('connect-ws-button');

let socket;
const MAX_DATA_POINTS_MOBILE = 150; // Can be different from desktop
const ecgDataPointsMobile = [];
let currentXMobile = 0;

const MAX_Y_VALUE_MOBILE = 1023; // Should match the source data range
const MIN_Y_VALUE_MOBILE = 0;

function updateWsStatus(status, color = 'black') {
    if (wsStatusSpan) {
        wsStatusSpan.textContent = status;
        wsStatusSpan.style.color = color;
    }
}

function connectWebSocket() {
    let serverIp = serverIpInput.value.trim();
    if (!serverIp) {
        // Attempt to use the current page's host if IP is not entered,
        // assuming server.js is serving mobile.html from the same host.
        serverIp = window.location.hostname;
    }
    
    // Construct WebSocket URL. Default port is 3001.
    const wsUrl = `ws://${serverIp}:${window.location.port || '3001'}`; 
    updateWsStatus('Connecting...', 'orange');
    
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
    }

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        updateWsStatus('Connected', 'green');
        console.log('WebSocket connection established');
        if (chartPlaceholderTextMobile) chartPlaceholderTextMobile.style.display = 'none';
        // Clear old data on new connection
        ecgDataPointsMobile.length = 0;
        currentXMobile = 0;
        if(ecgWaveformPolylineMobile) ecgWaveformPolylineMobile.setAttribute('points', '');

    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'ecgData') {
                if (message.value === 'LEADS_OFF') {
                    handleLeadsOffStateMobile();
                } else {
                    const numericValue = parseInt(message.value, 10);
                    if (!isNaN(numericValue)) {
                        if (chartPlaceholderTextMobile && chartPlaceholderTextMobile.style.display !== 'none') {
                           chartPlaceholderTextMobile.style.display = 'none';
                        }
                        processAndDrawECGDataMobile(numericValue);
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing message or processing data:', e);
        }
    };

    socket.onclose = () => {
        updateWsStatus('Disconnected', 'red');
        console.log('WebSocket connection closed');
        if (chartPlaceholderTextMobile) {
            chartPlaceholderTextMobile.textContent = 'Disconnected. Reconnect to server.';
            chartPlaceholderTextMobile.style.display = 'block';
        }
    };

    socket.onerror = (error) => {
        updateWsStatus('Error', 'red');
        console.error('WebSocket error:', error);
        if (chartPlaceholderTextMobile) {
            chartPlaceholderTextMobile.textContent = 'Connection Error. Check IP & Server.';
            chartPlaceholderTextMobile.style.display = 'block';
        }
    };
}

function handleLeadsOffStateMobile() {
    if (chartPlaceholderTextMobile) {
        chartPlaceholderTextMobile.textContent = 'Leads Off (from Desktop)';
        chartPlaceholderTextMobile.style.display = 'block';
    }
    if (ecgWaveformPolylineMobile) {
        ecgWaveformPolylineMobile.setAttribute('points', ''); // Clear waveform
    }
    ecgDataPointsMobile.length = 0; // Reset data points
    currentXMobile = 0;
}


function processAndDrawECGDataMobile(rawValue) {
    if (!ecgChartSVGMobile || !ecgWaveformPolylineMobile) return;

     if (chartPlaceholderTextMobile && chartPlaceholderTextMobile.style.display !== 'none') {
        chartPlaceholderTextMobile.style.display = 'none';
    }

    const chartWidth = ecgChartSVGMobile.clientWidth;
    const chartHeight = ecgChartSVGMobile.clientHeight;

    const yRange = MAX_Y_VALUE_MOBILE - MIN_Y_VALUE_MOBILE;
    let normalizedY = yRange === 0 ? chartHeight / 2 : ((rawValue - MIN_Y_VALUE_MOBILE) / yRange) * chartHeight;
    normalizedY = chartHeight - normalizedY; // Invert Y for SVG
    normalizedY = Math.max(0, Math.min(chartHeight, normalizedY));

    const xIncrement = chartWidth / (MAX_DATA_POINTS_MOBILE > 1 ? MAX_DATA_POINTS_MOBILE -1 : 1);

    if (ecgDataPointsMobile.length >= MAX_DATA_POINTS_MOBILE) {
        ecgDataPointsMobile.shift();
        ecgDataPointsMobile.forEach(p => p.x -= xIncrement);
        currentXMobile = (MAX_DATA_POINTS_MOBILE -1) * xIncrement;
    } else {
        currentXMobile = ecgDataPointsMobile.length * xIncrement;
    }
    currentXMobile = Math.max(0, Math.min(currentXMobile, chartWidth));


    ecgDataPointsMobile.push({ x: currentXMobile, y: normalizedY });

    const pointsString = ecgDataPointsMobile.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    ecgWaveformPolylineMobile.setAttribute('points', pointsString);
}

connectWsButton?.addEventListener('click', connectWebSocket);

// Automatically try to connect on load using current hostname
document.addEventListener('DOMContentLoaded', () => {
    // Set placeholder for IP input to current hostname for convenience
    if (serverIpInput && !serverIpInput.value) {
        serverIpInput.placeholder = window.location.hostname + ' (auto)';
    }
    // connectWebSocket(); // You might want to auto-connect or require button press
});
