/**
 * Utils Module - Utility Functions
 */

function waitForShoelace() {
    return new Promise((resolve, reject) => {
        Promise.all([
            customElements.whenDefined('sl-radio-group'),
            customElements.whenDefined('sl-select'),
            customElements.whenDefined('sl-radio-button'),
            customElements.whenDefined('sl-option'),
            customElements.whenDefined('sl-checkbox'),
        ]).then(() => {
            setTimeout(resolve, 200);
        }).catch(reject);

        setTimeout(resolve, 5000); // fallback
    });
}

function convertRoleIdsToCsvValues(roleIds) {
    const roleSelect = document.getElementById('role-select');
    if (!roleSelect) return [];
    return roleIds.map(id => {
        const option = roleSelect.querySelector(`sl-option[value="${id}"]`);
        return option ? option.dataset.csvValue : id;
    });
}

function convertLocationIdsToCsvValues(locationIds) {
    const locationSelect = document.getElementById('location-select');
    if (!locationSelect) return [];
    return locationIds.map(id => {
        const option = locationSelect.querySelector(`sl-option[value="${id}"]`);
        return option ? option.dataset.csvValue : id;
    });
}

function getCheckedTenureCsvValues() {
    const checkboxes = document.querySelectorAll('.tenure-checkbox');
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
}

function getCurrentFiltersForCsv() {
    const roleRadioGroup     = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const tenureRadioGroup   = document.getElementById('tenure-radio-group');
    const roleSelect         = document.getElementById('role-select');
    const locationSelect     = document.getElementById('location-select');

    const filters = {
        roleMode:       roleRadioGroup     ? roleRadioGroup.value     : 'all',
        locationMode:   locationRadioGroup ? locationRadioGroup.value : 'all',
        tenureMode:     tenureRadioGroup   ? tenureRadioGroup.value   : 'all',
        selectedRoles:      [],
        selectedLocations:  [],
        selectedTenures:    [],
    };

    if (filters.roleMode === 'compare' && roleSelect?.value) {
        filters.selectedRoles = convertRoleIdsToCsvValues(
            Array.isArray(roleSelect.value) ? roleSelect.value : [roleSelect.value]
        );
    }

    if (filters.locationMode === 'compare' && locationSelect?.value) {
        filters.selectedLocations = convertLocationIdsToCsvValues(
            Array.isArray(locationSelect.value) ? locationSelect.value : [locationSelect.value]
        );
    }

    if (filters.tenureMode === 'compare') {
        filters.selectedTenures = getCheckedTenureCsvValues();
    }

    return filters;
}

window.UtilsModule = {
    waitForShoelace,
    convertRoleIdsToCsvValues,
    convertLocationIdsToCsvValues,
    getCheckedTenureCsvValues,
    getCurrentFiltersForCsv,
};
