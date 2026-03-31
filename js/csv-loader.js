/**
 * CSV Loader Module - CSV Data Loading with Role Weight Support
 * Loads and parses survey-results.csv; all averages and counts are
 * weighted by Role_Weight to handle multi-role respondents correctly.
 */

let csvData      = null;
let isDataLoaded = false;

async function loadCSVData() {
    try {
        const response = await fetch('data/survey-results.csv');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const csvText = await response.text();
        csvData       = parseCSV(csvText);
        isDataLoaded  = true;

        if (window.DataModule) {
            window.DataModule.csvData = csvData;
            if (window.DataModule.buildLookupTables) {
                window.DataModule.buildLookupTables(csvData);
            }
        }

        return csvData;
    } catch (error) {
        console.error('Error loading CSV data:', error);
        throw error;
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const data    = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((h, idx) => { row[h] = values[idx]; });
            data.push(row);
        }
    }

    return data;
}

function parseCSVLine(line) {
    const values  = [];
    let current   = '';
    let inQuotes  = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

function getCSVData()       { return csvData; }
function isCSVDataLoaded()  { return isDataLoaded; }

/**
 * Calculate weighted average for a set of numeric columns.
 * Uses Role_Weight so multi-role respondents (expanded into N rows)
 * each contribute 1/N rather than a full response per row.
 */
function calculateWeightedAverage(data, columns) {
    let weightedSum  = 0;
    let totalWeight  = 0;

    data.forEach(row => {
        const weight = parseFloat(row.Role_Weight) || 1;
        columns.forEach(col => {
            const value = parseFloat(row[col]);
            if (!isNaN(value)) {
                weightedSum += value * weight;
                totalWeight += weight;
            }
        });
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Sum of Role_Weight values — represents effective respondent count.
 */
function getWeightedCount(data) {
    return data.reduce((sum, row) => sum + (parseFloat(row.Role_Weight) || 1), 0);
}

/**
 * Number of unique respondents regardless of row expansion.
 */
function getUniqueRespondentCount(data) {
    return new Set(data.map(row => row.Respondent_ID)).size;
}

/**
 * Filter data by role, location, and/or tenure.
 */
function getFilteredData(filters) {
    if (!csvData) return [];

    let data = [...csvData];

    if (filters.roleMode === 'compare' && filters.selectedRoles.length > 0) {
        data = data.filter(row => filters.selectedRoles.includes(row.Job_Role));
    }

    if (filters.locationMode === 'compare' && filters.selectedLocations.length > 0) {
        data = data.filter(row => filters.selectedLocations.includes(row.Location));
    }

    if (filters.tenureMode === 'compare' && filters.selectedTenures && filters.selectedTenures.length > 0) {
        data = data.filter(row => filters.selectedTenures.includes(row.Tenure));
    }

    return data;
}

async function initializeCSVLoader() {
    try {
        await loadCSVData();
    } catch (error) {
        console.error('Error initializing CSV loader:', error);
        throw error;
    }
}

window.CSVLoaderModule = {
    loadCSVData,
    getCSVData,
    isCSVDataLoaded,
    getFilteredData,
    initializeCSVLoader,
    calculateWeightedAverage,
    getWeightedCount,
    getUniqueRespondentCount,
};
