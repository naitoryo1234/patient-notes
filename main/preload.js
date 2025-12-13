// Preload script for Electron
// This script runs in the renderer process before its web content begins loading

const { contextBridge } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Add any IPC methods here in the future
    platform: process.platform,
});
