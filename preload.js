const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('butlerAPI', {
    runButler: (folderPath) => ipcRenderer.invoke('run-butler', folderPath),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
});
