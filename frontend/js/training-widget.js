// Data Store Abstraction - Supports both static file mode and Docker mode
const DataStore = {
    mode: null, // 'database' or 'localStorage'

    async init() {
        // Detect if backend is available
        try {
            const response = await fetch('/api/v1/health', {
                method: 'GET',
                cache: 'no-cache'
            });
            this.mode = response.ok ? 'database' : 'localStorage';
        } catch (error) {
            // Backend not available - use localStorage
            this.mode = 'localStorage';
        }
        console.log(`[DataStore] Running in ${this.mode} mode`);
        return this.mode;
    },

    async saveHours(hours) {
        if (this.mode !== 'database') {
            console.error('[DataStore] Cannot save hours - database mode required');
            throw new Error('Database mode required');
        }

        // Use import_history table via API
        try {
            await fetch('/api/import-history/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    import_type: 'manual_update',
                    file_name: 'widget_update',
                    flights_imported: 0,
                    hours_imported: {
                        total: hours.total || 0,
                        pic: hours.pic || 0,
                        pic_xc: hours.picXC || 0,
                        cross_country: hours.crossCountry || 0,
                        instrument_total: hours.instrumentTotal || 0,
                        instrument_dual_airplane: hours.instrumentDualAirplane || 0,
                        recent_instrument: hours.recentInstrument || 0,
                        ir_250nm_xc: hours.ir250nmXC || 0,
                        night: hours.night || 0,
                        simulator_time: hours.simTime || 0,
                        actual_instrument: hours.actualInstrument || 0,
                        simulated_instrument: hours.simulatedInstrument || 0
                    }
                })
            });
            console.log('[DataStore] Hours saved to database');
        } catch (error) {
            console.error('[DataStore] Failed to save to database:', error);
            throw error;
        }
    },

    async loadHours() {
        if (this.mode !== 'database') {
            console.error('[DataStore] Cannot load hours - database mode required');
            return null;
        }

        try {
            const response = await fetch('/api/import-history/latest');
            if (response.ok) {
                const data = await response.json();
                // Check if data exists (null on fresh database)
                if (data && data.hours_imported) {
                    // Convert snake_case from API to camelCase
                    const hours = data.hours_imported;
                    return {
                        total: hours.total || 0,
                        pic: hours.pic || 0,
                        picXC: hours.pic_xc || 0,
                        crossCountry: hours.cross_country || 0,
                        instrumentTotal: hours.instrument_total || 0,
                        instrumentDualAirplane: hours.instrument_dual_airplane || 0,
                        recentInstrument: hours.recent_instrument || 0,
                        ir250nmXC: hours.ir_250nm_xc || 0,
                        night: hours.night || 0,
                        simTime: hours.simulator_time || 0,
                        actualInstrument: hours.actual_instrument || 0,
                        simulatedInstrument: hours.simulated_instrument || 0
                    };
                }
                // No import history yet - return null
                return null;
            }
        } catch (error) {
            console.error('[DataStore] Database error:', error.message);
            return null;
        }
    }
};

// Training Progress Widget
const TrainingWidget = {
    // Initialize the widget
    init: async function() {
        console.log('[TrainingWidget] Initializing...');

        // Initialize DataStore first
        await DataStore.init();

        // Load hours from appropriate source
        await this.loadHours();

        // Show widget if data exists
        const hasData = await this.checkForExistingData();
        if (hasData) {
            this.show();
        }

        // Setup certification selector (load from database)
        await this.setupCertificationSelector();
    },

    // Setup certification selector event listener
    setupCertificationSelector: async function() {
        const selector = document.getElementById('cert-selector');
        if (selector) {
            selector.addEventListener('change', async (e) => {
                const selectedCert = e.target.value;

                // Save to database instead of localStorage
                try {
                    const response = await fetch('/api/user/settings');
                    if (response.ok) {
                        const settings = await response.json();
                        settings.target_certification = selectedCert;

                        await fetch('/api/user/settings', {
                            method: 'PUT',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(settings)
                        });
                        console.log('[TrainingWidget] Saved certification to database:', selectedCert);
                    }
                } catch (error) {
                    console.error('[TrainingWidget] Failed to save certification:', error);
                }

                // Sync with Flight tab buttons
                this.syncFlightTabButtons(selectedCert);

                // Reload hours from DataStore to update display immediately
                const hours = await DataStore.loadHours();
                if (hours) {
                    this.updateDisplayFromHours(hours);
                } else {
                    // If no hours data, just show the empty state
                    this.updateCertificationProgress({});
                }
            });

            // Load certification from database instead of localStorage
            try {
                const response = await fetch('/api/user/settings');
                if (response.ok) {
                    const settings = await response.json();
                    const savedCert = settings.target_certification;
                    if (savedCert) {
                        selector.value = savedCert;
                        this.syncFlightTabButtons(savedCert);
                        console.log('[TrainingWidget] Loaded certification from database:', savedCert);

                        // Load hours and update progress display
                        const hours = await DataStore.loadHours();
                        if (hours) {
                            this.updateDisplayFromHours(hours);
                        } else {
                            this.updateCertificationProgress({});
                        }
                    }
                }
            } catch (error) {
                console.error('[TrainingWidget] Failed to load certification:', error);
            }
        }
    },

    // Sync Flight tab certification buttons with Summary tab selector
    syncFlightTabButtons: function(certValue) {
        // Update hidden select
        const targetCert = document.getElementById('targetCert');
        if (targetCert) {
            targetCert.value = certValue;
        }

        // Update active state on buttons
        const buttons = document.querySelectorAll('.cert-btn');
        buttons.forEach(function(btn) {
            if (btn.getAttribute('data-cert') === certValue) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    // Check if there's existing import data
    checkForExistingData: async function() {
        // In database mode, check the database for data
        if (DataStore.mode === 'database') {
            const hours = await DataStore.loadHours();
            return hours !== null && hours.total > 0;
        }
        // Not in database mode
        return false;
    },

    // Show the widget
    show: function() {
        const widget = document.getElementById('trainingProgressWidget');
        if (widget) {
            widget.style.display = 'block';
            console.log('[TrainingWidget] Widget displayed');
        }
    },

    // Hide the widget
    hide: function() {
        const widget = document.getElementById('trainingProgressWidget');
        if (widget) {
            widget.style.display = 'none';
        }
    },

    // Load hours using DataStore
    loadHours: async function() {
        try {
            const hours = await DataStore.loadHours();
            if (hours) {
                console.log('[TrainingWidget] Loaded hours:', hours);
                this.updateDisplayFromHours(hours);
                this.show();
            }
        } catch (error) {
            console.error('[TrainingWidget] Error loading hours:', error);
        }
    },

    // Update display from import history data (converts snake_case from API to camelCase)
    updateDisplay: function(importData) {
        const hours = importData.hours_imported;

        // Convert snake_case from API to camelCase for consistency
        const normalizedHours = {
            total: hours.total || 0,
            pic: hours.pic || 0,
            crossCountry: hours.cross_country || 0,
            instrumentTotal: hours.instrument_total || 0,
            night: hours.night || 0,
            simTime: hours.simulator_time || 0,
            actualInstrument: hours.actual_instrument || 0,
            simulatedInstrument: hours.simulated_instrument || 0
        };

        // Update hour cards
        this.updateDisplayFromHours(normalizedHours);

        // Update import info
        this.updateImportInfo(importData);
    },

    // Update display from hours object (expects camelCase)
    updateDisplayFromHours: async function(hours) {
        this.setHourValue('widget-total-hours', hours.total || 0);
        this.setHourValue('widget-pic-hours', hours.pic || 0);
        this.setHourValue('widget-xc-hours', hours.crossCountry || 0);
        this.setHourValue('widget-instrument-hours', hours.instrumentTotal || 0);
        this.setHourValue('widget-night-hours', hours.night || 0);
        this.setHourValue('widget-sim-hours', hours.simTime || 0);

        // Don't save here - import already saves to database
        // Saving here creates duplicate records with incomplete data

        this.updateCertificationProgress(hours);
    },

    // Set hour value in widget
    setHourValue: function(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = parseFloat(value).toFixed(1);
        }
    },

    // Update import info section
    updateImportInfo: function(importData) {
        const infoSection = document.getElementById('widget-import-info');
        const dateElement = document.getElementById('widget-import-date');
        const detailsElement = document.getElementById('widget-import-details');

        if (infoSection && dateElement && detailsElement) {
            const importDate = new Date(importData.import_date);
            dateElement.textContent = importDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Build detailed breakdown like: "Added 126 flights and 6 simulator sessions (+1.1 hours). Total: 188.8 hours."
            const totalFlights = importData.flights_imported || 0;
            const actualFlights = importData.hours_imported?.actual_flights || 0;
            const simFlights = importData.hours_imported?.simulator_flights || 0;
            const totalHours = importData.hours_imported?.total || 0;

            let details = '';
            if (actualFlights > 0 && simFlights > 0) {
                details = `${actualFlights} flight${actualFlights !== 1 ? 's' : ''} and ${simFlights} simulator session${simFlights !== 1 ? 's' : ''}`;
            } else if (actualFlights > 0) {
                details = `${actualFlights} flight${actualFlights !== 1 ? 's' : ''}`;
            } else if (simFlights > 0) {
                details = `${simFlights} simulator session${simFlights !== 1 ? 's' : ''}`;
            } else {
                details = `${totalFlights} flight${totalFlights !== 1 ? 's' : ''}`;
            }

            details += `. Total: ${totalHours.toFixed(1)} hours.`;
            detailsElement.textContent = details;
            infoSection.style.display = 'flex';
        }
    },

    // Update certification progress with collapsible panels
    updateCertificationProgress: function(hours) {
        const container = document.getElementById('cert-progress-container');
        const section = document.getElementById('widget-cert-progress');
        const selector = document.getElementById('cert-selector');

        if (!container || !section) return;

        // Always show the section so user can select a certification
        section.style.display = 'block';

        // Get selected certification from dropdown (already loaded from database by setupCertificationSelector)
        const selectedCert = selector ? selector.value : '';
        if (!selectedCert || selectedCert === '') {
            container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Select a certification above to view requirements</p>';
            return;
        }

        // Get requirements based on certification
        const requirements = this.getCertificationRequirements(selectedCert);
        if (!requirements) {
            container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">No requirements defined for this certification</p>';
            return;
        }

        // Debug log for instrument rating
        if (selectedCert === 'instrument') {
            console.log('[TrainingWidget] Updating instrument requirements with hours:', hours);
            console.log('[TrainingWidget] picXC:', hours.picXC, 'instrumentDualAirplane:', hours.instrumentDualAirplane, 'recentInstrument:', hours.recentInstrument);
        }

        // Clear existing panels
        container.innerHTML = '';

        // Create collapsible panel for each requirement
        requirements.forEach((req, index) => {
            const currentHours = hours[req.hoursKey] || 0;
            const requiredHours = req.required;
            const progress = Math.min((currentHours / requiredHours) * 100, 100);
            const isComplete = currentHours >= requiredHours;
            const remaining = Math.max(requiredHours - currentHours, 0);

            const panel = document.createElement('div');
            panel.className = 'cert-requirement-panel';

            // Special handling for non-hour requirements
            if (req.isSpecial) {
                panel.innerHTML = `
                    <div class="cert-requirement-panel-header ${isComplete ? 'complete' : ''}">
                        <div class="cert-requirement-panel-title">
                            <span class="status-icon">${isComplete ? '✅' : '⏳'}</span>
                            <span>${req.label}</span>
                        </div>
                        <div class="cert-requirement-panel-values">
                            <span class="current-value" style="font-size: 16px;">${isComplete ? '✓ Done' : 'Pending'}</span>
                        </div>
                    </div>
                    <div class="cert-requirement-panel-body expanded">
                        ${req.notes ? `<p style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin: 0;">${req.notes}</p>` : ''}
                    </div>
                `;
            } else {
                panel.innerHTML = `
                    <div class="cert-requirement-panel-header ${isComplete ? 'complete' : ''}">
                        <div class="cert-requirement-panel-title">
                            <span class="status-icon">${isComplete ? '✅' : '⏳'}</span>
                            <span>${req.label}</span>
                        </div>
                        <div class="cert-requirement-panel-values">
                            <span class="current-value">${currentHours.toFixed(1)}</span>
                            <span class="required-value">of ${requiredHours} hours</span>
                        </div>
                    </div>
                    <div class="cert-requirement-panel-body expanded">
                        <div class="cert-progress-bar-container" style="margin-bottom: 10px;">
                            <div class="cert-progress-bar-fill ${isComplete ? 'complete' : ''}" style="width: ${progress}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                            <span>${isComplete ? 'Complete' : `${remaining.toFixed(1)} hrs left`}</span>
                            <span>${progress.toFixed(0)}%</span>
                        </div>
                        ${req.notes ? `<p style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin: 0;">${req.notes}</p>` : ''}
                    </div>
                `;
            }
            container.appendChild(panel);
        });
    },

    // Toggle collapsible panel
    togglePanel: function(index) {
        const body = document.getElementById(`cert-panel-${index}`);
        const chevron = body.previousElementSibling.querySelector('.chevron');

        if (body.classList.contains('expanded')) {
            body.classList.remove('expanded');
            chevron.classList.remove('expanded');
        } else {
            body.classList.add('expanded');
            chevron.classList.add('expanded');
        }
    },

    // Toggle entire certification section
    toggleCertSection: function() {
        const body = document.getElementById('cert-section-body');
        const chevron = document.getElementById('cert-section-chevron');

        if (body.classList.contains('expanded')) {
            body.classList.remove('expanded');
            chevron.classList.remove('expanded');
        } else {
            body.classList.add('expanded');
            chevron.classList.add('expanded');
        }
    },

    // Get certification requirements
    getCertificationRequirements: function(certType) {
        const requirements = {
            'private': [
                {
                    label: 'Total Flight Time',
                    required: 40,
                    hoursKey: 'total',
                    notes: 'Minimum 40 hours total time including at least 20 hours dual instruction and 10 hours solo.'
                },
                {
                    label: 'Solo Flight Time',
                    required: 10,
                    hoursKey: 'pic',
                    notes: 'At least 10 hours of solo flight time including cross-country and night solo.'
                },
                {
                    label: 'Solo Cross-Country',
                    required: 5,
                    hoursKey: 'crossCountry',
                    notes: '5 hours solo cross-country including one flight of 150nm total with full-stop landings at 3 points, one leg at least 50nm.'
                },
                {
                    label: 'Instrument Training',
                    required: 3,
                    hoursKey: 'instrumentTotal',
                    notes: '3 hours of instrument training in a single-engine airplane.'
                },
                {
                    label: 'Night Training',
                    required: 3,
                    hoursKey: 'night',
                    notes: '3 hours night flight training including one cross-country over 100nm and 10 takeoffs and 10 landings.'
                }
            ],
            'ir': [
                {
                    label: '50 hours PIC cross country',
                    required: 50,
                    hoursKey: 'picXC',
                    notes: '50 hours of cross-country flight time as pilot in command.'
                },
                {
                    label: '10 hours PIC XC in airplanes',
                    required: 10,
                    hoursKey: 'picXC',
                    notes: '10 hours of PIC cross-country time in airplanes for an instrument-airplane rating.'
                },
                {
                    label: '40 hours actual or simulated instrument',
                    required: 40,
                    hoursKey: 'instrumentTotal',
                    notes: '40 hours of actual or simulated instrument time. Your total includes actual instrument, simulated instrument (hood/foggles), and simulator time (up to 20 hours of BATD).'
                },
                {
                    label: '15 hours instrument training from instructor',
                    required: 15,
                    hoursKey: 'instrumentDualAirplane',
                    notes: '15 hours of instrument flight training from an authorized instructor in the aircraft category for the rating.'
                },
                {
                    label: 'One 250nm XC: 3 approaches, 3 approach types',
                    required: 1,
                    hoursKey: 'ir250nmXC',
                    notes: 'One cross-country flight in an airplane under IFR of at least 250nm along airways or ATC-directed routing with an instrument approach at each airport and three different kinds of approaches.',
                    isSpecial: true
                },
                {
                    label: '3 hours instrument training (last 2 months)',
                    required: 3,
                    hoursKey: 'recentInstrument',
                    notes: '3 hours of instrument training from an authorized instructor within 2 calendar months before the practical test in preparation for the test.'
                }
            ],
            'cpl': [
                {
                    label: 'Total Flight Time',
                    required: 250,
                    hoursKey: 'total',
                    notes: '250 hours total time as a pilot including specific training requirements.'
                },
                {
                    label: 'PIC Time',
                    required: 100,
                    hoursKey: 'pic',
                    notes: '100 hours as pilot in command including 50 hours in airplanes and 50 hours of cross-country.'
                },
                {
                    label: 'Cross Country',
                    required: 50,
                    hoursKey: 'crossCountry',
                    notes: '50 hours of cross-country PIC time including one flight of at least 300nm with landings at 3 points.'
                },
                {
                    label: 'Instrument Time',
                    required: 10,
                    hoursKey: 'instrumentTotal',
                    notes: '10 hours of instrument training including at least 5 hours in a single engine airplane.'
                },
                {
                    label: 'Night Time',
                    required: 5,
                    hoursKey: 'night',
                    notes: '5 hours of night flight time including 10 takeoffs and 10 landings.'
                }
            ],
            'cfi': [
                {
                    label: 'Total Flight Time',
                    required: 250,
                    hoursKey: 'total',
                    notes: '250 hours total time as a pilot.'
                },
                {
                    label: 'PIC Time',
                    required: 100,
                    hoursKey: 'pic',
                    notes: '100 hours as pilot in command.'
                },
                {
                    label: 'Cross Country',
                    required: 50,
                    hoursKey: 'crossCountry',
                    notes: '50 hours of cross-country flight time.'
                },
                {
                    label: 'Instrument Training',
                    required: 15,
                    hoursKey: 'instrumentTotal',
                    notes: '15 hours of instrument training (received as a student).'
                }
            ]
        };

        return requirements[certType] || null;
    },

    // Show import modal
    showImportModal: function() {
        console.log('[TrainingWidget] Opening import modal...');
        // Trigger the existing logbook file input
        const fileInput = document.getElementById('logbookFile');
        if (fileInput) {
            fileInput.click();
        }
    },

    // Handle import complete
    onImportComplete: function(hoursData, importInfo) {
        console.log('[TrainingWidget] Import complete:', hoursData, importInfo);

        // Update the widget display
        this.updateDisplayFromHours(hoursData);

        // Show the widget
        this.show();

        // Note: Don't save import history here - app.js already saved it with all calculated fields
        // Saving again would create duplicate database records
    },

    // Save import history
    saveImportHistory: async function(hoursData, importInfo) {
        try {
            const payload = {
                import_type: 'foreflight_csv',
                file_name: importInfo.fileName || 'logbook.csv',
                flights_imported: importInfo.flightCount || 0,
                hours_imported: {
                    total: hoursData.total || 0,
                    pic: hoursData.pic || 0,
                    pic_xc: hoursData.picXC || 0,
                    cross_country: hoursData.crossCountry || 0,
                    instrument_total: hoursData.instrumentTotal || 0,
                    instrument_dual_airplane: hoursData.instrumentDualAirplane || 0,
                    recent_instrument: hoursData.recentInstrument || 0,
                    ir_250nm_xc: hoursData.ir250nmXC || 0,
                    night: hoursData.night || 0,
                    sim_time: hoursData.simTime || 0,
                    actual_instrument: hoursData.actualInstrument || 0,
                    simulated_instrument: hoursData.simulatedInstrument || 0
                },
                notes: importInfo.notes || null
            };

            const response = await fetch('/api/import-history/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[TrainingWidget] Import history saved:', result);

                // Update display with the saved import data
                this.updateDisplay(result);
            } else {
                console.error('[TrainingWidget] Failed to save import history:', response.statusText);
            }
        } catch (error) {
            console.error('[TrainingWidget] Error saving import history:', error);
        }
    }
};

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TrainingWidget.init());
} else {
    TrainingWidget.init();
}
