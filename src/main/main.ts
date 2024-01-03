/* eslint-disable prefer-template */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, Tray, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
//import { exec } from "child_process";
import * as fs from 'fs'
import Store from 'electron-store';
import { BingChat } from './bingchat';
const util = require('util');
const exec = util.promisify(require('child_process').exec);
import schedule from 'node-schedule';
import { Connection } from 'renderer/models/GPTTask';


// (async function () {
//   var BingChat = (await import('bing-chat')).BingChat
// })();

// import('bing-chat').then(module => {
//   //module.default();
//   // → logs 'Hi from the default export!'
//   //module.doStuff();
//   // → logs 'Doing stuff…'
// });



const store = new Store();

//console.log(app.getPath('userData'));
// IPC listener
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val);
});

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

// ipcMain.on('ipc-example', async (event, arg) => {
//   const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
//   console.log(msgTemplate(arg));
//   event.reply('ipc-example', msgTemplate('pong'));
// });
ipcMain.on('schedule-task', async (event, arg) => {

    var language = arg[0];


    var code = arg[1];
    var file = arg[2];
    var dirpath = path.join(app.getPath('userData'), 'scripts');
    var filepath = path.join(dirpath, file + ".py");
    var params = arg[3];
    var modules = arg[4];
    var cron_expression = arg[5];
    var paramsarg = "";
    paramsarg = params.map(element => '--' + element.name + '="' + element.value +'"').join(" ")


    if (!fs.existsSync(dirpath)){
        fs.mkdirSync(dirpath);
    }

    fs.writeFileSync(filepath, code);


    if(modules && modules.length > 0) {
      const { error, stdout, stderr } = await exec('pip install ' + modules.join(" "));
      if (error) {
        console.log(error);
        event.reply('schedule-task-execution', {success: false, error: error.message});
        return;
      }
    }

    const job = schedule.scheduleJob(cron_expression, function(){

      var start_date = new Date();

      exec(`python ${filepath} ${paramsarg}`, {'shell':'powershell.exe'}, (error, stdout, stderr) => {
        var res = stdout;
        if (error) {
            console.log(error);
            //error.message = error.message.replace(`python -c "import sys\n\nsys.stdout.reconfigure(encoding='utf-8')\n\n`,"");
            error.message = error.message.replace(`python ${filepath} ${paramsarg}`,"");
            event.reply('schedule-task-execution', {success: false, error: error.message, start_date: start_date});
        } else {
          console.log("res : " + res);

          const msgTemplate = (pingPong: string) => `${pingPong}`;
          //console.log(msgTemplate(arg));
          //event.reply('chatgpt-result', msgTemplate(res));
          event.reply('schedule-task-execution', {success: true, result: res, start_date: start_date});
        }
      });

  });

})


ipcMain.on('bingchat-code', async (event, arg) => {

  //var language = arg[1];
  var input = arg[0];

  // var BingChatCode = /```python\\n([\S\s\\n]+)```/gm;
  // //var BingChatCode = new RegExp("```"+ language + "\\s([\\S\\s]+)```", "gm");

  // var instructions = "";
  // instructions = 'You are an automation engineer and you need to write efficient and safe high quality code with the following instructions : \n\n';
  // instructions += 'write only '+language+' plain code without any explanation\n';
  // if(language == "python") {
  //  instructions += "use only single quote for escaping string\n"
  // }

  const api = new BingChat({
    cookie: <string>store.get("bingcookie")
  })

  const res = await api.sendMessage(input.instructions + '\n\n' + input.code, {
    // print the partial response as the AI is "typing"
    variant: 'Precise',
    onProgress: (partialResponse:any) => {
      //console.log(partialResponse.text)
      var code = partialResponse.text;
      event.reply('bingchat-code', {success: true, result: code});
    }
  })

  // var code = res.text;
  // event.reply('bingchat-code', {success: true, result: code});
  //console.log(res.text)

})

ipcMain.on('chatgpt-result', async (event, arg) => {
  console.log(arg);

  if(arg[0] == "powershell") {

    exec("[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; " + arg[1], {'shell':'powershell.exe'}, (error, stdout, stderr) => {
      var res = stdout;
      if (error !== null) {
          console.log(error);
          error.message = error.message.replace(`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; `,"");
          event.reply('chatgpt-result', {success: false, error: error.message});
      } else {
        console.log("res : " + res);

        //const msgTemplate = (pingPong: string) => `${pingPong}`;
        //console.log(msgTemplate(arg));
        //event.reply('chatgpt-result', msgTemplate(res));
        event.reply('chatgpt-result', {success: true, result: res});
      }
  });

  } else if(arg[0] == "python") {

    var code = arg[1];
    var file = arg[2];
    var dirpath = path.join(app.getPath('userData'), 'scripts');
    var filepath = path.join(dirpath, file + ".py");
    var params = arg[3];
    var modules = arg[4];
    var paramsarg = "";
    paramsarg = params.map(element => '--' + element.name + '="' + element.value +'"').join(" ")
    var connections = arg[5];
    if(connections && connections.length > 0) {
      var cons = <Connection[]>store.get('connections')

      connections.forEach(element => {
        var c = cons.find((conn: { name: string; }) => conn.name === element)
        if(c) {
          paramsarg += ' --' + c.name + '_host="' + c.host + '"' + ' --' + c.name + '_user="' + c.username + '"' + ' --' + c.name + '_password="' + c.password + '"' 
        }
      });
      
    }


    //code = code.replace(/"/g, "'")
    //code = "import sys\n\nsys.stdout.reconfigure(encoding='utf-8')\n\n" + code.replace(/"/g, "'");
    //code = "import sys\n\nsys.stdout.reconfigure(encoding='utf-8')\n\n" + code;

    if (!fs.existsSync(dirpath)){
        fs.mkdirSync(dirpath);
    }

    fs.writeFileSync(filepath, code);


    if(modules && modules.length > 0) {
      const { error, stdout, stderr } = await exec('pip install ' + modules.join(" "));
      if (error) {
        console.log(error);
        event.reply('chatgpt-result', {success: false, error: error.message});
        return;
      }
    }


    exec(`python ${filepath} ${paramsarg}`, {'shell':'powershell.exe'}, (error, stdout, stderr) => {
      var res = stdout;
      if (error) {
          console.log(error);
          //error.message = error.message.replace(`python -c "import sys\n\nsys.stdout.reconfigure(encoding='utf-8')\n\n`,"");
          error.message = error.message.replace(`python ${filepath} ${paramsarg}`,"");
          event.reply('chatgpt-result', {success: false, error: error.message});
      } else {
        console.log("res : " + res);

        const msgTemplate = (pingPong: string) => `${pingPong}`;
        //console.log(msgTemplate(arg));
        //event.reply('chatgpt-result', msgTemplate(res));
        event.reply('chatgpt-result', {success: true, result: res});
      }
  });

  //   exec(`python -c "import sys\n\nsys.stdout.reconfigure(encoding='utf-8')\n\n${code.replace(/"/g, "'")}"`, {'shell':'powershell.exe'}, (error, stdout, stderr) => {
  //     var res = stdout;
  //     if (error !== null) {
  //         console.log(error);
  //         error.message = error.message.replace(`python -c "import sys\n\nsys.stdout.reconfigure(encoding='utf-8')\n\n`,"");
  //         event.reply('chatgpt-result', {success: false, error: error.message});
  //     } else {
  //       console.log("res : " + res);

  //       const msgTemplate = (pingPong: string) => `${pingPong}`;
  //       //console.log(msgTemplate(arg));
  //       //event.reply('chatgpt-result', msgTemplate(res));
  //       event.reply('chatgpt-result', {success: true, result: res});
  //     }
  // });

  }




});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };


  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  let tray = new Tray(getAssetPath('icons', 'logo.png'))
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Item1', type: 'radio' },
      { label: 'Item2', type: 'radio' },
      { label: 'Item3', type: 'radio', checked: true },
      { label: 'Item4', type: 'radio' }
    ])
    tray.setToolTip('RunGPT')
    tray.setContextMenu(contextMenu)

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});



app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
