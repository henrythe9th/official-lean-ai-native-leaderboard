// Computes the dashboard tile values from `leaderboardCompanies` so a single
// data edit keeps both the table and the headline metrics in sync.

(function () {
  function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  function deriveMetrics() {
    const companies = (typeof leaderboardCompanies !== 'undefined') ? leaderboardCompanies : [];

    const totalRevenue = companies.reduce((sum, c) => sum + (c.annualRevenue || 0), 0);
    const revPerEmpValues = companies.map(c => c.revenuePerEmployee).filter(v => typeof v === 'number');
    const valPerEmpValues = companies.map(c => c.valuationPerEmployee).filter(v => typeof v === 'number');
    const teamSizes = companies.map(c => c.employees).filter(v => typeof v === 'number');

    return {
      totalRevenue: { value: totalRevenue },
      revenuePerEmployee: {
        value: Math.round(average(revPerEmpValues)),
        maxValue: 100000000,
        minValue: 0,
        reverseScale: false
      },
      valuationPerEmployee: {
        value: Math.round(average(valPerEmpValues)),
        maxValue: 1000000000,
        minValue: 0,
        reverseScale: false
      },
      teamSize: {
        value: Math.round(average(teamSizes)),
        maxValue: 100,
        minValue: 1,
        reverseScale: true
      }
    };
  }

  function formatCurrency(value) {
    return '$' + value.toLocaleString('en-US');
  }

  function formatNumber(value) {
    return value.toLocaleString('en-US');
  }

  function calculatePercentage(config) {
    let percentage;
    if (config.reverseScale) {
      percentage = ((config.maxValue - config.value) / (config.maxValue - config.minValue)) * 100;
    } else {
      percentage = ((config.value - config.minValue) / (config.maxValue - config.minValue)) * 100;
    }
    return Math.max(0, Math.min(100, percentage));
  }

  function updateProgressBar(bar, percentText, percentage) {
    bar.style.width = '0%';
    percentText.style.left = '0%';
    percentText.textContent = '0%';

    void bar.offsetWidth;

    setTimeout(() => {
      bar.style.width = `${percentage}%`;
      percentText.style.left = `${percentage}%`;
      percentText.textContent = `${Math.round(percentage)}%`;
    }, 50);
  }

  function render() {
    const config = deriveMetrics();
    const revenuePercentage = calculatePercentage(config.revenuePerEmployee);
    const valuationPercentage = calculatePercentage(config.valuationPerEmployee);
    const teamSizePercentage = calculatePercentage(config.teamSize);

    try {
      const metricBoxes = document.querySelectorAll('.metric-box');
      if (metricBoxes.length < 4) return;

      metricBoxes[0].querySelector('.metric-value').textContent =
        formatCurrency(config.totalRevenue.value);

      metricBoxes[1].querySelector('.metric-value').textContent =
        formatCurrency(config.revenuePerEmployee.value);
      updateProgressBar(
        metricBoxes[1].querySelector('.progress-bar-fill'),
        metricBoxes[1].querySelector('.progress-percentage'),
        revenuePercentage
      );

      metricBoxes[2].querySelector('.metric-value').textContent =
        formatCurrency(config.valuationPerEmployee.value);
      updateProgressBar(
        metricBoxes[2].querySelector('.progress-bar-fill'),
        metricBoxes[2].querySelector('.progress-percentage'),
        valuationPercentage
      );

      metricBoxes[3].querySelector('.metric-value').textContent =
        formatNumber(config.teamSize.value);
      updateProgressBar(
        metricBoxes[3].querySelector('.progress-bar-fill'),
        metricBoxes[3].querySelector('.progress-percentage'),
        teamSizePercentage
      );
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
