const { app, BrowserWindow, Menu } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: __dirname + '/src/assets/favicon.ico',
  });

  Menu.setApplicationMenu(null);

  win.loadFile('./build/index.html');
}

app.whenReady().then(() => {
  createWindow();
});