/**
 * Budget Management Module
 * Handles budget CRUD operations, budget entries, and budget vs actual comparisons
 */

const BudgetManager = {
    apiBase: 'http://localhost:8000/api/budgets',
    currentBudgetId: null,
    budgets: [],
    chartInstance: null,

    /**
     * Initialize budget manager
     */
    async init() {
        console.log('[BudgetManager] Initializing...');
        await this.loadBudgets();
        console.log('[BudgetManager] Budgets loaded, setting up event listeners...');
        this.setupEventListeners();
        console.log('[BudgetManager] Initialization complete');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('[BudgetManager] Setting up event listeners...');
        const addBudgetBtn = document.getElementById('addBudgetBtn');
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', () => {
                console.log('[BudgetManager] Add Budget button clicked!');
                this.showBudgetModal();
            });
            console.log('[BudgetManager] Event listener attached to addBudgetBtn');
        }
        // Note: addBudgetBtn may not exist on onboarding screen - this is expected

        const budgetFormEl = document.getElementById('budgetForm');
        if (budgetFormEl) {
            budgetFormEl.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
        }

        const entryFormEl = document.getElementById('entryForm');
        if (entryFormEl) {
            entryFormEl.addEventListener('submit', (e) => this.handleEntrySubmit(e));
        }

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const modal = closeBtn.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    },

    /**
     * Load all budgets
     */
    async loadBudgets() {
        try {
            const response = await fetch(this.apiBase);
            if (!response.ok) throw new Error('Failed to load budgets');

            this.budgets = await response.json();
            this.renderBudgetList();
        } catch (error) {
            console.error('Error loading budgets:', error);
            this.showNotification('Failed to load budgets', 'error');
        }
    },

    /**
     * Render budget list
     */
    renderBudgetList() {
        const container = document.getElementById('budgetList');
        if (!container) return;

        if (this.budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No budgets yet. Create your first budget to start tracking!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.budgets.map(budget => `
            <div class="budget-card ${budget.is_active ? 'active' : 'inactive'}">
                <div class="budget-header">
                    <h3 onclick="BudgetManager.openBudgetDetail(${budget.id})" style="cursor: pointer; flex: 1;">${this.escapeHtml(budget.name)}</h3>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="budget-status ${budget.is_active ? 'active' : 'inactive'}">
                            ${budget.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button class="btn-icon" onclick="event.stopPropagation(); BudgetManager.deleteBudget(${budget.id})" title="Delete budget">🗑️</button>
                    </div>
                </div>
                <div class="budget-summary" onclick="BudgetManager.openBudgetDetail(${budget.id})" style="cursor: pointer;">
                    <div class="summary-item">
                        <label>Type:</label>
                        <span>${budget.budget_type}</span>
                    </div>
                    <div class="summary-item">
                        <label>Total:</label>
                        <span>$${this.formatCurrency(budget.amount)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Open budget detail modal
     */
    async openBudgetDetail(budgetId) {
        this.currentBudgetId = budgetId;

        try {
            const [budget, entries] = await Promise.all([
                fetch(`${this.apiBase}/${budgetId}`).then(r => r.json()),
                fetch(`${this.apiBase}/${budgetId}/entries`).then(r => r.json())
            ]);

            // Load status for each entry
            const statuses = await Promise.all(
                entries.map(entry =>
                    fetch(`${this.apiBase}/${budgetId}/status?month=${entry.month}`)
                        .then(r => r.json())
                        .catch(() => null)
                )
            );

            this.displayBudgetDetail(budget, entries, statuses.filter(s => s !== null));
            this.showModal('budgetDetailModal');
        } catch (error) {
            console.error('Error loading budget detail:', error);
            this.showNotification('Failed to load budget details', 'error');
        }
    },

    /**
     * Display budget detail
     */
    displayBudgetDetail(budget, entries, statuses) {
        document.getElementById('budgetName').textContent = budget.name;
        document.getElementById('budgetType').textContent = budget.budget_type;
        document.getElementById('budgetDates').textContent =
            `${this.formatDate(budget.start_date)} - ${this.formatDate(budget.end_date)}`;
        document.getElementById('budgetCategories').textContent =
            budget.categories ? budget.categories.join(', ') : 'All';

        // Render entries table
        const tbody = document.getElementById('entriesTbody');
        if (entries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">
                        No budget entries yet. Add your first month's allocation.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = statuses.map(status => {
                const statusClass = status.is_over_budget ? 'over-budget' : 'under-budget';
                const statusIcon = status.is_over_budget ? '⚠️' : '✓';

                return `
                    <tr class="${statusClass}">
                        <td>${this.formatMonth(status.month)}</td>
                        <td>$${this.formatCurrency(status.allocated)}</td>
                        <td>$${this.formatCurrency(status.total_actual)}</td>
                        <td class="${status.difference >= 0 ? 'positive' : 'negative'}">
                            $${this.formatCurrency(Math.abs(status.difference))}
                            ${status.difference >= 0 ? 'under' : 'over'}
                        </td>
                        <td>
                            <span class="status-indicator ${statusClass}">
                                ${statusIcon} ${status.percentage_used.toFixed(1)}%
                            </span>
                        </td>
                        <td>
                            <button onclick="BudgetManager.editEntry('${status.month}')" class="btn-icon" title="Edit">✏️</button>
                            <button onclick="BudgetManager.deleteEntry('${status.month}')" class="btn-icon" title="Delete">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Render chart
        if (statuses.length > 0) {
            this.renderBudgetChart(statuses);
        }
    },

    /**
     * Render budget chart
     */
    renderBudgetChart(statuses) {
        const ctx = document.getElementById('budgetChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statuses.map(s => this.formatMonth(s.month)),
                datasets: [
                    {
                        label: 'Allocated',
                        data: statuses.map(s => parseFloat(s.allocated)),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Actual',
                        data: statuses.map(s => parseFloat(s.total_actual)),
                        backgroundColor: statuses.map(s =>
                            s.is_over_budget
                                ? 'rgba(255, 99, 132, 0.5)'
                                : 'rgba(75, 192, 192, 0.5)'
                        ),
                        borderColor: statuses.map(s =>
                            s.is_over_budget
                                ? 'rgba(255, 99, 132, 1)'
                                : 'rgba(75, 192, 192, 1)'
                        ),
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Budget vs Actual Spending'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Show budget modal for create/edit
     */
    showBudgetModal(budgetId = null) {
        console.log('[BudgetManager] showBudgetModal called with budgetId:', budgetId);
        const modal = document.getElementById('budgetFormModal');
        const title = document.getElementById('budgetFormTitle');
        const form = document.getElementById('budgetForm');

        console.log('[BudgetManager] Modal elements:', { modal, title, form });

        if (budgetId) {
            title.textContent = 'Edit Budget';
            // Load budget data and populate form
            // TODO: Implement edit functionality
        } else {
            title.textContent = 'Add Budget';
            form.reset();
        }

        console.log('[BudgetManager] Opening modal...');
        this.showModal('budgetFormModal');
    },

    /**
     * Handle budget form submit
     */
    async handleBudgetSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('budgetNameInput').value,
            budget_type: document.getElementById('budgetTypeSelect').value,
            amount: parseFloat(document.getElementById('budgetAmountInput').value),
            start_date: document.getElementById('budgetStartDate').value || null,
            end_date: document.getElementById('budgetEndDate').value || null,
            categories: Array.from(document.getElementById('budgetCategoriesInput').selectedOptions)
                .map(opt => opt.value),
            notes: document.getElementById('budgetNotesInput').value || null,
            is_active: true
        };

        console.log('[BudgetManager] Submitting form data:', formData);

        try {
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Budget creation failed:', response.status, errorData);
                throw new Error(errorData.detail || 'Failed to create budget');
            }

            this.showNotification('Budget created successfully', 'success');
            this.closeModal('budgetFormModal');
            await this.loadBudgets();
        } catch (error) {
            console.error('Error creating budget:', error);
            this.showNotification('Failed to create budget', 'error');
        }
    },

    /**
     * Show confirmation modal
     */
    showConfirmation(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;

        const modal = document.getElementById('confirmModal');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        // Remove old event listeners by cloning buttons
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        // Add new event listeners
        newOkBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            onConfirm();
        });

        newCancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.style.display = 'flex';
    },

    /**
     * Delete budget
     */
    async deleteBudget(budgetId) {
        this.showConfirmation(
            'Delete Budget',
            'Are you sure you want to delete this budget? This action cannot be undone and will remove all associated budget entries.',
            async () => {
                try {
                    const response = await fetch(`${this.apiBase}/${budgetId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('Budget deletion failed:', response.status, errorData);
                        throw new Error(errorData.detail || 'Failed to delete budget');
                    }

                    this.showNotification('Budget deleted successfully', 'success');
                    await this.loadBudgets();
                } catch (error) {
                    console.error('Error deleting budget:', error);
                    this.showNotification('Failed to delete budget', 'error');
                }
            }
        );
    },

    /**
     * Show entry modal for create/edit
     */
    showEntryModal(month = null) {
        const modal = document.getElementById('entryFormModal');
        const title = document.getElementById('entryFormTitle');
        const form = document.getElementById('entryForm');

        if (month) {
            title.textContent = 'Edit Budget Entry';
            // Load entry data and populate form
            // TODO: Implement edit functionality
        } else {
            title.textContent = 'Add Budget Entry';
            form.reset();
        }

        this.showModal('entryFormModal');
    },

    /**
     * Handle entry form submit
     */
    async handleEntrySubmit(e) {
        e.preventDefault();

        if (!this.currentBudgetId) {
            this.showNotification('No budget selected', 'error');
            return;
        }

        const monthValue = document.getElementById('entryMonth').value;
        const [year, month] = monthValue.split('-');
        const firstOfMonth = `${year}-${month}-01`;

        const formData = {
            month: firstOfMonth,
            allocated_amount: parseFloat(document.getElementById('entryAmount').value),
            notes: document.getElementById('entryNotes').value || null
        };

        try {
            const response = await fetch(`${this.apiBase}/${this.currentBudgetId}/entries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save entry');

            this.showNotification('Budget entry saved', 'success');
            this.closeModal('entryFormModal');
            await this.openBudgetDetail(this.currentBudgetId);
        } catch (error) {
            console.error('Error saving entry:', error);
            this.showNotification('Failed to save entry', 'error');
        }
    },

    /**
     * Edit entry
     */
    editEntry(month) {
        // TODO: Implement edit entry
        console.log('Edit entry for month:', month);
    },

    /**
     * Delete entry
     */
    async deleteEntry(month) {
        if (!confirm('Are you sure you want to delete this budget entry?')) {
            return;
        }

        // TODO: Implement delete entry
        console.log('Delete entry for month:', month);
    },

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        const container = document.getElementById('toastContainer');
        if (!container) return;

        // Icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
            <button class="toast-close">×</button>
        `;

        // Add to container
        container.appendChild(toast);

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        });

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    },

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return parseFloat(amount).toFixed(2);
    },

    /**
     * Format date
     */
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    /**
     * Format month
     */
    formatMonth(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Don't auto-init, let app.js call it when ready
    });
}
