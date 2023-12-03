const { app, BrowserWindow, Menu } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: __dirname + '/src/assets/favicon.ico',
  });

  Menu.setApplicationMenu(null);

  // Make sure dist folder exists by running: npm run build
  win.loadFile('./dist/index.html');
}

app.whenReady().then(() => {
  createWindow();
});