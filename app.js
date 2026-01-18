// State Management
let tableData = {
    headers: [],
    rows: []
};
let config = {
    contentColIndex: 0,
    labels: {
        ArrowUp: "重点看",
        ArrowDown: "放下",
        ArrowLeft: "还可以",
        ArrowRight: "待看"
    }
};
let currentIndex = 0;
let results = [];

// DOM Elements
const stages = ['step-1', 'step-2', 'step-3', 'step-4'];
const showStage = (id) => {
    stages.forEach(s => document.getElementById(s).classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

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

    tableData.headers = headers;
    tableData.rows = rows;

    // Populate Column Select
    const select = document.getElementById('column-select');
    select.innerHTML = '';
    tableData.headers.forEach((h, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = h || `Column ${i + 1}`;
        select.appendChild(opt);
    });

    // Auto-select column 1 if it exists
    if (tableData.headers.length > 1) select.selectedIndex = 1;

    showStage('step-2');
});

document.getElementById('btn-back-1').addEventListener('click', () => showStage('step-1'));

// --- Step 2: Configuration ---
document.getElementById('btn-start').addEventListener('click', () => {
    config.contentColIndex = parseInt(document.getElementById('column-select').value);
    config.labels.ArrowUp = document.getElementById('up-label').value || "Up";
    config.labels.ArrowLeft = document.getElementById('left-label').value || "Left";
    config.labels.ArrowRight = document.getElementById('right-label').value || "Right";
    config.labels.ArrowDown = document.getElementById('down-label').value || "Down";

    // Update hints in UI
    document.querySelector('#hint-up label-text').textContent = config.labels.ArrowUp;
    document.querySelector('#hint-left label-text').textContent = config.labels.ArrowLeft;
    document.querySelector('#hint-right label-text').textContent = config.labels.ArrowRight;
    document.querySelector('#hint-down label-text').textContent = config.labels.ArrowDown;

    currentIndex = 0;
    results = [];
    startLabelling();
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
    const card = document.getElementById('card-card');

    // Visual Feedback
    const hintId = `hint-${e.key.replace('Arrow', '').toLowerCase()}`;
    const hint = document.getElementById(hintId);
    hint.classList.add('active');
    setTimeout(() => hint.classList.remove('active'), 150);

    // Swipe Animation
    const animClass = `swipe-${e.key.replace('Arrow', '').toLowerCase()}`;
    card.classList.add(animClass);

    // Save result after animation
    setTimeout(() => {
        results.push(label);
        currentIndex++;
        updateCard();
    }, 200);
});

// --- Step 4: Completion ---
function finishLabelling() {
    showStage('step-4');
    renderResultTable();
}

function renderResultTable() {
    const thead = document.getElementById('result-thead');
    const tbody = document.getElementById('result-tbody');

    thead.innerHTML = `<tr>${tableData.headers.map(h => `<th>${h}</th>`).join('')}<th>Label</th></tr>`;
    tbody.innerHTML = tableData.rows.map((row, i) => `
        <tr>
            ${row.map(c => `<td>${c}</td>`).join('')}
            <td style="color: var(--primary); font-weight: bold;">${results[i]}</td>
        </tr>
    `).join('');
}

function generateMarkdown() {
    let md = `| ${tableData.headers.join(' | ')} | Label |\n`;
    md += `| ${tableData.headers.map(() => '---').join(' | ')} | --- |\n`;
    tableData.rows.forEach((row, i) => {
        md += `| ${row.join(' | ')} | ${results[i]} |\n`;
    });
    return md;
}

function generateTSV() {
    let tsv = [...tableData.headers, "Label"].join('\t') + '\n';
    tableData.rows.forEach((row, i) => {
        tsv += [...row, results[i]].join('\t') + '\n';
    });
    return tsv;
}

document.getElementById('btn-export').addEventListener('click', () => {
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
    showStage('step-1');
});
