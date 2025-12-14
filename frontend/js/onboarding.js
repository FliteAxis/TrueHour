/**
 * Onboarding Wizard Module
 * Handles the multi-stage onboarding flow for new users
 */

// State constants
const OnboardingState = {
    LANDING: 'landing',
    MANUAL_ENTRY: 'manual',
    FOREFLIGHT_IMPORT: 'foreflight',
    LOAD_SAVED: 'load',
    COMPLETED: 'completed'
};

const OnboardingStep = {
    // Manual path
    ENTER_HOURS: 'enter_hours',
    ADD_AIRCRAFT: 'add_aircraft',
    SELECT_CERT: 'select_cert',
    REVIEW: 'review',

    // ForeFlight path
    UPLOAD_CSV: 'upload_csv',
    IMPORT_AIRCRAFT: 'import_aircraft',
    VERIFY_HOURS: 'verify_hours',

    // Load saved path
    SELECT_FILE: 'select_file'
};

// Onboarding manager
const OnboardingManager = {
    currentState: null,
    currentStep: null,
    currentPath: null,
    wizardData: {},

    /**
     * Initialize onboarding system
     */
    init: async function() {
        console.log('[Onboarding] Initializing...');

        // Wait a brief moment for UserDataManager to load from database
        // This ensures we check for aircraft after database load completes
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if user has completed onboarding before
        const hasCompletedOnboarding = localStorage.getItem('truehour-onboarding-completed');
        const hasAircraft = AircraftAPI.getAllAircraft().length > 0;
        const urlParams = new URLSearchParams(window.location.search);
        const forceOnboarding = urlParams.get('onboarding') === 'true';
        const classicMode = urlParams.get('flow') === 'classic';

        // Check URL hash for direct navigation
        const hash = window.location.hash;

        if (classicMode) {
            console.log('[Onboarding] Classic mode requested, skipping onboarding');
            this.skipOnboarding();
            return;
        }

        if (!hasCompletedOnboarding || forceOnboarding || (!hasAircraft && hash.startsWith('#/onboarding'))) {
            console.log('[Onboarding] Starting onboarding flow');
            this.showLanding();
        } else {
            console.log('[Onboarding] User has completed onboarding, showing main app');
            this.skipOnboarding();
        }

        // Set up URL hash change listener
        window.addEventListener('hashchange', () => this.handleHashChange());
    },

    /**
     * Handle URL hash changes for navigation
     */
    handleHashChange: function() {
        const hash = window.location.hash;

        if (hash.startsWith('#/onboarding/')) {
            const path = hash.substring(13); // Remove '#/onboarding/'
            this.navigateToStep(path);
        }
    },

    /**
     * Navigate to a specific step by hash
     */
    navigateToStep: function(stepHash) {
        console.log('[Onboarding] Navigating to step:', stepHash);

        // Map hash to path and step
        const pathMap = {
            'manual/hours': { path: 'manual', step: OnboardingStep.ENTER_HOURS },
            'manual/aircraft': { path: 'manual', step: OnboardingStep.ADD_AIRCRAFT },
            'manual/certification': { path: 'manual', step: OnboardingStep.SELECT_CERT },
            'manual/review': { path: 'manual', step: OnboardingStep.REVIEW },
            'foreflight/upload': { path: 'foreflight', step: OnboardingStep.UPLOAD_CSV },
            'foreflight/aircraft': { path: 'foreflight', step: OnboardingStep.IMPORT_AIRCRAFT },
            'foreflight/hours': { path: 'foreflight', step: OnboardingStep.VERIFY_HOURS },
            'foreflight/certification': { path: 'foreflight', step: OnboardingStep.SELECT_CERT },
            'foreflight/review': { path: 'foreflight', step: OnboardingStep.REVIEW },
            'load/file': { path: 'load', step: OnboardingStep.SELECT_FILE }
        };

        const destination = pathMap[stepHash];
        if (destination) {
            this.currentPath = destination.path;
            this.currentStep = destination.step;
            this.showWizardStep();
        }
    },

    /**
     * Show landing page
     */
    showLanding: function() {
        console.log('[Onboarding] Showing landing page');
        this.currentState = OnboardingState.LANDING;

        // Hide main app
        document.querySelector('.main-container').style.display = 'none';

        // Show landing screen
        const landing = document.getElementById('landing-screen');
        if (landing) {
            landing.style.display = 'flex';
        }

        // Update URL
        window.history.replaceState({}, '', '#/onboarding');
    },

    /**
     * Start manual entry path
     */
    startManualPath: function() {
        console.log('[Onboarding] Starting manual entry path');

        // Clear any existing aircraft from previous sessions
        this.clearExistingAircraft();

        this.currentPath = 'manual';
        this.currentStep = OnboardingStep.ENTER_HOURS;
        window.location.hash = '#/onboarding/manual/hours';
        this.showWizard();
    },

    /**
     * Start ForeFlight import path
     */
    startForeFlightPath: async function() {
        console.log('[Onboarding] Starting ForeFlight import path');

        // Clear any existing aircraft from previous sessions
        this.clearExistingAircraft();

        // Check if FAA lookup service is available and auto-enable FAA lookups
        await this.checkAndEnableFAALookup();

        this.currentPath = 'foreflight';
        this.currentStep = OnboardingStep.UPLOAD_CSV;
        window.location.hash = '#/onboarding/foreflight/upload';
        this.showWizard();
    },

    /**
     * Start load saved path
     */
    startLoadPath: function() {
        console.log('[Onboarding] Starting load saved path');
        this.currentPath = 'load';
        this.currentStep = OnboardingStep.SELECT_FILE;
        window.location.hash = '#/onboarding/load/file';
        this.showWizard();
    },

    /**
     * Start with sample data
     */
    startSampleData: function() {
        console.log('[Onboarding] Loading sample data');
        this.loadSampleData();
        this.completeOnboarding();
    },

    /**
     * Show wizard modal
     */
    showWizard: function() {
        // Hide landing
        const landing = document.getElementById('landing-screen');
        if (landing) {
            landing.style.display = 'none';
        }

        // Show wizard
        const wizard = document.getElementById('onboarding-wizard');
        if (wizard) {
            wizard.style.display = 'flex';
        }

        this.showWizardStep();
    },

    /**
     * Show current wizard step
     */
    showWizardStep: function() {
        console.log('[Onboarding] Showing step:', this.currentPath, this.currentStep);

        // Update progress bar
        this.updateProgress();

        // Hide all step containers
        document.querySelectorAll('.wizard-step').forEach(el => {
            el.style.display = 'none';
        });

        // Show current step
        const stepId = this.getStepId();
        const stepElement = document.getElementById(stepId);
        if (stepElement) {
            stepElement.style.display = 'block';
            this.setupStepHandlers(stepId);
        }

        // Update navigation buttons
        this.updateNavigationButtons();
    },

    /**
     * Get step element ID
     */
    getStepId: function() {
        return `wizard-step-${this.currentPath}-${this.currentStep}`;
    },

    /**
     * Setup step-specific handlers
     */
    setupStepHandlers: function(stepId) {
        // Each step will have specific initialization
        switch (stepId) {
            case 'wizard-step-manual-enter_hours':
                this.setupHoursStep();
                break;
            case 'wizard-step-manual-add_aircraft':
            case 'wizard-step-foreflight-import_aircraft':
                this.setupAircraftStep();
                break;
            case 'wizard-step-manual-select_cert':
            case 'wizard-step-foreflight-select_cert':
                this.setupCertificationStep();
                break;
            case 'wizard-step-foreflight-upload_csv':
                this.setupUploadStep();
                break;
            case 'wizard-step-foreflight-verify_hours':
                this.setupVerifyHoursStep();
                break;
            case 'wizard-step-manual-review':
            case 'wizard-step-foreflight-review':
                this.setupReviewStep();
                break;
            case 'wizard-step-load-select_file':
                this.setupLoadFileStep();
                break;
        }
    },

    /**
     * Setup hours entry step
     */
    setupHoursStep: function() {
        // Focus on first input
        const firstInput = document.querySelector('#wizard-step-manual-enter_hours input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    },

    /**
     * Setup aircraft step
     */
    setupAircraftStep: async function() {
        console.log('[Onboarding] Setting up aircraft step');
        console.log('[Onboarding] Detected aircraft:', this.wizardData.detectedAircraft);

        if (!this.wizardData.detectedAircraft || this.wizardData.detectedAircraft.length === 0) {
            console.warn('[Onboarding] No aircraft detected');
            return;
        }

        // Process aircraft through AircraftAPI to get complete data with totalTime
        let csvAircraftData = [];
        if (typeof AircraftAPI !== 'undefined' && typeof AircraftAPI.importFromCSV === 'function' && this._flightData) {
            // Use the stored flight data to get accurate totalTime per aircraft
            csvAircraftData = AircraftAPI.importFromCSV(this._flightData, this._aircraftTableData || []);
            console.log('[Onboarding] Processed aircraft data:', csvAircraftData);
        } else {
            // Fallback: use raw detected aircraft
            csvAircraftData = this.wizardData.detectedAircraft.map(a => ({
                registration: a.registration,
                make: a.make || '',
                model: a.model || '',
                year: a.year || '',
                type: a.type || `${a.make} ${a.model}`.trim(),
                totalTime: 0
            }));
        }

        // Perform FAA lookups for US aircraft if enabled
        if (typeof AircraftLookup !== 'undefined' && AircraftLookup.isOnlineLookupEnabled()) {
            console.log('[Onboarding] Performing FAA lookups for aircraft...');
            for (let i = 0; i < csvAircraftData.length; i++) {
                const aircraft = csvAircraftData[i];
                if (AircraftLookup.isUSAircraft(aircraft.registration)) {
                    try {
                        const lookupData = await AircraftLookup.lookupByTailNumber(aircraft.registration);
                        if (lookupData) {
                            csvAircraftData[i].faaYear = lookupData.year || aircraft.year;
                            csvAircraftData[i].faaMake = lookupData.make || aircraft.make;
                            csvAircraftData[i].faaModel = lookupData.model || aircraft.model;
                            csvAircraftData[i].dataSource = lookupData.source;
                            console.log(`[Onboarding] FAA lookup for ${aircraft.registration}:`, lookupData);
                        }
                    } catch (error) {
                        console.warn(`[Onboarding] Failed to lookup ${aircraft.registration}:`, error);
                    }
                }
            }
        }

        // Store for later use
        this.wizardData.csvAircraftData = csvAircraftData;

        // Render aircraft list
        this.renderAircraftList(csvAircraftData);
    },

    /**
     * Render aircraft list in wizard
     */
    renderAircraftList: function(csvAircraftData) {
        const listContainer = document.getElementById('wizard-foreflight-aircraft-list');
        if (!listContainer) {
            console.error('[Onboarding] Aircraft list container not found');
            return;
        }

        // Helper function to clean make/model names
        function cleanName(name) {
            return name
                .replace(/\s+Aircraft\s*/gi, ' ')
                .replace(/\bAICSA\b/gi, 'Piper')
                .trim();
        }

        listContainer.innerHTML = csvAircraftData.map((a, index) => {
            // Use FAA data if available, otherwise use ForeFlight data
            const year = a.faaYear || a.year || '';
            const make = a.faaMake || a.make || '';
            const model = a.faaModel || a.model || '';
            const dataSource = a.dataSource || 'foreflight';

            const cleanMake = cleanName(make);
            const cleanModel = cleanName(model);

            // Check if this is a simulator
            const isSimulator = !cleanMake && !cleanModel && a.type;
            const displayModel = cleanModel || (isSimulator ? a.type : '');
            const displayMake = cleanMake || (isSimulator ? 'N/A' : '');
            const displayYear = year || (isSimulator ? 'N/A' : '');

            // Create data source badge
            let sourceBadge = '';
            if (dataSource === 'faa') {
                sourceBadge = '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; margin-left: 8px;">✓ FAA Verified</span>';
            } else if (dataSource === 'cache') {
                sourceBadge = '<span style="background: #6366f1; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; margin-left: 8px;">✓ FAA Cached</span>';
            } else {
                sourceBadge = '<span style="background: #94a3b8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; margin-left: 8px;">ForeFlight</span>';
            }

            return `
            <div class="csv-aircraft-item aircraft-item" style="padding: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); transition: all 0.2s ease; margin-bottom: 16px;">
                <!-- Header Section -->
                <div class="aircraft-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <input type="checkbox" class="csv-aircraft-checkbox" id="wizard-csv-check-${index}" checked style="width: 18px; height: 18px; cursor: pointer;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 1.1em; color: #1e293b;">${a.registration}</div>
                            ${a.totalTime ? '<div style="font-size: 0.875em; color: #64748b; margin-top: 2px;">' + a.totalTime.toFixed(1) + ' hours logged</div>' : ''}
                        </div>
                    </div>
                    ${sourceBadge}
                </div>

                <!-- Aircraft Info Grid -->
                <div class="aircraft-info-grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div class="aircraft-field">
                        <label class="aircraft-field-label" style="font-size: 0.75em; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Tail Number</label>
                        <input type="text" class="input-field" id="wizard-csv-tail-${index}" value="${a.registration}" placeholder="e.g., N12345" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.95em; box-sizing: border-box;">
                    </div>
                    <div class="aircraft-field">
                        <label class="aircraft-field-label" style="font-size: 0.75em; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Year</label>
                        <input type="text" class="input-field" id="wizard-csv-year-${index}" value="${displayYear}" placeholder="e.g., 1981" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.95em; box-sizing: border-box;">
                    </div>
                    <div class="aircraft-field">
                        <label class="aircraft-field-label" style="font-size: 0.75em; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Make</label>
                        <input type="text" class="input-field" id="wizard-csv-make-${index}" value="${displayMake}" placeholder="e.g., Cessna" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.95em; box-sizing: border-box;">
                    </div>
                    <div class="aircraft-field">
                        <label class="aircraft-field-label" style="font-size: 0.75em; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Model</label>
                        <input type="text" class="input-field" id="wizard-csv-model-${index}" value="${displayModel}" placeholder="e.g., 172 Skyhawk" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.95em; box-sizing: border-box;">
                    </div>
                </div>

                <!-- Rate Configuration Panel -->
                <div class="aircraft-item-row2" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <div class="aircraft-rate-config">
                        <div class="rate-type-toggle" data-aircraft-index="${index}">
                            <button type="button" class="rate-type-btn active" data-type="wet" data-aircraft-index="${index}">Wet</button>
                            <button type="button" class="rate-type-btn" data-type="dry" data-aircraft-index="${index}">Dry</button>
                        </div>
                        <div class="rate-value" id="wizard-csv-rate-value-${index}">
                            <span class="currency">$</span>
                            <input type="number" class="input-field" id="wizard-csv-wet-${index}" value="150" min="0" style="width:80px;font-size:1em;font-weight:600;">
                            <span class="unit">/hr</span>
                        </div>
                    </div>

                    <div class="csv-aircraft-rates">
                        <input type="number" class="input-field" id="wizard-csv-dry-${index}" value="120" min="0" style="width:80px;font-size:1em;font-weight:600;display:none;">

                        <div id="wizard-csv-fuel-section-${index}" class="fuel-inputs hidden" style="margin-top: 12px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label class="aircraft-field-label" style="font-size: 0.75em; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">Fuel Price</label>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="color: #64748b; font-weight: 600; font-size: 1em;">$</span>
                                        <input type="number" class="input-field" id="wizard-csv-fuel-price-${index}" value="6" min="0" step="0.10" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.95em; background: white; box-sizing: border-box;">
                                        <span style="color: #64748b; font-size: 0.85em; white-space: nowrap;">/gal</span>
                                    </div>
                                </div>
                                <div>
                                    <label class="aircraft-field-label" style="font-size: 0.75em; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">Fuel Burn</label>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <input type="number" class="input-field" id="wizard-csv-fuel-burn-${index}" value="8" min="0" step="0.5" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.95em; background: white; box-sizing: border-box;">
                                        <span style="color: #64748b; font-size: 0.85em; white-space: nowrap;">gal/hr</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Default Aircraft Checkbox -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="wizard-csv-default-${index}" ${index === 0 ? 'checked' : ''} data-aircraft-index="${index}" style="width: 16px; height: 16px; cursor: pointer;">
                    <label for="wizard-csv-default-${index}" style="font-size: 0.875em; color: #64748b; cursor: pointer; user-select: none;">★ Set as default aircraft</label>
                </div>
            </div>
            `;
        }).join('');

        // Add Continue button at the bottom
        listContainer.innerHTML += `
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn-primary" onclick="OnboardingManager.nextStep()" style="padding: 12px 40px;">
                    Continue →
                </button>
            </div>
        `;

        // Attach event listeners to toggle buttons and checkboxes after HTML is rendered
        console.log('[Onboarding] Attaching event listeners to toggle buttons and checkboxes');
        csvAircraftData.forEach((a, index) => {
            // Attach to rate type toggle buttons
            const toggleButtons = document.querySelectorAll(`.rate-type-toggle[data-aircraft-index="${index}"] .rate-type-btn`);
            toggleButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clickedBtn = e.target;
                    const rateType = clickedBtn.dataset.type;
                    const aircraftIndex = clickedBtn.dataset.aircraftIndex;

                    console.log('[Onboarding] Toggle button clicked for index:', aircraftIndex, 'type:', rateType);

                    // Update button states
                    toggleButtons.forEach(b => b.classList.remove('active'));
                    clickedBtn.classList.add('active');

                    // Toggle sections
                    this.toggleWizardRateType(parseInt(aircraftIndex), rateType);
                });
            });

            // Attach to default checkbox
            const defaultCheckbox = document.getElementById(`wizard-csv-default-${index}`);
            if (defaultCheckbox) {
                defaultCheckbox.addEventListener('change', () => {
                    console.log('[Onboarding] Default checkbox change event fired for index:', index);
                    this.handleWizardDefaultChange(index);
                });
            }
        });

        console.log('[Onboarding] Aircraft list rendered');
    },

    /**
     * Toggle between wet and dry rate for wizard aircraft
     */
    toggleWizardRateType: function(index, rateType) {
        console.log('[Onboarding] toggleWizardRateType called for index:', index, 'rateType:', rateType);

        const wetInput = document.getElementById(`wizard-csv-wet-${index}`);
        const dryInput = document.getElementById(`wizard-csv-dry-${index}`);
        const rateValueDiv = document.getElementById(`wizard-csv-rate-value-${index}`);
        const fuelSection = document.getElementById(`wizard-csv-fuel-section-${index}`);

        console.log('[Onboarding] Elements found:', {
            wetInput: !!wetInput,
            dryInput: !!dryInput,
            rateValueDiv: !!rateValueDiv,
            fuelSection: !!fuelSection
        });

        if (rateType === 'wet') {
            // Show wet input in the rate-value div
            const currentValue = wetInput.value;
            rateValueDiv.innerHTML = `
                <span class="currency">$</span>
                <input type="number" class="input-field" id="wizard-csv-wet-${index}" value="${currentValue}" min="0" style="width:80px;font-size:1em;font-weight:600;">
                <span class="unit">/hr</span>
            `;
            if (fuelSection) {
                fuelSection.classList.add('hidden');
                fuelSection.style.display = 'none';
            }
        } else {
            // Show dry input in the rate-value div
            const currentValue = dryInput.value;
            rateValueDiv.innerHTML = `
                <span class="currency">$</span>
                <input type="number" class="input-field" id="wizard-csv-dry-${index}" value="${currentValue}" min="0" style="width:80px;font-size:1em;font-weight:600;">
                <span class="unit">/hr</span>
            `;
            // Keep wet input hidden but accessible for data storage
            const hiddenWet = document.getElementById(`wizard-csv-wet-${index}`);
            if (!hiddenWet) {
                const wetValue = wetInput ? wetInput.value : '150';
                rateValueDiv.insertAdjacentHTML('beforeend', `<input type="number" class="input-field" id="wizard-csv-wet-${index}" value="${wetValue}" min="0" style="width:80px;font-size:1em;font-weight:600;display:none;">`);
            }
            if (fuelSection) {
                fuelSection.classList.remove('hidden');
                fuelSection.style.display = 'block';
            }
        }

        console.log('[Onboarding] After toggle, fuel section visible:', rateType === 'dry');
    },

    /**
     * Handle default aircraft checkbox change
     */
    handleWizardDefaultChange: function(index) {
        const currentCheckbox = document.getElementById(`wizard-csv-default-${index}`);

        if (currentCheckbox && currentCheckbox.checked) {
            // Uncheck all other default checkboxes
            const csvAircraftData = this.wizardData.csvAircraftData || [];
            csvAircraftData.forEach((_, i) => {
                if (i !== index) {
                    const otherCheckbox = document.getElementById(`wizard-csv-default-${i}`);
                    if (otherCheckbox) {
                        otherCheckbox.checked = false;
                    }
                }
            });
        }
    },

    /**
     * Setup certification step
     */
    setupCertificationStep: function() {
        // Focus on certification dropdown
        const certSelect = document.querySelector('.wizard-step[style*="block"] #targetCert');
        if (certSelect) {
            setTimeout(() => certSelect.focus(), 100);
        }
    },

    /**
     * Setup upload step
     */
    setupUploadStep: function() {
        console.log('[Onboarding] Setting up upload step');
    },

    /**
     * Setup verify hours step
     */
    setupVerifyHoursStep: function() {
        // Populate with imported data
        if (currentHours && currentHours.totalTime) {
            document.getElementById('wizard-verify-total').textContent = currentHours.totalTime.toFixed(1);
            document.getElementById('wizard-verify-pic').textContent = (currentHours.picTime || 0).toFixed(1);
            document.getElementById('wizard-verify-xc').textContent = (currentHours.picXC || 0).toFixed(1);
            document.getElementById('wizard-verify-instrument').textContent = (currentHours.instrumentTotal || 0).toFixed(1);
        }
    },

    /**
     * Setup review step
     */
    setupReviewStep: function() {
        console.log('[Onboarding] Setting up review step');
        // Populate the review page with entered data
        this.populateReview();
    },

    /**
     * Setup load file step
     */
    setupLoadFileStep: function() {
        console.log('[Onboarding] Setting up load file step');
    },

    /**
     * Update progress bar
     */
    updateProgress: function() {
        const steps = this.getPathSteps();
        const currentIndex = steps.indexOf(this.currentStep);
        const progress = ((currentIndex + 1) / steps.length) * 100;

        const progressBar = document.getElementById('wizard-progress-bar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }

        const progressText = document.getElementById('wizard-progress-text');
        if (progressText) {
            progressText.textContent = `Step ${currentIndex + 1} of ${steps.length}`;
        }
    },

    /**
     * Get steps for current path
     */
    getPathSteps: function() {
        const pathSteps = {
            'manual': [
                OnboardingStep.ENTER_HOURS,
                OnboardingStep.ADD_AIRCRAFT,
                OnboardingStep.SELECT_CERT,
                OnboardingStep.REVIEW
            ],
            'foreflight': [
                OnboardingStep.UPLOAD_CSV,
                OnboardingStep.IMPORT_AIRCRAFT,
                OnboardingStep.VERIFY_HOURS,
                OnboardingStep.SELECT_CERT,
                OnboardingStep.REVIEW
            ],
            'load': [
                OnboardingStep.SELECT_FILE
            ]
        };

        return pathSteps[this.currentPath] || [];
    },

    /**
     * Update navigation buttons
     */
    updateNavigationButtons: function() {
        const steps = this.getPathSteps();
        const currentIndex = steps.indexOf(this.currentStep);
        const stepId = this.getStepId();

        const backBtn = document.getElementById('wizard-back-btn');
        const nextBtn = document.getElementById('wizard-next-btn');

        // Show/hide back button
        if (backBtn) {
            backBtn.style.display = currentIndex > 0 ? 'inline-block' : 'none';
        }

        // Update next button text and visibility
        if (nextBtn) {
            // Hide Continue button on steps that auto-advance
            if (stepId === 'wizard-step-foreflight-upload_csv' || stepId === 'wizard-step-foreflight-import_aircraft') {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'inline-block';

                if (currentIndex === steps.length - 1) {
                    nextBtn.textContent = 'Complete Setup';
                } else {
                    nextBtn.textContent = 'Continue →';
                }
            }
        }
    },

    /**
     * Go to next step
     */
    nextStep: function() {
        // Save step data BEFORE validation
        // This ensures aircraft are added to AircraftAPI before validation checks
        this.saveStepData();

        // Validate current step
        if (!this.validateCurrentStep()) {
            return;
        }

        const steps = this.getPathSteps();
        const currentIndex = steps.indexOf(this.currentStep);

        if (currentIndex < steps.length - 1) {
            // Move to next step
            this.currentStep = steps[currentIndex + 1];
            this.updateUrlForStep();
            this.showWizardStep();
        } else {
            // Complete onboarding
            this.completeOnboarding();
        }
    },

    /**
     * Go to previous step
     */
    previousStep: function() {
        const steps = this.getPathSteps();
        const currentIndex = steps.indexOf(this.currentStep);

        if (currentIndex > 0) {
            this.currentStep = steps[currentIndex - 1];
            this.updateUrlForStep();
            this.showWizardStep();
        } else {
            // Go back to landing
            this.showLanding();
        }
    },

    /**
     * Update URL for current step
     */
    updateUrlForStep: function() {
        const hashMap = {
            'manual-enter_hours': 'manual/hours',
            'manual-add_aircraft': 'manual/aircraft',
            'manual-select_cert': 'manual/certification',
            'manual-review': 'manual/review',
            'foreflight-upload_csv': 'foreflight/upload',
            'foreflight-import_aircraft': 'foreflight/aircraft',
            'foreflight-verify_hours': 'foreflight/hours',
            'foreflight-select_cert': 'foreflight/certification',
            'foreflight-review': 'foreflight/review',
            'load-select_file': 'load/file'
        };

        const key = `${this.currentPath}-${this.currentStep}`;
        const hash = hashMap[key];
        if (hash) {
            window.location.hash = `#/onboarding/${hash}`;
        }
    },

    /**
     * Validate current step
     */
    validateCurrentStep: function() {
        const stepId = this.getStepId();

        switch (stepId) {
            case 'wizard-step-manual-enter_hours':
                // Validate hours don't exceed total
                return this.validateHours();

            case 'wizard-step-manual-add_aircraft':
            case 'wizard-step-foreflight-import_aircraft':
                // Must have at least one aircraft
                if (AircraftAPI.getAllAircraft().length === 0) {
                    this.showHelp('Please add at least one aircraft before continuing.');
                    return false;
                }
                break;

            case 'wizard-step-foreflight-verify_hours':
                // Must confirm hours are correct
                const confirmCheckbox = document.getElementById('wizard-verify-confirm');
                if (!confirmCheckbox || !confirmCheckbox.checked) {
                    this.showHelp('Please confirm your flight hours are correct before continuing.');
                    return false;
                }
                break;

            case 'wizard-step-manual-review':
            case 'wizard-step-foreflight-review':
                // Populate review page before showing
                this.populateReview();
                break;
        }

        return true;
    },

    /**
     * Save current step data
     */
    saveStepData: function() {
        const stepId = this.getStepId();

        // Save specific data based on step
        switch (stepId) {
            case 'wizard-step-manual-enter_hours':
                // Save hours to wizardData
                this.wizardData.hours = {
                    total: parseFloat(document.getElementById('wizard-total-hours').value) || 0,
                    pic: parseFloat(document.getElementById('wizard-pic-hours').value) || 0,
                    xc: parseFloat(document.getElementById('wizard-xc-hours').value) || 0,
                    instrument: parseFloat(document.getElementById('wizard-instrument-hours').value) || 0,
                    simulator: parseFloat(document.getElementById('wizard-simulator-hours').value) || 0
                };

                // Store in global currentHours for main app with ALL required fields
                currentHours = {
                    totalTime: this.wizardData.hours.total,
                    picTime: this.wizardData.hours.pic,
                    picXC: this.wizardData.hours.xc,
                    instrumentTotal: this.wizardData.hours.instrument,
                    simInstrumentTime: this.wizardData.hours.simulator,
                    dualReceived: this.wizardData.hours.total - this.wizardData.hours.pic,
                    actualInstrument: this.wizardData.hours.instrument * 0.2,
                    simulatedInstrument: this.wizardData.hours.instrument * 0.8,
                    batdTime: 0,
                    instrumentDualAirplane: 0,
                    recentInstrument: 0,
                    complexTime: 0,
                    dayXC: 0,
                    nightXC: 0,
                    soloLongXC: 0,
                    nightTime: 0,
                    longXC: 0,
                    ir250nmXC: 0
                };
                break;

            case 'wizard-step-foreflight-import_aircraft':
                // Save selected aircraft from ForeFlight import
                // Only save if we haven't already saved this step
                if (this.wizardData.aircraftSaved) {
                    console.log('[Onboarding] Aircraft already saved, skipping');
                    break;
                }

                console.log('[Onboarding] Saving aircraft from import step');
                const csvAircraftData = this.wizardData.csvAircraftData || [];

                csvAircraftData.forEach((aircraft, index) => {
                    // Check if aircraft is selected
                    const checkbox = document.getElementById(`wizard-csv-check-${index}`);
                    if (!checkbox || !checkbox.checked) {
                        console.log(`[Onboarding] Skipping unchecked aircraft: ${aircraft.registration}`);
                        return;
                    }

                    // Get form values
                    const registration = document.getElementById(`wizard-csv-tail-${index}`)?.value || aircraft.registration;
                    // Get form values, fallback to FAA data if available, then ForeFlight data
                    const year = document.getElementById(`wizard-csv-year-${index}`)?.value || aircraft.faaYear || aircraft.year || '';
                    const make = document.getElementById(`wizard-csv-make-${index}`)?.value || aircraft.faaMake || aircraft.make || '';
                    const model = document.getElementById(`wizard-csv-model-${index}`)?.value || aircraft.faaModel || aircraft.model || '';
                    // Get rate type from active toggle button
                    const activeRateBtn = document.querySelector(`.rate-type-toggle[data-aircraft-index="${index}"] .rate-type-btn.active`);
                    const rateType = activeRateBtn?.dataset.type || 'wet';
                    const wetRate = parseFloat(document.getElementById(`wizard-csv-wet-${index}`)?.value) || 0;
                    const dryRate = parseFloat(document.getElementById(`wizard-csv-dry-${index}`)?.value) || 0;
                    const fuelPrice = parseFloat(document.getElementById(`wizard-csv-fuel-price-${index}`)?.value) || 6;
                    const fuelBurn = parseFloat(document.getElementById(`wizard-csv-fuel-burn-${index}`)?.value) || 8;
                    const isDefault = document.getElementById(`wizard-csv-default-${index}`)?.checked || false;

                    // Determine data source (prefer FAA if available)
                    const dataSource = aircraft.dataSource || 'foreflight';

                    // Build type string
                    const type = `${make} ${model}`.trim() || aircraft.type;

                    console.log(`[Onboarding] Adding aircraft: ${registration} (${type}) [source: ${dataSource}]`);

                    // Add to AircraftAPI
                    AircraftAPI.addAircraft({
                        type: type,
                        registration: registration,
                        make: make,
                        model: model,
                        year: year || null,
                        wetRate: rateType === 'wet' ? wetRate : 0,
                        dryRate: rateType === 'dry' ? dryRate : 0,
                        fuelPrice: fuelPrice,
                        fuelBurn: fuelBurn,
                        notes: 'Imported from ForeFlight',
                        source: dataSource,  // Use actual source (faa/cache/foreflight) - API expects 'source' not 'dataSource'
                        isDefault: isDefault
                    });
                });

                // Mark as saved so we don't save again
                this.wizardData.aircraftSaved = true;

                console.log('[Onboarding] Aircraft saved:', AircraftAPI.getAllAircraft().length, 'total');
                break;

            case 'wizard-step-manual-select_cert':
            case 'wizard-step-foreflight-select_cert':
                // Save certification selection
                const certId = this.currentPath === 'manual' ? 'wizard-cert-select' : 'wizard-cert-select-ff';
                const lessonsId = this.currentPath === 'manual' ? 'wizard-lessons-per-week' : 'wizard-lessons-per-week-ff';

                this.wizardData.certification = document.getElementById(certId).value;
                this.wizardData.lessonsPerWeek = parseFloat(document.getElementById(lessonsId).value) || 2;

                // Set in main app
                document.getElementById('targetCert').value = this.wizardData.certification;
                document.getElementById('lessonsPerWeek').value = this.wizardData.lessonsPerWeek;
                break;
        }

        // Save progress to localStorage
        localStorage.setItem('truehour-onboarding-progress', JSON.stringify({
            path: this.currentPath,
            step: this.currentStep,
            data: this.wizardData
        }));
    },

    /**
     * Populate review page with entered data
     */
    populateReview: function() {
        if (this.currentPath === 'manual') {
            // Populate manual path review
            const hours = this.wizardData.hours || {};
            document.getElementById('review-total-hours').textContent = hours.total || 0;

            // Populate aircraft list
            const aircraft = AircraftAPI.getAllAircraft();
            const aircraftListEl = document.getElementById('review-aircraft-list');
            if (aircraft.length > 0) {
                let html = '';
                aircraft.forEach(ac => {
                    const rate = ac.wetRate > 0 ? `$${ac.wetRate}/hr (wet)` : `$${ac.dryRate}/hr (dry)`;
                    html += `<div class="review-item"><strong>${ac.type}</strong> ${ac.registration ? `(${ac.registration})` : ''} - ${rate}</div>`;
                });
                aircraftListEl.innerHTML = html;
            } else {
                aircraftListEl.innerHTML = '<div class="review-item">No aircraft added</div>';
            }

            // Populate certification
            const certMap = {
                'ir': 'Instrument Rating',
                'cpl': 'Commercial Pilot License',
                'cfi': 'Certified Flight Instructor'
            };
            const certText = this.wizardData.certification ? certMap[this.wizardData.certification] : 'None selected';
            document.getElementById('review-certification').textContent = certText;

        } else if (this.currentPath === 'foreflight') {
            // Populate ForeFlight path review
            const hours = currentHours || {};
            document.getElementById('review-ff-total-hours').textContent = (hours.totalTime || 0).toFixed(1);

            // Populate aircraft list
            const aircraft = AircraftAPI.getAllAircraft();
            const aircraftListEl = document.getElementById('review-ff-aircraft-list');
            if (aircraft.length > 0) {
                let html = '';
                aircraft.forEach(ac => {
                    const rate = ac.wetRate > 0 ? `$${ac.wetRate}/hr (wet)` : `$${ac.dryRate}/hr (dry)`;
                    html += `<div class="review-item"><strong>${ac.type}</strong> ${ac.registration ? `(${ac.registration})` : ''} - ${rate}</div>`;
                });
                aircraftListEl.innerHTML = html;
            } else {
                aircraftListEl.innerHTML = '<div class="review-item">No aircraft added</div>';
            }

            // Populate certification
            const certMap = {
                'ir': 'Instrument Rating',
                'cpl': 'Commercial Pilot License',
                'cfi': 'Certified Flight Instructor'
            };
            const certText = this.wizardData.certification ? certMap[this.wizardData.certification] : 'None selected';
            document.getElementById('review-ff-certification').textContent = certText;
        }
    },

    /**
     * Complete onboarding
     */
    completeOnboarding: function() {
        console.log('[Onboarding] Completing onboarding');

        // Mark onboarding as complete
        localStorage.setItem('truehour-onboarding-completed', 'true');

        // Clear progress
        localStorage.removeItem('truehour-onboarding-progress');

        // Hide wizard
        const wizard = document.getElementById('onboarding-wizard');
        if (wizard) {
            wizard.style.display = 'none';
        }

        // Hide landing
        const landing = document.getElementById('landing-screen');
        if (landing) {
            landing.style.display = 'none';
        }

        // Show main app
        this.showMainApp();

        // Update URL
        window.location.hash = '';
    },

    /**
     * Skip onboarding
     */
    skipOnboarding: function() {
        console.log('[Onboarding] Skipping onboarding');

        // Hide landing and wizard
        const landing = document.getElementById('landing-screen');
        if (landing) {
            landing.style.display = 'none';
        }

        const wizard = document.getElementById('onboarding-wizard');
        if (wizard) {
            wizard.style.display = 'none';
        }

        // Show main app
        this.showMainApp();
    },

    /**
     * Show main app
     */
    showMainApp: function() {
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
        }

        // Ensure currentHours is set (needed for updateDisplay to work)
        if (typeof currentHours === 'undefined' || !currentHours || !currentHours.totalTime) {
            console.log('[Onboarding] Initializing currentHours from wizard data or defaults');
            if (this.wizardData.hours) {
                // Manual path - use wizard data
                currentHours = {
                    totalTime: this.wizardData.hours.total || 0,
                    picTime: this.wizardData.hours.pic || 0,
                    picXC: this.wizardData.hours.xc || 0,
                    instrumentTotal: this.wizardData.hours.instrument || 0,
                    simInstrumentTime: this.wizardData.hours.simulator || 0,
                    dualReceived: (this.wizardData.hours.total || 0) - (this.wizardData.hours.pic || 0),
                    actualInstrument: (this.wizardData.hours.instrument || 0) * 0.2,
                    simulatedInstrument: (this.wizardData.hours.instrument || 0) * 0.8,
                    batdTime: 0,
                    instrumentDualAirplane: 0,
                    recentInstrument: 0,
                    complexTime: 0,
                    dayXC: 0,
                    nightXC: 0,
                    soloLongXC: 0,
                    nightTime: 0,
                    longXC: 0,
                    ir250nmXC: 0
                };
            } else if (!currentHours || !currentHours.totalTime) {
                // ForeFlight path should already have set currentHours, but ensure it has all fields
                currentHours = {
                    totalTime: currentHours?.totalTime || 0,
                    picTime: currentHours?.picTime || 0,
                    picXC: currentHours?.picXC || 0,
                    instrumentTotal: currentHours?.instrumentTotal || 0,
                    simInstrumentTime: currentHours?.simInstrumentTime || 0,
                    dualReceived: currentHours?.dualReceived || 0,
                    actualInstrument: currentHours?.actualInstrument || 0,
                    simulatedInstrument: currentHours?.simulatedInstrument || 0,
                    batdTime: currentHours?.batdTime || 0,
                    instrumentDualAirplane: currentHours?.instrumentDualAirplane || 0,
                    recentInstrument: currentHours?.recentInstrument || 0,
                    complexTime: currentHours?.complexTime || 0,
                    dayXC: currentHours?.dayXC || 0,
                    nightXC: currentHours?.nightXC || 0,
                    soloLongXC: currentHours?.soloLongXC || 0,
                    nightTime: currentHours?.nightTime || 0,
                    longXC: currentHours?.longXC || 0,
                    ir250nmXC: currentHours?.ir250nmXC || 0
                };
            }
        }

        console.log('[Onboarding] currentHours:', currentHours);

        // Refresh aircraft dropdown (but don't load old defaults)
        if (typeof refreshAircraftDropdown === 'function') {
            refreshAircraftDropdown();
        }

        // Check if we should skip aircraft loading (e.g., when loading from saved budget)
        if (this._skipAircraftLoad) {
            console.log('[Onboarding] Skipping aircraft load - already loaded by loadBudget()');
            this._skipAircraftLoad = false; // Reset flag
        } else {
            // Populate the old aircraft list from saved aircraft (wizard-added only)
            const aircraft = AircraftAPI.getAllAircraft();
            if (aircraft.length > 0 && typeof addAircraft === 'function') {
                console.log('[Onboarding] Loading', aircraft.length, 'aircraft from AircraftAPI to budget list');

                // Show the aircraft list section
                document.getElementById('aircraftList').style.display = 'block';

                // Add each saved aircraft to the list
                aircraft.forEach(ac => {
                    const rateType = ac.wetRate > 0 ? 'wet' : 'dry';
                    const rate = rateType === 'wet' ? ac.wetRate : ac.dryRate;

                    // Extract make and model from type (format: "Make Model")
                    const typeParts = (ac.type || '').split(' ');
                    const make = typeParts[0] || '';
                    const model = typeParts.slice(1).join(' ') || '';

                    addAircraft({
                        id: ac.id,
                        make: make,
                        model: model,
                        registration: ac.registration || '',
                        type: rateType,
                        rate: rate,
                        fuelPrice: ac.fuelPrice || 6,
                        fuelBurn: ac.fuelBurn || 8
                    });
                });
            }
        }

        // Small delay to let aircraft UI render, then trigger calculation
        setTimeout(() => {
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        }, 150);
    },

    /**
     * Clear existing aircraft from localStorage and DOM
     */
    clearExistingAircraft: function() {
        console.log('[Onboarding] Clearing existing aircraft from previous sessions');

        // Clear the aircraft config from localStorage
        localStorage.removeItem('truehour-config');

        // Clear any aircraft that might be in AircraftAPI memory
        if (typeof AircraftAPI !== 'undefined' && AircraftAPI.getAllAircraft) {
            const allAircraft = AircraftAPI.getAllAircraft();
            console.log('[Onboarding] Found', allAircraft.length, 'aircraft to clear from API');

            // Create a copy of the array to avoid modification during iteration
            const aircraftIds = allAircraft.map(ac => ac.id);

            // Remove each aircraft
            aircraftIds.forEach(id => {
                if (AircraftAPI.deleteAircraft) {
                    try {
                        AircraftAPI.deleteAircraft(id);
                        console.log('[Onboarding] Deleted aircraft:', id);
                    } catch (e) {
                        console.warn('[Onboarding] Failed to delete aircraft:', id, e);
                    }
                }
            });
        }

        // Clear aircraft from the old list in DOM
        const aircraftList = document.getElementById('aircraftList');
        if (aircraftList) {
            const aircraftItems = aircraftList.querySelectorAll('.aircraft-item');
            console.log('[Onboarding] Found', aircraftItems.length, 'aircraft items in DOM to remove');
            aircraftItems.forEach(item => item.remove());
        }

        console.log('[Onboarding] Aircraft clearing complete');
    },

    /**
     * Check if FAA lookup service is available and auto-enable FAA lookups
     */
    checkAndEnableFAALookup: async function() {
        if (typeof AircraftLookup === 'undefined') {
            console.log('[Onboarding] AircraftLookup module not available');
            return;
        }

        console.log('[Onboarding] Checking FAA lookup service availability...');

        const isAvailable = await AircraftLookup.checkServiceAvailability();

        if (isAvailable) {
            console.log('[Onboarding] FAA lookup service detected - auto-enabling FAA lookups');
            AircraftLookup.setOnlineLookupEnabled(true);
            this.showHelp('✓ FAA aircraft verification enabled - aircraft will be verified against FAA registry');
        } else {
            console.log('[Onboarding] FAA lookup service not available - using ForeFlight data only');
            AircraftLookup.setOnlineLookupEnabled(false);
            // Optionally show help message
            // this.showHelp('Using ForeFlight data only (FAA lookup unavailable)');
        }
    },

    /**
     * Show help message
     */
    showHelp: function(message) {
        const helpBox = document.getElementById('wizard-help-message');
        if (helpBox) {
            helpBox.textContent = message;
            helpBox.style.display = 'block';

            // Auto-hide after 4 seconds
            setTimeout(() => {
                helpBox.style.display = 'none';
            }, 4000);
        }
    },

    /**
     * Load sample data
     */
    loadSampleData: function() {
        console.log('[Onboarding] Loading sample data');

        // Create sample aircraft
        AircraftAPI.addAircraft({
            type: 'Cessna 172SP',
            registration: 'N172SP',
            year: 2005,
            make: 'Cessna',
            model: '172SP',
            wetRate: 165,
            dryRate: 0,
            fuelPrice: 6.50,
            fuelBurn: 8.5,
            notes: 'Sample aircraft',
            source: 'sample'
        });

        // Set sample hours
        currentHours = {
            totalTime: 45.3,
            picTime: 12.5,
            picXC: 5.2,
            dualReceived: 32.8,
            instrumentTotal: 8.5,
            actualInstrument: 1.2,
            simulatedInstrument: 7.3,
            simInstrumentTime: 2.5
        };

        // Set certification
        document.getElementById('targetCert').value = 'ir';

        // Trigger calculation
        if (typeof certificationChanged === 'function') {
            certificationChanged();
        }

        console.log('[Onboarding] Sample data loaded');
    },

    /**
     * Validate hours entry
     */
    validateHours: function() {
        const total = parseFloat(document.getElementById('wizard-total-hours').value) || 0;
        const pic = parseFloat(document.getElementById('wizard-pic-hours').value) || 0;
        const xc = parseFloat(document.getElementById('wizard-xc-hours').value) || 0;
        const instrument = parseFloat(document.getElementById('wizard-instrument-hours').value) || 0;

        const validationEl = document.getElementById('wizard-hours-validation');
        const errors = [];

        if (pic > total) {
            errors.push('PIC hours cannot exceed total flight time');
        }

        if (xc > total) {
            errors.push('Cross Country hours cannot exceed total flight time');
        }

        if (instrument > total) {
            errors.push('Instrument hours cannot exceed total flight time');
        }

        if (errors.length > 0) {
            validationEl.innerHTML = '<strong>⚠ Validation Error:</strong><br>' + errors.join('<br>');
            validationEl.style.display = 'block';
            return false;
        } else {
            validationEl.style.display = 'none';
            return true;
        }
    },

    /**
     * Toggle wizard rate type (wet vs dry)
     */
    toggleWizardRateType: function() {
        const rateType = document.querySelector('input[name="wizard-rate-type"]:checked').value;

        const wetRateRow = document.getElementById('wizard-wet-rate-row');
        const dryRateRow = document.getElementById('wizard-dry-rate-row');
        const fuelPriceRow = document.getElementById('wizard-fuel-price-row');
        const fuelBurnRow = document.getElementById('wizard-fuel-burn-row');

        if (rateType === 'wet') {
            wetRateRow.style.display = 'flex';
            dryRateRow.style.display = 'none';
            fuelPriceRow.style.display = 'none';
            fuelBurnRow.style.display = 'none';

            // Clear dry rate fields
            document.getElementById('wizard-aircraft-dry-rate').value = '';
            document.getElementById('wizard-aircraft-fuel-price').value = '';
            document.getElementById('wizard-aircraft-fuel-burn').value = '';
        } else {
            wetRateRow.style.display = 'none';
            dryRateRow.style.display = 'flex';
            fuelPriceRow.style.display = 'flex';
            fuelBurnRow.style.display = 'flex';

            // Clear wet rate field
            document.getElementById('wizard-aircraft-wet-rate').value = '';

            // Set default fuel values
            if (!document.getElementById('wizard-aircraft-fuel-price').value) {
                document.getElementById('wizard-aircraft-fuel-price').value = '6';
            }
            if (!document.getElementById('wizard-aircraft-fuel-burn').value) {
                document.getElementById('wizard-aircraft-fuel-burn').value = '8';
            }
        }
    },

    /**
     * Add aircraft from wizard form
     */
    addWizardAircraft: function() {
        const make = document.getElementById('wizard-aircraft-make').value.trim();
        const model = document.getElementById('wizard-aircraft-model').value.trim();
        const registration = document.getElementById('wizard-aircraft-registration').value.trim();
        const rateType = document.querySelector('input[name="wizard-rate-type"]:checked').value;

        const wetRate = parseFloat(document.getElementById('wizard-aircraft-wet-rate').value) || 0;
        const dryRate = parseFloat(document.getElementById('wizard-aircraft-dry-rate').value) || 0;
        const fuelPrice = parseFloat(document.getElementById('wizard-aircraft-fuel-price').value) || 6;
        const fuelBurn = parseFloat(document.getElementById('wizard-aircraft-fuel-burn').value) || 8;

        // Validation
        if (!make || !model) {
            this.showHelp('Please enter aircraft make and model');
            return;
        }

        if (rateType === 'wet' && wetRate <= 0) {
            this.showHelp('Please enter a valid wet rate');
            return;
        }

        if (rateType === 'dry' && dryRate <= 0) {
            this.showHelp('Please enter a valid dry rate');
            return;
        }

        // Build aircraft type string
        const type = `${make} ${model}`;

        // Add aircraft using AircraftAPI
        AircraftAPI.addAircraft({
            type: type,
            registration: registration,
            make: make,
            model: model,
            year: null,
            wetRate: rateType === 'wet' ? wetRate : 0,
            dryRate: rateType === 'dry' ? dryRate : 0,
            fuelPrice: fuelPrice,
            fuelBurn: fuelBurn,
            notes: 'Added during onboarding',
            source: 'manual'
        });

        // Clear form
        document.getElementById('wizard-aircraft-make').value = '';
        document.getElementById('wizard-aircraft-model').value = '';
        document.getElementById('wizard-aircraft-registration').value = '';
        document.getElementById('wizard-aircraft-wet-rate').value = '';
        document.getElementById('wizard-aircraft-dry-rate').value = '';
        document.getElementById('wizard-aircraft-fuel-price').value = '';
        document.getElementById('wizard-aircraft-fuel-burn').value = '';

        // Reset to wet rate
        document.querySelector('input[name="wizard-rate-type"][value="wet"]').checked = true;
        this.toggleWizardRateType();

        // Update list
        this.updateWizardAircraftList();

        // Show success message
        this.showHelp('✓ Aircraft saved! Add another or click Continue.');
    },

    /**
     * Update wizard aircraft list
     */
    updateWizardAircraftList: function() {
        const listEl = document.getElementById('wizard-aircraft-list');
        if (!listEl) return;

        const aircraft = AircraftAPI.getAllAircraft();

        if (aircraft.length === 0) {
            listEl.innerHTML = '<p style="color: #64748b; font-style: italic;">No aircraft added yet</p>';
            return;
        }

        let html = '<div style="background: #f8fafc; border-radius: 8px; padding: 15px;">';
        html += '<h4 style="margin-bottom: 10px; color: #1e293b;">Added Aircraft:</h4>';

        aircraft.forEach(ac => {
            const rate = ac.wetRate > 0 ? `$${ac.wetRate}/hr (wet)` : `$${ac.dryRate}/hr (dry)`;
            html += `<div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>${ac.type}</strong> ${ac.registration ? `(${ac.registration})` : ''} - ${rate}
            </div>`;
        });

        html += '</div>';
        listEl.innerHTML = html;
    },

    /**
     * Handle CSV file upload
     */
    handleCSVUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('[Onboarding] CSV file uploaded:', file.name);

        const statusEl = document.getElementById('wizard-csv-status');
        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.innerHTML = '<p style="color: #3b82f6;">📊 Processing logbook...</p>';
        }

        // Use shared ForeFlight parser
        if (typeof parseForeFlight === 'function') {
            parseForeFlight(file, {
                onSuccess: (validFlights, aircraftTableData) => {
                    console.log('[Onboarding] Parse successful:', validFlights.length, 'flights');

                    // Store aircraft table data
                    this._aircraftTableData = aircraftTableData;

                    // Process logbook data
                    this.processLogbookData(validFlights);

                    if (statusEl) {
                        statusEl.innerHTML = '<p style="color: #059669;">✓ Logbook processed successfully!</p>';
                    }

                    // Auto-advance to next step
                    setTimeout(() => {
                        this.nextStep();
                    }, 1500);
                },
                onError: (errorMessage) => {
                    console.error('[Onboarding] Parse error:', errorMessage);
                    if (statusEl) {
                        statusEl.innerHTML = '<p style="color: #dc2626;">❌ ' + errorMessage + '</p>';
                    }
                }
            });
        } else {
            console.error('[Onboarding] parseForeFlight function not found!');
            if (statusEl) {
                statusEl.innerHTML = '<p style="color: #dc2626;">❌ Parser not available</p>';
            }
        }
    },

    /**
     * Process logbook data from CSV
     */
    processLogbookData: function(data) {
        console.log('[Onboarding] Processing', data.length, 'flights');

        // Store raw flight data for later use
        this._flightData = data;

        // Initialize accumulators
        let totalTime = 0;
        let picTime = 0;
        let picXC = 0;
        let xcTime = 0;
        let actualInstrument = 0;
        let simulatedInstrument = 0;
        let simulatorTime = 0;
        let simInstrumentTime = 0;
        let dualReceived = 0;
        let complexTime = 0;
        let batdTime = 0;
        let instrumentDualAirplane = 0;
        let recentInstrument = 0;
        let nightTime = 0;
        let dayXC = 0;
        let nightXC = 0;
        let soloLongXC = 0;
        let longXC = 0;
        let ir250nmXC = 0;
        let actualFlights = 0;
        let simFlights = 0;

        // Calculate date threshold for recent instrument (last 2 months)
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        // Build aircraft data map for simulator detection
        const aircraftData = {};
        if (this._aircraftTableData) {
            this._aircraftTableData.forEach(ac => {
                if (ac.AircraftID) {
                    aircraftData[ac.AircraftID.trim()] = {
                        make: ac.Make,
                        model: ac.Model,
                        equipType: ac['equipType (FAA)'] || ac['equipType'] || ''
                    };
                }
            });
        }

        // Process each flight
        data.forEach(row => {
            const total = row.TotalTime || 0;
            const pic = row.PIC || 0;
            const xc = row.CrossCountry || 0;
            const dual = row.DualReceived || 0;
            const actual = row.ActualInstrument || 0;
            const simulated = row.SimulatedInstrument || 0;
            const simulator = row.SimulatedFlight || 0;
            const complex = row['[Hours]Complex'] || 0;
            const night = row.Night || 0;
            const aircraftId = (row.AircraftID || '').trim();
            const flightDate = new Date(row.Date);

            totalTime += total;
            picTime += pic;
            xcTime += xc;
            dualReceived += dual;
            complexTime += complex;
            nightTime += night;

            // Check if this is a simulator
            let isSimulator = false;
            let isBATD = false;
            if (aircraftData[aircraftId]) {
                const equipType = (aircraftData[aircraftId].equipType || '').toLowerCase();
                isSimulator = equipType === 'batd' || equipType === 'aatd' || equipType === 'ftd';
                isBATD = equipType === 'batd';
            }

            // Handle simulator vs real aircraft instrument time
            if (isSimulator) {
                // For simulators, use TotalTime if available, otherwise SimulatedFlight
                const simTimeForRow = total > 0 ? total : simulator;
                simulatorTime += simTimeForRow;
                simInstrumentTime += simulated;
                simFlights++;

                if (isBATD && simTimeForRow > 0) {
                    batdTime += simTimeForRow;
                }
            } else {
                actualInstrument += actual;
                simulatedInstrument += simulated;
                actualFlights++;
            }

            // Calculate PIC XC (intersection of PIC and XC)
            if (pic > 0 && xc > 0) {
                picXC += Math.min(pic, xc, total);
            }

            // Calculate instrument dual in airplane (not simulator)
            if (!isSimulator && dual > 0 && (actual > 0 || simulated > 0)) {
                instrumentDualAirplane += Math.min(dual, actual + simulated, total);
            }

            // Calculate recent instrument (last 2 months, dual, not simulator)
            if (!isSimulator && flightDate >= twoMonthsAgo && dual > 0 && (actual > 0 || simulated > 0)) {
                recentInstrument += Math.min(dual, actual + simulated, total);
            }

            // Track XC types for CPL
            if (xc > 0) {
                if (night > 0) {
                    nightXC += Math.min(xc, night, total);
                } else {
                    dayXC += Math.min(xc, total);
                }

                // Long XC (>50nm) - check if distance field exists
                const distance = row.Distance || 0;
                if (distance >= 50) {
                    longXC += Math.min(xc, total);

                    // Solo long XC for CPL (PIC and >300nm total)
                    if (pic === total && dual === 0 && distance >= 300) {
                        soloLongXC = Math.max(soloLongXC, Math.min(xc, total));
                    }
                }

                // Check for IR 250nm XC requirement: >=250nm with 3 approaches (3 types)
                if (!isSimulator && distance >= 250) {
                    // Count approaches
                    const approaches = [];
                    if (row.Approach1) approaches.push(row.Approach1);
                    if (row.Approach2) approaches.push(row.Approach2);
                    if (row.Approach3) approaches.push(row.Approach3);
                    if (row.Approach4) approaches.push(row.Approach4);
                    if (row.Approach5) approaches.push(row.Approach5);
                    if (row.Approach6) approaches.push(row.Approach6);

                    // Extract approach types from approach strings (format: "count;type;...")
                    const approachTypes = new Set();
                    for (let j = 0; j < approaches.length; j++) {
                        const parts = approaches[j].split(';');
                        if (parts.length >= 2) {
                            const type = parts[1].trim().toUpperCase();
                            // Normalize approach types
                            if (type.includes('ILS')) {
                                approachTypes.add('ILS');
                            } else if (type.includes('LOC')) {
                                approachTypes.add('LOC');
                            } else if (type.includes('VOR')) {
                                approachTypes.add('VOR');
                            } else if (type.includes('RNAV') || type.includes('GPS')) {
                                approachTypes.add('RNAV');
                            } else if (type.includes('NDB')) {
                                approachTypes.add('NDB');
                            }
                        }
                    }

                    // Check if this flight meets all requirements
                    if (approaches.length >= 3 && approachTypes.size >= 3) {
                        ir250nmXC = 1;
                    }
                }
            }
        });

        const totalInstrument = actualInstrument + simulatedInstrument + simInstrumentTime;

        console.log('[Onboarding] Calculated totals:');
        console.log('  Total:', totalTime, 'PIC:', picTime, 'PIC XC:', picXC);
        console.log('  Actual Instrument:', actualInstrument, 'Simulated Instrument (hood):', simulatedInstrument);
        console.log('  Simulator:', simulatorTime, 'Sim Instrument:', simInstrumentTime);
        console.log('  Dual:', dualReceived, 'Complex:', complexTime);
        console.log('  Instrument Dual (airplane):', instrumentDualAirplane, 'Recent Instrument:', recentInstrument);
        console.log('  Night:', nightTime, 'Day XC:', dayXC, 'Night XC:', nightXC);
        console.log('  Long XC:', longXC, 'Solo Long XC:', soloLongXC);

        // Store in global currentHours
        currentHours = {
            totalTime: totalTime,
            picTime: picTime,
            picXC: picXC,
            instrumentTotal: totalInstrument,
            dualReceived: dualReceived || (totalTime - picTime),
            actualInstrument: actualInstrument,
            simulatedInstrument: simulatedInstrument,
            simInstrumentTime: simInstrumentTime,
            batdTime: batdTime,
            instrumentDualAirplane: instrumentDualAirplane,
            recentInstrument: recentInstrument,
            complexTime: complexTime,
            dayXC: dayXC,
            nightXC: nightXC,
            soloLongXC: soloLongXC,
            nightTime: nightTime,
            longXC: longXC,
            ir250nmXC: ir250nmXC
        };

        // Extract aircraft information from Aircraft Table data
        const aircraftMap = new Map();
        if (this._aircraftTableData) {
            this._aircraftTableData.forEach(row => {
                if (row.AircraftID && row.Make && row.Model) {
                    const tailNumber = row.AircraftID.trim();
                    aircraftMap.set(tailNumber, {
                        registration: tailNumber,
                        make: row.Make.trim(),
                        model: row.Model.trim(),
                        year: row.Year ? parseInt(row.Year) : null,
                        type: `${row.Make.trim()} ${row.Model.trim()}`
                    });
                }
            });
            console.log('[Onboarding] Aircraft Table:', aircraftMap.size, 'aircraft found');
        }

        // Extract unique aircraft IDs from flights
        const usedAircraft = new Set();
        data.forEach(row => {
            if (row.AircraftID) {
                usedAircraft.add(row.AircraftID.trim());
            }
        });

        // Build detected aircraft list with full details
        this.wizardData.detectedAircraft = [];
        usedAircraft.forEach(tailNumber => {
            const aircraftInfo = aircraftMap.get(tailNumber);
            if (aircraftInfo) {
                this.wizardData.detectedAircraft.push(aircraftInfo);
            } else {
                // Fallback if not found in aircraft table
                this.wizardData.detectedAircraft.push({
                    registration: tailNumber,
                    type: tailNumber
                });
            }
        });

        console.log('[Onboarding] Detected', this.wizardData.detectedAircraft.length, 'unique aircraft');

        // Save import history to database
        if (typeof saveImportHistory === 'function') {
            saveImportHistory(data.length, currentHours, 'foreflight_logbook_import.csv', actualFlights, simFlights);
        }
    },

    /**
     * Handle load budget file
     */
    handleLoadFile: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('[Onboarding] Loading budget file via loadBudget():', file.name);

        const statusEl = document.getElementById('wizard-load-status');
        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.innerHTML = '<p style="color: #3b82f6;">📂 Loading budget...</p>';
        }

        // Call the main loadBudget function from app.js
        // This will handle all the loading logic including aircraft
        if (typeof loadBudget === 'function') {
            // Store the status element reference so we can update it after load
            const originalAlertFn = window.alert;

            // Temporarily override alert to show in status instead
            window.alert = (msg) => {
                console.log('[Onboarding] Intercepted alert:', msg);
                if (statusEl) {
                    if (msg.includes('successfully')) {
                        statusEl.innerHTML = '<p style="color: #059669;">✓ ' + msg + '</p>';
                    } else {
                        statusEl.innerHTML = '<p style="color: #dc2626;">❌ ' + msg + '</p>';
                    }
                }
            };

            // Set flag to prevent showMainApp from loading aircraft again
            this._skipAircraftLoad = true;

            // Call the main loadBudget function
            loadBudget(event);

            // Restore original alert after a delay to ensure loadBudget completes
            setTimeout(() => {
                window.alert = originalAlertFn;

                if (statusEl) {
                    statusEl.innerHTML = '<p style="color: #059669;">✓ Budget loaded successfully!</p>';
                }

                // Complete onboarding
                setTimeout(() => {
                    this.completeOnboarding();
                }, 1000);
            }, 500);

        } else {
            console.error('[Onboarding] loadBudget function not found!');
            if (statusEl) {
                statusEl.innerHTML = '<p style="color: #dc2626;">❌ Load function not available</p>';
            }
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        OnboardingManager.init();
    });
} else {
    OnboardingManager.init();
}
