/**
 * App Module - Main Application Coordinator
 * Initializes all modules in the correct sequence.
 */

async function initializeApp() {
    try {
        // 1. Set up drawer (must be first — other modules call DrawerModule)
        if (window.DrawerModule) {
            window.DrawerModule.setupDrawerAll();
        }

        // 2. Load CSV data
        await window.CSVLoaderModule.initializeCSVLoader();

        // 3. Initialize display modules
        if (window.KPIModule)                         window.KPIModule.initializeKPIDisplay();
        if (window.initializeGroupedAveragesTable)     window.initializeGroupedAveragesTable();
        if (window.initializeIndividualQuestionsTable) window.initializeIndividualQuestionsTable();
        if (window.charts)                             window.charts.initializeCharts();

        // 4. Set up Shoelace-dependent filters
        if (window.UtilsModule) {
            await window.UtilsModule.waitForShoelace();
        }

        if (window.FiltersModule) {
            window.FiltersModule.setupRadioSelectFunctionality();
        }

        // 5. Scroll effects
        if (window.ScrollEffectsModule) {
            window.ScrollEffectsModule.init();
        }

        setupKeyboardShortcuts();
        setupDevelopmentHelpers();

    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const drawer = document.getElementById('survey-drawer');
            if (drawer) {
                window.DrawerModule?.isDrawerCurrentlyOpen?.() ? drawer.hide() : drawer.show();
            }
        }
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            window.FiltersModule?.resetFilters?.();
        }
    });
}

function setupDevelopmentHelpers() {
    window.SurveyApp = {
        getFilters:       () => window.FiltersModule?.getCurrentFilterState?.(),
        getFiltersForCsv: () => window.UtilsModule?.getCurrentFiltersForCsv?.(),
        resetFilters:     () => window.FiltersModule?.resetFilters?.(),
        modules: {
            data:     window.DataModule,
            csv:      window.CSVLoaderModule,
            kpis:     window.KPIModule,
            filters:  window.FiltersModule,
            drawer:   window.DrawerModule,
            charts:   window.charts,
        },
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(console.error);
});

window.AppModule = { initializeApp };
