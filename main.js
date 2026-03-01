const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");

let launchCsvPayload = null;

function normalizeCliPath(rawPath) {
    const input = (rawPath || "").trim();
    if (!input) return "";

    const quoted = input.match(/^["'](.*)["']$/);
    const unquoted = quoted ? quoted[1] : input;
    if (!unquoted) return "";

    if (unquoted === "~") return app.getPath("home");
    if (unquoted.startsWith("~/")) return path.join(app.getPath("home"), unquoted.slice(2));
    return unquoted;
}

function getLaunchCsvArg(argv) {
    if (!Array.isArray(argv) || !argv.length) return "";

    let candidatePath = "";
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (typeof arg !== "string" || !arg) continue;

        if (arg.startsWith("--csv=")) {
            candidatePath = arg.slice("--csv=".length).trim();
            break;
        }

        if (arg === "--csv") {
            candidatePath = (argv[i + 1] || "").trim();
            break;
        }

        if (!candidatePath && arg.toLowerCase().endsWith(".csv")) {
            candidatePath = arg.trim();
        }
    }

    return normalizeCliPath(candidatePath);
}

function resolveLaunchCsvPath(argv) {
    const candidatePath = getLaunchCsvArg(argv);
    if (!candidatePath) return { ok: false };

    const pathCandidates = [
        candidatePath,
        candidatePath.replace(/\r?\n/g, ""),
        candidatePath.replace(/\r?\n/g, " "),
        candidatePath.replace(/\s*\r?\n\s*/g, " "),
        candidatePath.replace(/\s*\r?\n\s*/g, "")
    ]
        .map((value) => value.trim())
        .filter(Boolean);

    // Deduplicate candidates while preserving order.
    const uniqueCandidates = Array.from(new Set(pathCandidates));

    const hasCsvSuffix = uniqueCandidates.some((value) => value.toLowerCase().endsWith(".csv"));
    if (!hasCsvSuffix) {
        return { ok: false, error: "Provided path is not a CSV file (.csv)." };
    }

    for (const variantPath of uniqueCandidates) {
        const absolutePath = path.isAbsolute(variantPath)
            ? variantPath
            : path.resolve(process.cwd(), variantPath);
        if (fsSync.existsSync(absolutePath)) {
            return { ok: true, path: absolutePath };
        }
    }

    const displayPath = path.isAbsolute(candidatePath)
        ? candidatePath
        : path.resolve(process.cwd(), candidatePath);
    return { ok: false, error: `CSV file not found: ${displayPath}` };
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        },
        title: "Quick Read Card",
        // Simple monochrome window style
        backgroundColor: '#ffffff'
    });

    // In production, we'd load the built files, but for MVP we load index.html
    win.loadFile('index.html');
}

ipcMain.handle("csv:open", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "CSV Files", extensions: ["csv"] }]
    });

    if (result.canceled || !result.filePaths?.length) {
        return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const content = await fs.readFile(filePath, "utf8");
    return {
        canceled: false,
        filePath,
        fileName: path.basename(filePath),
        content
    };
});

ipcMain.handle("csv:save", async (_event, payload) => {
    const filePath = payload?.filePath;
    const content = payload?.content;
    if (!filePath || typeof content !== "string") {
        return { ok: false, message: "Invalid save payload" };
    }

    await fs.writeFile(filePath, content, "utf8");
    return { ok: true };
});

ipcMain.handle("csv:get-launch", async () => {
    if (!launchCsvPayload) return { ok: false };
    const payload = { ...launchCsvPayload };
    launchCsvPayload = null;
    if (payload.error) {
        return { ok: false, error: payload.error };
    }
    return { ok: true, ...payload };
});

app.whenReady().then(async () => {
    const resolvedLaunchCsv = resolveLaunchCsvPath(process.argv);
    if (resolvedLaunchCsv.ok) {
        try {
            const content = await fs.readFile(resolvedLaunchCsv.path, "utf8");
            launchCsvPayload = {
                filePath: resolvedLaunchCsv.path,
                fileName: path.basename(resolvedLaunchCsv.path),
                content
            };
        } catch (error) {
            launchCsvPayload = {
                error: `Failed to read CSV: ${error?.message || error}`
            };
        }
    } else if (resolvedLaunchCsv.error) {
        launchCsvPayload = { error: resolvedLaunchCsv.error };
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
