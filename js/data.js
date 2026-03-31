/**
 * Data Module - Role, Location, and Tenure Data Management
 * Contains all data definitions and population functions for SteelFab VA Survey
 */

const ROLE_OPTIONS = [
    { value: 'crane-operator',        text: 'Crane Operator',        csvValue: 'Crane operator' },
    { value: 'detail-coordinator',    text: 'Detail Coordinator',    csvValue: 'Detail coordinator' },
    { value: 'fitter',                text: 'Fitter',                csvValue: 'Fitter' },
    { value: 'forklift-operator',     text: 'Forklift Operator',     csvValue: 'Forklift operator' },
    { value: 'leadperson-supervisor', text: 'Leadperson/Supervisor', csvValue: 'Leadperson/Supervisor' },
    { value: 'machine-operator',      text: 'Machine Operator',      csvValue: 'Machine operator' },
    { value: 'maintenance',           text: 'Maintenance',           csvValue: 'Maintenance' },
    { value: 'painter',               text: 'Painter',               csvValue: 'Painter' },
    { value: 'parts-puller',          text: 'Parts Puller',          csvValue: 'Parts Puller' },
    { value: 'programmer',            text: 'Programmer',            csvValue: 'Programmer' },
    { value: 'quality-control',       text: 'Quality Control',       csvValue: 'Quality control' },
    { value: 'welder',                text: 'Welder',                csvValue: 'Welder' },
    { value: 'other',                 text: 'Other',                 csvValue: 'Other' },
];

const LOCATION_OPTIONS = [
    { value: 'atlanta', text: 'Atlanta', csvValue: 'Atlanta' },
    { value: 'birmingham', text: 'Birmingham', csvValue: 'Birmingham' },
    { value: 'charlotte', text: 'Charlotte', csvValue: 'Charlotte' },
    { value: 'greenville', text: 'Greenville', csvValue: 'Greenville' },
];

const TENURE_OPTIONS = [
    { value: 'less-than-1',  text: 'Less than 1 year', csvValue: 'Less than 1 year' },
    { value: '1-3-years',    text: '1–3 years',         csvValue: '1-3 years' },
    { value: '4-6-years',    text: '4–6 years',         csvValue: '4-6 years' },
    { value: '7-plus-years', text: '7+ years',          csvValue: '7+ years' },
];

/**
 * Lookup tables for bidirectional role ↔ location filtering
 */
let roleToLocations = {};
let locationToRoles = {};

function buildLookupTables(csvData) {
    roleToLocations = {};
    locationToRoles = {};

    if (!csvData || csvData.length === 0) return;

    csvData.forEach(row => {
        const role     = row.Job_Role;
        const location = row.Location;
        if (!role || !location) return;

        if (!roleToLocations[role]) roleToLocations[role] = new Set();
        roleToLocations[role].add(location);

        if (!locationToRoles[location]) locationToRoles[location] = new Set();
        locationToRoles[location].add(role);
    });

    Object.keys(roleToLocations).forEach(r => {
        roleToLocations[r] = Array.from(roleToLocations[r]);
    });
    Object.keys(locationToRoles).forEach(l => {
        locationToRoles[l] = Array.from(locationToRoles[l]);
    });
}

function getAvailableLocationsForRoles(selectedRoles) {
    if (!selectedRoles || selectedRoles.length === 0) {
        return LOCATION_OPTIONS.map(o => o.csvValue);
    }
    let available = null;
    selectedRoles.forEach(role => {
        const locs = roleToLocations[role] || [];
        available = available === null ? [...locs] : available.filter(l => locs.includes(l));
    });
    return available || [];
}

function getAvailableRolesForLocations(selectedLocations) {
    if (!selectedLocations || selectedLocations.length === 0) {
        return ROLE_OPTIONS.map(o => o.csvValue);
    }
    let available = null;
    selectedLocations.forEach(loc => {
        const roles = locationToRoles[loc] || [];
        available = available === null ? [...roles] : available.filter(r => roles.includes(r));
    });
    return available || [];
}

function clearSelectOptions(selectElement) {
    selectElement.querySelectorAll('sl-option').forEach(o => o.remove());
}

function populateRoleOptions(selectElement, selectedLocations = []) {
    const available = getAvailableRolesForLocations(selectedLocations);
    const filtered  = ROLE_OPTIONS.filter(o => available.includes(o.csvValue));
    selectElement.innerHTML = filtered.length
        ? filtered.map(o => `<sl-option value="${o.value}" data-csv-value="${o.csvValue}">${o.text}</sl-option>`).join('')
        : '<sl-option value="" disabled>No roles available</sl-option>';
}

function populateLocationOptions(selectElement, selectedRoles = []) {
    const existingValue = selectElement.value;
    const available     = getAvailableLocationsForRoles(selectedRoles);
    const filtered      = LOCATION_OPTIONS.filter(o => available.includes(o.csvValue));

    selectElement.innerHTML = filtered.length
        ? filtered.map(o => `<sl-option value="${o.value}" data-csv-value="${o.csvValue}">${o.text}</sl-option>`).join('')
        : '<sl-option value="" disabled>No locations available</sl-option>';

    if (existingValue && filtered.length) {
        const stillAvailable = filtered.some(o => o.value === existingValue);
        if (stillAvailable) {
            setTimeout(() => { selectElement.value = [existingValue]; }, 50);
        }
    }
}

/**
 * Get filtered data based on current filter state (role, location, tenure)
 */
function getFilteredData() {
    if (!window.DataModule.csvData) return [];

    const filters = window.FiltersModule?.getCurrentFilterState() || {
        roleMode: 'all', locationMode: 'all', tenureMode: 'all',
        selectedRoles: [], selectedLocations: [], selectedTenures: []
    };

    let data = [...window.DataModule.csvData];

    if (filters.roleMode === 'compare' && filters.selectedRoles.length > 0) {
        const csvValues = filters.selectedRoles.map(v => {
            const opt = ROLE_OPTIONS.find(o => o.value === v);
            return opt ? opt.csvValue : null;
        }).filter(Boolean);
        data = data.filter(row => csvValues.includes(row.Job_Role));
    }

    if (filters.locationMode === 'compare' && filters.selectedLocations.length > 0) {
        const csvValues = filters.selectedLocations.map(v => {
            const opt = LOCATION_OPTIONS.find(o => o.value === v);
            return opt ? opt.csvValue : null;
        }).filter(Boolean);
        data = data.filter(row => csvValues.includes(row.Location));
    }

    if (filters.tenureMode === 'compare' && filters.selectedTenures.length > 0) {
        const csvValues = filters.selectedTenures.map(v => {
            const opt = TENURE_OPTIONS.find(o => o.value === v);
            return opt ? opt.csvValue : null;
        }).filter(Boolean);
        data = data.filter(row => csvValues.includes(row.Tenure));
    }

    return data;
}

window.DataModule = {
    ROLE_OPTIONS,
    LOCATION_OPTIONS,
    TENURE_OPTIONS,
    populateRoleOptions,
    populateLocationOptions,
    clearSelectOptions,
    buildLookupTables,
    getAvailableLocationsForRoles,
    getAvailableRolesForLocations,
    getFilteredData,
    csvData: null,
};
