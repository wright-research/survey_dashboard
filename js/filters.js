/**
 * Filters Module - Radio Button, Select, and Tenure Checkbox Functionality
 */

let radioFunctionalitySetup = false;

function updateKPIsAndCharts() {
    if (window.KPIModule) window.KPIModule.updateKPIDisplay();

    const currentFilters = window.UtilsModule.getCurrentFiltersForCsv();

    if (window.updateGroupedAveragesTable)     window.updateGroupedAveragesTable(currentFilters);
    if (window.updateIndividualQuestionsTable) window.updateIndividualQuestionsTable(currentFilters);
    if (window.charts)                         window.charts.updateCharts();
}

function getSelectedCsvValues(selectElement) {
    const selected = selectElement.value || [];
    return selected.map(value => {
        const option = selectElement.querySelector(`sl-option[value="${value}"]`);
        return option ? option.getAttribute('data-csv-value') : null;
    }).filter(Boolean);
}

function updateFilterLabelState(labelId, radioValue) {
    const label = document.getElementById(labelId);
    if (!label) return;
    label.classList.toggle('active', radioValue === 'compare');
    label.classList.toggle('inactive', radioValue !== 'compare');
}

function initializeFilterLabelStates() {
    ['role-radio-group', 'location-radio-group', 'tenure-radio-group'].forEach(id => {
        const group = document.getElementById(id);
        const labelId = id.replace('-radio-group', '-label');
        if (group) updateFilterLabelState(labelId, group.value);
    });
}

function updateLocationOptionsBasedOnRoles(selectedRoles) {
    const locationSelect = document.getElementById('location-select');
    if (!locationSelect) return;

    const current = locationSelect.value;
    window.DataModule.populateLocationOptions(locationSelect, selectedRoles);

    setTimeout(() => {
        if (Array.isArray(current) && current.length > 0) {
            const available   = Array.from(locationSelect.querySelectorAll('sl-option')).map(o => o.value);
            const stillValid  = current.filter(v => available.includes(v));
            locationSelect.value = stillValid.length > 0 ? stillValid : [];
        }
        updateKPIsAndCharts();
    }, 100);
}

function updateRoleOptionsBasedOnLocations(selectedLocations) {
    const roleSelect = document.getElementById('role-select');
    if (!roleSelect) return;

    const current = roleSelect.value;
    window.DataModule.populateRoleOptions(roleSelect, selectedLocations);

    setTimeout(() => {
        if (Array.isArray(current) && current.length > 0) {
            const available  = Array.from(roleSelect.querySelectorAll('sl-option')).map(o => o.value);
            const stillValid = current.filter(v => available.includes(v));
            roleSelect.value = stillValid.length > 0 ? stillValid : [];
        }
        updateKPIsAndCharts();
    }, 100);
}

function setupRadioSelectFunctionality() {
    if (radioFunctionalitySetup) return;

    const roleRadioGroup     = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const tenureRadioGroup   = document.getElementById('tenure-radio-group');
    const roleSelect         = document.getElementById('role-select');
    const locationSelect     = document.getElementById('location-select');
    const tenureSection      = document.getElementById('tenure-checkboxes-section');

    // ── Role radio ────────────────────────────────────────────────────────────
    if (roleRadioGroup && roleSelect) {
        roleRadioGroup.addEventListener('sl-change', () => {
            const val = roleRadioGroup.value;
            updateFilterLabelState('role-label', val);

            if (val === 'compare') {
                roleSelect.removeAttribute('disabled');
                const selectedLocs = locationSelect && !locationSelect.hasAttribute('disabled')
                    ? getSelectedCsvValues(locationSelect) : [];
                window.DataModule.populateRoleOptions(roleSelect, selectedLocs);
                setTimeout(updateKPIsAndCharts, 200);
            } else {
                roleSelect.setAttribute('disabled', '');
                roleSelect.value = [];
                window.DataModule.clearSelectOptions(roleSelect);
                if (locationSelect && !locationSelect.hasAttribute('disabled')) {
                    updateLocationOptionsBasedOnRoles([]);
                }
                updateKPIsAndCharts();
            }
        });

        roleSelect.addEventListener('sl-change', () => {
            updateLocationOptionsBasedOnRoles(getSelectedCsvValues(roleSelect));
            updateKPIsAndCharts();
        });
    }

    // ── Location radio ────────────────────────────────────────────────────────
    if (locationRadioGroup && locationSelect) {
        locationRadioGroup.addEventListener('sl-change', () => {
            const val = locationRadioGroup.value;
            updateFilterLabelState('location-label', val);

            if (val === 'compare') {
                locationSelect.removeAttribute('disabled');
                const selectedRoles = roleSelect && !roleSelect.hasAttribute('disabled')
                    ? getSelectedCsvValues(roleSelect) : [];
                window.DataModule.populateLocationOptions(locationSelect, selectedRoles);
                setTimeout(updateKPIsAndCharts, 200);
            } else {
                locationSelect.setAttribute('disabled', '');
                locationSelect.value = [];
                window.DataModule.clearSelectOptions(locationSelect);
                if (roleSelect && !roleSelect.hasAttribute('disabled')) {
                    updateRoleOptionsBasedOnLocations([]);
                }
                updateKPIsAndCharts();
            }
        });

        locationSelect.addEventListener('sl-change', () => {
            updateRoleOptionsBasedOnLocations(getSelectedCsvValues(locationSelect));
            updateKPIsAndCharts();
        });
    }

    // ── Tenure radio + checkboxes ─────────────────────────────────────────────
    if (tenureRadioGroup && tenureSection) {
        tenureRadioGroup.addEventListener('sl-change', () => {
            const val = tenureRadioGroup.value;
            updateFilterLabelState('tenure-label', val);

            if (val === 'compare') {
                tenureSection.classList.remove('hidden');
            } else {
                tenureSection.classList.add('hidden');
                tenureSection.querySelectorAll('.tenure-checkbox').forEach(cb => { cb.checked = false; });
            }
            updateKPIsAndCharts();
        });

        tenureSection.querySelectorAll('.tenure-checkbox').forEach(cb => {
            cb.addEventListener('sl-change', updateKPIsAndCharts);
        });
    }

    // ── Prevent select dropdowns from interfering with drawer ─────────────────
    [roleSelect, locationSelect].filter(Boolean).forEach(setupSelectEventHandlers);

    initializeFilterLabelStates();
    checkAndTriggerHtmlDefaults();

    radioFunctionalitySetup = true;
}

function setupSelectEventHandlers(selectElement) {
    if (!selectElement) return;
    ['sl-show', 'sl-hide', 'sl-after-show', 'sl-after-hide', 'sl-focus', 'sl-blur'].forEach(evt => {
        selectElement.addEventListener(evt, e => e.stopPropagation());
    });
}

function getCurrentFilterState() {
    const roleRadioGroup     = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const tenureRadioGroup   = document.getElementById('tenure-radio-group');
    const roleSelect         = document.getElementById('role-select');
    const locationSelect     = document.getElementById('location-select');

    return {
        roleMode:     roleRadioGroup     ? roleRadioGroup.value     : 'all',
        locationMode: locationRadioGroup ? locationRadioGroup.value : 'all',
        tenureMode:   tenureRadioGroup   ? tenureRadioGroup.value   : 'all',
        selectedRoles: roleSelect?.value
            ? (Array.isArray(roleSelect.value) ? roleSelect.value : [roleSelect.value]) : [],
        selectedLocations: locationSelect?.value
            ? (Array.isArray(locationSelect.value) ? locationSelect.value : [locationSelect.value]) : [],
        selectedTenures: window.UtilsModule.getCheckedTenureCsvValues(),
    };
}

function resetFilters() {
    const roleRadioGroup     = document.getElementById('role-radio-group');
    const locationRadioGroup = document.getElementById('location-radio-group');
    const tenureRadioGroup   = document.getElementById('tenure-radio-group');
    const roleSelect         = document.getElementById('role-select');
    const locationSelect     = document.getElementById('location-select');
    const tenureSection      = document.getElementById('tenure-checkboxes-section');

    if (roleRadioGroup)     roleRadioGroup.value     = 'all';
    if (locationRadioGroup) locationRadioGroup.value = 'all';
    if (tenureRadioGroup)   tenureRadioGroup.value   = 'all';

    if (roleSelect) {
        roleSelect.value = [];
        roleSelect.setAttribute('disabled', '');
        window.DataModule.clearSelectOptions(roleSelect);
    }
    if (locationSelect) {
        locationSelect.value = [];
        locationSelect.setAttribute('disabled', '');
        window.DataModule.clearSelectOptions(locationSelect);
    }
    if (tenureSection) {
        tenureSection.classList.add('hidden');
        tenureSection.querySelectorAll('.tenure-checkbox').forEach(cb => { cb.checked = false; });
    }

    updateFilterLabelState('role-label', 'all');
    updateFilterLabelState('location-label', 'all');
    updateFilterLabelState('tenure-label', 'all');

    updateKPIsAndCharts();
}

function checkAndTriggerHtmlDefaults() {
    setTimeout(() => {
        const roleRadioGroup     = document.getElementById('role-radio-group');
        const locationRadioGroup = document.getElementById('location-radio-group');
        const roleSelect         = document.getElementById('role-select');
        const locationSelect     = document.getElementById('location-select');
        let shouldUpdate = false;

        if (locationRadioGroup?.value === 'compare') {
            window.DataModule.populateLocationOptions(locationSelect, []);
            shouldUpdate = true;
        }
        if (roleRadioGroup?.value === 'compare') {
            window.DataModule.populateRoleOptions(roleSelect, []);
            shouldUpdate = true;
        }
        if (shouldUpdate) setTimeout(updateKPIsAndCharts, 200);
    }, 100);
}

window.FiltersModule = {
    setupRadioSelectFunctionality,
    getCurrentFilterState,
    resetFilters,
};
