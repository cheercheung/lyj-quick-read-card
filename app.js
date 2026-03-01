// State Management
const DEFAULT_LABELS = {
    ArrowUp: "重点看",
    ArrowDown: "放下",
    ArrowLeft: "还可以",
    ArrowRight: "待看"
};

let tableData = {
    headers: [],
    rows: []
};
let config = {
    contentColIndex: 0,
    labels: { ...DEFAULT_LABELS }
};
let currentIndex = 0;
let results = [];
let importedSource = {
    type: "paste",
    csvFilePath: "",
    csvFileName: ""
};

// --- Storage: Label Presets ---
const LABEL_PRESETS_STORAGE_KEY = "qrc_label_presets_v1";
const LAST_USED_LABELS_STORAGE_KEY = "qrc_last_used_labels_v1";
const SELECTED_PRESET_STORAGE_KEY = "qrc_selected_label_preset_v1";
const LAST_USED_PRESET_VALUE = "__last_used__";
let refreshLabelPresetsSelect = null;

function safeJsonParse(value, fallbackValue) {
    try {
        return JSON.parse(value);
    } catch (_) {
        return fallbackValue;
    }
}

function normalizeLabels(labels) {
    const safeLabels = labels && typeof labels === "object" ? labels : {};
    return {
        ArrowUp: (safeLabels.ArrowUp ?? DEFAULT_LABELS.ArrowUp).toString(),
        ArrowLeft: (safeLabels.ArrowLeft ?? DEFAULT_LABELS.ArrowLeft).toString(),
        ArrowRight: (safeLabels.ArrowRight ?? DEFAULT_LABELS.ArrowRight).toString(),
        ArrowDown: (safeLabels.ArrowDown ?? DEFAULT_LABELS.ArrowDown).toString()
    };
}

function loadLabelPresets() {
    const raw = localStorage.getItem(LABEL_PRESETS_STORAGE_KEY) || "{}";
    const parsed = safeJsonParse(raw, {});
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const presets = {};
    Object.keys(parsed).forEach((name) => {
        if (!name || typeof name !== "string") return;
        presets[name] = normalizeLabels(parsed[name]);
    });

    return presets;
}

function saveLabelPresets(presets) {
    localStorage.setItem(LABEL_PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

function loadLastUsedLabels() {
    const raw = localStorage.getItem(LAST_USED_LABELS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeJsonParse(raw, null);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return normalizeLabels(parsed);
}

function saveLastUsedLabels(labels) {
    localStorage.setItem(LAST_USED_LABELS_STORAGE_KEY, JSON.stringify(normalizeLabels(labels)));
}

function getLabelsFromInputs() {
    return normalizeLabels({
        ArrowUp: document.getElementById("up-label")?.value || "",
        ArrowLeft: document.getElementById("left-label")?.value || "",
        ArrowRight: document.getElementById("right-label")?.value || "",
        ArrowDown: document.getElementById("down-label")?.value || ""
    });
}

function applyLabelsToInputs(labels) {
    const normalized = normalizeLabels(labels);
    const upInput = document.getElementById("up-label");
    const leftInput = document.getElementById("left-label");
    const rightInput = document.getElementById("right-label");
    const downInput = document.getElementById("down-label");

    if (upInput) upInput.value = normalized.ArrowUp;
    if (leftInput) leftInput.value = normalized.ArrowLeft;
    if (rightInput) rightInput.value = normalized.ArrowRight;
    if (downInput) downInput.value = normalized.ArrowDown;
}

function isReservedPresetName(presetName) {
    const name = (presetName || "").trim().toLowerCase();
    return name === "last used" || name === "最近使用";
}

function initializeLabelPresetsUI() {
    const select = document.getElementById("label-group-select");
    const nameInput = document.getElementById("label-group-name");
    const saveButton = document.getElementById("btn-save-group");
    const deleteButton = document.getElementById("btn-delete-group");
    if (!select || !nameInput || !saveButton || !deleteButton) return;

    const renderSelect = (selectedValue) => {
        const presets = loadLabelPresets();
        const lastUsedLabels = loadLastUsedLabels();

        select.innerHTML = "";

        if (lastUsedLabels) {
            const opt = document.createElement("option");
            opt.value = LAST_USED_PRESET_VALUE;
            opt.textContent = "Last used";
            select.appendChild(opt);
        }

        Object.keys(presets)
            .sort((a, b) => a.localeCompare(b))
            .forEach((name) => {
                const opt = document.createElement("option");
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });

        if (select.options.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "No saved presets";
            select.appendChild(opt);
        }

        const desiredValue = selectedValue ?? select.value;
        const optionValues = Array.from(select.options).map(o => o.value);
        select.value = optionValues.includes(desiredValue) ? desiredValue : select.options[0].value;

        const isDeletable = select.value && select.value !== LAST_USED_PRESET_VALUE;
        deleteButton.disabled = !isDeletable;
    };
    refreshLabelPresetsSelect = () => renderSelect(select.value);

    const applySelectedPreset = () => {
        const selectedValue = select.value;
        if (!selectedValue) return;

        if (selectedValue === LAST_USED_PRESET_VALUE) {
            const lastUsedLabels = loadLastUsedLabels();
            if (!lastUsedLabels) return;
            applyLabelsToInputs(lastUsedLabels);
            nameInput.value = "";
            deleteButton.disabled = true;
            return;
        }

        const presets = loadLabelPresets();
        const labels = presets[selectedValue];
        if (!labels) return;
        applyLabelsToInputs(labels);
        nameInput.value = selectedValue;
        deleteButton.disabled = false;
    };

    renderSelect(localStorage.getItem(SELECTED_PRESET_STORAGE_KEY));
    applySelectedPreset();

    select.addEventListener("change", () => {
        localStorage.setItem(SELECTED_PRESET_STORAGE_KEY, select.value);
        applySelectedPreset();
    });

    saveButton.addEventListener("click", () => {
        const presetName = (nameInput.value || "").trim();
        if (!presetName) return alert("Please enter a preset name");
        if (isReservedPresetName(presetName)) return alert("This preset name is reserved");

        const presets = loadLabelPresets();
        if (presets[presetName]) {
            const ok = confirm(`Preset "${presetName}" already exists. Overwrite it?`);
            if (!ok) return;
        }

        presets[presetName] = getLabelsFromInputs();
        saveLabelPresets(presets);
        localStorage.setItem(SELECTED_PRESET_STORAGE_KEY, presetName);
        renderSelect(presetName);
        applySelectedPreset();
    });

    deleteButton.addEventListener("click", () => {
        const selectedValue = select.value;
        if (!selectedValue || selectedValue === LAST_USED_PRESET_VALUE) return;

        const ok = confirm(`Delete preset "${selectedValue}"?`);
        if (!ok) return;

        const presets = loadLabelPresets();
        delete presets[selectedValue];
        saveLabelPresets(presets);

        localStorage.setItem(SELECTED_PRESET_STORAGE_KEY, LAST_USED_PRESET_VALUE);
        renderSelect(LAST_USED_PRESET_VALUE);
        applySelectedPreset();
    });
}

// DOM Elements
const stages = ['step-1', 'step-2', 'step-3', 'step-4'];
const showStage = (id) => {
    stages.forEach(s => document.getElementById(s).classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

initializeLabelPresetsUI();

function parseCSVText(csvText) {
    const allRows = [];
    let currentRow = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && char === ',') {
            currentRow.push(currentCell);
            currentCell = "";
            continue;
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentCell);
            allRows.push(currentRow);
            currentRow = [];
            currentCell = "";
            continue;
        }

        currentCell += char;
    }

    currentRow.push(currentCell);
    allRows.push(currentRow);

    while (
        allRows.length &&
        allRows[allRows.length - 1].every(cell => cell.trim() === "")
    ) {
        allRows.pop();
    }

    if (!allRows.length) return { headers: [], rows: [] };

    const headers = allRows[0].map(cell => cell.trim());
    const rows = allRows.slice(1);
    return { headers, rows };
}

function applyParsedTable(headers, rows, sourceType = "paste", sourceInfo = {}) {
    if (!headers.length) {
        alert("CSV has no header row");
        return false;
    }

    tableData.headers = headers;
    tableData.rows = rows;

    importedSource.type = sourceType;
    importedSource.csvFilePath = sourceInfo.csvFilePath || "";
    importedSource.csvFileName = sourceInfo.csvFileName || "";

    const select = document.getElementById('column-select');
    select.innerHTML = '';
    tableData.headers.forEach((h, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = h || `Column ${i + 1}`;
        select.appendChild(opt);
    });

    if (tableData.headers.length > 1) select.selectedIndex = 1;

    const statusEl = document.getElementById("csv-import-status");
    if (statusEl) {
        statusEl.textContent = sourceType.startsWith("csv")
            ? `Imported: ${importedSource.csvFileName}`
            : "No CSV imported";
    }

    return true;
}

async function importCSVFromFile() {
    if (window.quickReadCardAPI?.openCsvFile) {
        try {
            const result = await window.quickReadCardAPI.openCsvFile();
            if (!result || result.canceled) return;

            const parsed = parseCSVText(result.content || "");
            if (!applyParsedTable(parsed.headers, parsed.rows, "csv-electron", {
                csvFilePath: result.filePath,
                csvFileName: result.fileName
            })) {
                return;
            }

            showStage('step-2');
        } catch (error) {
            alert(`Failed to import CSV: ${error?.message || error}`);
        }
        return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv,text/csv";
    fileInput.addEventListener("change", async () => {
        try {
            const selectedFile = fileInput.files?.[0];
            if (!selectedFile) return;

            const parsed = parseCSVText(await selectedFile.text());
            if (!applyParsedTable(parsed.headers, parsed.rows, "csv-browser", {
                csvFileName: selectedFile.name
            })) {
                return;
            }

            showStage('step-2');
        } catch (error) {
            alert(`Failed to import CSV: ${error?.message || error}`);
        }
    }, { once: true });
    fileInput.click();
}

// --- Step 1: Parsing ---
document.getElementById('btn-parse').addEventListener('click', () => {
    const input = document.getElementById('table-input').value.trim();
    if (!input) return alert("Please paste a table");

    const lines = input.split('\n').filter(l => l.trim());
    if (lines.length < 1) return alert("Table must have contents");

    // Detect format: Priority to Excel (Tabs) then Markdown (Pipes)
    const firstLine = lines[0];
    const hasTabs = firstLine.includes('\t');
    const hasPipes = firstLine.includes('|');

    let rows = [];
    let headers = [];

    if (hasTabs) {
        // Excel / TSV
        headers = firstLine.split('\t').map(c => c.trim());
        rows = lines.slice(1).map(line => line.split('\t').map(c => c.trim()));
    } else if (hasPipes) {
        // Markdown
        const parsePipeLine = (line) => line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
        headers = parsePipeLine(lines[0]);
        // Markdown tables usually have a separator line |---|---|
        const startIdx = lines[1] && lines[1].includes('---') ? 2 : 1;
        rows = lines.slice(startIdx).map(line => parsePipeLine(line));
    } else {
        // Fallback: Single column or comma separated
        headers = ["Content"];
        rows = lines.map(line => [line.trim()]);
    }

    applyParsedTable(headers, rows, "paste");

    showStage('step-2');
});

document.getElementById("btn-import-csv").addEventListener("click", importCSVFromFile);
document.getElementById('btn-back-1').addEventListener('click', () => showStage('step-1'));

// --- Step 2: Configuration ---
function applyConfigAndStartLabelling() {
    config.contentColIndex = parseInt(document.getElementById('column-select').value);
    config.labels.ArrowUp = document.getElementById('up-label').value || DEFAULT_LABELS.ArrowUp;
    config.labels.ArrowLeft = document.getElementById('left-label').value || DEFAULT_LABELS.ArrowLeft;
    config.labels.ArrowRight = document.getElementById('right-label').value || DEFAULT_LABELS.ArrowRight;
    config.labels.ArrowDown = document.getElementById('down-label').value || DEFAULT_LABELS.ArrowDown;

    saveLastUsedLabels(config.labels);
    if (typeof refreshLabelPresetsSelect === "function") refreshLabelPresetsSelect();

    // Update hints in UI
    document.querySelector('#hint-up label-text').textContent = config.labels.ArrowUp;
    document.querySelector('#hint-left label-text').textContent = config.labels.ArrowLeft;
    document.querySelector('#hint-right label-text').textContent = config.labels.ArrowRight;
    document.querySelector('#hint-down label-text').textContent = config.labels.ArrowDown;

    currentIndex = 0;
    results = [];
    startLabelling();
}

document.getElementById('btn-start').addEventListener('click', () => {
    applyConfigAndStartLabelling();
});

// --- Step 3: Labelling ---
function startLabelling() {
    showStage('step-3');
    updateCard();
}

function updateCard() {
    if (currentIndex >= tableData.rows.length) {
        finishLabelling();
        return;
    }

    const row = tableData.rows[currentIndex];
    const content = row[config.contentColIndex];
    const card = document.getElementById('card-card');

    card.textContent = content;
    card.className = 'card-display glass-pane'; // Reset animations

    document.getElementById('counter').textContent = `${currentIndex + 1} / ${tableData.rows.length}`;
    document.getElementById('progress-bar').style.width = `${((currentIndex) / tableData.rows.length) * 100}%`;
}

window.addEventListener('keydown', (e) => {
    if (!document.getElementById('step-3').classList.contains('active')) return;
    if (!config.labels[e.key]) return;

    const label = config.labels[e.key];

    // Immediate Visual Feedback for Key Hint
    const hintId = `hint-${e.key.replace('Arrow', '').toLowerCase()}`;
    const hint = document.getElementById(hintId);
    hint.classList.add('active');
    setTimeout(() => hint.classList.remove('active'), 100);

    // Immediate Logic Processing (No Animation/Delay)
    results.push(label);
    currentIndex++;
    updateCard();
});

// --- Step 4: Completion ---
function finishLabelling() {
    showStage('step-4');
    const isElectronCsv = importedSource.type === "csv-electron";
    const isBrowserCsv = importedSource.type === "csv-browser";
    const subtitle = document.getElementById("completion-subtitle");
    if (subtitle) {
        subtitle.textContent = isElectronCsv
            ? `Ready to overwrite: ${importedSource.csvFileName} (adds Label column)`
            : isBrowserCsv
                ? "Label column preview is ready below. Click Save to download a new CSV file."
                : "Label column preview is ready below. Export to save it.";
    }
    const exportButton = document.getElementById("btn-export");
    if (exportButton) {
        exportButton.textContent = "Save";
    }
    renderResultTable();
}

function renderResultTable() {
    const thead = document.getElementById('result-thead');
    const tbody = document.getElementById('result-tbody');

    thead.innerHTML = `<tr>${tableData.headers.map(h => `<th>${h}</th>`).join('')}<th>Label</th></tr>`;
    tbody.innerHTML = tableData.rows.map((row, i) => `
        <tr>
            ${row.map(c => `<td>${c}</td>`).join('')}
            <td style="color: var(--primary); font-weight: bold;">${getResultLabel(i)}</td>
        </tr>
    `).join('');
}

function getResultLabel(index) {
    return results[index] ?? '';
}

function generateMarkdown() {
    let md = `| ${tableData.headers.join(' | ')} | Label |\n`;
    md += `| ${tableData.headers.map(() => '---').join(' | ')} | --- |\n`;
    tableData.rows.forEach((row, i) => {
        md += `| ${row.join(' | ')} | ${getResultLabel(i)} |\n`;
    });
    return md;
}

function generateTSV() {
    let tsv = [...tableData.headers, "Label"].join('\t') + '\n';
    tableData.rows.forEach((row, i) => {
        tsv += [...row, getResultLabel(i)].join('\t') + '\n';
    });
    return tsv;
}

function escapeCSVCell(value) {
    const text = (value ?? "").toString();
    if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function generateCSV() {
    const headerLine = [...tableData.headers, "Label"].map(escapeCSVCell).join(',');
    const rowLines = tableData.rows.map((row, i) => {
        return [...row, getResultLabel(i)].map(escapeCSVCell).join(',');
    });
    return [headerLine, ...rowLines].join('\n');
}

document.getElementById('btn-finish-now').addEventListener('click', () => {
    finishLabelling();
});

document.getElementById('btn-export').addEventListener('click', async () => {
    if (importedSource.type === "csv-electron") {
        if (!window.quickReadCardAPI?.saveCsvFile) {
            return alert("CSV overwrite is only available in Electron app");
        }
        try {
            const csv = generateCSV();
            const response = await window.quickReadCardAPI.saveCsvFile({
                filePath: importedSource.csvFilePath,
                content: csv
            });
            if (!response?.ok) {
                throw new Error(response?.message || "Save failed");
            }
            alert(`Saved and overwritten: ${importedSource.csvFileName}`);
            return;
        } catch (error) {
            alert(`Failed to overwrite CSV: ${error?.message || error}`);
            return;
        }
    }

    if (importedSource.type === "csv-browser") {
        const csv = generateCSV();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const sourceName = importedSource.csvFileName || "labelled_table.csv";
        const hasCsvExtension = sourceName.toLowerCase().endsWith(".csv");
        const baseName = hasCsvExtension ? sourceName.slice(0, -4) : sourceName;
        a.href = url;
        a.download = `${baseName}_labelled.csv`;
        a.click();
        return;
    }

    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'labelled_table.md';
    a.click();
});

document.getElementById('btn-copy').addEventListener('click', () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md).then(() => {
        const btn = document.getElementById('btn-copy');
        const oldText = btn.textContent;
        btn.textContent = "Copied!";
        btn.style.background = "#22c55e";
        setTimeout(() => {
            btn.textContent = oldText;
            btn.style.background = "";
        }, 2000);
    });
});

document.getElementById('btn-copy-excel').addEventListener('click', () => {
    const tsv = generateTSV();
    navigator.clipboard.writeText(tsv).then(() => {
        const btn = document.getElementById('btn-copy-excel');
        const oldText = btn.textContent;
        btn.textContent = "Copied!";
        btn.style.background = "#22c55e";
        setTimeout(() => {
            btn.textContent = oldText;
            btn.style.background = "";
        }, 2000);
    });
});

document.getElementById('btn-restart').addEventListener('click', () => {
    importedSource = {
        type: "paste",
        csvFilePath: "",
        csvFileName: ""
    };
    const statusEl = document.getElementById("csv-import-status");
    if (statusEl) statusEl.textContent = "No CSV imported";
    showStage('step-1');
});

async function tryLaunchCsvImportAndStart() {
    if (!window.quickReadCardAPI?.getLaunchCsvFile) return;

    try {
        const launchCsv = await window.quickReadCardAPI.getLaunchCsvFile();
        if (!launchCsv?.ok) {
            if (launchCsv?.error) {
                alert(`Failed to load launch CSV: ${launchCsv.error}`);
            }
            return;
        }

        const parsed = parseCSVText(launchCsv.content || "");
        const didApply = applyParsedTable(parsed.headers, parsed.rows, "csv-electron", {
            csvFilePath: launchCsv.filePath,
            csvFileName: launchCsv.fileName
        });
        if (!didApply) return;

        const select = document.getElementById("column-select");
        if (select && select.options.length) {
            select.selectedIndex = tableData.headers.length > 1 ? 1 : 0;
        }

        applyConfigAndStartLabelling();
    } catch (error) {
        alert(`Failed to load launch CSV: ${error?.message || error}`);
    }
}

tryLaunchCsvImportAndStart();
