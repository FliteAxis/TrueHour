// Training Progress Widget
const TrainingWidget = {
    // Initialize the widget
    init: function() {
        console.log('[TrainingWidget] Initializing...');
        this.loadLatestImport();

        // Show widget if data exists
        const hasData = this.checkForExistingData();
        if (hasData) {
            this.show();
        }
    },

    // Check if there's existing import data
    checkForExistingData: function() {
        const hours = localStorage.getItem('currentHours');
        return hours !== null;
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

    // Load latest import data
    loadLatestImport: async function() {
        try {
            const response = await fetch('/api/import-history/latest');
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    console.log('[TrainingWidget] Latest import:', data);
                    this.updateDisplay(data);
                    this.show();
                }
            }
        } catch (error) {
            console.error('[TrainingWidget] Error loading latest import:', error);
            // Try to load from localStorage as fallback
            this.loadFromLocalStorage();
        }
    },

    // Load from localStorage (fallback)
    loadFromLocalStorage: function() {
        const hoursData = localStorage.getItem('currentHours');
        if (hoursData) {
            try {
                const hours = JSON.parse(hoursData);
                console.log('[TrainingWidget] Loaded from localStorage:', hours);
                this.updateDisplayFromHours(hours);
                this.show();
            } catch (error) {
                console.error('[TrainingWidget] Error parsing localStorage data:', error);
            }
        }
    },

    // Update display from import history data
    updateDisplay: function(importData) {
        const hours = importData.hours_imported;

        // Update hour cards
        this.setHourValue('widget-total-hours', hours.total || 0);
        this.setHourValue('widget-pic-hours', hours.pic || 0);
        this.setHourValue('widget-xc-hours', hours.cross_country || 0);
        this.setHourValue('widget-instrument-hours', hours.instrument_total || 0);
        this.setHourValue('widget-night-hours', hours.night || 0);
        this.setHourValue('widget-sim-hours', hours.sim_time || 0);

        // Update import info
        this.updateImportInfo(importData);

        // Update certification progress if we have requirement data
        this.updateCertificationProgress(hours);
    },

    // Update display from hours object
    updateDisplayFromHours: function(hours) {
        this.setHourValue('widget-total-hours', hours.total || 0);
        this.setHourValue('widget-pic-hours', hours.pic || 0);
        this.setHourValue('widget-xc-hours', hours.crossCountry || 0);
        this.setHourValue('widget-instrument-hours', hours.instrumentTotal || 0);
        this.setHourValue('widget-night-hours', hours.night || 0);
        this.setHourValue('widget-sim-hours', hours.simTime || 0);

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

    // Update certification progress bars
    updateCertificationProgress: function(hours) {
        const container = document.getElementById('cert-progress-container');
        const section = document.getElementById('widget-cert-progress');

        if (!container || !section) return;

        // Check if we have selected certification requirements
        const selectedCert = localStorage.getItem('selectedCertification');
        if (!selectedCert) return;

        // Get requirements based on certification
        const requirements = this.getCertificationRequirements(selectedCert);
        if (!requirements) return;

        // Clear existing progress bars
        container.innerHTML = '';

        // Create progress bars for each requirement
        requirements.forEach(req => {
            const currentHours = hours[req.hoursKey] || 0;
            const requiredHours = req.required;
            const progress = Math.min((currentHours / requiredHours) * 100, 100);
            const isComplete = currentHours >= requiredHours;

            const progressItem = document.createElement('div');
            progressItem.className = 'cert-progress-item';
            progressItem.innerHTML = `
                <div class="cert-progress-header">
                    <div class="cert-progress-label">${req.label}</div>
                    <div class="cert-progress-values">${currentHours.toFixed(1)} / ${requiredHours} hrs</div>
                </div>
                <div class="cert-progress-bar-container">
                    <div class="cert-progress-bar-fill ${isComplete ? 'complete' : ''}" style="width: ${progress}%"></div>
                </div>
            `;
            container.appendChild(progressItem);
        });

        section.style.display = 'block';
    },

    // Get certification requirements
    getCertificationRequirements: function(certType) {
        const requirements = {
            'private': [
                { label: 'Total Flight Time', required: 40, hoursKey: 'total' },
                { label: 'PIC Time', required: 10, hoursKey: 'pic' },
                { label: 'Cross Country PIC', required: 5, hoursKey: 'crossCountry' },
                { label: 'Instrument Training', required: 3, hoursKey: 'instrumentTotal' },
                { label: 'Night Training', required: 3, hoursKey: 'night' }
            ],
            'instrument': [
                { label: 'Total Instrument Time', required: 40, hoursKey: 'instrumentTotal' },
                { label: 'Instrument XC', required: 50, hoursKey: 'crossCountry' }
            ],
            'commercial': [
                { label: 'Total Flight Time', required: 250, hoursKey: 'total' },
                { label: 'PIC Time', required: 100, hoursKey: 'pic' },
                { label: 'Cross Country', required: 50, hoursKey: 'crossCountry' },
                { label: 'Instrument Time', required: 10, hoursKey: 'instrumentTotal' },
                { label: 'Night Time', required: 5, hoursKey: 'night' }
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

        // Save import history to API
        this.saveImportHistory(hoursData, importInfo);
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
                    cross_country: hoursData.crossCountry || 0,
                    instrument_total: hoursData.instrumentTotal || 0,
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
