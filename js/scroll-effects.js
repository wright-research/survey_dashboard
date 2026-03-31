/**
 * Scroll Effects Module - Handles scroll-based UI transformations
 * Desktop: Transitions from full button to circular chevron button
 * Mobile: Static chevron button, no scroll effects
 */

class ScrollEffects {
    constructor() {
        this.scrollThreshold = 120;
        this.isCompact = false;
        this.ticking = false;
        this.scrollListenerAdded = false;

        this.init();
    }

    init() {
        this.setupScrollEffects();

        window.addEventListener('resize', () => {
            this.setupScrollEffects();
        });
    }

    setupScrollEffects() {
        if (this.isMobile()) {
            const button = document.getElementById('survey-filters-btn');
            if (button) {
                button.classList.remove('compact-mode');
            }
            return;
        }

        if (!this.scrollListenerAdded) {
            window.addEventListener('scroll', () => {
                if (!this.ticking) {
                    requestAnimationFrame(() => {
                        this.handleScroll();
                        this.ticking = false;
                    });
                    this.ticking = true;
                }
            });
            this.scrollListenerAdded = true;
        }

        this.handleScroll();
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    handleScroll() {
        const scrollPosition = window.scrollY;
        const shouldBeCompact = scrollPosition > this.scrollThreshold;

        if (shouldBeCompact !== this.isCompact) {
            this.isCompact = shouldBeCompact;
            this.updateButtonState();
        }
    }

    updateButtonState() {
        const button = document.getElementById('survey-filters-btn');

        if (!button) return;

        if (this.isCompact) {
            button.classList.add('compact-mode');
        } else {
            button.classList.remove('compact-mode');
        }
    }

    forceUpdate() {
        this.handleScroll();
    }
}

let scrollEffects = new ScrollEffects();

window.ScrollEffects = ScrollEffects;
window.scrollEffects = scrollEffects;
