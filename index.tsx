
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as firebaseApp from "firebase/app";
import { getDatabase, ref, set, get, child, update, onValue, off, Database } from "firebase/database";

// --- Firebase Configuration (USER ACTION REQUIRED) ---
// Replace with your Firebase project's configuration object.
// You can find this in Project Settings (gear icon) -> Your apps -> Web app -> SDK setup and configuration.
const firebaseConfig = {
  apiKey: "AIzaSyA4Jma_4vwD2G2qb1iFhQkU2J65tLE-6hM",
  authDomain: "ecg-machine.firebaseapp.com",
  databaseURL: "https://ecg-machine-default-rtdb.firebaseio.com",
  projectId: "ecg-machine",
  storageBucket: "ecg-machine.firebasestorage.app",
  messagingSenderId: "839618848735",
  appId: "1:839618848735:web:fa03222466a7c0defc466a",
  measurementId: "G-LPD0MMBRFH"
};

let firebaseAppInstance: firebaseApp.FirebaseApp | null = null;
let databaseInstance: Database | null = null;
let currentReportRemarksListenerUnsubscribe: (() => void) | null = null;


// --- Role Selection Elements ---
const roleSelectionScreen = document.getElementById('role-selection-screen') as HTMLDivElement;
const selectPatientRoleButton = document.getElementById('select-patient-role') as HTMLButtonElement;
const selectDoctorRoleButton = document.getElementById('select-doctor-role') as HTMLButtonElement;
const appContainer = document.getElementById('app-container') as HTMLDivElement;
const switchRoleButton = document.getElementById('switch-role-button') as HTMLButtonElement;

// --- Doctor Login Elements ---
const doctorLoginSection = document.getElementById('doctor-login-section') as HTMLElement;
const doctorNameSelect = document.getElementById('doctor-name-select') as HTMLSelectElement;
const newDoctorNameInput = document.getElementById('new-doctor-name-input') as HTMLInputElement;
const addDoctorNameButton = document.getElementById('add-doctor-name-button') as HTMLButtonElement;
const reviewCurrentSessionReportButton = document.getElementById('review-current-session-report-button') as HTMLButtonElement; // Renamed
const doctorLoginMessage = document.getElementById('doctor-login-message') as HTMLParagraphElement;

// --- Doctor Report Selection Elements ---
const doctorReportSelectionSection = document.getElementById('doctor-report-selection-section') as HTMLDivElement;
const reportSelectDropdown = document.getElementById('report-select-dropdown') as HTMLSelectElement;
const loadReportButton = document.getElementById('load-report-button') as HTMLButtonElement;
const firebaseStatusMessage = document.getElementById('firebase-status-message') as HTMLParagraphElement;

// --- Main App Content Wrapper ---
const mainAppContent = document.getElementById('main-app-content') as HTMLDivElement;


// --- DOM Elements (existing) ---
const patientNameInput = document.getElementById('patient-name') as HTMLInputElement;
const patientAgeInput = document.getElementById('patient-age') as HTMLInputElement;
const patientGenderSelect = document.getElementById('patient-gender') as HTMLSelectElement;

const connectButton = document.getElementById('connect-button') as HTMLButtonElement;
const demoButton = document.getElementById('demo-button') as HTMLButtonElement;
const connectionStatusSpan = document.getElementById('connection-status') as HTMLSpanElement;
const timerStatusSpan = document.getElementById('timer-status') as HTMLSpanElement;
const relayStatusSpan = document.getElementById('relay-status') as HTMLSpanElement;

const ecgChartSVG = document.getElementById('ecg-chart') as unknown as SVGSVGElement | null;
const ecgWaveformPolyline = document.getElementById('ecg-waveform') as unknown as SVGPolylineElement | null;
const chartPlaceholderText = ecgChartSVG?.querySelector('.chart-placeholder') as SVGTextElement | null;
const ecgChartDefs = document.getElementById('ecg-chart-defs') as unknown as SVGDefsElement | null;
const ecgGridRect = document.getElementById('ecg-grid-rect') as unknown as SVGRectElement | null;
const ecgAxisLabelsGroup = document.getElementById('ecg-axis-labels') as unknown as SVGGElement | null;
const ecgChartTitlesGroup = document.getElementById('ecg-chart-titles') as unknown as SVGGElement | null;

const hrChartSVG = document.getElementById('hr-chart') as unknown as SVGSVGElement | null;
const hrWaveformPolyline = document.getElementById('hr-waveform') as unknown as SVGPolylineElement | null;
const hrChartPlaceholderText = hrChartSVG?.querySelector('.hr-chart-placeholder') as SVGTextElement | null;
const hrValueSpan = document.getElementById('hr-value') as HTMLSpanElement | null;
const hrGridLinesGroup = document.getElementById('hr-grid-lines') as unknown as SVGGElement | null;
const hrAxisLabelsGroup = document.getElementById('hr-axis-labels') as unknown as SVGGElement | null;
const hrChartTitlesGroup = document.getElementById('hr-chart-titles') as unknown as SVGGElement | null;
const hrDotMarkersLiveGroup = document.getElementById('hr-dot-markers-live') as unknown as SVGGElement | null;

const reportSection = document.getElementById('report-section') as HTMLElement | null;
const reportPatientNameSpan = document.getElementById('report-patient-name') as HTMLSpanElement | null;
const reportPatientAgeSpan = document.getElementById('report-patient-age') as HTMLSpanElement | null;
const reportPatientGenderSpan = document.getElementById('report-patient-gender') as HTMLSpanElement | null;
const reportDateTimeSpan = document.getElementById('report-datetime') as HTMLSpanElement | null;
const reportIdDisplaySpan = document.getElementById('report-id-display') as HTMLSpanElement | null;
const downloadPdfButton = document.getElementById('download-pdf-button') as HTMLButtonElement | null;

const reportHrChartSVG = document.getElementById('report-hr-chart') as unknown as SVGSVGElement | null;
const reportHrWaveformPolyline = document.getElementById('report-hr-waveform') as unknown as SVGPolylineElement | null;
const reportHrChartPlaceholderText = reportHrChartSVG?.querySelector('.report-hr-chart-placeholder') as SVGTextElement | null;
const reportHrGridLinesGroup = document.getElementById('report-hr-grid-lines') as unknown as SVGGElement | null;
const reportHrAxisLabelsGroup = document.getElementById('report-hr-axis-labels') as unknown as SVGGElement | null;
const reportHrChartTitlesGroup = document.getElementById('report-hr-chart-titles') as unknown as SVGGElement | null;
const reportHrDotMarkersGroup = document.getElementById('report-hr-dot-markers') as unknown as SVGGElement | null;

const reportMinHrSpan = document.getElementById('report-min-hr-value') as HTMLSpanElement | null;
const reportMaxHrSpan = document.getElementById('report-max-hr-value') as HTMLSpanElement | null;
const reportAvgHrSpan = document.getElementById('report-avg-hr-value') as HTMLSpanElement | null;

const remarksInputContainer = document.getElementById('remarks-input-container') as HTMLDivElement | null;
const doctorRemarksInput = document.getElementById('doctor-remarks-input') as HTMLTextAreaElement | null;
const saveRemarksButton = document.getElementById('save-remarks-button') as HTMLButtonElement | null;
const doctorRemarksDisplay = document.getElementById('doctor-remarks-display') as HTMLParagraphElement | null;
const waitingForRemarksMessage = document.getElementById('waiting-for-remarks-message') as HTMLParagraphElement | null;

const reportEcgSnapshotSVG = document.getElementById('report-ecg-snapshot') as unknown as SVGSVGElement | null;
const reportEcgSnapshotDefs = document.getElementById('report-ecg-snapshot-defs') as unknown as SVGDefsElement | null;
const reportGridRect = document.getElementById('report-grid-rect') as unknown as SVGRectElement | null;
const reportSnapshotHrText = document.getElementById('report-snapshot-hr-text') as unknown as SVGTextElement | null;
const reportAxisLabelsGroup = document.getElementById('report-axis-labels') as unknown as SVGGElement | null;
const reportChartTitlesGroup = document.getElementById('report-chart-titles') as unknown as SVGGElement | null;
let reportEcgWaveformPolyline: SVGPolylineElement | null = null;

// --- App State ---
type UserRole = 'patient' | 'doctor' | null;
let currentUserRole: UserRole = null;
let doctorNamesList: string[] = [];
let currentDoctorName: string | null = null;

interface ReportData {
    reportId: string; // Unique ID for Firebase
    patientInfo: { name: string; age: string; gender: string };
    dateTime: string;
    recordedDataForReport: number[];
    heartRateDataPoints: { relativeTimestampMs: number; bpm: number }[];
    detectedBeatTimestamps: number[];
    remarks: string;
    avgBpm: string;
    minBpm: string;
    maxBpm: string;
    doctorName?: string; // Optionally store which doctor made remarks
}
let activeReportData: ReportData | null = null;


// --- Constants (existing) ---
const BAUD_RATE = 9600; // CORRECTED: Must match Arduino's Serial.begin() rate
const RECORDING_DURATION_MS = 15000;
const DATA_READ_INTERVAL_MS = 75; // Used for demo mode interval
const ECG_MM_PER_MV = 10;
const ECG_MM_PER_SECOND = 25;
const ECG_TOTAL_MV_SPAN = 3.0;
const ECG_MIN_MV = -ECG_TOTAL_MV_SPAN / 2;
const ECG_MAX_MV = ECG_TOTAL_MV_SPAN / 2;
const LIVE_ECG_TIME_WINDOW_SECONDS = 2.5;
const MAX_DATA_POINTS_LIVE_ECG = Math.ceil((LIVE_ECG_TIME_WINDOW_SECONDS * 1000) / DATA_READ_INTERVAL_MS) + 1;
const ECG_MINOR_GRID_COLOR = "#FFDDE0"; // Standard ECG: Light Pink for minor grid lines
const ECG_MAJOR_GRID_COLOR = "#FFA0A0"; // Standard ECG: More prominent Pink/Red for major grid lines
const MAX_RAW_Y_VALUE = 1023;
const MIN_RAW_Y_VALUE = 0;
const PEAK_DETECT_THRESHOLD_ECG = 680;
const MIN_MS_BETWEEN_BEATS_FOR_DETECTION = 250;
const MIN_BPM = 30;
const MAX_BPM = 220;
const HR_DOT_INTERVAL_MS = 2500;
const chartMargins = { top: 40, right: 20, bottom: 50, left: 60 };

let port: SerialPort | null = null;
let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
let keepReading = false;
let recordingInterval: number | null = null;
let demoInterval: number | null = null;
let countdownTimer: number | null = null;

const liveEcgDataPoints: { x: number, y: number }[] = [];
const recordedDataForReportInternal: number[] = [];
const heartRateDataPointsInternal: { relativeTimestampMs: number, bpm: number }[] = [];
const detectedBeatTimestampsInternal: number[] = [];

let lastBeatTimestampForBPM = 0;
let recordingStartTime = 0;

let currentMaxRecordedBpmInSession = MIN_BPM;
let currentDynamicBpmYMax = 100;

const simulatedBeatPattern = [ 525, 545, 515, 480, 950, 450, 512, 515, 560, 580, 530 ];
let demoPatternIndex = 0;
let isDemoMode = false;
let isDeviceConnected = false;
let relayStatusTimeout: number | null = null;


// --- Firebase Helper Functions ---
function initializeFirebase() {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.databaseURL || firebaseConfig.databaseURL === "YOUR_DATABASE_URL") {
        updateFirebaseStatus("Firebase not configured. Please update API keys and Database URL in index.tsx.", "error");
        console.error("Firebase configuration is missing or incomplete. Ensure `firebaseConfig` in index.tsx is correctly set up with your project's details, especially `databaseURL`.");
        if (reportSelectDropdown) {
             reportSelectDropdown.innerHTML = '<option value="">Firebase Not Configured</option>';
        }
        return false;
    }
    try {
        if (!firebaseAppInstance) { // Prevent re-initialization
            firebaseAppInstance = firebaseApp.initializeApp(firebaseConfig);
            databaseInstance = getDatabase(firebaseAppInstance);
            updateFirebaseStatus("Firebase initialized.", "success");
            console.log("Firebase initialized successfully.");
        }
        return true;
    } catch (error: any) {
        console.error("Firebase initialization error:", error);
        updateFirebaseStatus(`Firebase init error: ${error.message}`, "error");
         if (reportSelectDropdown) {
             reportSelectDropdown.innerHTML = '<option value="">Firebase Init Error</option>';
        }
        return false;
    }
}

function updateFirebaseStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    if (firebaseStatusMessage) {
        firebaseStatusMessage.textContent = message;
        firebaseStatusMessage.className = `firebase-status-${type}`;
    }
}

function generateReportId(patientName: string, timestamp: number): string {
    const namePart = patientName.replace(/\s+/g, '_').substring(0, 20);
    return `${timestamp}_${namePart}`;
}

async function saveReportToFirebase(reportData: ReportData) {
    if (!databaseInstance) {
        updateFirebaseStatus("Firebase not initialized. Cannot save report.", "error");
        return;
    }
    if (!reportData.reportId) {
        updateFirebaseStatus("Report ID missing. Cannot save.", "error");
        console.error("Report ID is missing in reportData:", reportData);
        return;
    }
    updateFirebaseStatus(`Saving report ${reportData.reportId}...`, "info");
    try {
        await set(ref(databaseInstance, 'reports/' + reportData.reportId), reportData);
        updateFirebaseStatus(`Report ${reportData.reportId} saved successfully.`, "success");
    } catch (error: any) {
        console.error("Error saving report to Firebase:", error);
        updateFirebaseStatus(`Error saving report: ${error.message}`, "error");
    }
}

async function updateRemarksInFirebase(reportId: string, remarks: string, doctorName: string | null) {
    if (!databaseInstance) {
        updateFirebaseStatus("Firebase not initialized. Cannot update remarks.", "error");
        return;
    }
    updateFirebaseStatus(`Updating remarks for ${reportId}...`, "info");
    try {
        const updates: { [key: string]: any } = {};
        updates[`/reports/${reportId}/remarks`] = remarks;
        if (doctorName) {
            updates[`/reports/${reportId}/doctorName`] = doctorName;
        }
        await update(ref(databaseInstance), updates);
        updateFirebaseStatus(`Remarks for ${reportId} updated.`, "success");
    } catch (error: any) {
        console.error("Error updating remarks in Firebase:", error);
        updateFirebaseStatus(`Error updating remarks: ${error.message}`, "error");
    }
}

async function fetchAndPopulateDoctorReportList() {
    if (!databaseInstance || !reportSelectDropdown || !loadReportButton) return;

    reportSelectDropdown.innerHTML = '<option value="">Loading reports...</option>';
    reportSelectDropdown.disabled = true;
    loadReportButton.disabled = true;
    updateFirebaseStatus("Fetching report list...", "info");

    try {
        const reportsRef = ref(databaseInstance, 'reports');
        const snapshot = await get(reportsRef);
        if (snapshot.exists()) {
            reportSelectDropdown.innerHTML = '<option value="">-- Select a Report --</option>';
            let reportCount = 0;
            snapshot.forEach((childSnapshot) => {
                const report = childSnapshot.val() as ReportData;
                const option = document.createElement('option');
                option.value = childSnapshot.key || report.reportId; // Use key as reportId
                // Display patient name and a formatted date for better readability
                const date = new Date(report.dateTime).toLocaleDateString();
                option.textContent = `${report.patientInfo.name} (${date})`;
                reportSelectDropdown.appendChild(option);
                reportCount++;
            });
            if (reportCount === 0) {
                 reportSelectDropdown.innerHTML = '<option value="">No reports found</option>';
            } else {
                reportSelectDropdown.disabled = false;
            }
            updateFirebaseStatus(reportCount > 0 ? "Report list loaded." : "No reports found in database.", "success");
        } else {
            reportSelectDropdown.innerHTML = '<option value="">No reports found</option>';
            updateFirebaseStatus("No reports found in database.", "info");
        }
    } catch (error: any) {
        console.error("Error fetching report list from Firebase:", error);
        reportSelectDropdown.innerHTML = '<option value="">Error loading reports</option>';
        updateFirebaseStatus(`Error fetching reports: ${error.message}`, "error");
    }
}

async function loadReportForDoctor(reportId: string) {
    if (!databaseInstance) {
        updateFirebaseStatus("Firebase not initialized. Cannot load report.", "error");
        return;
    }
    if (!reportId) {
        updateFirebaseStatus("No report selected.", "info");
        return;
    }
    updateFirebaseStatus(`Loading report ${reportId}...`, "info");
    try {
        const reportRef = child(ref(databaseInstance, 'reports'), reportId);
        const snapshot = await get(reportRef);
        if (snapshot.exists()) {
            activeReportData = snapshot.val() as ReportData;
            if (activeReportData) {
                updateFirebaseStatus(`Report ${reportId} loaded.`, "success");
                doctorLoginSection.style.display = 'none';
                doctorReportSelectionSection.style.display = 'none'; // Hide selection part
                mainAppContent.style.display = 'block';
                document.getElementById('patient-info')?.style.setProperty('display', 'none', 'important');
                document.getElementById('controls')?.style.setProperty('display', 'none', 'important');
                (document.querySelector('#ecg-chart-container')?.closest('.chart-container-wrapper') as HTMLElement | null)?.style.setProperty('display', 'none', 'important');
                (document.querySelector('#hr-chart-container')?.closest('.chart-container-wrapper') as HTMLElement | null)?.style.setProperty('display', 'none', 'important');

                if (reportSection) reportSection.style.display = 'block';
                displayActiveReport();
                 // Subscribe to remarks changes for this loaded report
                subscribeToRemarksChanges(reportId);
            } else {
                 updateFirebaseStatus(`Failed to parse report ${reportId}.`, "error");
            }
        } else {
            updateFirebaseStatus(`Report ${reportId} not found.`, "error");
            activeReportData = null;
        }
    } catch (error: any) {
        console.error("Error loading report from Firebase:", error);
        updateFirebaseStatus(`Error loading report: ${error.message}`, "error");
        activeReportData = null;
    }
}

function subscribeToRemarksChanges(reportId: string) {
    if (!databaseInstance || !reportId) return;

    // Unsubscribe from previous listener if any
    if (currentReportRemarksListenerUnsubscribe) {
        currentReportRemarksListenerUnsubscribe();
        currentReportRemarksListenerUnsubscribe = null;
    }

    const remarksRef = ref(databaseInstance, `reports/${reportId}/remarks`);
    currentReportRemarksListenerUnsubscribe = onValue(remarksRef, (snapshot) => {
        const remarks = snapshot.val();
        if (activeReportData && activeReportData.reportId === reportId && doctorRemarksDisplay) {
            activeReportData.remarks = remarks || ""; // Update active data
             if (currentUserRole === 'patient' || (currentUserRole === 'doctor' && doctorRemarksInput?.value !== remarks)) {
                doctorRemarksDisplay.textContent = activeReportData.remarks;
                doctorRemarksDisplay.style.display = activeReportData.remarks.trim() ? 'block' : 'none';
                if (waitingForRemarksMessage && currentUserRole === 'patient') {
                    waitingForRemarksMessage.style.display = activeReportData.remarks.trim() ? 'none' : 'block';
                }
                if (downloadPdfButton && currentUserRole === 'patient') { // Update PDF button state based on new remarks for patient
                    downloadPdfButton.disabled = !activeReportData.remarks.trim();
                }
            }
        }
    }, (error) => {
        console.error(`Error listening to remarks for report ${reportId}:`, error);
        updateFirebaseStatus(`Error on remarks listener: ${error.message}`, "error");
    });
}


// --- Utility Functions (existing, may need minor adaptations) ---
function validatePatientInfo(): boolean {
    if (!patientNameInput || !patientAgeInput || !patientGenderSelect || !connectButton || !demoButton) return false;
    const isValid = patientNameInput.value.trim() !== '' &&
        patientAgeInput.valueAsNumber > 0 && patientAgeInput.valueAsNumber <= 150 &&
        patientGenderSelect.value !== '';

    connectButton.disabled = !isValid;
    demoButton.disabled = !isValid;

    if (!isValid) {
        updateConnectionStatus('Enter Patient Info', 'disconnected');
        if (hrValueSpan) hrValueSpan.textContent = '-';
        resetAndClearCharts(true);
    }
    return isValid;
}

function updateConnectionStatus(status: string, type: 'connected' | 'disconnected' | 'recording' | 'error' | 'connecting' | 'demomode' = 'disconnected') {
    if (!connectionStatusSpan) return;
    connectionStatusSpan.textContent = status;
    connectionStatusSpan.className = type;
}

function updateTimerStatus(message: string) {
    if (timerStatusSpan) timerStatusSpan.textContent = message;
}

function updateRelayStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    if (!relayStatusSpan) return;
    relayStatusSpan.textContent = message;
    relayStatusSpan.className = type;
}

async function sendDataToServer(data: string | number) {
    if (relayStatusTimeout) clearTimeout(relayStatusTimeout);
    updateRelayStatus('Relaying...', 'info');
    try {
        const response = await fetch('/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: data }),
        });
        if (response.ok) {
            updateRelayStatus('Relay Success ✓', 'success');
        } else {
            updateRelayStatus(`Relay Failed: ${response.status}`, 'error');
            console.error('Failed to send data to server:', response.status, await response.text());
        }
    } catch (error) {
        updateRelayStatus('Relay Error X', 'error');
        console.error('Error sending data to server:', error);
    }
    relayStatusTimeout = window.setTimeout(() => {
        if (relayStatusSpan && (relayStatusSpan.className === 'success' || relayStatusSpan.className === 'error')) {
            updateRelayStatus('', 'info');
        }
    }, 2000);
}


function createEcgGridPattern(id: string, pixelsPerMmX: number, pixelsPerMmY: number, defsElement: SVGDefsElement | null): void {
    if (!defsElement) return;
    const existingPattern = defsElement.querySelector(`#${id}`);
    if (existingPattern) existingPattern.remove();
    const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", id);
    pattern.setAttribute("width", (pixelsPerMmX * 5).toString());
    pattern.setAttribute("height", (pixelsPerMmY * 5).toString());
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    for (let i = 0; i < 5; i++) {
        const xLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xLine.setAttribute("x1", (i * pixelsPerMmX).toString()); xLine.setAttribute("y1", "0");
        xLine.setAttribute("x2", (i * pixelsPerMmX).toString()); xLine.setAttribute("y2", (pixelsPerMmY * 5).toString());
        xLine.setAttribute("stroke", ECG_MINOR_GRID_COLOR); xLine.setAttribute("stroke-width", "0.5");
        pattern.appendChild(xLine);
        const yLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yLine.setAttribute("x1", "0"); yLine.setAttribute("y1", (i * pixelsPerMmY).toString());
        yLine.setAttribute("x2", (pixelsPerMmX * 5).toString()); yLine.setAttribute("y2", (i * pixelsPerMmY).toString());
        yLine.setAttribute("stroke", ECG_MINOR_GRID_COLOR); yLine.setAttribute("stroke-width", "0.5");
        pattern.appendChild(yLine);
    }
    const majorXLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    majorXLine.setAttribute("x1", "0"); majorXLine.setAttribute("y1", "0");
    majorXLine.setAttribute("x2", "0"); majorXLine.setAttribute("y2", (pixelsPerMmY * 5).toString());
    majorXLine.setAttribute("stroke", ECG_MAJOR_GRID_COLOR); majorXLine.setAttribute("stroke-width", "1");
    pattern.appendChild(majorXLine);
    const majorYLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    majorYLine.setAttribute("x1", "0"); majorYLine.setAttribute("y1", "0");
    majorYLine.setAttribute("x2", (pixelsPerMmX * 5).toString()); majorYLine.setAttribute("y2", "0");
    majorYLine.setAttribute("stroke", ECG_MAJOR_GRID_COLOR); majorYLine.setAttribute("stroke-width", "1");
    pattern.appendChild(majorYLine);
    defsElement.appendChild(pattern);
}

interface ChartConfig {
    svg: SVGSVGElement;
    axisLabelsGroup: SVGGElement | null;
    chartTitlesGroup: SVGGElement | null;
    gridLinesGroup?: SVGGElement | null;
    defsElement?: SVGDefsElement | null;
    gridRect?: SVGRectElement | null;
    mainTitle: string; xLabel: string; yLabel: string;
    chartType: 'ecg-live' | 'ecg-report' | 'hr' | 'hr-report';
    timeWindowSeconds?: number;
    yMinBPM?: number; yMaxBPM?: number; xMaxSeconds?: number;
}

function drawChartStaticElements(config: ChartConfig) {
    const { svg, axisLabelsGroup, chartTitlesGroup, gridLinesGroup, defsElement, gridRect,
            mainTitle, xLabel, yLabel, chartType,
            timeWindowSeconds, yMinBPM, yMaxBPM, xMaxSeconds } = config;
    if (!svg || !axisLabelsGroup || !chartTitlesGroup) return;
    const chartWidth = svg.clientWidth; const chartHeight = svg.clientHeight;
    if (chartWidth === 0 || chartHeight === 0) return;
    const plotAreaWidth = chartWidth - chartMargins.left - chartMargins.right;
    const plotAreaHeight = chartHeight - chartMargins.top - chartMargins.bottom;
    while (axisLabelsGroup.firstChild) axisLabelsGroup.firstChild.remove();
    while (chartTitlesGroup.firstChild) chartTitlesGroup.firstChild.remove();
    if (gridLinesGroup) { while (gridLinesGroup.firstChild) gridLinesGroup.firstChild.remove(); }

    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", (chartWidth / 2).toString()); titleText.setAttribute("y", (chartMargins.top / 2 + 5).toString());
    titleText.setAttribute("class", "chart-title-svg"); titleText.textContent = mainTitle;
    chartTitlesGroup.appendChild(titleText);
    const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisLabel.setAttribute("class", "axis-label-svg"); yAxisLabel.setAttribute("transform", `translate(${chartMargins.left / 2 - 5}, ${chartMargins.top + plotAreaHeight / 2}) rotate(-90)`);
    yAxisLabel.textContent = yLabel; axisLabelsGroup.appendChild(yAxisLabel);
    const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xAxisLabel.setAttribute("class", "axis-label-svg"); xAxisLabel.setAttribute("x", (chartMargins.left + plotAreaWidth / 2).toString());
    xAxisLabel.setAttribute("y", (chartHeight - chartMargins.bottom / 2 + 10).toString()); xAxisLabel.textContent = xLabel;
    axisLabelsGroup.appendChild(xAxisLabel);

    if (chartType === 'ecg-live' || chartType === 'ecg-report') {
        if (!defsElement || !gridRect || !timeWindowSeconds) return;
        const totalMmY = ECG_TOTAL_MV_SPAN * ECG_MM_PER_MV; const pixelsPerMmY = plotAreaHeight / totalMmY;
        const totalMmX = timeWindowSeconds * ECG_MM_PER_SECOND; const pixelsPerMmX = plotAreaWidth / totalMmX;
        const patternId = chartType === 'ecg-live' ? 'ecg-live-grid-pattern' : 'ecg-report-grid-pattern';
        createEcgGridPattern(patternId, pixelsPerMmX, pixelsPerMmY, defsElement);
        gridRect.setAttribute("fill", `url(#${patternId})`); gridRect.setAttribute("x", chartMargins.left.toString());
        gridRect.setAttribute("y", chartMargins.top.toString()); gridRect.setAttribute("width", plotAreaWidth.toString());
        gridRect.setAttribute("height", plotAreaHeight.toString());
        const mvTickValues = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];
        mvTickValues.forEach(mv => {
            const yPos = chartMargins.top + plotAreaHeight / 2 - (mv * ECG_MM_PER_MV * pixelsPerMmY);
            if (yPos >= chartMargins.top && yPos <= chartMargins.top + plotAreaHeight) {
                const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                tickLabel.setAttribute("class", "axis-tick-label-svg"); tickLabel.setAttribute("x", (chartMargins.left - 8).toString());
                tickLabel.setAttribute("y", yPos.toString()); tickLabel.setAttribute("text-anchor", "end");
                tickLabel.setAttribute("dominant-baseline", "middle"); tickLabel.textContent = mv.toFixed(1);
                axisLabelsGroup.appendChild(tickLabel);
            }
        });
        const majorTickTimeIntervalSeconds = chartType === 'ecg-report' ? 2.5 : 0.2;
        const numMajorTimeTicks = Math.floor(timeWindowSeconds / majorTickTimeIntervalSeconds);
        for (let i = 0; i <= numMajorTimeTicks; i++) {
            const timeVal = i * majorTickTimeIntervalSeconds;
            if (chartType === 'ecg-live' && timeVal > timeWindowSeconds + 0.01) continue;
            if (chartType === 'ecg-report' && timeVal > timeWindowSeconds + 0.01 && i < numMajorTimeTicks) continue;
            const xPos = chartMargins.left + (timeVal / timeWindowSeconds) * plotAreaWidth;
             if (xPos >= chartMargins.left && xPos <= chartMargins.left + plotAreaWidth + 1 ) {
                const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                tickLabel.setAttribute("class", "axis-tick-label-svg"); tickLabel.setAttribute("x", xPos.toString());
                tickLabel.setAttribute("y", (chartHeight - chartMargins.bottom + 15).toString());
                tickLabel.setAttribute("text-anchor", "middle");
                tickLabel.textContent = chartType === 'ecg-live' ? (timeVal - timeWindowSeconds).toFixed(1) : timeVal.toFixed(timeVal % 1 === 0 ? 0 : 1);
                axisLabelsGroup.appendChild(tickLabel);
            }
        }
    } else if ((chartType === 'hr' || chartType === 'hr-report') && gridLinesGroup && yMinBPM !== undefined && yMaxBPM !== undefined && xMaxSeconds !== undefined) {
        const yRangeBPM = yMaxBPM - yMinBPM; const numHorzGridLines = 5;
        for (let i = 0; i <= numHorzGridLines; i++) {
            const y = chartMargins.top + (i / numHorzGridLines) * plotAreaHeight;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", chartMargins.left.toString()); line.setAttribute("y1", y.toString());
            line.setAttribute("x2", (chartMargins.left + plotAreaWidth).toString()); line.setAttribute("y2", y.toString());
            line.setAttribute("class", "grid-line-svg"); gridLinesGroup.appendChild(line);
            const bpmValue = Math.round(yMaxBPM - (i / numHorzGridLines) * yRangeBPM);
            const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tickLabel.setAttribute("class", "axis-tick-label-svg"); tickLabel.setAttribute("x", (chartMargins.left - 8).toString());
            tickLabel.setAttribute("y", y.toString()); tickLabel.setAttribute("text-anchor", "end");
            tickLabel.setAttribute("dominant-baseline", "middle"); tickLabel.textContent = bpmValue.toString();
            axisLabelsGroup.appendChild(tickLabel);
        }
        const numVertGridLines = Math.floor(xMaxSeconds / HR_DOT_INTERVAL_MS);
        for (let i = 0; i <= numVertGridLines; i++) {
            const timeValue = i * HR_DOT_INTERVAL_MS / 1000;
             if (timeValue > xMaxSeconds + 0.01 && i < numVertGridLines) continue;
            const x = chartMargins.left + (timeValue / xMaxSeconds) * plotAreaWidth;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x.toString()); line.setAttribute("y1", chartMargins.top.toString());
            line.setAttribute("x2", x.toString()); line.setAttribute("y2", (chartMargins.top + plotAreaHeight).toString());
            line.setAttribute("class", "grid-line-svg"); gridLinesGroup.appendChild(line);
            const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tickLabel.setAttribute("class", "axis-tick-label-svg"); tickLabel.setAttribute("x", x.toString());
            tickLabel.setAttribute("y", (chartHeight - chartMargins.bottom + 15).toString());
            tickLabel.setAttribute("text-anchor", "middle"); tickLabel.textContent = timeValue.toFixed(timeValue % 1 === 0 ? 0 : 1);
            axisLabelsGroup.appendChild(tickLabel);
        }
    }
}

function processAndDrawLiveData(rawValue: number) {
    if (!ecgChartSVG || !ecgWaveformPolyline) return;
    if (chartPlaceholderText && chartPlaceholderText.style.display !== 'none') chartPlaceholderText.style.display = 'none';
    const chartWidth = ecgChartSVG.clientWidth; const chartHeight = ecgChartSVG.clientHeight;
    if (chartWidth === 0 || chartHeight === 0) return;
    const plotAreaWidth = chartWidth - chartMargins.left - chartMargins.right;
    const plotAreaHeight = chartHeight - chartMargins.top - chartMargins.bottom;
    const totalMmY = ECG_TOTAL_MV_SPAN * ECG_MM_PER_MV; const pixelsPerMmY = plotAreaHeight / totalMmY;
    const mvValue = ((rawValue - MIN_RAW_Y_VALUE) / (MAX_RAW_Y_VALUE - MIN_RAW_Y_VALUE)) * ECG_TOTAL_MV_SPAN + ECG_MIN_MV;
    let yPixel = plotAreaHeight / 2 - (mvValue * ECG_MM_PER_MV * pixelsPerMmY);
    yPixel += chartMargins.top;
    yPixel = Math.max(chartMargins.top, Math.min(chartMargins.top + plotAreaHeight, yPixel));
    const pixelsPerDataPoint = plotAreaWidth / (MAX_DATA_POINTS_LIVE_ECG - 1);
    if (liveEcgDataPoints.length >= MAX_DATA_POINTS_LIVE_ECG) {
        liveEcgDataPoints.shift(); liveEcgDataPoints.forEach(p => p.x -= pixelsPerDataPoint);
    }
    liveEcgDataPoints.push({ x: chartMargins.left + plotAreaWidth, y: yPixel });
    liveEcgDataPoints.forEach((p, i) => p.x = chartMargins.left + i * pixelsPerDataPoint);
    ecgWaveformPolyline.setAttribute('points', liveEcgDataPoints.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));
    detectBeatAndCalculateBPM(rawValue, Date.now());
}

function detectBeatAndCalculateBPM(rawValue: number, currentTimestampMs: number) {
    if (rawValue > PEAK_DETECT_THRESHOLD_ECG && (currentTimestampMs - lastBeatTimestampForBPM > MIN_MS_BETWEEN_BEATS_FOR_DETECTION)) {
        lastBeatTimestampForBPM = currentTimestampMs;
        detectedBeatTimestampsInternal.push(currentTimestampMs);
        if (detectedBeatTimestampsInternal.length >= 2) {
            const lastIndex = detectedBeatTimestampsInternal.length - 1;
            const rrIntervalMs = detectedBeatTimestampsInternal[lastIndex] - detectedBeatTimestampsInternal[lastIndex - 1];
            if (rrIntervalMs > 0) {
                let bpm = 60000 / rrIntervalMs;
                bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
                currentMaxRecordedBpmInSession = Math.max(currentMaxRecordedBpmInSession, bpm);
                drawHeartRateData(bpm, currentTimestampMs, false, heartRateDataPointsInternal);
            }
        }
    }
}

function getCurrentDynamicBpmYMax(): number {
    if (currentMaxRecordedBpmInSession <= 100) return 100;
    if (currentMaxRecordedBpmInSession <= 150) return 150;
    return MAX_BPM;
}

function drawHeartRateData(
    bpmValue: number | null,
    absoluteTimestampMs: number | null,
    isForReport: boolean,
    dataSource: { relativeTimestampMs: number, bpm: number }[]
) {
    const targetChartSVG = isForReport ? reportHrChartSVG : hrChartSVG;
    const targetWaveformPolyline = isForReport ? reportHrWaveformPolyline : hrWaveformPolyline;
    const targetPlaceholderText = isForReport ? reportHrChartPlaceholderText : hrChartPlaceholderText;
    const targetDotMarkersGroup = isForReport ? reportHrDotMarkersGroup : hrDotMarkersLiveGroup;
    const targetAxisLabelsGroup = isForReport ? reportHrAxisLabelsGroup : hrAxisLabelsGroup;
    const targetTitlesGroup = isForReport ? reportHrChartTitlesGroup : hrChartTitlesGroup;
    const targetGridLinesGroup = isForReport ? reportHrGridLinesGroup : hrGridLinesGroup;

    if (!targetChartSVG || !targetWaveformPolyline || (!isForReport && !hrValueSpan)) return;
    if (targetPlaceholderText && targetPlaceholderText.style.display !== 'none') targetPlaceholderText.style.display = 'none';
    if (!isForReport && hrValueSpan && bpmValue !== null) hrValueSpan.textContent = Math.round(bpmValue).toString();

    const chartWidth = targetChartSVG.clientWidth; const chartHeight = targetChartSVG.clientHeight;
    if (chartWidth === 0 || chartHeight === 0) return;
    const plotAreaWidth = chartWidth - chartMargins.left - chartMargins.right;
    const plotAreaHeight = chartHeight - chartMargins.top - chartMargins.bottom;

    const dynamicYMaxForThisChart = isForReport ? (activeReportData ? Math.max(...activeReportData.heartRateDataPoints.map(p => p.bpm), MIN_BPM, 100) : MAX_BPM) : getCurrentDynamicBpmYMax();
    const yMaxToUse = Math.ceil(Math.max(dynamicYMaxForThisChart, MIN_BPM + 20) / 50) * 50;

    if (isForReport || dynamicYMaxForThisChart !== currentDynamicBpmYMax) {
        if(!isForReport) currentDynamicBpmYMax = yMaxToUse;
        drawChartStaticElements({
            svg: targetChartSVG, axisLabelsGroup: targetAxisLabelsGroup, chartTitlesGroup: targetTitlesGroup,
            gridLinesGroup: targetGridLinesGroup, mainTitle: isForReport ? "Heart Rate Trend (15s)" : "Heart Rate Monitor",
            xLabel: "Time (s)", yLabel: "BPM", chartType: isForReport ? 'hr-report' : 'hr',
            yMinBPM: MIN_BPM, yMaxBPM: yMaxToUse,
            xMaxSeconds: RECORDING_DURATION_MS / 1000
        });
    }

    if (!isForReport && bpmValue !== null && absoluteTimestampMs !== null) {
        const relativeTimestampMs = absoluteTimestampMs - recordingStartTime;
        dataSource.push({ relativeTimestampMs, bpm: bpmValue });
        dataSource.sort((a, b) => a.relativeTimestampMs - b.relativeTimestampMs);
    }

    if (dataSource.length === 0) {
        targetWaveformPolyline.setAttribute('points', '');
        if (targetDotMarkersGroup) while (targetDotMarkersGroup.firstChild) targetDotMarkersGroup.firstChild.remove();
        return;
    }

    const pointsString = dataSource.map(point => {
        const x = chartMargins.left + (point.relativeTimestampMs / RECORDING_DURATION_MS) * plotAreaWidth;
        const yRange = yMaxToUse - MIN_BPM;
        let normalizedY = yRange === 0 ? plotAreaHeight / 2 : ((point.bpm - MIN_BPM) / yRange) * plotAreaHeight;
        normalizedY = plotAreaHeight - normalizedY; normalizedY += chartMargins.top;
        normalizedY = Math.max(chartMargins.top, Math.min(chartMargins.top + plotAreaHeight, normalizedY));
        return `${x.toFixed(2)},${normalizedY.toFixed(2)}`;
    }).join(' ');
    targetWaveformPolyline.setAttribute('points', pointsString);

    if (targetDotMarkersGroup) {
        while (targetDotMarkersGroup.firstChild) targetDotMarkersGroup.firstChild.firstChild.remove();
        for (let t = 0; t <= RECORDING_DURATION_MS; t += HR_DOT_INTERVAL_MS) {
            let closestPoint = null; let minDiff = Infinity;
            for (const p of dataSource) {
                const diff = Math.abs(p.relativeTimestampMs - t);
                if (diff < minDiff) { minDiff = diff; closestPoint = p; }
                if (p.relativeTimestampMs > t && closestPoint && closestPoint.relativeTimestampMs < t) break;
            }
            if (closestPoint) {
                const x = chartMargins.left + (closestPoint.relativeTimestampMs / RECORDING_DURATION_MS) * plotAreaWidth;
                const yRange = yMaxToUse - MIN_BPM;
                let normalizedY = yRange === 0 ? plotAreaHeight / 2 : ((closestPoint.bpm - MIN_BPM) / yRange) * plotAreaHeight;
                normalizedY = plotAreaHeight - normalizedY; normalizedY += chartMargins.top;
                normalizedY = Math.max(chartMargins.top, Math.min(chartMargins.top + plotAreaHeight, normalizedY));
                const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                dot.setAttribute("cx", x.toFixed(2)); dot.setAttribute("cy", normalizedY.toFixed(2));
                dot.setAttribute("r", "3"); dot.setAttribute("class", "hr-dot-marker");
                targetDotMarkersGroup.appendChild(dot);
            }
        }
    }
}

function resetAndClearCharts(clearPatientInfoRelated: boolean = false) {
    liveEcgDataPoints.length = 0;
    recordedDataForReportInternal.length = 0;
    heartRateDataPointsInternal.length = 0;
    detectedBeatTimestampsInternal.length = 0;
    lastBeatTimestampForBPM = 0;
    currentMaxRecordedBpmInSession = MIN_BPM;
    currentDynamicBpmYMax = 100;

    if (ecgWaveformPolyline) ecgWaveformPolyline.setAttribute('points', '');
    if (hrWaveformPolyline) hrWaveformPolyline.setAttribute('points', '');
    if (hrDotMarkersLiveGroup) while (hrDotMarkersLiveGroup.firstChild) hrDotMarkersLiveGroup.firstChild.remove();
    if (reportHrWaveformPolyline) reportHrWaveformPolyline.setAttribute('points', '');
    if (reportHrDotMarkersGroup) while (reportHrDotMarkersGroup.firstChild) reportHrDotMarkersGroup.firstChild.remove();

    if (chartPlaceholderText) {
        chartPlaceholderText.style.display = 'block';
        chartPlaceholderText.textContent = clearPatientInfoRelated ? 'Enter patient info, then connect or start demo' : 'Connect or start demo for ECG';
    }
    if (hrChartPlaceholderText) {
        hrChartPlaceholderText.style.display = 'block';
        hrChartPlaceholderText.textContent = clearPatientInfoRelated ? 'Enter patient info, then record for BPM' : 'Start recording for BPM';
    }
    if (reportHrChartPlaceholderText) {
        reportHrChartPlaceholderText.style.display = 'block';
        reportHrChartPlaceholderText.textContent = 'HR data will appear here after recording.';
    }

    if (hrValueSpan) hrValueSpan.textContent = '-';
    if (reportMinHrSpan) reportMinHrSpan.textContent = '-';
    if (reportMaxHrSpan) reportMaxHrSpan.textContent = '-';
    if (reportAvgHrSpan) reportAvgHrSpan.textContent = '-';
    if (reportIdDisplaySpan) reportIdDisplaySpan.textContent = 'N/A';


    if (doctorRemarksInput) doctorRemarksInput.value = "";
    if (doctorRemarksDisplay) { doctorRemarksDisplay.textContent = ""; doctorRemarksDisplay.style.display = 'none'; }
    if (remarksInputContainer) remarksInputContainer.style.display = 'none';
    if (waitingForRemarksMessage) waitingForRemarksMessage.style.display = 'none';

    if (downloadPdfButton) {
        downloadPdfButton.disabled = true;
        // Visibility handled by role selection
    }
    if (reportSection) reportSection.style.display = 'none';
    
    if (currentReportRemarksListenerUnsubscribe) { // Clear any active Firebase listener
        currentReportRemarksListenerUnsubscribe();
        currentReportRemarksListenerUnsubscribe = null;
    }

    initializeAllChartsStaticElements();
}

function handleLeadsOffState() {
    updateConnectionStatus('Leads Off - Check Connection', 'error');

    if (chartPlaceholderText && ecgWaveformPolyline) {
        chartPlaceholderText.textContent = 'LEADS OFF - Check Connection';
        chartPlaceholderText.style.display = 'block';
        ecgWaveformPolyline.setAttribute('points', '');
    }
    if (hrChartPlaceholderText && hrWaveformPolyline && hrValueSpan) {
        hrChartPlaceholderText.textContent = 'Leads Off - No BPM';
        hrChartPlaceholderText.style.display = 'block';
        hrWaveformPolyline.setAttribute('points', '');
        if (hrDotMarkersLiveGroup) while (hrDotMarkersLiveGroup.firstChild) hrDotMarkersLiveGroup.firstChild.remove();
        hrValueSpan.textContent = 'N/A';
    }
}


async function connectAndRead() {
    if (!validatePatientInfo()) {
        updateConnectionStatus('Enter Patient Info First', 'error');
        return;
    }
    if (!("serial" in navigator)) {
        alert("Web Serial API not supported.");
        return;
    }

    let localPort: SerialPort | null = null;
    let localReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
        localPort = await navigator.serial.requestPort();
        port = localPort; // Assign to global port for access in endRecordingSession
        await localPort.open({ baudRate: BAUD_RATE });
        isDeviceConnected = true;
        updateConnectionStatus('Device Connected', 'connected');
        startRecordingSession();
        keepReading = true;

        let dataReceived = false;
        const dataReceptionTimeout = setTimeout(() => {
            if (!dataReceived && keepReading) {
                updateConnectionStatus('No data from device. Check wiring/baud.', 'error');
            }
        }, 3500);

        if (!localPort.readable) throw new Error("Serial port is not readable.");
        localReader = localPort.readable.getReader();
        reader = localReader; // Assign to global reader
        const decoder = new TextDecoder();
        let lineBuffer = '';

        while (true) { // Loop indefinitely, will be broken by reader.cancel()
            const { value, done } = await localReader.read();

            if (done) {
                break;
            }
            
            if (value && value.length > 0) {
                if (!dataReceived) {
                    dataReceived = true;
                    clearTimeout(dataReceptionTimeout);
                }
                
                if (connectionStatusSpan?.className.includes('error')) {
                    updateConnectionStatus('Recording...', 'recording');
                }
                if (chartPlaceholderText && chartPlaceholderText.style.display !== 'none') {
                    chartPlaceholderText.style.display = 'none';
                }

                lineBuffer += decoder.decode(value, { stream: true });
                const lines = lineBuffer.split('\n');
                lineBuffer = lines.pop() || '';

                lines.forEach(line => {
                    const trimmedLine = line.trim();
                    if (trimmedLine === '!') { // CORRECTED: Check for '!' for LEADS_OFF
                        handleLeadsOffState();
                        sendDataToServer('LEADS_OFF');
                    } else if (trimmedLine) {
                        const numericValue = parseInt(trimmedLine, 10);
                        if (!isNaN(numericValue)) {
                            // Only add data if we are still in recording state
                            if(recordingInterval !== null || countdownTimer !== null) {
                                recordedDataForReportInternal.push(numericValue);
                            }
                            processAndDrawLiveData(numericValue);
                            sendDataToServer(numericValue);
                        }
                    }
                });
            }
        }
    } catch (error: any) {
        // A cancellation by endRecordingSession will throw an error, which is expected.
        if (error.name === 'AbortError' || (error.name === 'TypeError' && error.message.includes('cannot read properties of null'))) {
             console.log("Stream reading cancelled or port closed as expected.");
        } else {
            console.error('Error with Web Serial:', error);
            updateConnectionStatus(`Error: ${(error as Error).message.split('.')[0]}`, 'error');
            resetAndClearCharts();
        }
    } finally {
        if (localReader) {
            try { localReader.releaseLock(); } catch (e) { /* Ignore release lock errors */ }
        }
        if (localPort && localPort.readable) {
            try { await localPort.close(); } catch (e) { /* Ignore close errors */ }
        }
        port = null;
        reader = null;
        isDeviceConnected = false;
        if(keepReading){ // If we exited abnormally
             updateConnectionStatus('Disconnected', 'disconnected');
        }
        keepReading = false;
    }
}

function startDemoMode() {
    if (!validatePatientInfo()) { updateConnectionStatus('Enter Patient Info First', 'error'); return; }
    isDemoMode = true;
    startRecordingSession();
    demoPatternIndex = 0;
    demoInterval = window.setInterval(() => {
        const rawValue = simulatedBeatPattern[demoPatternIndex];

        if (connectionStatusSpan?.className.includes('error') && connectionStatusSpan?.textContent?.includes('Leads Off')) {
            updateConnectionStatus('Demo Mode Active', 'demomode');
        }
        if (chartPlaceholderText && chartPlaceholderText.style.display !== 'none') {
            chartPlaceholderText.style.display = 'none';
        }

        processAndDrawLiveData(rawValue);
        recordedDataForReportInternal.push(rawValue);
        sendDataToServer(rawValue);
        demoPatternIndex = (demoPatternIndex + 1) % simulatedBeatPattern.length;
    }, DATA_READ_INTERVAL_MS);
}

function startRecordingSession() {
    resetAndClearCharts();
    updateConnectionStatus(isDemoMode ? 'Demo Mode Active' : 'Recording...', isDemoMode ? 'demomode' : 'recording');
    updateTimerStatus(`Recording: ${RECORDING_DURATION_MS / 1000}s remaining`);
    if(downloadPdfButton) downloadPdfButton.disabled = true;
    if(reportSection) reportSection.style.display = 'none';
    activeReportData = null;

    recordingStartTime = Date.now(); let timeLeft = RECORDING_DURATION_MS;
    countdownTimer = window.setInterval(() => {
        timeLeft -= 1000;
        if (timeLeft >= 0) {
            const statusClass = connectionStatusSpan?.className || '';
            if (statusClass === 'recording' || statusClass === 'demomode') {
                 updateTimerStatus(`Recording: ${timeLeft / 1000}s remaining`);
            } else if (statusClass === 'error') { // Generic error state
                 updateTimerStatus(`Paused (${timeLeft / 1000}s)`);
            } else {
                 updateTimerStatus(`Recording: ${timeLeft / 1000}s remaining`);
            }
        } else {
             endRecordingSession();
        }
    }, 1000);

    // This timeout is the definitive end of the recording period.
    recordingInterval = window.setTimeout(endRecordingSession, RECORDING_DURATION_MS);
}

async function endRecordingSession() {
    // Prevent multiple executions
    if (!countdownTimer && !recordingInterval && !demoInterval) {
        return; 
    }
    
    if (countdownTimer) clearInterval(countdownTimer);
    if (recordingInterval) clearTimeout(recordingInterval);
    if (demoInterval) clearInterval(demoInterval);
    countdownTimer = null; recordingInterval = null; demoInterval = null;

    const wasReading = keepReading;
    keepReading = false;
    
    if (reader) {
        try {
            // Forcefully cancel any pending read operations.
            // This is the most reliable way to stop the read loop.
            await reader.cancel(); 
        } catch (error) {
            // The cancellation itself might throw an error, which we can ignore.
            console.warn("Reader cancellation threw an error (this is often expected):", error);
        }
        // The read loop's `finally` block will handle closing the port.
    }
    
    updateTimerStatus('Recording Complete');
    const finalStatusMessage = isDemoMode ? 'Demo Mode Ended' : (wasReading ? 'Disconnected' : 'Session Ended');
    updateConnectionStatus(finalStatusMessage, isDemoMode ? 'demomode' : 'disconnected');
    
    if (recordedDataForReportInternal.length > 20) { // Require a minimum amount of data
        const {avgBpm, minBpm, maxBpm} = calculateHeartRateStatsForReport(heartRateDataPointsInternal);
        const reportTimestamp = Date.now();
        const currentReportId = generateReportId(patientNameInput.value, reportTimestamp);

        activeReportData = {
            reportId: currentReportId,
            patientInfo: {
                name: patientNameInput.value,
                age: patientAgeInput.value,
                gender: patientGenderSelect.value,
            },
            dateTime: new Date(reportTimestamp).toLocaleString(),
            recordedDataForReport: [...recordedDataForReportInternal],
            heartRateDataPoints: [...heartRateDataPointsInternal],
            detectedBeatTimestamps: [...detectedBeatTimestampsInternal],
            remarks: "",
            avgBpm, minBpm, maxBpm
        };
        displayActiveReport();
        if (initializeFirebase()) {
            await saveReportToFirebase(activeReportData);
        }
    } else {
        updateTimerStatus('Recording Complete - Not enough data for report.');
        if(downloadPdfButton) downloadPdfButton.disabled = true;
        activeReportData = null;
    }

    isDemoMode = false;
}

function calculateHeartRateStatsForReport(hrData: { relativeTimestampMs: number, bpm: number }[]): { avgBpm: string, minBpm: string, maxBpm: string } {
    if (hrData.length === 0) return { avgBpm: "N/A", minBpm: "N/A", maxBpm: "N/A" };
    const bpms = hrData.map(p => p.bpm);
    const sumBpm = bpms.reduce((sum, val) => sum + val, 0);
    const avg = Math.round(sumBpm / bpms.length);
    const min = Math.round(Math.min(...bpms));
    const max = Math.round(Math.max(...bpms));
    return {
        avgBpm: avg.toString(),
        minBpm: min.toString(),
        maxBpm: max.toString()
    };
}


function displayActiveReport() {
    if (!activeReportData || !reportSection || !reportPatientNameSpan || !reportPatientAgeSpan ||
        !reportPatientGenderSpan || !reportDateTimeSpan || !remarksInputContainer || !reportIdDisplaySpan ||
        !doctorRemarksInput || !saveRemarksButton || !doctorRemarksDisplay || !waitingForRemarksMessage ||
        !reportAvgHrSpan || !reportMinHrSpan || !reportMaxHrSpan || !downloadPdfButton) {
        console.error("Cannot display report, essential elements or data missing.");
        return;
    }

    reportPatientNameSpan.textContent = activeReportData.patientInfo.name;
    reportPatientAgeSpan.textContent = activeReportData.patientInfo.age;
    reportPatientGenderSpan.textContent = activeReportData.patientInfo.gender;
    reportDateTimeSpan.textContent = activeReportData.dateTime;
    reportIdDisplaySpan.textContent = activeReportData.reportId || "N/A";


    reportAvgHrSpan.textContent = activeReportData.avgBpm;
    reportMinHrSpan.textContent = activeReportData.minBpm;
    reportMaxHrSpan.textContent = activeReportData.maxBpm;
    if (reportSnapshotHrText) reportSnapshotHrText.textContent = `Avg. HR: ${activeReportData.avgBpm} BPM`;

    if (downloadPdfButton) {
        if (currentUserRole === 'patient') {
            downloadPdfButton.style.display = 'block';
            downloadPdfButton.disabled = !activeReportData.remarks || !activeReportData.remarks.trim();
        } else { // doctor or null
            downloadPdfButton.style.display = 'none';
        }
    }

    if (currentUserRole === 'patient') {
        remarksInputContainer.style.display = 'none';
        saveRemarksButton.style.display = 'none';
        if (activeReportData.remarks && activeReportData.remarks.trim()) {
            doctorRemarksDisplay.textContent = activeReportData.remarks;
            doctorRemarksDisplay.style.display = 'block';
            waitingForRemarksMessage.style.display = 'none';
        } else {
            doctorRemarksDisplay.style.display = 'none';
            waitingForRemarksMessage.textContent = "Waiting for Doctor's Remarks...";
            waitingForRemarksMessage.style.display = 'block';
        }
    } else if (currentUserRole === 'doctor') {
        remarksInputContainer.style.display = 'block';
        saveRemarksButton.style.display = 'block';
        doctorRemarksInput.value = activeReportData.remarks;
        doctorRemarksDisplay.textContent = activeReportData.remarks;
        doctorRemarksDisplay.style.display = activeReportData.remarks.trim() ? 'block' : 'none';
        waitingForRemarksMessage.style.display = 'none';
    }
    

    reportSection.style.display = 'block';
    setTimeout(() => {
        redrawReportSnapshotWaveform(activeReportData!.recordedDataForReport);
        drawHeartRateData(null, null, true, activeReportData!.heartRateDataPoints);
    }, 0);
    reportSection.scrollIntoView({ behavior: 'smooth' });

    // Subscribe to remarks changes if reportId exists (for real-time updates)
    if (activeReportData.reportId) {
        subscribeToRemarksChanges(activeReportData.reportId);
    }
}


function redrawReportSnapshotWaveform(data: number[]) {
    if (!reportEcgSnapshotSVG) return;
    const chartWidth = reportEcgSnapshotSVG.clientWidth; const chartHeight = reportEcgSnapshotSVG.clientHeight;
    if (chartWidth === 0 || chartHeight === 0) { setTimeout(() => redrawReportSnapshotWaveform(data), 100); return; }

    drawChartStaticElements({
        svg: reportEcgSnapshotSVG, axisLabelsGroup: reportAxisLabelsGroup, chartTitlesGroup: reportChartTitlesGroup,
        defsElement: reportEcgSnapshotDefs, gridRect: reportGridRect as SVGRectElement | null,
        mainTitle: "ECG Snapshot (15s)", xLabel: `Time (s) - ${ECG_MM_PER_SECOND}mm/s`, yLabel: `Signal (mV) - ${ECG_MM_PER_MV}mm/mV`,
        chartType: 'ecg-report', timeWindowSeconds: RECORDING_DURATION_MS / 1000
    });

    if (!reportEcgWaveformPolyline) {
        reportEcgWaveformPolyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        reportEcgWaveformPolyline.setAttribute("id", "report-ecg-waveform-actual");
        reportEcgWaveformPolyline.setAttribute("class", "report-ecg-waveform"); // Apply class for styling
        reportEcgSnapshotSVG.appendChild(reportEcgWaveformPolyline);
    }
    if (data.length === 0) { reportEcgWaveformPolyline.setAttribute('points', ''); return; }

    const plotAreaWidth = chartWidth - chartMargins.left - chartMargins.right;
    const plotAreaHeight = chartHeight - chartMargins.top - chartMargins.bottom;
    const totalMmY = ECG_TOTAL_MV_SPAN * ECG_MM_PER_MV; const pixelsPerMmY = plotAreaHeight / totalMmY;
    let pointsString = "";
    if (data.length === 1) {
        const rawValue = data[0];
        const mvValue = ((rawValue - MIN_RAW_Y_VALUE) / (MAX_RAW_Y_VALUE - MIN_RAW_Y_VALUE)) * ECG_TOTAL_MV_SPAN + ECG_MIN_MV;
        let yPixel = plotAreaHeight / 2 - (mvValue * ECG_MM_PER_MV * pixelsPerMmY) + chartMargins.top;
        yPixel = Math.max(chartMargins.top, Math.min(chartMargins.top + plotAreaHeight, yPixel));
        pointsString = `${chartMargins.left.toFixed(2)},${yPixel.toFixed(2)} ${(chartMargins.left + Math.min(5, plotAreaWidth)).toFixed(2)},${yPixel.toFixed(2)}`;
    } else {
        const step = plotAreaWidth / (data.length - 1);
        pointsString = data.map((rawValue, index) => {
            const mvValue = ((rawValue - MIN_RAW_Y_VALUE) / (MAX_RAW_Y_VALUE - MIN_RAW_Y_VALUE)) * ECG_TOTAL_MV_SPAN + ECG_MIN_MV;
            let yPixel = plotAreaHeight / 2 - (mvValue * ECG_MM_PER_MV * pixelsPerMmY) + chartMargins.top;
            yPixel = Math.max(chartMargins.top, Math.min(chartMargins.top + plotAreaHeight, yPixel));
            const xPixel = chartMargins.left + (index * step);
            return `${xPixel.toFixed(2)},${yPixel.toFixed(2)}`;
        }).join(' ');
    }
    reportEcgWaveformPolyline.setAttribute('points', pointsString);
}

function downloadReportAsPDF() {
    const { jsPDF } = window.jspdf;
    const reportContentElement = document.getElementById('report-content');
    if (!reportContentElement || !window.html2canvas || !jsPDF || !activeReportData) {
        alert('PDF generation resources or report data not available.'); return;
    }

    const pdfPrintArea = document.createElement('div');
    pdfPrintArea.id = 'pdf-print-area';
    pdfPrintArea.style.position = 'absolute'; pdfPrintArea.style.left = '-9999px';
    pdfPrintArea.style.width = reportContentElement.offsetWidth + 'px'; pdfPrintArea.style.backgroundColor = 'white';
    const clonedReportContent = reportContentElement.cloneNode(true) as HTMLElement;

    // Ensure only remarks display, not input, is shown for PDF
    const clonedRemarksDisplay = clonedReportContent.querySelector('#doctor-remarks-display') as HTMLParagraphElement | null;
    const clonedRemarksInputContainer = clonedReportContent.querySelector('#remarks-input-container') as HTMLElement | null;
    const clonedWaitingMessage = clonedReportContent.querySelector('#waiting-for-remarks-message') as HTMLElement | null;
    const clonedDownloadButton = clonedReportContent.querySelector('#download-pdf-button') as HTMLElement | null;

    if (clonedRemarksInputContainer) clonedRemarksInputContainer.style.display = 'none';
    if (clonedDownloadButton) clonedDownloadButton.style.display = 'none';


    if (clonedRemarksDisplay && clonedWaitingMessage) {
        if (activeReportData.remarks.trim()) {
            clonedRemarksDisplay.textContent = activeReportData.remarks;
            clonedRemarksDisplay.style.display = 'block';
            clonedWaitingMessage.style.display = 'none';
        } else {
            clonedRemarksDisplay.style.display = 'none';
            clonedWaitingMessage.textContent = "No remarks submitted by doctor."; // Or "No remarks available."
            clonedWaitingMessage.style.display = 'block';
        }
    }


    pdfPrintArea.appendChild(clonedReportContent); document.body.appendChild(pdfPrintArea);
    const options = {
        scale: 2, useCORS: true, logging: false,
         onclone: (documentClone: Document) => {
            const allClonedSvgs = documentClone.querySelectorAll('svg');
            allClonedSvgs.forEach(clonedSvgEl => {
                clonedSvgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                const gridRectsInClonedSvg = clonedSvgEl.querySelectorAll('rect[fill^="url(#"]');
                gridRectsInClonedSvg.forEach(clonedGridRect => {
                    const fillUrl = clonedGridRect.getAttribute('fill');
                    if (fillUrl) {
                        const patternId = fillUrl.substring(5, fillUrl.length - 1);
                        const originalPatternElement = document.getElementById(patternId) as unknown as SVGPatternElement | null;
                        if (originalPatternElement) {
                            let defsInClonedSvg = clonedSvgEl.querySelector('defs');
                            if (!defsInClonedSvg) { defsInClonedSvg = documentClone.createElementNS("http://www.w3.org/2000/svg", "defs"); clonedSvgEl.insertBefore(defsInClonedSvg, clonedSvgEl.firstChild); }
                            if (!defsInClonedSvg.querySelector(`#${patternId}`)) defsInClonedSvg.appendChild(originalPatternElement.cloneNode(true) as SVGPatternElement);
                        } else clonedGridRect.setAttribute('fill', ECG_MAJOR_GRID_COLOR);
                    }
                });
                const polylinesInClonedSvg = clonedSvgEl.querySelectorAll('polyline');
                polylinesInClonedSvg.forEach(clonedPolyline => {
                    const originalPolyline = document.getElementById(clonedPolyline.id) as unknown as SVGPolylineElement | null;
                    if (originalPolyline && !clonedPolyline.getAttribute('style')) {
                        const computed = window.getComputedStyle(originalPolyline);
                        clonedPolyline.style.stroke = computed.stroke || 'black';
                        clonedPolyline.style.strokeWidth = computed.strokeWidth || '1px';
                        clonedPolyline.style.fill = computed.fill || 'none';
                    } else if (!originalPolyline && !clonedPolyline.getAttribute('style')) {
                         // Fallback for dynamically created polylines or if style isn't picked up
                        if (clonedPolyline.id === 'report-ecg-waveform-actual' || clonedPolyline.id === 'ecg-waveform') {
                            clonedPolyline.style.stroke = '#000000'; // Black for ECG
                            clonedPolyline.style.strokeWidth = '1.5px';
                        } else { // HR waveforms
                            clonedPolyline.style.stroke = '#007BFF'; // Blue for HR
                            clonedPolyline.style.strokeWidth = '1.8px';
                        }
                        clonedPolyline.style.fill = 'none';
                    }
                });
                const dotMarkersInClonedSvg = clonedSvgEl.querySelectorAll('.hr-dot-marker');
                dotMarkersInClonedSvg.forEach(clonedDot => {
                    const dotElement = clonedDot as SVGCircleElement;
                    dotElement.style.fill = dotElement.style.fill || '#007BFF';
                    dotElement.style.stroke = dotElement.style.stroke || '#0056b3';
                    dotElement.style.strokeWidth = dotElement.style.strokeWidth || '0.5px';
                });
            });
        }
    };
    window.html2canvas(pdfPrintArea, options).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth(); 
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10; 
        const contentWidth = pdfWidth - 2 * margin; 
        const contentHeight = pdfHeight - 2 * margin; // Available height for content + footer
        
        let imgReportWidth = contentWidth; 
        let imgReportHeight = (canvas.height * imgReportWidth) / canvas.width;

        const footerText = "Report generated by CardioCare ❤️";
        const footerFontSize = 10;
        const footerSpace = 10; // Reserve space for footer text (mm)

        if (imgReportHeight > contentHeight - footerSpace) { 
            imgReportHeight = contentHeight - footerSpace; 
            imgReportWidth = (canvas.width * imgReportHeight) / canvas.height; 
        }
        
        pdf.addImage(imgData, 'PNG', margin + (contentWidth - imgReportWidth) / 2, margin, imgReportWidth, imgReportHeight);
        
        // Add footer text
        pdf.setFontSize(footerFontSize);
        const footerYPosition = pdfHeight - (margin / 2) - 2; // Position slightly above bottom margin
        pdf.text(footerText, pdfWidth / 2, footerYPosition, { align: 'center' });

        pdf.save(`CardioCare_Report_${activeReportData?.patientInfo.name.replace(/\s/g, '_') || 'Patient'}.pdf`);
    }).catch(err => {
        console.error("Error generating PDF: ", err);
        alert("Error generating PDF. See console.");
    }).finally(() => { document.body.removeChild(pdfPrintArea); });
}

// --- Initialization & Event Listeners (existing + new) ---
function initializeAllChartsStaticElements() {
    if (ecgChartSVG && ecgAxisLabelsGroup && ecgChartTitlesGroup && ecgChartDefs && ecgGridRect) {
        drawChartStaticElements({
            svg: ecgChartSVG, axisLabelsGroup: ecgAxisLabelsGroup, chartTitlesGroup: ecgChartTitlesGroup,
            defsElement: ecgChartDefs, gridRect: ecgGridRect, mainTitle: "Live ECG Signal",
            xLabel: `Time (s) - ${ECG_MM_PER_SECOND}mm/s`, yLabel: `Signal (mV) - ${ECG_MM_PER_MV}mm/mV`,
            chartType: 'ecg-live', timeWindowSeconds: LIVE_ECG_TIME_WINDOW_SECONDS
        });
    }
    if (hrChartSVG && hrAxisLabelsGroup && hrChartTitlesGroup && hrGridLinesGroup) {
         drawChartStaticElements({
            svg: hrChartSVG, axisLabelsGroup: hrAxisLabelsGroup, chartTitlesGroup: hrChartTitlesGroup,
            gridLinesGroup: hrGridLinesGroup, mainTitle: "Heart Rate Monitor", xLabel: "Time (s)",
            yLabel: "BPM", chartType: 'hr', yMinBPM: MIN_BPM, yMaxBPM: currentDynamicBpmYMax,
            xMaxSeconds: RECORDING_DURATION_MS / 1000
        });
    }
     if (reportHrChartSVG && reportHrAxisLabelsGroup && reportHrChartTitlesGroup && reportHrGridLinesGroup) {
        drawChartStaticElements({
            svg: reportHrChartSVG, axisLabelsGroup: reportHrAxisLabelsGroup, chartTitlesGroup: reportHrChartTitlesGroup,
            gridLinesGroup: reportHrGridLinesGroup, mainTitle: "Heart Rate Trend (15s)", xLabel: "Time (s)",
            yLabel: "BPM", chartType: 'hr-report', yMinBPM: MIN_BPM, yMaxBPM: MAX_BPM,
            xMaxSeconds: RECORDING_DURATION_MS / 1000
        });
    }
}

function loadDoctorNames() {
    const storedNames = localStorage.getItem('ecgAppDoctorNames');
    if (storedNames) {
        doctorNamesList = JSON.parse(storedNames);
    }
    populateDoctorDropdown();
}

function populateDoctorDropdown() {
    if (!doctorNameSelect) return;
    while (doctorNameSelect.options.length > 1) doctorNameSelect.remove(1);
    doctorNamesList.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        doctorNameSelect.appendChild(option);
    });
    reviewCurrentSessionReportButton.disabled = !doctorNameSelect.value || !activeReportData;
}

function handleRoleSelection(role: UserRole) {
    currentUserRole = role;
    roleSelectionScreen.style.display = 'none';
    appContainer.style.display = 'block';
    switchRoleButton.style.display = 'block';

    const ecgChartWrapper = document.querySelector('#ecg-chart-container')?.closest('.chart-container-wrapper') as HTMLElement | null;
    const hrChartWrapper = document.querySelector('#hr-chart-container')?.closest('.chart-container-wrapper') as HTMLElement | null;


    if (role === 'patient') {
        doctorLoginSection.style.display = 'none';
        doctorReportSelectionSection.style.display = 'none';
        mainAppContent.style.display = 'block';
        document.getElementById('patient-info')?.style.removeProperty('display');
        document.getElementById('controls')?.style.removeProperty('display');
        if(ecgChartWrapper) ecgChartWrapper.style.removeProperty('display');
        if(hrChartWrapper) hrChartWrapper.style.removeProperty('display');

        if (downloadPdfButton) {
            downloadPdfButton.style.display = 'block'; // Or 'inline-block' etc.
            if (activeReportData && activeReportData.reportId) {
                 downloadPdfButton.disabled = !activeReportData.remarks || !activeReportData.remarks.trim();
            } else {
                downloadPdfButton.disabled = true;
            }
        }

        if (reportSection) reportSection.style.display = activeReportData ? 'block' : 'none';
        if (activeReportData) displayActiveReport(); // This will also handle download button state if report is active
        else resetAndClearCharts(true);
        validatePatientInfo();

    } else if (role === 'doctor') {
        mainAppContent.style.display = 'none';
        doctorLoginSection.style.display = 'block';
        doctorReportSelectionSection.style.display = 'block';
        if (reportSection) reportSection.style.display = 'none'; // Initially hide report section for doctor
        if (downloadPdfButton) {
            downloadPdfButton.style.display = 'none';
        }
        doctorLoginMessage.textContent = '';
        loadDoctorNames();
        reviewCurrentSessionReportButton.disabled = !doctorNameSelect.value || !activeReportData;
        if (initializeFirebase()) {
           fetchAndPopulateDoctorReportList();
        }
        reportSelectDropdown.value = "";
        loadReportButton.disabled = true;
    }
}

function resetToRoleSelection() {
    currentUserRole = null;
    currentDoctorName = null;
    appContainer.style.display = 'none';
    switchRoleButton.style.display = 'none';
    roleSelectionScreen.style.display = 'block';
    if(doctorLoginSection) doctorLoginSection.style.display = 'none';
    if(doctorReportSelectionSection) doctorReportSelectionSection.style.display = 'none';
    if(mainAppContent) mainAppContent.style.display = 'none';
    if(reportSection) reportSection.style.display = 'none';
    updateFirebaseStatus("", "info");

    if (downloadPdfButton) { // Ensure button is hidden on full reset
        downloadPdfButton.style.display = 'none';
        downloadPdfButton.disabled = true;
    }

    if (keepReading && port && port.readable) {
      endRecordingSession().catch(e => console.warn("Error ending session on role switch:", e));
    } else {
      if (countdownTimer) clearInterval(countdownTimer);
      if (recordingInterval) clearTimeout(recordingInterval);
      if (demoInterval) clearInterval(demoInterval);
      countdownTimer = null; recordingInterval = null; demoInterval = null;
      isDemoMode = false;
       updateConnectionStatus('Disconnected', 'disconnected');
       updateTimerStatus('');
       updateRelayStatus('', 'info');
    }
     if (currentReportRemarksListenerUnsubscribe) {
        currentReportRemarksListenerUnsubscribe();
        currentReportRemarksListenerUnsubscribe = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase(); 
    resetToRoleSelection();

    selectPatientRoleButton.addEventListener('click', () => handleRoleSelection('patient'));
    selectDoctorRoleButton.addEventListener('click', () => handleRoleSelection('doctor'));
    switchRoleButton.addEventListener('click', resetToRoleSelection);

    addDoctorNameButton.addEventListener('click', () => {
        const newName = newDoctorNameInput.value.trim();
        if (newName && !doctorNamesList.includes(newName)) {
            doctorNamesList.push(newName);
            doctorNamesList.sort();
            localStorage.setItem('ecgAppDoctorNames', JSON.stringify(doctorNamesList));
            populateDoctorDropdown();
            doctorNameSelect.value = newName;
            newDoctorNameInput.value = '';
            reviewCurrentSessionReportButton.disabled = !activeReportData;
            doctorLoginMessage.textContent = '';
        } else if (doctorNamesList.includes(newName)) {
            doctorLoginMessage.textContent = 'Doctor name already exists.';
        } else {
            doctorLoginMessage.textContent = 'Please enter a valid name.';
        }
    });

    doctorNameSelect.addEventListener('change', () => {
        currentDoctorName = doctorNameSelect.value;
        reviewCurrentSessionReportButton.disabled = !currentDoctorName || !activeReportData;
        doctorLoginMessage.textContent = '';
    });

    reviewCurrentSessionReportButton.addEventListener('click', () => {
        currentDoctorName = doctorNameSelect.value;
        if (!currentDoctorName) {
            doctorLoginMessage.textContent = 'Please select or add a doctor name.';
            return;
        }
        if (activeReportData) {
            doctorLoginSection.style.display = 'none';
            doctorReportSelectionSection.style.display = 'none';
            mainAppContent.style.display = 'block';
             document.getElementById('patient-info')?.style.setProperty('display', 'none', 'important');
             document.getElementById('controls')?.style.setProperty('display', 'none', 'important');
             (document.querySelector('#ecg-chart-container')?.closest('.chart-container-wrapper') as HTMLElement | null)?.style.setProperty('display', 'none', 'important');
             (document.querySelector('#hr-chart-container')?.closest('.chart-container-wrapper') as HTMLElement | null)?.style.setProperty('display', 'none', 'important');
            if (reportSection) reportSection.style.display = 'block';
            if (downloadPdfButton) downloadPdfButton.style.display = 'none'; // Ensure it's hidden for doctor reviewing session report
            displayActiveReport();
        } else {
            doctorLoginMessage.textContent = 'No patient report from current session is available for review.';
        }
    });

    reportSelectDropdown.addEventListener('change', () => {
        loadReportButton.disabled = !reportSelectDropdown.value;
    });

    loadReportButton.addEventListener('click', () => {
        currentDoctorName = doctorNameSelect.value;
         if (!currentDoctorName) {
            updateFirebaseStatus('Please select your doctor name first.', 'error');
            doctorLoginMessage.textContent = 'Please select your doctor name from the top dropdown first.';
            return;
        }
        const selectedReportId = reportSelectDropdown.value;
        if (selectedReportId) {
            loadReportForDoctor(selectedReportId); // displayActiveReport inside this will hide download button for doctor
        } else {
            updateFirebaseStatus("No report selected from the dropdown.", "info");
        }
    });


    if (!patientNameInput || !patientAgeInput || !patientGenderSelect || !connectButton || !demoButton || !downloadPdfButton) {
        console.error("One or more critical UI elements are missing for patient flow.");
        return;
    }
    patientNameInput.addEventListener('input', validatePatientInfo);
    patientAgeInput.addEventListener('input', validatePatientInfo);
    patientGenderSelect.addEventListener('change', validatePatientInfo);
    connectButton.addEventListener('click', connectAndRead);
    demoButton.addEventListener('click', startDemoMode);
    downloadPdfButton.addEventListener('click', downloadReportAsPDF);

    if (saveRemarksButton && doctorRemarksInput && doctorRemarksDisplay && remarksInputContainer && waitingForRemarksMessage) {
        saveRemarksButton.addEventListener('click', async () => {
            if (currentUserRole === 'doctor' && activeReportData && activeReportData.reportId && doctorRemarksInput) {
                const remarksToSave = doctorRemarksInput.value.trim();
                activeReportData.remarks = remarksToSave;
                activeReportData.doctorName = currentDoctorName || undefined;

                if (doctorRemarksDisplay) {
                     doctorRemarksDisplay.textContent = activeReportData.remarks;
                     doctorRemarksDisplay.style.display = activeReportData.remarks ? 'block' : 'none';
                }
                // For doctors, download button is hidden, so no need to manage its 'disabled' state here.
                // If it were visible for patients, and remarks are edited by patient (not current flow), then:
                // if(downloadPdfButton && currentUserRole === 'patient') downloadPdfButton.disabled = !activeReportData.remarks.trim();

                if (initializeFirebase()) {
                     await updateRemarksInFirebase(activeReportData.reportId, activeReportData.remarks, activeReportData.doctorName || null);
                }
            }
        });
    } else {
        console.error("Remark related elements missing or activeReportData check issue.");
    }

    initializeAllChartsStaticElements();

    const chartResizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
             initializeAllChartsStaticElements();
            if (activeReportData) {
                if (entry.target === reportEcgSnapshotSVG && reportSection?.style.display !== 'none') {
                    redrawReportSnapshotWaveform(activeReportData.recordedDataForReport);
                }
                if (entry.target === reportHrChartSVG && reportSection?.style.display !== 'none') {
                    drawHeartRateData(null, null, true, activeReportData.heartRateDataPoints);
                }
            }
        }
    });

    if (ecgChartSVG) chartResizeObserver.observe(ecgChartSVG);
    if (hrChartSVG) chartResizeObserver.observe(hrChartSVG);
    if (reportEcgSnapshotSVG) chartResizeObserver.observe(reportEcgSnapshotSVG);
    if (reportHrChartSVG) chartResizeObserver.observe(reportHrChartSVG);
});

window.addEventListener('error', (event) => console.error('Unhandled error:', event.error || event.message));
window.addEventListener('unhandledrejection', (event) => console.error('Unhandled promise rejection:', event.reason));

declare global {
    interface Window { jspdf: any; html2canvas: any; }
    interface SerialPort extends EventTarget {
        readable: ReadableStream<Uint8Array> | null; writable: WritableStream<Uint8Array> | null;
        open(options: SerialOptions): Promise<void>; close(): Promise<void>; readonly closed: Promise<void>;
    }
    interface Serial extends EventTarget {
        requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>; getPorts(): Promise<SerialPort[]>;
    }
    interface Navigator { serial: Serial; }
    interface SerialOptions { baudRate: number; dataBits?: 7 | 8; stopBits?: 1 | 2; parity?: "none" | "even" | "odd"; bufferSize?: number; flowControl?: "none" | "hardware"; }
    interface SerialPortRequestOptions { filters?: { usbVendorId?: number; usbProductId?: number; }[]; }
    interface ReadableStreamDefaultReader<R = any> { cancel(): Promise<void>; closed: Promise<undefined>; }
}
export {};
