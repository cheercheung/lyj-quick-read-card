const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("quickReadCardAPI", {
    openCsvFile: () => ipcRenderer.invoke("csv:open"),
    saveCsvFile: (payload) => ipcRenderer.invoke("csv:save", payload),
    getLaunchCsvFile: () => ipcRenderer.invoke("csv:get-launch")
});
