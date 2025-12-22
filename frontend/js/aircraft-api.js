/**
 * Aircraft API Module
 * Manages aircraft configuration with persistent storage via config.json
 */

const AircraftAPI = (function() {
    const CONFIG_URL = '/data/config.json';
    let config = null;
    let isDirty = false; // Track unsaved changes

    /**
     * Initialize the API - load config on startup
     */
    async function init() {
        try {
            await loadConfig();
            console.log('Aircraft API initialized');
            return true;
        } catch (error) {
            console.warn('Config not found, initializing empty:', error);
            config = {
                version: '1.0',
                defaultAircraftId: null,
                aircraft: []
            };
            return false;
        }
    }

    /**
     * Load configuration from server
     */
    async function loadConfig() {
        try {
            const response = await fetch(CONFIG_URL + '?t=' + Date.now()); // Cache bust
            if (!response.ok) throw new Error('Config not found');
            config = await response.json();
            isDirty = false;
            return config;
        } catch (error) {
            throw new Error('Failed to load config: ' + error.message);
        }
    }

    /**
     * Save configuration to server
     */
    async function saveConfig() {
        try {
            // Since nginx serves static files, we need a different approach
            // We'll use localStorage as a fallback until we add a backend
            localStorage.setItem('truehour-config', JSON.stringify(config));
            isDirty = false;
            console.log('Config saved to localStorage', config);
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        }
    }

    /**
     * Load config from localStorage if available
     */
    function loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('truehour-config');
            if (stored) {
                config = JSON.parse(stored);
                console.log('Config loaded from localStorage');
                return true;
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
        return false;
    }

    /**
     * Get all aircraft
     */
    function getAllAircraft() {
        if (!config) {
            loadFromLocalStorage();
        }
        return config ? config.aircraft : [];
    }

    /**
     * Get aircraft by ID
     */
    function getAircraft(id) {
        const aircraft = getAllAircraft();
        return aircraft.find(a => a.id === id);
    }

    /**
     * Get default aircraft ID
     */
    function getDefaultAircraftId() {
        if (!config) {
            loadFromLocalStorage();
        }
        return config ? config.defaultAircraftId : null;
    }

    /**
     * Get default aircraft
     */
    function getDefaultAircraft() {
        if (!config || !config.defaultAircraftId) return null;
        return getAircraft(config.defaultAircraftId);
    }

    /**
     * Add new aircraft
     */
    function addAircraft(aircraft) {
        if (!config) {
            config = {
                version: '1.0',
                defaultAircraftId: null,
                aircraft: []
            };
        }

        // Generate ID if not provided
        if (!aircraft.id) {
            // Use timestamp + random string to ensure uniqueness even in rapid succession
            aircraft.id = 'aircraft-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }

        // Check for duplicate ID
        if (getAircraft(aircraft.id)) {
            throw new Error('Aircraft with this ID already exists');
        }

        // Check for duplicate tail number/registration
        if (aircraft.registration && aircraft.registration.trim()) {
            const normalizedNewReg = aircraft.registration.trim().toUpperCase();
            const duplicate = config.aircraft.find(a =>
                a.registration && a.registration.trim().toUpperCase() === normalizedNewReg
            );
            if (duplicate) {
                throw new Error(`Aircraft with tail number ${aircraft.registration} already exists`);
            }
        }

        // Add required fields
        const newAircraft = {
            id: aircraft.id,
            type: aircraft.type || '',
            registration: aircraft.registration || '',
            make: aircraft.make || '',
            model: aircraft.model || '',
            year: aircraft.year || '',
            wetRate: parseFloat(aircraft.wetRate) || 0,
            dryRate: parseFloat(aircraft.dryRate) || 0,
            fuelPrice: parseFloat(aircraft.fuelPrice) || 0,
            fuelBurn: parseFloat(aircraft.fuelBurn) || 0,
            notes: aircraft.notes || '',
            source: aircraft.source || 'manual',
            lastFAACheck: aircraft.lastFAACheck || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        config.aircraft.push(newAircraft);
        isDirty = true;

        // Trigger auto-save if enabled
        if (typeof UserDataManager !== 'undefined' && UserDataManager.triggerAutoSave) {
            UserDataManager.triggerAutoSave();
        }

        // Set as default if first aircraft
        if (config.aircraft.length === 1) {
            config.defaultAircraftId = newAircraft.id;
        }

        return newAircraft;
    }

    /**
     * Update existing aircraft
     */
    function updateAircraft(id, updates) {
        const aircraft = getAircraft(id);
        if (!aircraft) {
            throw new Error('Aircraft not found');
        }

        // If updating registration, check for conflicts
        if (updates.registration && updates.registration.trim()) {
            const normalizedNewReg = updates.registration.trim().toUpperCase();
            const duplicate = config.aircraft.find(a =>
                a.id !== id &&
                a.registration &&
                a.registration.trim().toUpperCase() === normalizedNewReg
            );
            if (duplicate) {
                throw new Error(`Aircraft with tail number ${updates.registration} already exists`);
            }
        }

        // Update fields
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                aircraft[key] = updates[key];
            }
        });

        aircraft.updatedAt = new Date().toISOString();
        isDirty = true;

        // Trigger auto-save if enabled
        if (typeof UserDataManager !== 'undefined' && UserDataManager.triggerAutoSave) {
            UserDataManager.triggerAutoSave();
        }

        return aircraft;
    }

    /**
     * Delete aircraft
     */
    function deleteAircraft(id) {
        const index = config.aircraft.findIndex(a => a.id === id);
        if (index === -1) {
            throw new Error('Aircraft not found');
        }

        config.aircraft.splice(index, 1);
        isDirty = true;

        // Trigger auto-save if enabled
        if (typeof UserDataManager !== 'undefined' && UserDataManager.triggerAutoSave) {
            UserDataManager.triggerAutoSave();
        }

        // Update default if deleted
        if (config.defaultAircraftId === id) {
            config.defaultAircraftId = config.aircraft.length > 0 ? config.aircraft[0].id : null;
        }

        return true;
    }

    /**
     * Set default aircraft
     */
    function setDefaultAircraft(id) {
        if (id && !getAircraft(id)) {
            throw new Error('Aircraft not found');
        }

        config.defaultAircraftId = id;
        isDirty = true;

        // Trigger auto-save if enabled
        if (typeof UserDataManager !== 'undefined' && UserDataManager.triggerAutoSave) {
            UserDataManager.triggerAutoSave();
        }

        return true;
    }

    /**
     * Import aircraft from ForeFlight CSV data
     * Handles both flight records and aircraft table data
     */
    function importFromCSV(csvData, aircraftTableData) {
        const aircraftMap = new Map();

        // First, parse aircraft table if provided (has Make/Model)
        if (aircraftTableData && Array.isArray(aircraftTableData)) {
            aircraftTableData.forEach(row => {
                const id = row['AircraftID'] || row['Aircraft ID'];
                const make = row['Make'] || '';
                const model = row['Model'] || '';
                const year = row['Year'] || '';
                const equipType = (row['equipType (FAA)'] || row['equipType'] || '').toLowerCase();

                // Check if it's a simulator
                const isSimulator = equipType === 'aatd' || equipType === 'batd' || equipType === 'ftd';

                let type = (make + ' ' + model).trim();

                // If no type but it's a simulator, use equipment type
                if (!type && isSimulator) {
                    type = equipType.toUpperCase() + ' Simulator';
                }

                console.log(`Aircraft: ${id}, Make: "${make}", Model: "${model}", EquipType: "${equipType}", IsSimulator: ${isSimulator}, Type: "${type}"`);

                if (id && (type || isSimulator)) {
                    console.log(`  -> Adding aircraft ${id} to map`);
                    aircraftMap.set(id, {
                        registration: id,
                        make: make,
                        model: model,
                        year: year,
                        type: type,
                        source: 'foreflight',
                        totalTime: 0
                    });
                } else {
                    console.log(`  -> Skipping aircraft ${id} (no type and not simulator)`);
                }
            });
        }

        // Then parse flight records to get aircraft IDs and total time
        csvData.forEach(row => {
            // ForeFlight CSV can have different field names
            const id = row['AircraftID'] || row['Aircraft ID'] || row['aircraftID'];

            if (id) {
                // If we don't have this aircraft yet, try to construct from flight data
                if (!aircraftMap.has(id)) {
                    const make = row['Make'] || '';
                    const model = row['Model'] || '';
                    const year = row['Year'] || '';
                    let type = row['Aircraft Type'] || row['Type'];

                    if (!type && (make || model)) {
                        type = (make + ' ' + model).trim();
                    }

                    if (type) {
                        aircraftMap.set(id, {
                            registration: id,
                            make: make,
                            model: model,
                            year: year,
                            type: type,
                            source: 'foreflight',
                            totalTime: 0
                        });
                    }
                }

                // Track total time - try multiple field names
                // For simulators, use SimulatedFlight time instead of TotalTime
                if (aircraftMap.has(id)) {
                    const totalTime = parseFloat(row['TotalTime']) ||
                                    parseFloat(row['Total Time']) ||
                                    parseFloat(row['Flight Time']) || 0;
                    const simTime = parseFloat(row['SimulatedFlight']) || 0;

                    // Use simulator time if TotalTime is 0 but SimulatedFlight has time
                    const time = totalTime > 0 ? totalTime : simTime;
                    aircraftMap.get(id).totalTime += time;
                }
            }
        });

        const result = Array.from(aircraftMap.values());
        console.log('Final aircraft map:', result);
        return result;
    }

    /**
     * Check if there are unsaved changes
     */
    function hasUnsavedChanges() {
        return isDirty;
    }

    /**
     * Prompt user to save if there are unsaved changes
     */
    function promptSaveIfNeeded() {
        if (isDirty) {
            return confirm('You have unsaved aircraft changes. Would you like to save them?');
        }
        return false;
    }

    /**
     * Export config for debugging
     */
    function exportConfig() {
        return JSON.stringify(config, null, 2);
    }

    /**
     * Restore aircraft from database (used during load)
     */
    function restoreAircraft(aircraftList) {
        if (!config) {
            config = {
                version: '1.0',
                defaultAircraftId: null,
                aircraft: []
            };
        }

        // Replace aircraft array with loaded data
        config.aircraft = aircraftList;
        isDirty = false;  // Just loaded, so not dirty

        console.log('[AircraftAPI] Restored', aircraftList.length, 'aircraft from database');

        // Refresh UI if the display function exists
        if (typeof displayAircraftList === 'function') {
            displayAircraftList();
        }

        return config;
    }

    // Public API
    return {
        init,
        loadConfig,
        saveConfig,
        getAllAircraft,
        getAircraft,
        getDefaultAircraft,
        getDefaultAircraftId,
        addAircraft,
        updateAircraft,
        deleteAircraft,
        setDefaultAircraft,
        importFromCSV,
        hasUnsavedChanges,
        promptSaveIfNeeded,
        exportConfig,
        restoreAircraft
    };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    AircraftAPI.init().catch(error => {
        console.warn('Failed to initialize Aircraft API:', error);
    });
});

// Prompt to save before leaving if there are unsaved changes
window.addEventListener('beforeunload', function(e) {
    if (AircraftAPI.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
    }
});
