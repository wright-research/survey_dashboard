/**
 * Grouped Averages Module
 * THRIVE component averages table for SteelFab VA survey.
 * Rows = THRIVE components; columns = selected roles / locations / baseline.
 * Conditional formatting: highest = green, lowest = red per row.
 */

const QUESTION_GROUPS = {
    'Trust':                    ['Q25_num', 'Q26_num'],
    'Health':                   ['Q27_num', 'Q28_num'],
    'Relationships':            ['Q30_num', 'Q31_num'],
    'Impact':                   ['Q32_num', 'Q33_num'],
    'Value':                    ['Q34_num', 'Q36_num'],
    'Engagement':               ['Q38_num', 'Q39_num'],
    'Overall Job Satisfaction': ['Q47_num'],
};

let baselineAverages  = {};
let isTableInitialized = false;

function calculateGroupedAverages(data) {
    const result = {};
    Object.keys(QUESTION_GROUPS).forEach(group => {
        result[group] = window.CSVLoaderModule.calculateWeightedAverage(data, QUESTION_GROUPS[group]);
    });
    return result;
}

function getComparisonModeColorClass(value, minValue, maxValue, itemCount) {
    if (itemCount <= 1) return 'score-neutral';
    if (value === maxValue) return 'score-green';
    if (value === minValue) return 'score-red';
    return 'score-neutral';
}

function buildGroupedTableHeader(datasets) {
    const thead = document.getElementById('grouped-averages-thead');
    if (!thead) return;

    while (thead.firstChild) thead.removeChild(thead.firstChild);

    const tr = document.createElement('tr');

    const catTh = document.createElement('th');
    catTh.className   = 'group-header';
    catTh.textContent = 'Category';
    tr.appendChild(catTh);

    datasets.forEach(ds => {
        const th = document.createElement('th');
        th.className   = 'group-header';
        th.textContent = ds.name;
        tr.appendChild(th);
    });

    thead.appendChild(tr);
}

function buildGroupedTableBody(datasets, comparisonMode) {
    const tbody = document.getElementById('grouped-averages-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (datasets.length === 0) {
        const row  = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan   = 2;
        const emptyLabels = { roles: 'roles', location: 'locations', tenure: 'tenure brackets' };
        cell.textContent = `Select ${emptyLabels[comparisonMode] || 'items'} to see comparison data`;
        cell.className = 'empty-state';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    Object.keys(QUESTION_GROUPS).forEach(groupName => {
        const row = document.createElement('tr');
        if (groupName === 'Overall Job Satisfaction') row.classList.add('satisfaction-separator');

        const groupCell = document.createElement('td');
        groupCell.className   = 'dataset-name';
        groupCell.textContent = groupName;
        row.appendChild(groupCell);

        const rowValues = datasets.map(ds => parseFloat(ds.averages[groupName].toFixed(1)));
        const minValue  = Math.min(...rowValues);
        const maxValue  = Math.max(...rowValues);

        datasets.forEach((ds, idx) => {
            const cell         = document.createElement('td');
            cell.className     = 'group-average';
            const value        = ds.averages[groupName];
            const roundedValue = rowValues[idx];
            cell.textContent   = value.toFixed(1);

            if (ds.isFiltered) {
                if (comparisonMode === 'roles' || comparisonMode === 'location' || comparisonMode === 'tenure') {
                    cell.classList.add(getComparisonModeColorClass(roundedValue, minValue, maxValue, datasets.length));
                } else {
                    const baseline = baselineAverages[groupName];
                    if (value > baseline)      cell.classList.add('score-green');
                    else if (value < baseline) cell.classList.add('score-red');
                    else                       cell.classList.add('score-neutral');
                }
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

function updateGroupedAveragesTable(filters = null) {
    if (!window.CSVLoaderModule || !window.CSVLoaderModule.isCSVDataLoaded()) return;

    const allData = window.CSVLoaderModule.getCSVData();
    if (!allData || allData.length === 0) return;

    if (!isTableInitialized) {
        baselineAverages  = calculateGroupedAverages(allData);
        isTableInitialized = true;
    }

    const comparisonMode = window.DrawerModule?.getCurrentComparisonMode?.() || 'baseline';
    let datasets = [];

    if (comparisonMode === 'roles') {
        const selectedRoles = window.KPIModule.getSelectedComparisonItems('roles');
        if (selectedRoles && selectedRoles.length > 0) {
            datasets = selectedRoles.map(rd => ({
                name:       rd.displayName,
                averages:   calculateGroupedAverages(allData.filter(row => row.Job_Role === rd.csvValue)),
                isFiltered: true,
            }));
        }
    } else if (comparisonMode === 'location') {
        const selectedLocations = window.KPIModule.getSelectedComparisonItems('location');
        if (selectedLocations && selectedLocations.length > 0) {
            datasets = selectedLocations.map(ld => ({
                name:       ld.displayName,
                averages:   calculateGroupedAverages(allData.filter(row => row.Location === ld.csvValue)),
                isFiltered: true,
            }));
        }
    } else if (comparisonMode === 'tenure') {
        const selectedTenures = window.KPIModule.getSelectedComparisonItems('tenure');
        if (selectedTenures && selectedTenures.length > 0) {
            datasets = selectedTenures.map(td => ({
                name:       td.displayName,
                averages:   calculateGroupedAverages(allData.filter(row => row.Tenure === td.csvValue)),
                isFiltered: true,
            }));
        }
    } else {
        datasets.push({ name: 'All Responses', averages: baselineAverages, isFiltered: false });

        const hasFilters = filters && (
            (filters.roleMode === 'compare' && filters.selectedRoles?.length > 0) ||
            (filters.locationMode === 'compare' && filters.selectedLocations?.length > 0) ||
            (filters.tenureMode === 'compare' && filters.selectedTenures?.length > 0)
        );

        if (hasFilters) {
            const filteredData = window.CSVLoaderModule.getFilteredData(filters);
            if (filteredData.length > 0) {
                datasets.push({
                    name:       'Filtered Results',
                    averages:   calculateGroupedAverages(filteredData),
                    isFiltered: true,
                });
            }
        }
    }

    const subtitle = document.getElementById('grouped-averages-subtitle');
    if (subtitle) {
        if (comparisonMode === 'baseline') {
            subtitle.textContent = 'Scores are on a 0–100 scale. Conditional formatting of filtered results relative to company baseline.';
        } else {
            subtitle.textContent = datasets.length >= 3
                ? 'Scores are on a 0–100 scale. Green = highest, red = lowest per row. Black = middle values.'
                : 'Scores are on a 0–100 scale. Green = highest, red = lowest per row.';
        }
        subtitle.classList.remove('hidden');
    }

    buildGroupedTableHeader(datasets);
    buildGroupedTableBody(datasets, comparisonMode);

    // On mobile, widen the table when extra score columns are present so it scrolls
    const table = document.getElementById('grouped-averages-table');
    if (table) {
        const scoreColumns = datasets.length;
        if (scoreColumns > 1 && window.innerWidth <= 768) {
            table.style.width = (100 + (scoreColumns - 1) * 20) + '%';
        } else {
            table.style.width = '';
        }
    }
}

function initializeGroupedAveragesTable() {
    updateGroupedAveragesTable();
}

window.updateGroupedAveragesTable     = updateGroupedAveragesTable;
window.initializeGroupedAveragesTable = initializeGroupedAveragesTable;
window.calculateGroupedAverages       = calculateGroupedAverages;
window.QUESTION_GROUPS                = QUESTION_GROUPS;
