const publishedSheetCsvEndpoint =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1vMlwTJ8_Lty161T73uwnMzVxb48XzHxz9aPNla5OgCjd2yJ0HMfxEHGSv1OsyGOarWUYDcsJZfmk/pub?gid=0&single=true&output=csv';

let leaderboardStatusSettled = false;
let leaderboardStatusTimeout;

function showLeaderboardStatus(snapshotLabel, companyCount) {
    const status = document.getElementById('leaderboard-status');
    const loader = document.getElementById('leaderboard-status-loader');
    const dot = document.getElementById('leaderboard-status-dot');
    const text = document.getElementById('leaderboard-status-text');

    if (!status || !loader || !dot || !text) return;

    loader.classList.add('hidden');
    dot.classList.remove('hidden');
    text.replaceChildren();

    const label = document.createElement('span');
    label.className = 'font-medium text-gray-700';
    label.textContent = `Latest data snapshot: ${snapshotLabel}`;

    const separator = document.createElement('span');
    separator.className = 'mx-2 text-gray-300';
    separator.textContent = '•';

    const count = document.createElement('span');
    count.textContent = `${companyCount.toLocaleString('en-US')} companies tracked`;

    text.append(label, separator, count);
    status.setAttribute('aria-busy', 'false');
}

function showLeaderboardStatusUnavailable() {
    if (leaderboardStatusSettled) return;
    leaderboardStatusSettled = true;

    const status = document.getElementById('leaderboard-status');
    const loader = document.getElementById('leaderboard-status-loader');
    const text = document.getElementById('leaderboard-status-text');

    if (!status || !loader || !text) return;

    loader.classList.add('hidden');
    text.textContent = 'Latest data snapshot temporarily unavailable';
    status.setAttribute('aria-busy', 'false');
}

function parseCsv(csv) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < csv.length; index += 1) {
        const character = csv[index];

        if (quoted) {
            if (character === '"' && csv[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                quoted = false;
            } else {
                field += character;
            }
        } else if (character === '"') {
            quoted = true;
        } else if (character === ',') {
            row.push(field);
            field = '';
        } else if (character === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else if (character !== '\r') {
            field += character;
        }
    }

    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

function getLeaderboardSnapshot(csv) {
    const rows = parseCsv(csv);
    const headers = rows[0] || [];
    const companyIndex = headers.indexOf('Company');
    const snapshotIndex = headers.indexOf('Snapshot Time');
    const monthIndexes = new Map([
        ['Jan', 0], ['Feb', 1], ['Mar', 2], ['Apr', 3], ['May', 4], ['Jun', 5],
        ['Jul', 6], ['Aug', 7], ['Sep', 8], ['Oct', 9], ['Nov', 10], ['Dec', 11]
    ]);

    if (companyIndex === -1 || snapshotIndex === -1) {
        throw new Error('Published Sheet is missing expected leaderboard columns.');
    }

    let companyCount = 0;
    let latestSnapshot;

    rows.slice(1).forEach((currentRow) => {
        if (!currentRow[companyIndex]?.trim()) return;
        companyCount += 1;

        const snapshotLabel = currentRow[snapshotIndex]?.trim();
        const match = snapshotLabel?.match(/^([A-Z][a-z]{2})\s+(\d{4})$/);
        const monthIndex = match ? monthIndexes.get(match[1]) : undefined;

        if (monthIndex === undefined) return;

        const sortValue = Number(match[2]) * 12 + monthIndex;
        if (!latestSnapshot || sortValue > latestSnapshot.sortValue) {
            latestSnapshot = { label: snapshotLabel, sortValue };
        }
    });

    if (!latestSnapshot || companyCount === 0) {
        throw new Error('Published Sheet returned incomplete leaderboard data.');
    }

    return { snapshotLabel: latestSnapshot.label, companyCount };
}

window.addEventListener('DOMContentLoaded', () => {
    leaderboardStatusTimeout = setTimeout(showLeaderboardStatusUnavailable, 8000);

    fetch(publishedSheetCsvEndpoint, { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) throw new Error(`Published Sheet request failed: ${response.status}`);
            return response.text();
        })
        .then((csv) => {
            if (leaderboardStatusSettled) return;

            const { snapshotLabel, companyCount } = getLeaderboardSnapshot(csv);
            leaderboardStatusSettled = true;
            clearTimeout(leaderboardStatusTimeout);
            showLeaderboardStatus(snapshotLabel, companyCount);
        })
        .catch((error) => {
            console.error('Unable to read the latest leaderboard snapshot:', error);
            showLeaderboardStatusUnavailable();
        });
});
