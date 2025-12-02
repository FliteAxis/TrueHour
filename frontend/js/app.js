var budgetChart = null;
var currentHours = {};
var aircraftData = {};
var preventAutoFill = false;
// Default aircraft removed - now managed by onboarding wizard and AircraftAPI
var defaultAircraft = [];

function toggleMenu() {
    var menu = document.getElementById('menuDropdown');
    menu.classList.toggle('open');
}

function saveBudget() {
    console.log('[saveBudget] Starting budget save');

    var budget = {
        version: '2.0',  // Increment version to include AircraftAPI data
        savedDate: new Date().toISOString(),
        currentHours: currentHours,
        settings: {
            targetCert: document.getElementById('targetCert').value,
            aircraft: [],
            lessonsPerWeek: parseFloat(document.getElementById('lessonsPerWeek').value) || 2,
            instructorRate: parseFloat(document.getElementById('instructorRate').value) || 60,
            simulatorRate: parseFloat(document.getElementById('simulatorRate').value) || 105,
            groundHours: parseFloat(document.getElementById('groundHours').value) || 0,
            headsetCost: parseFloat(document.getElementById('headsetCost').value) || 0,
            booksCost: parseFloat(document.getElementById('booksCost').value) || 0,
            bagCost: parseFloat(document.getElementById('bagCost').value) || 0,
            medicalCost: parseFloat(document.getElementById('medicalCost').value) || 300,
            knowledgeCost: parseFloat(document.getElementById('knowledgeCost').value) || 250,
            checkrideCost: parseFloat(document.getElementById('checkrideCost').value) || 1000,
            insuranceCost: parseFloat(document.getElementById('insuranceCost').value) || 1150,
            foreflightCost: parseFloat(document.getElementById('foreflightCost').value) || 275,
            onlineSchoolCost: parseFloat(document.getElementById('onlineSchoolCost').value) || 0,
            contingencyPercent: parseFloat(document.getElementById('contingencyPercent').value) || 20
        }
    };

    // Save aircraft from the old list (with hour allocations)
    var aircraftItems = document.querySelectorAll('#aircraftList .aircraft-item');
    console.log('[saveBudget] Found', aircraftItems.length, 'aircraft items in list');

    for (var i = 0; i < aircraftItems.length; i++) {
        var item = aircraftItems[i];

        // Get the aircraft ID from data attribute
        var aircraftIdDiv = item.querySelector('[data-aircraft-id]');
        var aircraftId = aircraftIdDiv ? aircraftIdDiv.getAttribute('data-aircraft-id') : '';

        // Get make, model, registration from separate fields
        var make = item.querySelector('.aircraft-make').value.trim();
        var model = item.querySelector('.aircraft-model').value.trim();
        var registration = item.querySelector('.aircraft-registration').value.trim();

        var aircraft = {
            id: aircraftId,
            make: make,
            model: model,
            registration: registration,
            rateType: item.querySelector('.aircraft-rate-type').value,
            baseRate: parseFloat(item.querySelector('.aircraft-base-rate').value) || 0,
            fuelPrice: parseFloat(item.querySelector('.fuel-price').value) || 0,
            fuelBurn: parseFloat(item.querySelector('.fuel-burn').value) || 0,
            dualHours: parseFloat(item.querySelector('.aircraft-dual-hours').value) || 0,
            soloHours: parseFloat(item.querySelector('.aircraft-solo-hours').value) || 0,
            familyHours: parseFloat(item.querySelector('.aircraft-family-hours').value) || 0
        };
        budget.settings.aircraft.push(aircraft);
    }

    // ALSO save AircraftAPI data (with make/model/registration)
    if (typeof AircraftAPI !== 'undefined' && AircraftAPI.getAllAircraft) {
        budget.aircraftConfig = AircraftAPI.getAllAircraft();
        console.log('[saveBudget] Saved', budget.aircraftConfig.length, 'aircraft from AircraftAPI');
    }

    var jsonStr = JSON.stringify(budget, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'flight-training-budget-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById('menuDropdown').classList.remove('open');
}

function loadBudget(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var budget = JSON.parse(e.target.result);

            console.log('[loadBudget] Loading budget version:', budget.version);

            if (!budget.settings) {
                alert('Invalid budget file format.');
                return;
            }

            // Restore AircraftAPI data first (if available)
            if (budget.aircraftConfig && typeof AircraftAPI !== 'undefined') {
                console.log('[loadBudget] Restoring', budget.aircraftConfig.length, 'aircraft to AircraftAPI');

                // Clear existing aircraft
                var existing = AircraftAPI.getAllAircraft();
                existing.forEach(function(ac) {
                    AircraftAPI.deleteAircraft(ac.id);
                });

                // Add saved aircraft
                budget.aircraftConfig.forEach(function(ac) {
                    AircraftAPI.addAircraft(ac);
                });

                // Refresh aircraft dropdown
                if (typeof refreshAircraftDropdown === 'function') {
                    refreshAircraftDropdown();
                }
            }

            if (budget.currentHours) {
                currentHours = budget.currentHours;
                
                if (currentHours.totalTime && currentHours.totalTime > 0) {
                    document.getElementById('logbookSummary').style.display = 'block';
                    document.getElementById('summaryTotalTime').textContent = currentHours.totalTime.toFixed(1);
                    document.getElementById('summaryPICTime').textContent = currentHours.picTime.toFixed(1);
                    document.getElementById('summaryXCTime').textContent = currentHours.picXC.toFixed(1);
                    document.getElementById('summaryDualTime').textContent = currentHours.dualReceived.toFixed(1);
                    document.getElementById('summaryInstrumentTime').textContent = currentHours.instrumentTotal.toFixed(1);
                    document.getElementById('summaryActualInstrument').textContent = currentHours.actualInstrument.toFixed(1);
                    document.getElementById('summarySimulatedInstrument').textContent = currentHours.simulatedInstrument.toFixed(1);
                    
                    var simTimeElement = document.getElementById('summarySimTime');
                    simTimeElement.textContent = currentHours.simInstrumentTime.toFixed(1);
                    
                    var container = document.getElementById('summarySimTimeContainer');
                    if (container && !container.querySelector('.sim-max-text')) {
                        var maxText = document.createElement('span');
                        maxText.className = 'sim-max-text';
                        maxText.style.fontSize = '0.6em';
                        maxText.style.color = '#999';
                        maxText.style.marginLeft = '8px';
                        maxText.textContent = '/ 20 max';
                        container.appendChild(maxText);
                    }
                    
                    document.getElementById('summaryInstrumentDualAirplane').textContent = currentHours.instrumentDualAirplane.toFixed(1);
                    document.getElementById('summaryRecentInstrument').textContent = currentHours.recentInstrument.toFixed(1);
                }
            } else {
                currentHours = {};
            }

            console.log('[loadBudget] Clearing aircraftList');
            document.getElementById('aircraftList').innerHTML = '';

            var settings = budget.settings;
            console.log('[loadBudget] Loading settings:', settings);

            document.getElementById('targetCert').value = settings.targetCert || '';
            document.getElementById('lessonsPerWeek').value = settings.lessonsPerWeek || 2;
            document.getElementById('instructorRate').value = settings.instructorRate || 60;
            document.getElementById('simulatorRate').value = settings.simulatorRate || 105;
            document.getElementById('groundHours').value = settings.groundHours || 0;
            document.getElementById('headsetCost').value = settings.headsetCost || 0;
            document.getElementById('booksCost').value = settings.booksCost || 0;
            document.getElementById('bagCost').value = settings.bagCost || 0;
            document.getElementById('medicalCost').value = settings.medicalCost || 300;
            document.getElementById('knowledgeCost').value = settings.knowledgeCost || 250;
            document.getElementById('checkrideCost').value = settings.checkrideCost || 1000;
            document.getElementById('insuranceCost').value = settings.insuranceCost || 1150;
            document.getElementById('foreflightCost').value = settings.foreflightCost || 275;
            document.getElementById('onlineSchoolCost').value = settings.onlineSchoolCost || 0;
            document.getElementById('contingencyPercent').value = settings.contingencyPercent || 20;

            console.log('[loadBudget] Checking aircraft array:', settings.aircraft);
            if (settings.aircraft && settings.aircraft.length > 0) {
                console.log('[loadBudget] Loading', settings.aircraft.length, 'aircraft from save file');

                // Show the aircraft list before adding items
                var aircraftListElement = document.getElementById('aircraftList');
                aircraftListElement.style.display = 'block';
                console.log('[loadBudget] Set aircraftList display to block');

                for (var i = 0; i < settings.aircraft.length; i++) {
                    var ac = settings.aircraft[i];
                    console.log('[loadBudget] Adding aircraft', i + 1, ':', ac);

                    addAircraft({
                        id: ac.id,
                        make: ac.make,
                        model: ac.model,
                        registration: ac.registration,
                        rate: ac.baseRate,
                        type: ac.rateType,
                        fuelPrice: ac.fuelPrice,
                        fuelBurn: ac.fuelBurn
                    });

                    var items = document.querySelectorAll('#aircraftList .aircraft-item');
                    console.log('[loadBudget] After addAircraft, total items in list:', items.length);

                    var item = items[items.length - 1];
                    if (item) {
                        item.querySelector('.aircraft-dual-hours').value = ac.dualHours || 0;
                        item.querySelector('.aircraft-solo-hours').value = ac.soloHours || 0;
                        item.querySelector('.aircraft-family-hours').value = ac.familyHours || 0;
                        console.log('[loadBudget] Set hours for aircraft:', ac.dualHours, ac.soloHours, ac.familyHours);
                    } else {
                        console.error('[loadBudget] Could not find item to set hours!');
                    }
                }
                console.log('[loadBudget] Finished loading all aircraft');
            } else {
                console.log('[loadBudget] No aircraft in save file, using defaults');
                for (var i = 0; i < defaultAircraft.length; i++) {
                    addAircraft(defaultAircraft[i]);
                }
            }

            calculate();
            
            preventAutoFill = true;
            updateDisplay();
            preventAutoFill = false;
            
            document.getElementById('menuDropdown').classList.remove('open');
            document.getElementById('budgetFileInput').value = '';
            
            alert('Budget loaded successfully!');
        } catch (error) {
            alert('Error loading budget file: ' + error.message);
            document.getElementById('budgetFileInput').value = '';
        }
    };
    reader.readAsText(file);
}

function init() {
    for (var i = 0; i < defaultAircraft.length; i++) {
        addAircraft(defaultAircraft[i]);
    }
    
    document.getElementById('addAircraftBtn').addEventListener('click', function() { addAircraft(); });
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('logbookFile').addEventListener('change', parseLogbook);
    document.getElementById('targetCert').addEventListener('change', updateDisplay);
    
    // Hamburger menu
    document.getElementById('hamburgerMenu').addEventListener('click', toggleMenu);
    document.getElementById('saveBudgetBtn').addEventListener('click', saveBudget);
    document.getElementById('loadBudgetBtn').addEventListener('click', function() {
        document.getElementById('budgetFileInput').click();
    });
    document.getElementById('budgetFileInput').addEventListener('change', loadBudget);
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        var menu = document.getElementById('menuDropdown');
        var hamburger = document.getElementById('hamburgerMenu');
        if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
            menu.classList.remove('open');
        }
    });
    
    var instrumentHeader = document.getElementById('instrumentDetailsHeader');
    if (instrumentHeader) {
        instrumentHeader.addEventListener('click', function() {
            var content = document.getElementById('instrumentDetails');
            var icon = document.getElementById('instrumentDetailsIcon');
            if (content) content.classList.toggle('open');
            if (icon) icon.classList.toggle('open');
        });
    }
    
    var inputs = document.querySelectorAll('.input-field');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('input', calculate);
    }
    
    document.getElementById('aircraftList').addEventListener('change', function(e) {
        if (e.target.classList.contains('aircraft-rate-type')) {
            var aircraftItem = e.target.closest('.aircraft-item');
            var fuelInputs = aircraftItem.querySelector('.fuel-inputs');
            if (e.target.value === 'wet') {
                fuelInputs.classList.add('hidden');
            } else {
                fuelInputs.classList.remove('hidden');
            }
            calculate();
        }
    });
    
    document.getElementById('aircraftList').addEventListener('input', calculate);
    calculate();
}

function exportToPDF() {
    var cert = document.getElementById('targetCert').value;
    var filename = 'flight-training-budget-' + (cert || 'general') + '.pdf';
    
    var element = document.querySelector('.main-container');
    var opt = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    var btn = document.getElementById('exportPdfBtn');
    var originalText = btn.textContent;
    btn.textContent = 'Generating PDF...';
    btn.disabled = true;
    
    html2pdf().set(opt).from(element).save().then(function() {
        btn.textContent = originalText;
        btn.disabled = false;
    }).catch(function(error) {
        console.error('PDF generation error:', error);
        btn.textContent = originalText;
        btn.disabled = false;
        alert('Error generating PDF. Please try again.');
    });
}

function addAircraft(defaults) {
    console.log('[addAircraft] Called with defaults:', defaults);

    defaults = defaults || null;
    var newItem = document.createElement('div');
    newItem.className = 'aircraft-item';

    // Extract aircraft details from defaults or AircraftAPI
    var aircraftId = defaults ? defaults.id : '';
    var make = '';
    var model = '';
    var registration = '';

    if (defaults && defaults.id && typeof AircraftAPI !== 'undefined') {
        console.log('[addAircraft] Looking up aircraft in AircraftAPI with id:', defaults.id);
        // Try to find this aircraft in AircraftAPI by matching registration or type
        var allAircraft = AircraftAPI.getAllAircraft();
        var matchedAircraft = allAircraft.find(function(ac) {
            return ac.registration === defaults.id || ac.type === defaults.id || ac.id === defaults.id;
        });

        if (matchedAircraft) {
            console.log('[addAircraft] Found match in AircraftAPI:', matchedAircraft);
            // Extract make and model from type (format: "Make Model")
            var typeParts = (matchedAircraft.type || '').split(' ');
            make = typeParts[0] || '';
            model = typeParts.slice(1).join(' ') || '';
            registration = matchedAircraft.registration || '';
            aircraftId = matchedAircraft.id;
        } else {
            console.log('[addAircraft] No match found in AircraftAPI');
        }
    } else if (defaults && defaults.make && defaults.model) {
        console.log('[addAircraft] Using direct make/model/registration from defaults');
        // Direct make/model/registration provided
        make = defaults.make;
        model = defaults.model;
        registration = defaults.registration || '';
    }

    console.log('[addAircraft] Final values - make:', make, 'model:', model, 'registration:', registration);

    var rateType = defaults ? defaults.type : 'wet';
    var baseRate = defaults ? defaults.rate : 120;
    var fuelPrice = defaults ? defaults.fuelPrice : 6.5;
    var fuelBurn = defaults ? defaults.fuelBurn : 8;

    var isDefault = defaults && (defaults.id === 'PA28-151' || defaults.id === 'C-172' || defaults.id === 'C-R182' || defaults.id === 'PA28-181');
    var showRemove = !isDefault;

    // Build HTML with separate fields for make, model, registration
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px;" data-aircraft-id="' + aircraftId + '">';
    html += '<div><label style="font-size:0.85em;color:#666;">Make</label>';
    html += '<input type="text" class="input-field aircraft-make" placeholder="e.g., Cessna" value="' + make + '"></div>';
    html += '<div><label style="font-size:0.85em;color:#666;">Model</label>';
    html += '<input type="text" class="input-field aircraft-model" placeholder="e.g., 172" value="' + model + '"></div>';
    html += '<div><label style="font-size:0.85em;color:#666;">Registration</label>';
    html += '<input type="text" class="input-field aircraft-registration" placeholder="e.g., N12345" value="' + registration + '"></div>';
    html += '</div>';

    html += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">';
    html += '<select class="input-field aircraft-rate-type">';
    html += '<option value="wet"' + (rateType === 'wet' ? ' selected' : '') + '>Wet</option>';
    html += '<option value="dry"' + (rateType === 'dry' ? ' selected' : '') + '>Dry</option>';
    html += '</select>';
    html += '<div class="aircraft-rate-section">';
    html += '<span style="color: #999;">$</span>';
    html += '<input type="number" class="input-field aircraft-base-rate" value="' + baseRate + '">';
    html += '<span class="input-unit">/hr</span>';
    html += '</div>';
    html += showRemove ? '<button class="btn-remove aircraft-remove">Remove</button>' : '<span></span>';
    html += '</div>';

    html += '<div class="fuel-inputs' + (rateType === 'wet' ? ' hidden' : '') + '">';
    html += '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:0.9em;color:#666;">Fuel: $</span>';
    html += '<input type="number" class="input-field fuel-price" value="' + fuelPrice + '" step="0.01">';
    html += '<span class="input-unit">/gal</span></div>';
    html += '<div style="display:flex;align-items:center;gap:10px;">';
    html += '<input type="number" class="input-field fuel-burn" value="' + fuelBurn + '" step="0.1">';
    html += '<span class="input-unit">gal/hr</span></div></div>';
    html += '<div class="aircraft-item-row2">';
    html += '<div class="hour-input-group"><label>Dual:</label><div class="hour-input-row">';
    html += '<input type="number" class="input-field hour-input aircraft-dual-hours" value="0" step="0.1"><span style="font-size:0.85em;color:#999;">hrs</span></div>';
    html += '<div class="hour-cost-display aircraft-dual-cost">$0</div></div>';
    html += '<div class="hour-input-group"><label>Solo:</label><div class="hour-input-row">';
    html += '<input type="number" class="input-field hour-input aircraft-solo-hours" value="0" step="0.1"><span style="font-size:0.85em;color:#999;">hrs</span></div>';
    html += '<div class="hour-cost-display aircraft-solo-cost">$0</div></div>';
    html += '<div class="hour-input-group"><label>Personal:</label><div class="hour-input-row">';
    html += '<input type="number" class="input-field hour-input aircraft-family-hours" value="0" step="0.1"><span style="font-size:0.85em;color:#999;">hrs</span></div>';
    html += '<div class="hour-cost-display aircraft-family-cost">$0</div></div>';
    html += '<div style="font-size:0.95em;color:#1e40af;font-weight:700;align-self:center;">Total: <span class="aircraft-total-cost">$0</span></div>';
    html += '</div>';

    newItem.innerHTML = html;

    var aircraftListElement = document.getElementById('aircraftList');
    console.log('[addAircraft] About to append to aircraftList. Current children count:', aircraftListElement.children.length);

    aircraftListElement.appendChild(newItem);

    console.log('[addAircraft] Appended aircraft item. New children count:', aircraftListElement.children.length);
    console.log('[addAircraft] aircraftList display style:', aircraftListElement.style.display);

    if (showRemove) {
        newItem.querySelector('.aircraft-remove').addEventListener('click', function() {
            newItem.remove();
            calculate();
        });
    }
}

/**
 * Shared ForeFlight CSV parser - used by both main app and onboarding wizard
 * @param {File} file - The CSV file to parse
 * @param {Object} callbacks - {onSuccess: function(validFlights, aircraftTableData), onError: function(errorMessage)}
 */
function parseForeFlight(file, callbacks) {
    console.log('[parseForeFlight] Starting parse of file:', file.name);

    var reader = new FileReader();
    reader.onerror = function(e) {
        console.error('[parseForeFlight] FileReader error:', e);
        callbacks.onError('Failed to read file');
    };

    reader.onload = function(e) {
        var text = e.target.result;
        var lines = text.split('\n');
        console.log('[parseForeFlight] File loaded:', lines.length, 'lines');

        // Validate ForeFlight export header
        if (lines.length === 0 || !lines[0].includes('ForeFlight Logbook Import')) {
            callbacks.onError('Not a valid ForeFlight export');
            return;
        }

        // Find Aircraft Table and Flights Table sections
        var aircraftIdx = -1;
        var flightsIdx = -1;

        for (var i = 0; i < lines.length; i++) {
            if (lines[i].includes('Aircraft Table')) {
                aircraftIdx = i + 1;
                console.log('[parseForeFlight] Found Aircraft Table at line', i);
            }
            if (lines[i].includes('Flights Table')) {
                // Find the actual header row
                for (var j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                    if (lines[j].includes('Date') && lines[j].includes('AircraftID')) {
                        flightsIdx = j;
                        console.log('[parseForeFlight] Found Flights Table header at line', j);
                        break;
                    }
                }
                break;
            }
        }

        if (flightsIdx === -1) {
            callbacks.onError('Could not find Flights Table in CSV');
            return;
        }

        var aircraftTableData = [];

        // Parse Aircraft Table section (if found)
        if (aircraftIdx > 0 && flightsIdx > aircraftIdx) {
            var aircraftCsv = lines.slice(aircraftIdx, flightsIdx - 1).join('\n');
            Papa.parse(aircraftCsv, {
                header: true,
                dynamicTyping: false,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log('[parseForeFlight] Aircraft parse complete:', results.data.length, 'aircraft');
                    aircraftTableData = results.data;

                    // Also populate global aircraftData for backward compatibility
                    for (var i = 0; i < results.data.length; i++) {
                        var aircraft = results.data[i];
                        if (aircraft.AircraftID) {
                            aircraftData[aircraft.AircraftID] = {
                                equipType: aircraft['equipType (FAA)'] || '',
                                aircraftClass: aircraft['aircraftClass (FAA)'] || '',
                                make: aircraft.Make || '',
                                model: aircraft.Model || '',
                                year: aircraft.Year || ''
                            };
                        }
                    }
                }
            });
        }

        // Parse Flights Table section
        var flightsCsv = lines.slice(flightsIdx).join('\n');
        Papa.parse(flightsCsv, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('[parseForeFlight] Flights parse complete:', results.data.length, 'rows');

                // Filter valid flights
                var validFlights = results.data.filter(function(row) {
                    return row.Date && (row.TotalTime > 0 || row.SimulatedFlight > 0);
                });

                if (validFlights.length === 0) {
                    callbacks.onError('No valid flights found');
                    return;
                }

                console.log('[parseForeFlight] Success:', validFlights.length, 'valid flights');
                callbacks.onSuccess(validFlights, aircraftTableData);
            },
            error: function(error) {
                console.error('[parseForeFlight] Flights parse error:', error);
                callbacks.onError('Error parsing flights: ' + error.message);
            }
        });
    };

    reader.readAsText(file);
}

function parseLogbook(event) {
    var file = event.target.files[0];
    if (!file) return;

    var uploadArea = document.getElementById('fileUploadArea');

    // Helper function to update upload card status
    function updateUploadCard(state, title, message) {
        uploadArea.classList.remove('file-uploaded', 'file-upload-error');
        if (state === 'success') {
            uploadArea.classList.add('file-uploaded');
        } else if (state === 'error') {
            uploadArea.classList.add('file-upload-error');
        }

        var h3 = uploadArea.querySelector('h3');
        var p = uploadArea.querySelector('p');
        if (h3) h3.textContent = title;
        if (p) {
            if (message.includes('<br>')) {
                p.innerHTML = message;
            } else {
                p.textContent = message;
            }
        }
    }

    updateUploadCard('success', 'Processing...', 'Reading file...');

    // Use shared parser
    parseForeFlight(file, {
        onSuccess: function(validFlights, aircraftTableData) {
            // Count actual vs simulator flights
            var actualFlights = 0;
            var simFlights = 0;

            for (var i = 0; i < validFlights.length; i++) {
                var row = validFlights[i];
                var aircraftId = row.AircraftID || '';
                var isSimulator = false;

                if (aircraftData[aircraftId]) {
                    var equipType = (aircraftData[aircraftId].equipType || '').toLowerCase();
                    isSimulator = equipType === 'batd' || equipType === 'aatd' || equipType === 'ftd';
                }

                if (isSimulator) {
                    simFlights++;
                } else {
                    actualFlights++;
                }
            }

            processLogbook(validFlights);

            // Create detailed message
            var message = 'Processed ' + actualFlights + ' flight' + (actualFlights !== 1 ? 's' : '');
            if (simFlights > 0) {
                message += ' and ' + simFlights + ' simulator session' + (simFlights !== 1 ? 's' : '');
            }
            message += '.<br>Select a certification to auto-fill remaining hours needed.';
            updateUploadCard('success', 'Logbook Imported: ' + file.name, message);

            // Prompt to import aircraft from CSV
            if (typeof showCSVImportModal === 'function') {
                setTimeout(function() {
                    showAircraftImportPrompt(validFlights, aircraftData);
                }, 500);
            }
        },
        onError: function(errorMessage) {
            updateUploadCard('error', 'Error', errorMessage);
            document.getElementById('logbookFile').value = '';
        }
    });
}

// Store data for aircraft import prompt
var pendingAircraftImportData = null;

function showAircraftImportPrompt(validFlights, aircraftData) {
    // Store data for later use
    pendingAircraftImportData = { validFlights: validFlights, aircraftData: aircraftData };

    // Show the prompt modal
    document.getElementById('aircraftImportPromptModal').style.display = 'flex';
}

function closeAircraftImportPrompt() {
    document.getElementById('aircraftImportPromptModal').style.display = 'none';
    pendingAircraftImportData = null;
}

function confirmAircraftImport() {
    console.log('confirmAircraftImport called');
    console.log('pendingAircraftImportData:', pendingAircraftImportData);
    console.log('typeof showCSVImportModal:', typeof showCSVImportModal);

    // Save the data BEFORE closing the prompt (which clears it)
    const savedData = pendingAircraftImportData;

    closeAircraftImportPrompt();

    if (savedData && typeof showCSVImportModal === 'function') {
        console.log('Calling showCSVImportModal with:', savedData.validFlights.length, 'flights');
        showCSVImportModal(savedData.validFlights, savedData.aircraftData);
    } else {
        console.error('Cannot call showCSVImportModal:', {
            hasPendingData: !!savedData,
            functionExists: typeof showCSVImportModal === 'function'
        });
    }
}

function processLogbook(data) {
    currentHours = {
        totalTime: 0, picTime: 0, picXC: 0, xcTime: 0, dualReceived: 0,
        instrumentTotal: 0, actualInstrument: 0, simulatedInstrument: 0,
        simTime: 0, simInstrumentTime: 0, batdTime: 0, instrumentDualAirplane: 0, recentInstrument: 0,
        complexTime: 0, ir250nmXC: 0, nightTime: 0, dayXC: 0, nightXC: 0, soloLongXC: 0, longXC: 0
    };

    var twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (!row.Date) continue;
        
        var totalTime = row.TotalTime || 0;
        var pic = row.PIC || 0;
        var xc = row.CrossCountry || 0;
        var dual = row.DualReceived || 0;
        var actual = row.ActualInstrument || 0;
        var simulated = row.SimulatedInstrument || 0;
        var simulator = row.SimulatedFlight || 0;
        var complex = row['[Hours]Complex'] || 0;
        var aircraftId = row.AircraftID || '';

        currentHours.totalTime += totalTime;
        currentHours.picTime += pic;
        currentHours.xcTime += xc;
        currentHours.dualReceived += dual;
        currentHours.complexTime += complex;

        var isSimulator = false;
        var isBATD = false;
        if (aircraftData[aircraftId]) {
            var equipType = (aircraftData[aircraftId].equipType || '').toLowerCase();
            isSimulator = equipType === 'batd' || equipType === 'aatd' || equipType === 'ftd';
            isBATD = equipType === 'batd';
        }
        
        if (isSimulator) {
            currentHours.simTime += simulator;
            currentHours.simInstrumentTime += simulated;
            
            if (isBATD && simulator > 0) {
                currentHours.batdTime += simulator;
            }
            
            currentHours.instrumentTotal += simulated;
        } else {
            currentHours.actualInstrument += actual;
            currentHours.simulatedInstrument += simulated;
            currentHours.instrumentTotal += actual + simulated;
        }

        if (pic > 0 && xc > 0) {
            currentHours.picXC += Math.min(pic, xc, totalTime);
        }

        if (!isSimulator && dual > 0 && (actual > 0 || simulated > 0)) {
            currentHours.instrumentDualAirplane += Math.min(dual, actual + simulated, totalTime);
        }

        var flightDate = new Date(row.Date);
        if (!isSimulator && flightDate >= twoMonthsAgo && dual > 0 && (actual > 0 || simulated > 0)) {
            currentHours.recentInstrument += Math.min(dual, actual + simulated, totalTime);
        }

        // Check for IR 250nm XC requirement: >=250nm with 3 approaches (3 types)
        var distance = row.Distance || 0;
        if (!isSimulator && distance >= 250 && xc > 0) {
            // Count approaches
            var approaches = [];
            if (row.Approach1) approaches.push(row.Approach1);
            if (row.Approach2) approaches.push(row.Approach2);
            if (row.Approach3) approaches.push(row.Approach3);
            if (row.Approach4) approaches.push(row.Approach4);
            if (row.Approach5) approaches.push(row.Approach5);
            if (row.Approach6) approaches.push(row.Approach6);

            // Extract approach types from approach strings (format: "count;type;...")
            var approachTypes = new Set();
            for (var j = 0; j < approaches.length; j++) {
                var parts = approaches[j].split(';');
                if (parts.length >= 2) {
                    var type = parts[1].trim().toUpperCase();
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
                currentHours.ir250nmXC = 1;
            }
        }
    }

    document.getElementById('logbookSummary').style.display = 'block';
    document.getElementById('summaryTotalTime').textContent = currentHours.totalTime.toFixed(1);
    document.getElementById('summaryPICTime').textContent = currentHours.picTime.toFixed(1);
    document.getElementById('summaryXCTime').textContent = currentHours.picXC.toFixed(1);
    document.getElementById('summaryDualTime').textContent = currentHours.dualReceived.toFixed(1);
    
    document.getElementById('summaryInstrumentTime').textContent = currentHours.instrumentTotal.toFixed(1);
    document.getElementById('summaryActualInstrument').textContent = currentHours.actualInstrument.toFixed(1);
    document.getElementById('summarySimulatedInstrument').textContent = currentHours.simulatedInstrument.toFixed(1);
    
    var simTimeElement = document.getElementById('summarySimTime');
    simTimeElement.textContent = currentHours.simInstrumentTime.toFixed(1);
    
    var container = document.getElementById('summarySimTimeContainer');
    if (container && !container.querySelector('.sim-max-text')) {
        var maxText = document.createElement('span');
        maxText.className = 'sim-max-text';
        maxText.style.fontSize = '0.6em';
        maxText.style.color = '#999';
        maxText.style.marginLeft = '8px';
        maxText.textContent = '/ 20 max';
        container.appendChild(maxText);
    }
    
    document.getElementById('summaryInstrumentDualAirplane').textContent = currentHours.instrumentDualAirplane.toFixed(1);
    document.getElementById('summaryRecentInstrument').textContent = currentHours.recentInstrument.toFixed(1);

    updateDisplay();
}

function updateDisplay() {
    console.log('[updateDisplay] Starting - cert:', document.getElementById('targetCert').value, 'preventAutoFill:', preventAutoFill);

    var cert = document.getElementById('targetCert').value;
    if (!cert) {
        console.log('[updateDisplay] No cert selected, hiding requirements and clearing hours');
        document.getElementById('requirementsList').style.display = 'none';

        // Reset aircraft hours to 0 when no certification is selected
        if (!preventAutoFill) {
            var aircraftItems = document.querySelectorAll('#aircraftList .aircraft-item');
            console.log('[updateDisplay] Found', aircraftItems.length, 'aircraft items to clear');
            for (var i = 0; i < aircraftItems.length; i++) {
                var item = aircraftItems[i];
                var dualInput = item.querySelector('.aircraft-dual-hours');
                var soloInput = item.querySelector('.aircraft-solo-hours');

                if (dualInput) dualInput.value = '0';
                if (soloInput) soloInput.value = '0';
            }
            calculate();
        }
        return;
    }

    var requirements = {
        ir: [
            { name: '50 hours PIC cross country', required: 50, field: 'picXC', type: 'solo' },
            { name: '10 hours PIC XC in airplanes', required: 10, field: 'picXC', type: 'solo' },
            { name: '40 hours actual or simulated instrument', required: 40, field: 'instrumentTotal', type: 'dual', showBreakdown: true },
            { name: '15 hours instrument training from instructor', required: 15, field: 'instrumentDualAirplane', type: 'dual' },
            { name: 'One 250nm XC: 3 approaches, 3 approach types', required: 1, field: 'ir250nmXC', type: 'dual', isSpecial: true },
            { name: '3 hours instrument training (last 2 months)', required: 3, field: 'recentInstrument', type: 'dual' }
        ],
        cpl: [
            { name: '250 hours total time', required: 250, field: 'totalTime', type: 'solo' },
            { name: '100 hours PIC', required: 100, field: 'picTime', type: 'solo' },
            { name: '50 hours PIC in airplanes', required: 50, field: 'picTime', type: 'solo' },
            { name: '50 hours PIC cross country', required: 50, field: 'picXC', type: 'solo' },
            { name: '10 hours PIC XC in airplanes', required: 10, field: 'picXC', type: 'solo' },
            { name: '20 hours training (total)', required: 20, field: 'dualReceived', type: 'dual' },
            { name: '10 hours instrument training', required: 10, field: 'instrumentDualAirplane', type: 'dual' },
            { name: '5 hours instrument in single engine', required: 5, field: 'instrumentDualAirplane', type: 'dual' },
            { name: '10 hours complex or TAA', required: 10, field: 'complexTime', type: 'dual' },
            { name: 'One 2hr day XC (100nm+ from origin)', required: 1, field: 'dayXC', type: 'dual', isSpecial: true },
            { name: 'One 2hr night XC (100nm+ from origin)', required: 1, field: 'nightXC', type: 'dual', isSpecial: true },
            { name: '3 hours training (last 2 months)', required: 3, field: 'recentInstrument', type: 'dual' },
            { name: '10 hours solo or PIC time', required: 10, field: 'picTime', type: 'solo' },
            { name: 'One solo 300nm XC (one leg 250nm+)', required: 1, field: 'soloLongXC', type: 'solo', isSpecial: true },
            { name: '5 hours night VFR (10 T/O and landings)', required: 5, field: 'nightTime', type: 'solo', isSpecial: true }
        ],
        cfi: [
            { name: '250 hours total time', required: 250, field: 'totalTime', type: 'solo' },
            { name: '100 hours PIC', required: 100, field: 'picTime', type: 'solo' },
            { name: '50 hours PIC cross country', required: 50, field: 'picXC', type: 'solo' },
            { name: '15 hours instrument (in training)', required: 15, field: 'instrumentTotal', type: 'dual' }
        ]
    };

    var reqs = requirements[cert];
    if (!reqs) return;

    if (currentHours.totalTime) {
        document.getElementById('requirementsList').style.display = 'block';
    }
    
    var html = '';
    var totalDualNeeded = 0;
    var totalSoloNeeded = 0;
    
    for (var i = 0; i < reqs.length; i++) {
        var req = reqs[i];
        var current = currentHours[req.field] || 0;
        var needed = Math.max(req.required - current, 0);
        var pct = Math.min((current / req.required) * 100, 100);
        
        if (needed > 0 && !req.isSpecial) {
            if (req.type === 'dual') {
                totalDualNeeded = Math.max(totalDualNeeded, needed);
            } else {
                totalSoloNeeded = Math.max(totalSoloNeeded, needed);
            }
        }
        
        if (currentHours.totalTime) {
            var status = pct >= 100 ? 'completed' : (pct > 0 ? 'in-progress' : 'not-started');
            var badge = pct >= 100 ? 'badge-completed' : (pct > 0 ? 'badge-in-progress' : 'badge-not-started');
            var badgeText = pct >= 100 ? 'Complete' : (pct > 0 ? 'In Progress' : 'Not Started');

            html += '<div class="requirement-item ' + status + '">';
            html += '<div class="requirement-header"><div class="requirement-title">' + req.name + '</div>';
            html += '<div class="requirement-badge ' + badge + '">' + badgeText + '</div></div>';
            
            if (req.isSpecial) {
                html += '<div class="requirement-stats"><span>Special flight requirement</span>';
                html += '<span>' + (pct >= 100 ? 'Completed' : 'Not completed') + '</span></div>';
            } else {
                html += '<div class="requirement-stats"><span>' + current.toFixed(1) + ' / ' + req.required + ' hrs</span>';
                html += '<span>' + needed.toFixed(1) + ' hrs needed</span></div>';
            }
            
            if (req.showBreakdown && req.field === 'instrumentTotal') {
                html += '<div class="requirement-breakdown">';
                html += '(' + currentHours.batdTime.toFixed(1) + ' BATD hours included)<br>';
                html += '(' + currentHours.simInstrumentTime.toFixed(1) + ' total simulator hours included)';
                html += '</div>';
            }
            
            html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div></div>';
        }
    }

    if (currentHours.totalTime) {
        document.getElementById('requirementsContent').innerHTML = html;
    }

    console.log('[updateDisplay] Dual needed:', totalDualNeeded, 'Solo needed:', totalSoloNeeded);
    console.log('[updateDisplay] preventAutoFill:', preventAutoFill);

    if (!preventAutoFill) {
        var aircraftItems = document.querySelectorAll('#aircraftList .aircraft-item');
        console.log('[updateDisplay] Found', aircraftItems.length, 'aircraft items for auto-fill');

        if (aircraftItems.length > 0) {
            var firstAircraft = aircraftItems[0];
            var dualInput = firstAircraft.querySelector('.aircraft-dual-hours');
            var soloInput = firstAircraft.querySelector('.aircraft-solo-hours');

            console.log('[updateDisplay] Auto-filling first aircraft with dual:', totalDualNeeded.toFixed(1), 'solo:', totalSoloNeeded.toFixed(1));

            if (dualInput) dualInput.value = totalDualNeeded.toFixed(1);
            if (soloInput) soloInput.value = totalSoloNeeded.toFixed(1);

            calculate();
        } else {
            console.warn('[updateDisplay] No aircraft items found in DOM - cannot auto-fill');
        }
    } else {
        console.log('[updateDisplay] Auto-fill prevented');
    }
}

function calculate() {
    var groundHours = parseFloat(document.getElementById('groundHours').value) || 0;
    var instructorRate = parseFloat(document.getElementById('instructorRate').value) || 0;
    var totalFlightTrainingCost = 0;
    var totalFamilyFlightCost = 0;
    var totalDualHours = 0;
    var totalSoloHours = 0;
    var totalFamilyHours = 0;

    var aircraftItems = document.querySelectorAll('#aircraftList .aircraft-item');
    for (var i = 0; i < aircraftItems.length; i++) {
        var item = aircraftItems[i];
        var rateType = item.querySelector('.aircraft-rate-type').value;
        var aircraftRate = parseFloat(item.querySelector('.aircraft-base-rate').value) || 0;

        if (rateType === 'dry') {
            var fuelPrice = parseFloat(item.querySelector('.fuel-price').value) || 0;
            var fuelBurn = parseFloat(item.querySelector('.fuel-burn').value) || 0;
            aircraftRate = aircraftRate + (fuelPrice * fuelBurn);
        }

        var dualHours = parseFloat(item.querySelector('.aircraft-dual-hours').value) || 0;
        var soloHours = parseFloat(item.querySelector('.aircraft-solo-hours').value) || 0;
        var familyHours = parseFloat(item.querySelector('.aircraft-family-hours').value) || 0;

        var dualCost = dualHours * (aircraftRate + instructorRate);
        var soloCost = soloHours * aircraftRate;
        var familyCost = familyHours * aircraftRate;
        var aircraftTotal = dualCost + soloCost + familyCost;

        item.querySelector('.aircraft-dual-cost').textContent = '$' + dualCost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        item.querySelector('.aircraft-solo-cost').textContent = '$' + soloCost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        item.querySelector('.aircraft-family-cost').textContent = '$' + familyCost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        item.querySelector('.aircraft-total-cost').textContent = '$' + aircraftTotal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        totalFlightTrainingCost += dualCost + soloCost;
        totalFamilyFlightCost += familyCost;
        totalDualHours += dualHours;
        totalSoloHours += soloHours;
        totalFamilyHours += familyHours;
    }

    var groundCost = groundHours * instructorRate;
    var flightTrainingTotal = totalFlightTrainingCost + groundCost;

    document.getElementById('dualHours').value = totalDualHours.toFixed(1);
    document.getElementById('soloHours').value = totalSoloHours.toFixed(1);
    document.getElementById('familyHours').value = totalFamilyHours.toFixed(1);

    var headsetCost = parseFloat(document.getElementById('headsetCost').value) || 0;
    var booksCost = parseFloat(document.getElementById('booksCost').value) || 0;
    var bagCost = parseFloat(document.getElementById('bagCost').value) || 0;
    var gearTotal = headsetCost + booksCost + bagCost;

    var medicalCost = parseFloat(document.getElementById('medicalCost').value) || 0;
    var knowledgeCost = parseFloat(document.getElementById('knowledgeCost').value) || 0;
    var checkrideCost = parseFloat(document.getElementById('checkrideCost').value) || 0;
    var insuranceCost = parseFloat(document.getElementById('insuranceCost').value) || 0;
    var examsTotal = medicalCost + knowledgeCost + checkrideCost + insuranceCost;

    var foreflightCost = parseFloat(document.getElementById('foreflightCost').value) || 0;
    var onlineSchoolCost = parseFloat(document.getElementById('onlineSchoolCost').value) || 0;
    var subscriptionsTotal = foreflightCost + onlineSchoolCost;

    var subtotal = flightTrainingTotal + totalFamilyFlightCost + gearTotal + examsTotal + subscriptionsTotal;
    var contingencyPercent = parseFloat(document.getElementById('contingencyPercent').value) || 0;
    var contingency = subtotal * (contingencyPercent / 100);
    var grandTotal = subtotal + contingency;

    document.getElementById('flightTrainingCost').textContent = '$' + flightTrainingTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('familyFlightCost').textContent = '$' + totalFamilyFlightCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('gearCost').textContent = '$' + gearTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('examsCost').textContent = '$' + examsTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('subscriptionsCost').textContent = '$' + subscriptionsTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('subtotalCost').textContent = '$' + subtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('contingencyCost').textContent = '$' + contingency.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('totalCost').textContent = '$' + grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    var lessonsPerWeek = parseFloat(document.getElementById('lessonsPerWeek').value) || 2;
    var totalTrainingHours = totalDualHours + totalSoloHours;
    var avgHoursPerLesson = 1.5;
    
    if (totalTrainingHours > 0) {
        var weeksToComplete = totalTrainingHours / (lessonsPerWeek * avgHoursPerLesson);
        var monthsToComplete = weeksToComplete / 4.33;
        
        var trainingBudget = flightTrainingTotal + gearTotal + examsTotal + subscriptionsTotal;
        var trainingContingency = trainingBudget * (contingencyPercent / 100);
        var totalTrainingBudget = trainingBudget + trainingContingency;
        var monthlyBudget = totalTrainingBudget / monthsToComplete;
        
        document.getElementById('estimatedMonths').textContent = '~ ' + Math.ceil(monthsToComplete) + ' Months';
        document.getElementById('monthlyBudget').textContent = '$' + monthlyBudget.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
        document.getElementById('estimatedMonths').textContent = '~ 0 Months';
        document.getElementById('monthlyBudget').textContent = '$0.00';
    }

    updateBudgetChart(flightTrainingTotal, totalFamilyFlightCost, gearTotal, examsTotal, subscriptionsTotal, contingency);
}

function updateBudgetChart(training, family, gear, exams, subs, contingency) {
    var ctx = document.getElementById('budgetChart');
    if (!ctx) return;

    var chartData = {
        labels: ['Flight Training', 'Personal', 'Gear', 'Exams', 'Subscriptions', 'Contingency'],
        datasets: [{
            data: [training, family, gear, exams, subs, contingency],
            backgroundColor: ['#1e40af', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };

    if (budgetChart) {
        budgetChart.data = chartData;
        budgetChart.update();
    } else {
        budgetChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var total = 0;
                                for (var i = 0; i < context.dataset.data.length; i++) {
                                    total += context.dataset.data[i];
                                }
                                var pct = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': $' + context.parsed.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    var legendDiv = document.getElementById('chartLegend');
    var colors = chartData.datasets[0].backgroundColor;
    var total = 0;
    for (var i = 0; i < chartData.datasets[0].data.length; i++) {
        total += chartData.datasets[0].data[i];
    }
    
    var html = '';
    for (var i = 0; i < chartData.labels.length; i++) {
        var value = chartData.datasets[0].data[i];
        var pct = ((value / total) * 100).toFixed(1);
        html += '<div class="legend-item"><div class="legend-color" style="background:' + colors[i] + '"></div>';
        html += '<div class="legend-label">' + chartData.labels[i] + '</div>';
        html += '<div class="legend-value">$' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' (' + pct + '%)</div></div>';
    }
    legendDiv.innerHTML = html;
}

window.addEventListener('DOMContentLoaded', init);
