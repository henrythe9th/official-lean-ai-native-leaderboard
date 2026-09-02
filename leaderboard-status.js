const publishedSheetQueryEndpoint =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1vMlwTJ8_Lty161T73uwnMzVxb48XzHxz9aPNla5OgCjd2yJ0HMfxEHGSv1OsyGOarWUYDcsJZfmk/gviz/tq';

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

window.handleLeaderboardSnapshot = function handleLeaderboardSnapshot(response) {
    if (leaderboardStatusSettled) return;

    try {
        const cells = response?.table?.rows?.[0]?.c;
        const snapshotLabel = cells?.[0]?.f;
        const companyCount = cells?.[1]?.v;

        if (!snapshotLabel || !Number.isFinite(companyCount)) {
            throw new Error('Published Sheet returned incomplete leaderboard metadata.');
        }

        leaderboardStatusSettled = true;
        clearTimeout(leaderboardStatusTimeout);
        showLeaderboardStatus(snapshotLabel, companyCount);
    } catch (error) {
        console.error('Unable to read the latest leaderboard snapshot:', error);
        showLeaderboardStatusUnavailable();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    const query = "select max(O), count(C) where C is not null format max(O) 'MMM yyyy'";
    const responseOptions = 'out:json;responseHandler:handleLeaderboardSnapshot';
    const script = document.createElement('script');

    script.async = true;
    script.src = `${publishedSheetQueryEndpoint}?gid=0&headers=1&tq=${encodeURIComponent(query)}&tqx=${encodeURIComponent(responseOptions)}`;
    script.onerror = showLeaderboardStatusUnavailable;
    document.head.appendChild(script);

    leaderboardStatusTimeout = setTimeout(showLeaderboardStatusUnavailable, 8000);
});
