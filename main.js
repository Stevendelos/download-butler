const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const configPath = path.join(__dirname, 'config.json');

function getExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function ensureDirExists(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function moveFileCategory(file, downloadsDir, targetFolder) {
    const src = path.join(downloadsDir, file);
    const destDir = path.join(downloadsDir, targetFolder);
    ensureDirExists(destDir);
    const dest = path.join(destDir, file);
    fs.renameSync(src, dest);
    return `Moved: ${file} -> ${targetFolder}/`;
}

function runButler(downloadsDir) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const rules = config.rules;
    const logs = [];

const files = fs.readdirSync(downloadsDir).filter(f => {
    const fullPath = path.join(downloadsDir, f);
    return fs.statSync(fullPath).isFile();
});

files.forEach(file => {
    const ext = getExtension(file);
    const target = rules[ext];
    if (target) {
        logs.push(moveFileCategory(file, downloadsDir, target));
    } else {
        logs.push(`No rule for: ${file}`);
    }
});

    return logs;
}

function createWindow() {
    const win = new BrowserWindow({
        width: 500,
        height: 400,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,  
            nodeIntegration: false,
            enableRemoteModule: false,
        },
        resizable: false,
    });
    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('run-butler', (_, folderPath) => {
        try {
            return runButler(folderPath);
        } catch (err) {
            return [`Error: ${err.message}`];
        }
    });

    ipcMain.handle('select-folder', async () => {
        const { dialog } = require('electron');
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        return result.canceled ? null : result.filePaths[0];
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
