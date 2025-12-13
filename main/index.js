const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let serverProcess = null;

// Use app.isPackaged for reliable detection
const isDev = !app.isPackaged;
const PORT = 3000;

/**
 * Start the Next.js production server
 * Returns a promise that resolves when the server is ready
 */
function startProductionServer() {
    return new Promise((resolve, reject) => {
        // Path to the standalone server.js
        const serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
        const serverDir = path.dirname(serverPath);

        console.log('[Electron] Starting production server:', serverPath);

        if (!fs.existsSync(serverPath)) {
            const msg = `Server file not found: ${serverPath}`;
            console.error('[Electron]', msg);
            dialog.showErrorBox('Server Error', msg);
            reject(new Error(msg));
            return;
        }

        serverProcess = spawn('node', [serverPath], {
            cwd: serverDir,
            env: {
                ...process.env,
                PORT: PORT.toString(),
                HOSTNAME: 'localhost',
                NODE_ENV: 'production',
            },
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let serverReady = false;

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('[Next.js]', output);

            // Detect server ready message
            if (!serverReady && (output.includes('Ready') || output.includes('started server'))) {
                serverReady = true;
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error('[Next.js Error]', data.toString());
        });

        serverProcess.on('error', (err) => {
            console.error('[Electron] Failed to start server:', err);
            reject(err);
        });

        serverProcess.on('close', (code) => {
            console.log('[Electron] Server process exited with code:', code);
            if (!serverReady) {
                reject(new Error(`Server exited with code ${code}`));
            }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            if (!serverReady) {
                reject(new Error('Server startup timeout'));
            }
        }, 30000);
    });
}

/**
 * Stop the production server gracefully
 */
function stopProductionServer() {
    if (serverProcess) {
        console.log('[Electron] Stopping production server...');
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const url = `http://localhost:${PORT}`;

    mainWindow.loadURL(url);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

async function startApp() {
    try {
        if (!isDev) {
            await startProductionServer();
        }
        createWindow();
    } catch (error) {
        console.error('[Electron] Failed to start app:', error);
        dialog.showErrorBox('Startup Error', error.message);
        app.quit();
    }
}

app.on('ready', startApp);

app.on('window-all-closed', () => {
    stopProductionServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        startApp();
    }
});

app.on('before-quit', () => {
    stopProductionServer();
});
