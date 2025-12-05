/**
 * User Data Management Module
 * Handles save/load/delete operations for user data persistence
 */

const UserDataManager = (function() {
    let autoSaveEnabled = true;
    let autoSaveTimer = null;
    const AUTO_SAVE_DELAY = 3000; // 3 seconds
    let sessionId = null;

    /**
     * Initialize session ID from localStorage or generate new one
     */
    function initSessionId() {
        sessionId = localStorage.getItem('truehour_session_id');
        if (!sessionId) {
            sessionId = generateSessionId();
            localStorage.setItem('truehour_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Generate a unique session ID
     */
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Show save status indicator
     */
    function showSaveStatus(status, message) {
        const statusEl = document.getElementById('saveStatus');
        if (!statusEl) return;

        statusEl.className = 'save-status ' + status;
        statusEl.textContent = message || '';

        // Auto-hide success messages after 2 seconds
        if (status === 'success') {
            setTimeout(() => {
                statusEl.className = 'save-status';
                statusEl.textContent = '';
            }, 2000);
        }
    }

    /**
     * Update last saved timestamp display
     */
    function updateLastSavedTimestamp() {
        const lastSavedEl = document.getElementById('lastSavedText');
        if (!lastSavedEl) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        lastSavedEl.textContent = `Last saved: ${timeStr}`;
    }

    /**
     * Save current state to database
     */
    async function saveToDatabase() {
        const saveBtn = document.getElementById('saveBtn');
        if (!saveBtn) return;

        try {
            saveBtn.classList.add('saving');
            showSaveStatus('saving', 'Saving...');

            // Collect current state
            const data = {
                aircraft: [],
                expenses: [],
                budget_state: {}
            };

            // Get aircraft from AircraftAPI if available
            if (typeof AircraftAPI !== 'undefined' && AircraftAPI.getAllAircraft) {
                data.aircraft = AircraftAPI.getAllAircraft();
                console.log('[UserData] Collected', data.aircraft.length, 'aircraft');
            }

            // Collect budget state (certification, hours, settings)
            const targetCertEl = document.getElementById('targetCert');
            if (targetCertEl) {
                data.budget_state.targetCert = targetCertEl.value;
            }

            // Collect current hours (from ForeFlight import)
            if (typeof currentHours !== 'undefined' && currentHours) {
                data.budget_state.currentHours = currentHours;
            }

            // Collect training settings
            data.budget_state.settings = {
                lessonsPerWeek: parseFloat(document.getElementById('lessonsPerWeek')?.value) || 2,
                instructorRate: parseFloat(document.getElementById('instructorRate')?.value) || 60,
                simulatorRate: parseFloat(document.getElementById('simulatorRate')?.value) || 105,
                groundHours: parseFloat(document.getElementById('groundHours')?.value) || 0,
                headsetCost: parseFloat(document.getElementById('headsetCost')?.value) || 0,
                booksCost: parseFloat(document.getElementById('booksCost')?.value) || 0,
                bagCost: parseFloat(document.getElementById('bagCost')?.value) || 0,
                medicalCost: parseFloat(document.getElementById('medicalCost')?.value) || 300,
                knowledgeCost: parseFloat(document.getElementById('knowledgeCost')?.value) || 250,
                checkrideCost: parseFloat(document.getElementById('checkrideCost')?.value) || 1000,
                insuranceCost: parseFloat(document.getElementById('insuranceCost')?.value) || 1150,
                foreflightCost: parseFloat(document.getElementById('foreflightCost')?.value) || 275,
                onlineSchoolCost: parseFloat(document.getElementById('onlineSchoolCost')?.value) || 0,
                contingencyPercent: parseFloat(document.getElementById('contingencyPercent')?.value) || 20
            };

            console.log('[UserData] Collected budget_state:', data.budget_state);

            // TODO: Collect expenses when expense management is implemented

            const response = await fetch('/api/user/save', {
                method: 'POST',
                headers: {
                    'X-Session-ID': sessionId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('[UserData] Save successful:', result);

            showSaveStatus('success', '✓ Saved');
            updateLastSavedTimestamp();
            return result;

        } catch (error) {
            console.error('[UserData] Save failed:', error);
            showSaveStatus('error', '✗ Save failed');
            throw error;
        } finally {
            saveBtn.classList.remove('saving');
        }
    }

    /**
     * Trigger auto-save with debouncing
     */
    function triggerAutoSave() {
        if (!autoSaveEnabled) {
            console.log('[UserData] Auto-save is disabled');
            return;
        }

        clearTimeout(autoSaveTimer);
        showSaveStatus('pending', 'Changes pending...');

        autoSaveTimer = setTimeout(async () => {
            try {
                await saveToDatabase();
            } catch (error) {
                console.error('[UserData] Auto-save failed:', error);
            }
        }, AUTO_SAVE_DELAY);
    }

    /**
     * Load user data from database
     */
    async function loadFromDatabase() {
        try {
            const response = await fetch('/api/user/load', {
                method: 'GET',
                headers: {
                    'X-Session-ID': sessionId,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('[UserData] Load successful:', data);

            return data;

        } catch (error) {
            console.error('[UserData] Load failed:', error);
            throw error;
        }
    }

    /**
     * Export config to JSON file
     */
    function exportConfig() {
        console.log('[UserData] Starting config export');

        const config = {
            version: '3.0',
            exportedDate: new Date().toISOString(),
            settings: {
                autoSaveEnabled: autoSaveEnabled
            }
        };

        // Get aircraft from AircraftAPI if available
        if (typeof AircraftAPI !== 'undefined' && AircraftAPI.getAllAircraft) {
            config.aircraft = AircraftAPI.getAllAircraft();
            console.log('[UserData] Exported', config.aircraft.length, 'aircraft');
        }

        // TODO: Add expenses export when expense management is implemented

        const jsonStr = JSON.stringify(config, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'truehour-config-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[UserData] Config exported successfully');
    }

    /**
     * Load config from JSON file
     */
    function loadConfig(file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const config = JSON.parse(e.target.result);
                console.log('[UserData] Loaded config:', config);

                // Show dialog: Load into memory only or save to database?
                const saveToDb = confirm(
                    'Configuration loaded successfully.\n\n' +
                    'Do you want to save this to the database?\n\n' +
                    '• Click OK to save to database (recommended)\n' +
                    '• Click Cancel to load into memory only (temporary)'
                );

                // Load aircraft if present
                if (config.aircraft && typeof AircraftAPI !== 'undefined') {
                    // TODO: Implement aircraft loading
                    console.log('[UserData] Would load', config.aircraft.length, 'aircraft');
                }

                if (saveToDb) {
                    await saveToDatabase();
                    alert('Configuration loaded and saved to database successfully!');
                } else {
                    alert('Configuration loaded into memory (not saved to database).');
                }

            } catch (error) {
                console.error('[UserData] Failed to load config:', error);
                alert('Failed to load configuration: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Show custom modal dialog
     */
    function showModal(title, message, requireInput = false) {
        return new Promise((resolve) => {
            const modal = document.getElementById('deleteConfirmModal');
            const modalTitle = document.getElementById('deleteModalTitle');
            const modalMessage = document.getElementById('deleteModalMessage');
            const modalInput = document.getElementById('deleteModalInput');
            const inputField = document.getElementById('deleteConfirmInput');
            const cancelBtn = document.getElementById('deleteModalCancel');
            const confirmBtn = document.getElementById('deleteModalConfirm');

            // Track event listeners for cleanup
            let onInput = null;
            let onKeyDown = null;
            let onOverlayClick = null;

            // Set content
            modalTitle.textContent = title;
            modalMessage.textContent = message;

            // Show/hide input
            if (requireInput) {
                modalInput.style.display = 'block';
                inputField.value = '';
                confirmBtn.disabled = true;

                // Enable confirm button only when "DELETE" is typed
                onInput = () => {
                    confirmBtn.disabled = inputField.value !== 'DELETE';
                };
                inputField.addEventListener('input', onInput);

                // Allow Enter key to confirm
                onKeyDown = (e) => {
                    if (e.key === 'Enter' && inputField.value === 'DELETE') {
                        cleanup();
                        resolve(true);
                    } else if (e.key === 'Escape') {
                        cleanup();
                        resolve(false);
                    }
                };
                inputField.addEventListener('keydown', onKeyDown);

                // Focus input after a brief delay to ensure modal is visible
                setTimeout(() => inputField.focus(), 100);
            } else {
                modalInput.style.display = 'none';
                confirmBtn.disabled = false;
            }

            // Show modal
            modal.classList.add('active');

            // Cleanup function
            function cleanup() {
                modal.classList.remove('active');
                if (onInput) inputField.removeEventListener('input', onInput);
                if (onKeyDown) inputField.removeEventListener('keydown', onKeyDown);
                if (onOverlayClick) modal.removeEventListener('click', onOverlayClick);
                cancelBtn.removeEventListener('click', onCancel);
                confirmBtn.removeEventListener('click', onConfirm);
            }

            // Button handlers
            function onCancel() {
                cleanup();
                resolve(false);
            }

            function onConfirm() {
                if (requireInput && inputField.value !== 'DELETE') {
                    return;
                }
                cleanup();
                resolve(true);
            }

            cancelBtn.addEventListener('click', onCancel);
            confirmBtn.addEventListener('click', onConfirm);

            // Close on overlay click
            onOverlayClick = (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            };
            modal.addEventListener('click', onOverlayClick);
        });
    }

    /**
     * Delete all user data (multi-step confirmation with custom modal)
     */
    async function deleteAllData() {
        // Step 1: Warning modal
        const step1 = await showModal(
            'Delete All Data?',
            'This will permanently delete all aircraft, expenses, flights, and settings from the database.\n\nThis action cannot be undone.'
        );

        if (!step1) {
            console.log('[UserData] Delete cancelled at step 1');
            return;
        }

        // Step 2: Type confirmation
        const step2 = await showModal(
            'Type DELETE to Confirm',
            'To prevent accidental deletion, please type DELETE in the box below.',
            true
        );

        if (!step2) {
            console.log('[UserData] Delete cancelled at step 2');
            return;
        }

        // Step 3: Final confirmation
        const step3 = await showModal(
            'Are You Absolutely Sure?',
            'This will permanently delete ALL your data. There is no way to recover it.\n\nAre you sure you want to proceed?'
        );

        if (!step3) {
            console.log('[UserData] Delete cancelled at step 3');
            return;
        }

        // Execute deletion
        try {
            const response = await fetch('/api/user/data', {
                method: 'DELETE',
                headers: {
                    'X-Session-ID': sessionId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirm_text: 'DELETE' })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('[UserData] Delete successful:', result);

            // Clear localStorage
            localStorage.clear();

            // Show success modal
            await showModal(
                'Data Deleted Successfully',
                'All your data has been permanently deleted. The page will now reload.'
            );

            // Reload to show onboarding
            window.location.reload();

        } catch (error) {
            console.error('[UserData] Delete failed:', error);
            await showModal(
                'Delete Failed',
                `Failed to delete data: ${error.message}`
            );
        }
    }

    /**
     * Toggle auto-save on/off
     */
    function toggleAutoSave() {
        autoSaveEnabled = !autoSaveEnabled;
        const statusEl = document.getElementById('autoSaveStatus');
        if (statusEl) {
            statusEl.textContent = autoSaveEnabled ? 'ON' : 'OFF';
        }
        console.log('[UserData] Auto-save', autoSaveEnabled ? 'enabled' : 'disabled');

        // Save preference to database
        updateSettings({ auto_save_enabled: autoSaveEnabled });
    }

    /**
     * Update user settings in database
     */
    async function updateSettings(settings) {
        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            console.log('[UserData] Settings updated');
        } catch (error) {
            console.error('[UserData] Failed to update settings:', error);
        }
    }

    /**
     * Initialize the module
     */
    async function init() {
        console.log('============================================');
        console.log('[UserData] INITIALIZATION STARTING');
        console.log('============================================');

        initSessionId();

        // Load saved data from database
        try {
            const data = await loadFromDatabase();
            if (data && data.aircraft && data.aircraft.length > 0) {
                console.log('[UserData] Restoring', data.aircraft.length, 'aircraft from database');

                // Restore aircraft to AircraftAPI
                if (typeof AircraftAPI !== 'undefined' && AircraftAPI.restoreAircraft) {
                    AircraftAPI.restoreAircraft(data.aircraft);

                    // Mark onboarding as completed since we have data in database
                    localStorage.setItem('truehour-onboarding-completed', 'true');
                } else {
                    console.warn('[UserData] AircraftAPI.restoreAircraft not available');
                }
            }

            // Restore budget_state (certification, hours, settings)
            if (data && data.settings && data.settings.budget_state) {
                console.log('[UserData] Restoring budget_state from database');
                const budgetState = data.settings.budget_state;

                // Restore certification goal
                if (budgetState.targetCert) {
                    const targetCertEl = document.getElementById('targetCert');
                    if (targetCertEl) {
                        targetCertEl.value = budgetState.targetCert;
                        console.log('[UserData] Restored targetCert:', budgetState.targetCert);
                    }
                }

                // Restore current hours
                if (budgetState.currentHours && typeof currentHours !== 'undefined') {
                    Object.assign(currentHours, budgetState.currentHours);
                    console.log('[UserData] Restored currentHours');
                }

                // Restore training settings
                if (budgetState.settings) {
                    Object.keys(budgetState.settings).forEach(key => {
                        const element = document.getElementById(key);
                        if (element) {
                            element.value = budgetState.settings[key];
                        }
                    });
                    console.log('[UserData] Restored training settings');
                }

                // Trigger display update if function exists
                if (typeof updateDisplay === 'function') {
                    updateDisplay();
                    console.log('[UserData] Triggered updateDisplay()');
                }
            }

            // Update last saved timestamp if available
            if (data && data.last_saved_at) {
                const lastSavedEl = document.getElementById('lastSavedText');
                if (lastSavedEl) {
                    const savedDate = new Date(data.last_saved_at);
                    const timeStr = savedDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                    lastSavedEl.textContent = `Last saved: ${timeStr}`;
                }
            }
        } catch (error) {
            console.error('[UserData] Failed to load data:', error);
        }

        // Attach event listeners
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveToDatabase);
        }

        const exportBtn = document.getElementById('exportConfigBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                exportConfig();
                document.getElementById('menuDropdown').classList.remove('open');
            });
        }

        const loadBtn = document.getElementById('loadConfigBtn');
        const fileInput = document.getElementById('budgetFileInput');
        if (loadBtn && fileInput) {
            loadBtn.addEventListener('click', () => {
                fileInput.click();
                document.getElementById('menuDropdown').classList.remove('open');
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    loadConfig(e.target.files[0]);
                }
            });
        }

        const autoSaveToggle = document.getElementById('autoSaveToggle');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('click', toggleAutoSave);
        }

        const deleteBtn = document.getElementById('deleteAllDataBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                document.getElementById('menuDropdown').classList.remove('open');
                deleteAllData();
            });
        }

        // Add auto-save triggers for certification dropdown
        const targetCertEl = document.getElementById('targetCert');
        if (targetCertEl) {
            console.log('[UserData] Attached auto-save listener to targetCert');
            targetCertEl.addEventListener('change', () => {
                console.log('[UserData] Certification changed, triggering auto-save');
                triggerAutoSave();
            });
        } else {
            console.warn('[UserData] targetCert element not found');
        }

        // Add auto-save triggers for all settings inputs
        const settingsInputIds = [
            'lessonsPerWeek', 'instructorRate', 'simulatorRate', 'groundHours',
            'headsetCost', 'booksCost', 'bagCost', 'medicalCost', 'knowledgeCost',
            'checkrideCost', 'insuranceCost', 'foreflightCost', 'onlineSchoolCost',
            'contingencyPercent'
        ];

        let attachedCount = 0;
        settingsInputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    console.log(`[UserData] Setting ${id} changed, triggering auto-save`);
                    triggerAutoSave();
                });
                attachedCount++;
            } else {
                console.warn(`[UserData] Element ${id} not found`);
            }
        });
        console.log(`[UserData] Attached auto-save listeners to ${attachedCount}/${settingsInputIds.length} settings inputs`);

        console.log('[UserData] Initialized with session ID:', sessionId);
    }

    // Public API
    return {
        init,
        saveToDatabase,
        loadFromDatabase,
        exportConfig,
        triggerAutoSave,
        deleteAllData,
        toggleAutoSave
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UserDataManager.init();
    });
} else {
    UserDataManager.init();
}
