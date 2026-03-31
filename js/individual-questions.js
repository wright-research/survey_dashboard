/**
 * Individual Questions Module
 * Displays the 12 THRIVE question averages in a table.
 * Columns are dynamic based on the active comparison mode.
 */

// The 12 THRIVE questions for SteelFab VA (satisfaction shown in grouped-averages)
const THRIVE_QUESTIONS = [
    { category: 'Trust',         col: 'Q25_num', text: 'I trust my leaders at the shop.' },
    { category: 'Trust',         col: 'Q26_num', text: 'I trust my co-workers.' },
    { category: 'Health',        col: 'Q27_num', text: 'I often feel anxious or stressed at work.*' },
    { category: 'Health',        col: 'Q28_num', text: 'I often feel overwhelmed at work.*' },
    { category: 'Relationships', col: 'Q30_num', text: 'I feel known at work.' },
    { category: 'Relationships', col: 'Q31_num', text: 'I am satisfied with the ways we prioritize safety at SteelFab and make sure to watch out for one another.' },
    { category: 'Impact',        col: 'Q32_num', text: "I am motivated by SteelFab's values and the direction of the company." },
    { category: 'Impact',        col: 'Q33_num', text: 'I am satisfied by the level of training and feedback I am receiving to improve the quality of my work.' },
    { category: 'Value',         col: 'Q34_num', text: 'I regularly receive recognition or praise for doing good work.' },
    { category: 'Value',         col: 'Q36_num', text: "I am satisfied with SteelFab's compensation and wages." },
    { category: 'Engagement',    col: 'Q38_num', text: 'I have been given opportunities to learn and grow in my work at SteelFab.' },
    { category: 'Engagement',    col: 'Q39_num', text: 'I feel like I have been supplied with everything I need to be successful in my job at SteelFab.' },
];

// Category order for alternating group shading (even index = shaded)
const CATEGORY_ORDER = ['Trust', 'Health', 'Relationships', 'Impact', 'Value', 'Engagement'];

let baselineQuestionAverages = {};
let isQTableInitialized      = false;

function calculateQuestionAverage(data, col) {
    return window.CSVLoaderModule.calculateWeightedAverage(data, [col]);
}

function calculateAllQuestionAverages(data) {
    const result = {};
    THRIVE_QUESTIONS.forEach(q => {
        result[q.col] = calculateQuestionAverage(data, q.col);
    });
    return result;
}

function getScoreColorClass(value, comparisonValue, mode, minVal, maxVal, itemCount) {
    if (mode === 'roles' || mode === 'location' || mode === 'tenure') {
        if (itemCount <= 1) return 'score-neutral';
        if (value === maxVal) return 'score-green';
        if (value === minVal) return 'score-red';
        return 'score-neutral';
    }
    // Baseline mode: compare filtered vs overall
    if (value > comparisonValue)      return 'score-green';
    if (value < comparisonValue)      return 'score-red';
    return 'score-neutral';
}

function buildTableHeader(datasets) {
    const thead = document.getElementById('individual-questions-thead');
    if (!thead) return;

    while (thead.firstChild) thead.removeChild(thead.firstChild);

    const tr = document.createElement('tr');

    ['Category', 'Question'].forEach(label => {
        const th = document.createElement('th');
        th.className   = 'question-header';
        th.textContent = label;
        tr.appendChild(th);
    });

    datasets.forEach(ds => {
        const th = document.createElement('th');
        th.className   = 'question-header';
        th.textContent = ds.name;
        tr.appendChild(th);
    });

    thead.appendChild(tr);
}

function buildTableBody(datasets, comparisonMode) {
    const tbody = document.getElementById('individual-questions-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (datasets.length === 0) {
        const row  = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan     = 3;
        const emptyLabels = { roles: 'roles', location: 'locations', tenure: 'tenure brackets' };
        cell.textContent = `Select ${emptyLabels[comparisonMode] || 'items'} to see comparison data`;
        cell.className   = 'empty-state';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    THRIVE_QUESTIONS.forEach((q, qIndex) => {
        const row = document.createElement('tr');

        // Alternating group shading based on category index
        const groupIndex  = CATEGORY_ORDER.indexOf(q.category);
        const shadedClass = groupIndex % 2 === 0 ? ' category-group-shaded' : '';
        row.className     = 'category-group' + shadedClass;

        // Category cell — use rowspan to merge cells for questions in the same category
        const isFirstInGroup = qIndex === 0 || THRIVE_QUESTIONS[qIndex - 1].category !== q.category;
        if (isFirstInGroup) {
            const categoryCell = document.createElement('td');
            categoryCell.className   = 'question-category';
            categoryCell.textContent = q.category;
            // Count how many consecutive questions share this category
            let span = 1;
            while (qIndex + span < THRIVE_QUESTIONS.length && THRIVE_QUESTIONS[qIndex + span].category === q.category) {
                span++;
            }
            if (span > 1) categoryCell.rowSpan = span;
            row.appendChild(categoryCell);
        }

        // Question text cell
        const questionCell = document.createElement('td');
        questionCell.className   = 'question-text';
        questionCell.textContent = q.text;
        row.appendChild(questionCell);

        // Score cells
        const rowValues = datasets.map(ds => ds.averages[q.col]);
        const minVal    = Math.min(...rowValues);
        const maxVal    = Math.max(...rowValues);

        datasets.forEach((ds, idx) => {
            const cell  = document.createElement('td');
            cell.className = 'question-score';
            const value = ds.averages[q.col];
            cell.textContent = value.toFixed(1);

            if (ds.isFiltered) {
                const baselineVal = datasets[0].averages[q.col];
                cell.classList.add(
                    getScoreColorClass(value, baselineVal, comparisonMode, minVal, maxVal, datasets.length)
                );
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

function updateIndividualQuestionsTable(filters = null) {
    if (!window.CSVLoaderModule || !window.CSVLoaderModule.isCSVDataLoaded()) return;

    const allData = window.CSVLoaderModule.getCSVData();
    if (!allData || allData.length === 0) return;

    if (!isQTableInitialized) {
        baselineQuestionAverages = calculateAllQuestionAverages(allData);
        isQTableInitialized      = true;
    }

    const comparisonMode = window.DrawerModule?.getCurrentComparisonMode?.() || 'baseline';
    let datasets = [];

    if (comparisonMode === 'roles') {
        const selectedRoles = window.KPIModule.getSelectedComparisonItems('roles');
        if (selectedRoles && selectedRoles.length > 0) {
            datasets = selectedRoles.map(rd => ({
                name:       rd.displayName,
                averages:   calculateAllQuestionAverages(allData.filter(row => row.Job_Role === rd.csvValue)),
                isFiltered: true,
            }));
        }
    } else if (comparisonMode === 'location') {
        const selectedLocations = window.KPIModule.getSelectedComparisonItems('location');
        if (selectedLocations && selectedLocations.length > 0) {
            datasets = selectedLocations.map(ld => ({
                name:       ld.displayName,
                averages:   calculateAllQuestionAverages(allData.filter(row => row.Location === ld.csvValue)),
                isFiltered: true,
            }));
        }
    } else if (comparisonMode === 'tenure') {
        const selectedTenures = window.KPIModule.getSelectedComparisonItems('tenure');
        if (selectedTenures && selectedTenures.length > 0) {
            datasets = selectedTenures.map(td => ({
                name:       td.displayName,
                averages:   calculateAllQuestionAverages(allData.filter(row => row.Tenure === td.csvValue)),
                isFiltered: true,
            }));
        }
    } else {
        datasets.push({ name: 'All Responses', averages: baselineQuestionAverages, isFiltered: false });

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
                    averages:   calculateAllQuestionAverages(filteredData),
                    isFiltered: true,
                });
            }
        }
    }

    const subtitle = document.getElementById('individual-questions-subtitle');
    if (subtitle) {
        if (comparisonMode === 'baseline') {
            subtitle.textContent = 'Average scores (0–100) for each of the 12 THRIVE survey questions.';
        } else {
            subtitle.textContent = datasets.length >= 3
                ? 'Scores are on a 0–100 scale. Green = highest, red = lowest per row. Black = middle values.'
                : 'Scores are on a 0–100 scale. Green = highest, red = lowest per row.';
        }
    }

    buildTableHeader(datasets);
    buildTableBody(datasets, comparisonMode);

    // On mobile, widen the table when extra score columns are present so it scrolls
    const table = document.getElementById('individual-questions-table');
    if (table) {
        const scoreColumns = datasets.length;
        if (scoreColumns > 1 && window.innerWidth <= 768) {
            // Each extra score column adds ~20% width
            table.style.width = (100 + (scoreColumns - 1) * 20) + '%';
        } else {
            table.style.width = '';
        }
    }

    // Add reverse-scored footnote if not already present
    const container = document.querySelector('.individual-questions-container');
    if (container && !document.getElementById('reverse-scored-footnote')) {
        const footnote = document.createElement('p');
        footnote.id = 'reverse-scored-footnote';
        footnote.className = 'reverse-scored-footnote';
        footnote.textContent = '* Reverse scored: For these questions, a higher score means less anxiety or stress — the original scale is flipped so that higher is always better.';
        container.appendChild(footnote);
    }
}

function initializeIndividualQuestionsTable() {
    updateIndividualQuestionsTable();
}

window.updateIndividualQuestionsTable     = updateIndividualQuestionsTable;
window.initializeIndividualQuestionsTable = initializeIndividualQuestionsTable;
