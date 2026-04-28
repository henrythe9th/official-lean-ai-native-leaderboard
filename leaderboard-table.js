// Renders the company leaderboard table from `leaderboardCompanies`.
// Click a column header to sort; click again to flip direction.

(function () {
  const NUMERIC_FIELDS = new Set([
    'rank', 'annualRevenue', 'employees', 'revenuePerEmployee',
    'totalFunding', 'valuation', 'valuationPerEmployee', 'founded'
  ]);

  // Default to "rank" so the user lands on the curated revenue/employee ordering.
  let currentSort = { field: 'rank', dir: 'asc' };

  function formatCurrency(value) {
    if (value === null || value === undefined) return '<span class="text-gray-300">—</span>';
    return '$' + value.toLocaleString('en-US');
  }

  function formatNumber(value) {
    if (value === null || value === undefined) return '<span class="text-gray-300">—</span>';
    return value.toLocaleString('en-US');
  }

  function formatProfitable(value) {
    if (value === true) {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">Yes</span>';
    }
    if (value === false) {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">No</span>';
    }
    return '<span class="text-gray-300">—</span>';
  }

  // Deterministic per-name color so each company keeps the same avatar tint across renders.
  function avatarFor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const initial = name.replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase() || '?';
    return `<span class="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold text-white shrink-0" style="background:hsl(${hue}, 55%, 42%)">${initial}</span>`;
  }

  function escapeHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function renderSourceCell(source) {
    if (!source) return '<span class="text-gray-300">—</span>';
    if (/^https?:\/\//i.test(source)) {
      return `<a href="${escapeHTML(source)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Open source"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>`;
    }
    return `<span class="text-xs text-gray-500 italic" title="${escapeHTML(source)}">Private</span>`;
  }

  function renderRow(company) {
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-3 py-3 text-right tabular-nums text-gray-500">${company.rank}</td>
        <td class="px-3 py-3">${avatarFor(company.company)}</td>
        <td class="px-3 py-3 font-medium text-gray-900">${escapeHTML(company.company)}</td>
        <td class="px-3 py-3 text-gray-700">${escapeHTML(company.description)}</td>
        <td class="px-3 py-3 text-gray-700">${escapeHTML(company.location)}</td>
        <td class="px-3 py-3 text-right tabular-nums text-gray-900">${formatCurrency(company.annualRevenue)}</td>
        <td class="px-3 py-3 text-right tabular-nums text-gray-700">${formatNumber(company.employees)}</td>
        <td class="px-3 py-3 text-right tabular-nums font-medium text-gray-900">${formatCurrency(company.revenuePerEmployee)}</td>
        <td class="px-3 py-3 text-center">${formatProfitable(company.profitable)}</td>
        <td class="px-3 py-3 text-right tabular-nums text-gray-700">${formatCurrency(company.totalFunding)}</td>
        <td class="px-3 py-3 text-right tabular-nums text-gray-700">${formatCurrency(company.valuation)}</td>
        <td class="px-3 py-3 text-right tabular-nums text-gray-700">${formatCurrency(company.valuationPerEmployee)}</td>
        <td class="px-3 py-3 text-right tabular-nums text-gray-700">${company.founded ?? '<span class="text-gray-300">—</span>'}</td>
        <td class="px-3 py-3 text-gray-700 whitespace-nowrap">${escapeHTML(company.lastUpdated || '—')}</td>
        <td class="px-3 py-3 text-center">${renderSourceCell(company.source)}</td>
      </tr>
    `;
  }

  function renderRows(rows) {
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(renderRow).join('');
  }

  function compareValues(a, b, field) {
    const av = a[field];
    const bv = b[field];
    // Always sort null/undefined to the bottom regardless of direction.
    const aMissing = av === null || av === undefined;
    const bMissing = bv === null || bv === undefined;
    if (aMissing && bMissing) return 0;
    if (aMissing) return 1;
    if (bMissing) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    if (typeof av === 'boolean' && typeof bv === 'boolean') return (av === bv) ? 0 : (av ? -1 : 1);
    return String(av).localeCompare(String(bv));
  }

  function sortedRows() {
    const sorted = leaderboardCompanies.slice().sort((a, b) => {
      const cmp = compareValues(a, b, currentSort.field);
      return currentSort.dir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }

  function updateHeaderIndicators() {
    document.querySelectorAll('.leaderboard-th').forEach((th) => {
      const field = th.dataset.field;
      const arrow = th.querySelector('.sort-arrow');
      if (!arrow) return;
      if (field === currentSort.field) {
        arrow.textContent = currentSort.dir === 'asc' ? '↑' : '↓';
        arrow.classList.remove('opacity-30');
        arrow.classList.add('opacity-100');
      } else {
        arrow.textContent = '↕';
        arrow.classList.remove('opacity-100');
        arrow.classList.add('opacity-30');
      }
    });
  }

  function handleHeaderClick(event) {
    const th = event.currentTarget;
    const field = th.dataset.field;
    if (!field) return;
    if (currentSort.field === field) {
      currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.field = field;
      // Numeric columns generally make more sense largest-first; rank is naturally ascending.
      currentSort.dir = (field === 'rank' || !NUMERIC_FIELDS.has(field)) ? 'asc' : 'desc';
    }
    renderRows(sortedRows());
    updateHeaderIndicators();
  }

  function init() {
    if (typeof leaderboardCompanies === 'undefined') {
      console.error('leaderboardCompanies is not defined — make sure leaderboard-data.js is loaded first.');
      return;
    }

    const countEl = document.getElementById('leaderboard-count');
    if (countEl) countEl.textContent = leaderboardCompanies.length;

    document.querySelectorAll('.leaderboard-th').forEach((th) => {
      th.addEventListener('click', handleHeaderClick);
    });

    renderRows(sortedRows());
    updateHeaderIndicators();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
