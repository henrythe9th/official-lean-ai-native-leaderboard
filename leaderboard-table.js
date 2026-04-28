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

  // Deterministic per-name color so each company keeps the same tint across renders.
  function paletteFor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const initial = name.replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase() || '?';
    return { bg: `hsl(${hue}, 55%, 42%)`, initial };
  }

  function domainFromUrl(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (_) {
      return null;
    }
  }

  // Renders a logo cell: colored letter avatar with the company's favicon
  // layered on top. If the favicon fails to load (or `logoUrl` is missing
  // and there's no website), the letter avatar shows through.
  function logoFor(company) {
    const { bg, initial } = paletteFor(company.company);
    const avatarBase = `<span class="relative inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold text-white shrink-0 overflow-hidden" style="background:${bg}">`;
    const initialEl = `<span aria-hidden="true">${initial}</span>`;

    // Explicit override always wins.
    if (company.logoUrl) {
      return `${avatarBase}${initialEl}<img src="${escapeHTML(company.logoUrl)}" alt="" loading="lazy" onerror="this.remove()" class="absolute inset-0 w-full h-full object-cover">`+`</span>`;
    }

    // Favicon path — only if we have a website to derive a domain from.
    const domain = company.website ? domainFromUrl(company.website) : null;
    if (domain) {
      const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
      return `${avatarBase}${initialEl}<img src="${favicon}" alt="" loading="lazy" onerror="this.remove()" class="absolute inset-0 w-full h-full object-cover">`+`</span>`;
    }

    // No website, no override — letter avatar only.
    return `${avatarBase}${initial}</span>`;
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

  function renderCompanyName(company) {
    const safe = escapeHTML(company.company);
    if (company.website) {
      return `<a href="${escapeHTML(company.website)}" target="_blank" rel="noopener noreferrer" class="text-gray-900 hover:text-blue-600 hover:underline">${safe}</a>`;
    }
    return safe;
  }

  function renderRow(company) {
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-3 py-3 text-right tabular-nums text-gray-500">${company.rank}</td>
        <td class="px-3 py-3">${logoFor(company)}</td>
        <td class="px-3 py-3 font-medium">${renderCompanyName(company)}</td>
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

  // Sticky horizontal scrollbar that hugs the viewport bottom while the
  // leaderboard is in view. Mirrors the real scroll container so dragging
  // either thumb scrolls the table. Hides itself when the table fits.
  function setupStickyScrollbar() {
    const scroller = document.getElementById('leaderboard-scroll');
    const phantom = document.getElementById('leaderboard-sticky-scroll');
    const track = document.getElementById('leaderboard-sticky-track');
    if (!scroller || !phantom || !track) return;

    const sync = () => {
      const overflows = scroller.scrollWidth - scroller.clientWidth > 1;
      phantom.classList.toggle('hidden', !overflows);
      if (overflows) {
        track.style.width = scroller.scrollWidth + 'px';
        // Re-align in case clientWidth changed under the user's scroll position.
        if (Math.abs(phantom.scrollLeft - scroller.scrollLeft) > 1) {
          phantom.scrollLeft = scroller.scrollLeft;
        }
      }
    };

    // Bidirectional scroll mirroring. The lock prevents a→b→a feedback while
    // still keeping the perceived motion frame-perfect (rAF, not setTimeout).
    let scrollLock = false;
    const linkScroll = (from, to) => {
      from.addEventListener('scroll', () => {
        if (scrollLock) return;
        scrollLock = true;
        to.scrollLeft = from.scrollLeft;
        requestAnimationFrame(() => { scrollLock = false; });
      }, { passive: true });
    };
    linkScroll(scroller, phantom);
    linkScroll(phantom, scroller);

    // ResizeObserver catches viewport resize, font-load reflow, and any future
    // case where the table's intrinsic width shifts. Falls back to window
    // resize for environments without RO support.
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(sync).observe(scroller);
    } else {
      window.addEventListener('resize', sync);
    }

    // Browsers settle table layout asynchronously — measure on the next frame.
    requestAnimationFrame(sync);
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
    setupStickyScrollbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
