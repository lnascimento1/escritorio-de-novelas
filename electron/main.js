// Windows app: a window with the writing desk, plus file saving and an optional backup folder.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path'), fs = require('fs');
const cfgFile = () => path.join(app.getPath('userData'), 'config.json');
const readCfg = () => { try { return JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch (e) { return {}; } };
const writeCfg = c => fs.writeFileSync(cfgFile(), JSON.stringify(c, null, 1));
let win;
function create() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 380, title: 'Escritorio de novelas', backgroundColor: '#ffffff',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, spellcheck: true }
  });
  win.webContents.session.setSpellCheckerLanguages(['es-AR', 'es']);
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('context-menu', (e, p) => {
    const items = p.dictionarySuggestions.map(s => ({ label: s, click: () => win.webContents.replaceMisspelling(s) }));
    if (p.misspelledWord) items.push({ label: 'Agregar al diccionario', click: () => win.webContents.session.addWordToSpellCheckerDictionary(p.misspelledWord) }, { type: 'separator' });
    items.push({ role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' });
    Menu.buildFromTemplate(items).popup();
  });
}
Menu.setApplicationMenu(null);
ipcMain.handle('save-file', async (e, name, bytes) => {
  const cfg = readCfg();
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(cfg.lastDir || app.getPath('documents'), name) });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, Buffer.from(bytes)); cfg.lastDir = path.dirname(r.filePath); writeCfg(cfg); return r.filePath;
});
ipcMain.handle('choose-folder', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Carpeta de respaldo', properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const cfg = readCfg(); cfg.backupDir = r.filePaths[0]; writeCfg(cfg); return cfg.backupDir;
});
ipcMain.handle('get-folder', () => readCfg().backupDir || null);
ipcMain.handle('write-backup', (e, rel, bytes) => {
  const dir = readCfg().backupDir; if (!dir) return false;
  const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.from(bytes)); return true;
});
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
