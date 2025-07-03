// Configuration for progress calculations and metrics
const progressConfig = {
    totalRevenue: {
        value: 3393700000
    },
    revenuePerEmployee: {
        value: 2526597,
        maxValue: 100000000, // $100MM
        minValue: 0,
        reverseScale: false // Higher is better
    },
    valuationPerEmployee: {
        value: 122135714,
        maxValue: 1000000000, // $1B
        minValue: 0,
        reverseScale: false // Higher is better
    },
    teamSize: {
        value: 22,
        maxValue: 100,
        minValue: 1,
        reverseScale: true // Lower is better (closer to 1-person company)
    }
};

// Format number as currency with $ and commas
function formatCurrency(value) {
    return '$' + value.toLocaleString('en-US');
}

// Format number with commas
function formatNumber(value) {
    return value.toLocaleString('en-US');
}

// Calculate percentages based on configuration
function calculatePercentage(config) {
    let percentage;
    if (config.reverseScale) {
        // For reverse scale (like team size where smaller is better)
        percentage = ((config.maxValue - config.value) / (config.maxValue - config.minValue)) * 100;
    } else {
        // For normal scale (like revenue where larger is better)
        percentage = ((config.value - config.minValue) / (config.maxValue - config.minValue)) * 100;
    }
    // Ensure percentage is between 0 and 100
    return Math.max(0, Math.min(100, percentage));
}

// Function to update progress bar with animation
function updateProgressBar(bar, percentText, percentage) {
    // Set initial width to 0 to ensure animation works
    bar.style.width = '0%';
    percentText.style.left = '0%';
    percentText.textContent = '0%';
    
    // Force a reflow to ensure the animation works
    void bar.offsetWidth;
    
    // Use setTimeout to ensure the browser registers the initial state before animating
    setTimeout(() => {
        // Now set the actual width
        bar.style.width = `${percentage}%`;
        percentText.style.left = `${percentage}%`;
        percentText.textContent = `${Math.round(percentage)}%`;
    }, 50);
}

// Calculate and update progress bars and metric values when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // Calculate percentages
    const revenuePercentage = calculatePercentage(progressConfig.revenuePerEmployee);
    const valuationPercentage = calculatePercentage(progressConfig.valuationPerEmployee);
    const teamSizePercentage = calculatePercentage(progressConfig.teamSize);
    
    try {
        // Get all metric boxes
        const metricBoxes = document.querySelectorAll('.metric-box');
        
        if (metricBoxes.length >= 4) {
            // Total Revenue (1st box)
            metricBoxes[0].querySelector('.metric-value').textContent = 
                formatCurrency(progressConfig.totalRevenue.value);
            
            // Revenue per employee (2nd box)
            metricBoxes[1].querySelector('.metric-value').textContent = 
                formatCurrency(progressConfig.revenuePerEmployee.value);
            updateProgressBar(
                metricBoxes[1].querySelector('.progress-bar-fill'),
                metricBoxes[1].querySelector('.progress-percentage'),
                revenuePercentage
            );
            
            // Valuation per employee (3rd box)
            metricBoxes[2].querySelector('.metric-value').textContent = 
                formatCurrency(progressConfig.valuationPerEmployee.value);
            updateProgressBar(
                metricBoxes[2].querySelector('.progress-bar-fill'),
                metricBoxes[2].querySelector('.progress-percentage'),
                valuationPercentage
            );
            
            // Team size (4th box)
            metricBoxes[3].querySelector('.metric-value').textContent = 
                formatNumber(progressConfig.teamSize.value);
            updateProgressBar(
                metricBoxes[3].querySelector('.progress-bar-fill'),
                metricBoxes[3].querySelector('.progress-percentage'),
                teamSizePercentage
            );
        }
    } catch (error) {
        console.error('Error updating metrics:', error);
    }
});
