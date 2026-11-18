const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (name, bytes) => ipcRenderer.invoke('save-file', name, bytes),
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  getFolder: () => ipcRenderer.invoke('get-folder'),
  writeBackup: (rel, bytes) => ipcRenderer.invoke('write-backup', rel, bytes)
});
