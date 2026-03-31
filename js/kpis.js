/**
 * KPIs Module - Key Performance Indicators
 * Calculates and displays survey metrics using role-weighted averages.
 */

// The 12 THRIVE numeric columns (satisfaction displayed separately)
const NUM_COLUMNS = [
    'Q25_num', 'Q26_num', 'Q27_num', 'Q28_num',
    'Q30_num', 'Q31_num', 'Q32_num', 'Q33_num',
    'Q34_num', 'Q36_num', 'Q38_num', 'Q39_num',
];

function getCurrentComparisonMode() {
    return window.DrawerModule?.getCurrentComparisonMode?.() || 'baseline';
}

function getAverageScoreColorClass(filtered, total) {
    if (filtered > total) return 'score-green';
    if (filtered < total) return 'score-red';
    return 'score-neutral';
}

function calculateAverageResponse(data) {
    if (!data || data.length === 0) return 0;
    return window.CSVLoaderModule.calculateWeightedAverage(data, NUM_COLUMNS);
}

function calculateSatisfactionAverage(data) {
    if (!data || data.length === 0) return 0;
    return window.CSVLoaderModule.calculateWeightedAverage(data, ['Q47_num']);
}

function getSelectedComparisonItems(mode) {
    if (!window.CSVLoaderModule?.isCSVDataLoaded()) return [];

    const allData      = window.CSVLoaderModule.getCSVData();
    const totalAverage = calculateAverageResponse(allData);

    if (mode === 'roles') {
        const roleSelect = document.getElementById('roles-comparison-select');
        if (!roleSelect?.value?.length) return [];

        return roleSelect.value.map(value => {
            const opt        = window.DataModule.ROLE_OPTIONS.find(o => o.value === value);
            const csvValue   = opt ? opt.csvValue : value;
            const filtered   = allData.filter(row => row.Job_Role === csvValue);
            const count      = Math.round(window.CSVLoaderModule.getWeightedCount(filtered));
            const average    = Math.round(calculateAverageResponse(filtered) * 10) / 10;
            return { displayName: opt ? opt.text : value, csvValue, count, average, totalAverage };
        });
    }

    if (mode === 'location') {
        const locSelect = document.getElementById('locations-comparison-select');
        if (!locSelect?.value?.length) return [];

        return locSelect.value.map(value => {
            const opt      = window.DataModule.LOCATION_OPTIONS.find(o => o.value === value);
            const csvValue = opt ? opt.csvValue : value;
            const filtered = allData.filter(row => row.Location === csvValue);
            const count    = Math.round(window.CSVLoaderModule.getWeightedCount(filtered));
            const average  = Math.round(calculateAverageResponse(filtered) * 10) / 10;
            return { displayName: opt ? opt.text : value, csvValue, count, average, totalAverage };
        });
    }

    if (mode === 'tenure') {
        const tenureSelect = document.getElementById('tenure-comparison-select');
        if (!tenureSelect?.value?.length) return [];

        return tenureSelect.value.map(value => {
            const opt      = window.DataModule.TENURE_OPTIONS.find(o => o.value === value);
            const csvValue = opt ? opt.csvValue : value;
            const filtered = allData.filter(row => row.Tenure === csvValue);
            const count    = Math.round(window.CSVLoaderModule.getWeightedCount(filtered));
            const average  = Math.round(calculateAverageResponse(filtered) * 10) / 10;
            return { displayName: opt ? opt.text : value, csvValue, count, average, totalAverage };
        });
    }

    return [];
}

function getComparisonModeColorClass(value, minValue, maxValue, itemCount) {
    if (itemCount <= 1) return 'score-neutral';
    if (value === maxValue) return 'score-green';
    if (value === minValue) return 'score-red';
    return 'score-neutral';
}

function createComparisonModeKPIHTML(mode, items) {
    if (!items || items.length === 0) {
        const labels = { roles: 'roles', location: 'locations', tenure: 'tenure brackets' };
        return `<div class="kpi-container kpi-comparison-empty">Select ${labels[mode] || 'items'} to see comparison data</div>`;
    }

    const modeLabels = { roles: 'Role', location: 'Location', tenure: 'Tenure' };
    const modeLabel  = modeLabels[mode] || 'Comparison';
    const averages  = items.map(i => i.average);
    const minAvg    = Math.min(...averages);
    const maxAvg    = Math.max(...averages);

    const cardsHTML = items.map(item => `
        <div class="kpi-card kpi-comparison-card">
            <div class="kpi-comparison-header">${item.displayName}</div>
            <div class="kpi-value">${item.count}</div>
            <div class="kpi-label">Responses</div>
            <div class="kpi-value ${getComparisonModeColorClass(item.average, minAvg, maxAvg, items.length)}">${item.average}</div>
            <div class="kpi-label">Avg THRIVE Score<br>(0–100)</div>
        </div>
    `).join('');

    const compactClass = items.length > 4 ? ' kpi-comparison-compact' : '';

    return `
        <div class="kpi-container kpi-comparison-mode">
            <div class="kpi-comparison-title">${modeLabel} Comparison</div>
            <div class="kpi-comparison-cards${compactClass}">
                ${cardsHTML}
            </div>
        </div>
    `;
}

function getCurrentKPIData() {
    if (!window.CSVLoaderModule?.isCSVDataLoaded()) {
        return { totalResponses: 0, averageResponse: 0, satisfactionAvg: 0,
                 filteredResponses: 0, filteredPercent: 0, averageFilteredResponse: 0,
                 filteredSatisfactionAvg: 0, hasFilters: false };
    }

    const allData         = window.CSVLoaderModule.getCSVData();
    const totalResponses  = Math.round(window.CSVLoaderModule.getWeightedCount(allData));
    const averageResponse = calculateAverageResponse(allData);
    const satisfactionAvg = calculateSatisfactionAverage(allData);

    const filters    = window.UtilsModule.getCurrentFiltersForCsv();
    const hasFilters = (filters.roleMode === 'compare' && filters.selectedRoles.length > 0) ||
                       (filters.locationMode === 'compare' && filters.selectedLocations.length > 0) ||
                       (filters.tenureMode === 'compare' && filters.selectedTenures?.length > 0);

    let filteredData            = allData;
    let filteredResponses       = totalResponses;
    let filteredPercent         = 100;
    let averageFilteredResponse = averageResponse;
    let filteredSatisfactionAvg = satisfactionAvg;

    if (hasFilters) {
        filteredData            = window.CSVLoaderModule.getFilteredData(filters);
        filteredResponses       = Math.round(window.CSVLoaderModule.getWeightedCount(filteredData));
        filteredPercent         = totalResponses > 0 ? (filteredResponses / totalResponses) * 100 : 0;
        averageFilteredResponse = calculateAverageResponse(filteredData);
        filteredSatisfactionAvg = calculateSatisfactionAverage(filteredData);
    }

    return {
        totalResponses,
        averageResponse:        Math.round(averageResponse * 10) / 10,
        satisfactionAvg:        Math.round(satisfactionAvg * 10) / 10,
        filteredResponses,
        filteredPercent,
        averageFilteredResponse: Math.round(averageFilteredResponse * 10) / 10,
        filteredSatisfactionAvg: Math.round(filteredSatisfactionAvg * 10) / 10,
        hasFilters,
    };
}

function createKPIHTML(kpiData) {
    const { totalResponses, averageResponse, satisfactionAvg,
            filteredResponses, filteredPercent, averageFilteredResponse,
            filteredSatisfactionAvg, hasFilters } = kpiData;

    if (hasFilters) {
        return `
            <div class="kpi-container kpi-4-column">
                <div class="kpi-group">
                    <div class="kpi-group-header">All Responses</div>
                    <div class="kpi-group-cards">
                        <div class="kpi-card">
                            <div class="kpi-value">${totalResponses}</div>
                            <div class="kpi-label">Responses</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value">${averageResponse}</div>
                            <div class="kpi-label">Avg THRIVE Score<br>(0–100)</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value">${satisfactionAvg}</div>
                            <div class="kpi-label">Avg Job Satisfaction (0–100)</div>
                        </div>
                    </div>
                </div>
                <div class="kpi-group">
                    <div class="kpi-group-header">Filtered Results</div>
                    <div class="kpi-group-cards">
                        <div class="kpi-card">
                            <div class="kpi-value">${filteredResponses}</div>
                            <div class="kpi-label">Responses<br/>(${Math.round(filteredPercent)}% of total)</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value ${getAverageScoreColorClass(averageFilteredResponse, averageResponse)}">${averageFilteredResponse}</div>
                            <div class="kpi-label">Avg THRIVE Score<br>(0–100)</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value ${getAverageScoreColorClass(filteredSatisfactionAvg, satisfactionAvg)}">${filteredSatisfactionAvg}</div>
                            <div class="kpi-label">Avg Job Satisfaction (0–100)</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="kpi-container kpi-2-column">
            <div class="kpi-card">
                <div class="kpi-value">${totalResponses}</div>
                <div class="kpi-label">Responses</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${averageResponse}</div>
                <div class="kpi-label">Avg THRIVE Score<br>(0–100)</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${satisfactionAvg}</div>
                <div class="kpi-label">Avg Job Satisfaction (0–100)</div>
            </div>
        </div>
    `;
}

function updateKPIDisplay() {
    const kpiContainer = document.getElementById('kpi-container');
    if (!kpiContainer) return;

    const mode = getCurrentComparisonMode();

    if (mode === 'roles') {
        kpiContainer.innerHTML = createComparisonModeKPIHTML('roles', getSelectedComparisonItems('roles'));
    } else if (mode === 'location') {
        kpiContainer.innerHTML = createComparisonModeKPIHTML('location', getSelectedComparisonItems('location'));
    } else if (mode === 'tenure') {
        kpiContainer.innerHTML = createComparisonModeKPIHTML('tenure', getSelectedComparisonItems('tenure'));
    } else {
        kpiContainer.innerHTML = createKPIHTML(getCurrentKPIData());
    }

    updateFilterStatus();
}

function formatListWithGrammar(items) {
    if (!items?.length) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(' and ');
    return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

function generateFilterStatusText() {
    const filters = window.UtilsModule.getCurrentFiltersForCsv();
    if (!filters) return '';

    const roleNames   = [];
    const locNames    = [];
    const tenureNames = [];

    filters.selectedRoles?.forEach(csv => {
        const opt = window.DataModule.ROLE_OPTIONS.find(o => o.csvValue === csv);
        if (opt) roleNames.push(opt.text);
    });

    filters.selectedLocations?.forEach(csv => {
        const opt = window.DataModule.LOCATION_OPTIONS.find(o => o.csvValue === csv);
        if (opt) locNames.push(opt.text);
    });

    filters.selectedTenures?.forEach(csv => {
        const opt = window.DataModule.TENURE_OPTIONS.find(o => o.csvValue === csv);
        if (opt) tenureNames.push(opt.text);
    });

    if (!roleNames.length && !locNames.length && !tenureNames.length) return '';

    const parts = [];
    if (roleNames.length)   parts.push(`${formatListWithGrammar(roleNames)} role${roleNames.length > 1 ? 's' : ''}`);
    if (locNames.length)    parts.push(`${formatListWithGrammar(locNames)} location${locNames.length > 1 ? 's' : ''}`);
    if (tenureNames.length) parts.push(`${formatListWithGrammar(tenureNames)} tenure`);

    return `Filtered results show ${parts.join(', ')} only.`;
}

function updateFilterStatus() {
    const container = document.getElementById('filter-status');
    const textEl    = document.getElementById('filter-status-text');
    if (!container || !textEl) return;

    const text = generateFilterStatusText();
    if (text) {
        textEl.textContent = text;
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function initializeKPIDisplay() {
    updateKPIDisplay();
    updateFilterStatus();
}

window.KPIModule = {
    calculateAverageResponse,
    getCurrentKPIData,
    updateKPIDisplay,
    initializeKPIDisplay,
    updateFilterStatus,
    getSelectedComparisonItems,
    getComparisonModeColorClass,
};
