/**
 * Expense Management Module
 * Handles expense tracking and budget card linking
 */

const ExpenseManager = {
    expenses: [],
    budgetCards: [],
    currentExpense: null,

    async init() {
        console.log('[ExpenseManager] Initializing...');
        await this.loadExpenses();
        await this.loadBudgetCards();
        this.setupEventListeners();
        this.renderExpenses();
    },

    setupEventListeners() {
        // Add expense button
        const addBtn = document.getElementById('addExpenseBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Month filter
        const monthFilter = document.getElementById('expenseMonthFilter');
        if (monthFilter) {
            monthFilter.addEventListener('change', () => this.applyFilters());
        }

        // Category filter
        const categoryFilter = document.getElementById('expenseCategoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
    },

    async loadExpenses() {
        try {
            const response = await fetch('/api/expenses?limit=1000');
            if (response.ok) {
                this.expenses = await response.json();
                console.log('[ExpenseManager] Loaded expenses:', this.expenses.length);
            } else {
                console.error('[ExpenseManager] Failed to load expenses:', response.statusText);
            }
        } catch (error) {
            console.error('[ExpenseManager] Error loading expenses:', error);
        }
    },

    async loadBudgetCards() {
        try {
            const response = await fetch('/api/budget-cards/?status=active');
            if (response.ok) {
                this.budgetCards = await response.json();
                console.log('[ExpenseManager] Loaded budget cards:', this.budgetCards.length);
            } else {
                console.error('[ExpenseManager] Failed to load budget cards:', response.statusText);
            }
        } catch (error) {
            console.error('[ExpenseManager] Error loading budget cards:', error);
        }
    },

    applyFilters() {
        const monthFilter = document.getElementById('expenseMonthFilter')?.value;
        const categoryFilter = document.getElementById('expenseCategoryFilter')?.value;

        let filtered = [...this.expenses];

        if (monthFilter) {
            filtered = filtered.filter(expense => {
                const expenseMonth = expense.date.substring(0, 7); // YYYY-MM
                return expenseMonth === monthFilter;
            });
        }

        if (categoryFilter) {
            filtered = filtered.filter(expense => expense.category === categoryFilter);
        }

        this.renderExpenses(filtered);
    },

    renderExpenses(expensesToRender = null) {
        const container = document.getElementById('expensesList');
        if (!container) return;

        const expenses = expensesToRender || this.expenses;

        if (expenses.length === 0) {
            container.innerHTML = '<div class="empty-state">No expenses found. Click "Add Expense" to track your first expense.</div>';
            return;
        }

        // Group by month
        const byMonth = {};
        expenses.forEach(expense => {
            const month = expense.date.substring(0, 7); // YYYY-MM
            if (!byMonth[month]) byMonth[month] = [];
            byMonth[month].push(expense);
        });

        let html = '';
        Object.keys(byMonth).sort().reverse().forEach(month => {
            const monthExpenses = byMonth[month];
            const monthDate = new Date(month + '-01');
            const monthName = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            const monthTotal = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

            html += `
                <div class="expense-month-section">
                    <div class="expense-month-header">
                        <h3>${monthName}</h3>
                        <span class="expense-month-total">$${monthTotal.toFixed(2)}</span>
                    </div>
                    <div class="expense-list">
                        ${monthExpenses.map(expense => this.renderExpense(expense)).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Update summary stats
        this.updateSummaryStats(expenses);
    },

    renderExpense(expense) {
        const date = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const categoryBadge = this.getCategoryBadge(expense.category);

        return `
            <div class="expense-item" data-expense-id="${expense.id}">
                <div class="expense-item-left">
                    <div class="expense-date">${date}</div>
                    <div class="expense-category">${categoryBadge}</div>
                </div>
                <div class="expense-item-center">
                    <div class="expense-description">${expense.description || expense.category}</div>
                    ${expense.vendor ? `<div class="expense-vendor">${expense.vendor}</div>` : ''}
                </div>
                <div class="expense-item-right">
                    <div class="expense-amount">$${parseFloat(expense.amount).toFixed(2)}</div>
                    <div class="expense-actions">
                        <button class="btn-icon" onclick="ExpenseManager.linkToBudget(${expense.id})" title="Link to Budget Card">
                            <span>🔗</span>
                        </button>
                        <button class="btn-icon" onclick="ExpenseManager.editExpense(${expense.id})" title="Edit">
                            <span>✏️</span>
                        </button>
                        <button class="btn-icon btn-danger" onclick="ExpenseManager.deleteExpense(${expense.id})" title="Delete">
                            <span>🗑️</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    getCategoryBadge(category) {
        const categoryColors = {
            'fuel': '#3b82f6',
            'instructor': '#8b5cf6',
            'rental': '#10b981',
            'insurance': '#f59e0b',
            'maintenance': '#ef4444',
            'subscription': '#06b6d4',
            'membership': '#ec4899',
            'supplies': '#6366f1',
            'other': '#6b7280'
        };

        const color = categoryColors[category.toLowerCase()] || '#6b7280';
        return `<span class="category-badge" style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${category}</span>`;
    },

    updateSummaryStats(expenses) {
        const totalExpenses = expenses.length;
        const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        const avgAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

        // Update summary cards if they exist
        const summaryContainer = document.getElementById('expenseSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="summary-card">
                    <div class="summary-value">${totalExpenses}</div>
                    <div class="summary-label">Total Expenses</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">$${totalAmount.toFixed(2)}</div>
                    <div class="summary-label">Total Amount</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">$${avgAmount.toFixed(2)}</div>
                    <div class="summary-label">Average</div>
                </div>
            `;
        }
    },

    showCreateModal() {
        this.currentExpense = null;
        document.getElementById('expenseFormTitle').textContent = 'Add Expense';
        document.getElementById('expenseForm').reset();

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expenseDate').value = today;

        // Populate budget card dropdown (exclude completed budget cards)
        this.populateBudgetCardDropdown();

        this.showModal('expenseFormModal');
    },

    populateBudgetCardDropdown() {
        const dropdown = document.getElementById('expenseBudgetCard');
        if (!dropdown) return;

        // Filter out completed budget cards
        const activeBudgetCards = this.budgetCards.filter(card => card.status !== 'completed');

        dropdown.innerHTML = '<option value="">-- Don\'t link now --</option>';
        activeBudgetCards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `${card.name} (${card.category}) - $${parseFloat(card.remaining_amount || 0).toFixed(2)} remaining`;
            dropdown.appendChild(option);
        });
    },

    async editExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) return;

        this.currentExpense = expense;
        document.getElementById('expenseFormTitle').textContent = 'Edit Expense';

        // Populate form
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseSubcategory').value = expense.subcategory || '';
        document.getElementById('expenseDescription').value = expense.description || '';
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseDate').value = expense.date;
        document.getElementById('expenseVendor').value = expense.vendor || '';
        document.getElementById('expenseIsRecurring').checked = expense.is_recurring;
        document.getElementById('expenseRecurrenceInterval').value = expense.recurrence_interval || '';
        document.getElementById('expenseIsTaxDeductible').checked = expense.is_tax_deductible;

        // Populate budget card dropdown but don't select anything (user can link via link button)
        this.populateBudgetCardDropdown();
        document.getElementById('expenseBudgetCard').value = '';

        this.showModal('expenseFormModal');
    },

    async saveExpense() {
        const formData = {
            category: document.getElementById('expenseCategory').value,
            subcategory: document.getElementById('expenseSubcategory').value || null,
            description: document.getElementById('expenseDescription').value || null,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            vendor: document.getElementById('expenseVendor').value || null,
            is_recurring: document.getElementById('expenseIsRecurring').checked,
            recurrence_interval: document.getElementById('expenseRecurrenceInterval').value || null,
            is_tax_deductible: document.getElementById('expenseIsTaxDeductible').checked
        };

        try {
            let response;
            if (this.currentExpense) {
                // Update existing expense
                response = await fetch(`/api/expenses/${this.currentExpense.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new expense
                response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            if (response.ok) {
                const savedExpense = await response.json();

                // If editing an existing expense, check if we need to update link amounts
                if (this.currentExpense) {
                    try {
                        // Get existing links
                        const linksResponse = await fetch(`/api/expense-budget-links/expense/${savedExpense.id}`);
                        if (linksResponse.ok) {
                            const existingLinks = await linksResponse.json();

                            // If there's exactly one link with the full old amount, update it to the new amount
                            if (existingLinks.length === 1 &&
                                parseFloat(existingLinks[0].amount) === parseFloat(this.currentExpense.amount)) {
                                // Delete old link
                                await fetch(`/api/expense-budget-links/${existingLinks[0].id}`, {
                                    method: 'DELETE'
                                });

                                // Create new link with updated amount
                                await fetch('/api/expense-budget-links', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        expense_id: savedExpense.id,
                                        budget_card_id: existingLinks[0].budget_card_id,
                                        amount: formData.amount
                                    })
                                });
                            }
                        }
                    } catch (linkError) {
                        console.error('[ExpenseManager] Error updating budget link:', linkError);
                    }
                }

                // If a budget card was selected and this is a new expense, create the link
                const selectedBudgetCardId = document.getElementById('expenseBudgetCard')?.value;
                if (selectedBudgetCardId && !this.currentExpense) {
                    try {
                        const linkResponse = await fetch('/api/expense-budget-links', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                expense_id: savedExpense.id,
                                budget_card_id: parseInt(selectedBudgetCardId),
                                amount: formData.amount
                            })
                        });

                        if (!linkResponse.ok) {
                            console.error('[ExpenseManager] Failed to create budget link');
                        }
                    } catch (linkError) {
                        console.error('[ExpenseManager] Error creating budget link:', linkError);
                    }
                }

                await this.loadExpenses();
                this.renderExpenses();
                this.closeModal('expenseFormModal');

                // Trigger budget cards reload if they're on the same page
                if (typeof BudgetCards !== 'undefined' && BudgetCards.loadCards) {
                    await BudgetCards.loadCards();
                }

                // Trigger auto-save
                if (typeof UserDataManager !== 'undefined' && UserDataManager.triggerAutoSave) {
                    UserDataManager.triggerAutoSave();
                }
            } else {
                const error = await response.json();
                console.error('[ExpenseManager] Save failed:', error);
                if (typeof showErrorModal === 'function') {
                    showErrorModal('Save Failed', `Failed to save expense: ${error.detail}`);
                } else {
                    alert(`Failed to save expense: ${error.detail}`);
                }
            }
        } catch (error) {
            console.error('[ExpenseManager] Error saving expense:', error);
            if (typeof showErrorModal === 'function') {
                showErrorModal('Error', 'Failed to save expense: ' + error.message);
            } else {
                alert('Failed to save expense: ' + error.message);
            }
        }
    },

    async deleteExpense(expenseId) {
        // Use confirmation modal instead of browser confirm
        if (typeof showConfirmModal === 'function') {
            const confirmed = await showConfirmModal(
                'Delete Expense',
                'Are you sure you want to delete this expense? This action cannot be undone.'
            );
            if (!confirmed) return;
        } else if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadExpenses();
                this.renderExpenses();

                // Reload budget cards to update actual amounts
                if (typeof BudgetCards !== 'undefined' && BudgetCards.loadCards) {
                    await BudgetCards.loadCards();
                }

                // Trigger auto-save
                if (typeof UserDataManager !== 'undefined' && UserDataManager.triggerAutoSave) {
                    UserDataManager.triggerAutoSave();
                }
            } else {
                console.error('[ExpenseManager] Delete failed');
                if (typeof showErrorModal === 'function') {
                    showErrorModal('Delete Failed', 'Failed to delete expense');
                } else {
                    alert('Failed to delete expense');
                }
            }
        } catch (error) {
            console.error('[ExpenseManager] Error deleting expense:', error);
            if (typeof showErrorModal === 'function') {
                showErrorModal('Error', 'Failed to delete expense: ' + error.message);
            } else {
                alert('Failed to delete expense: ' + error.message);
            }
        }
    },

    async linkToBudget(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) return;

        this.currentExpense = expense;

        // Show budget card selection modal
        await this.showBudgetLinkModal(expense);
    },

    async showBudgetLinkModal(expense) {
        // Get existing links for this expense
        let existingLinks = [];
        try {
            const response = await fetch(`/api/expense-budget-links/expense/${expense.id}`);
            if (response.ok) {
                existingLinks = await response.json();
            }
        } catch (error) {
            console.error('[ExpenseManager] Error loading existing links:', error);
        }

        const linkedAmount = existingLinks.reduce((sum, link) => sum + parseFloat(link.amount), 0);
        const remainingAmount = parseFloat(expense.amount) - linkedAmount;

        // Build modal content
        let modalContent = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Link Expense to Budget Cards</h2>
                    <button class="modal-close" onclick="ExpenseManager.closeModal('budgetLinkModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="expense-link-info">
                        <div><strong>Expense:</strong> ${expense.description || expense.category}</div>
                        <div><strong>Amount:</strong> $${parseFloat(expense.amount).toFixed(2)}</div>
                        <div><strong>Remaining:</strong> $${remainingAmount.toFixed(2)}</div>
                    </div>

                    ${existingLinks.length > 0 ? `
                    <div class="existing-links">
                        <h3 style="font-size: 1em; font-weight: 600; margin-bottom: 12px; color: #374151;">Current Links</h3>
                        ${existingLinks.map(link => {
                            const card = this.budgetCards.find(c => c.id === link.budget_card_id);
                            return `
                                <div class="link-item">
                                    <span style="flex: 1;">${card ? card.name : 'Unknown'}</span>
                                    <span style="font-weight: 600; margin-right: 10px;">$${parseFloat(link.amount).toFixed(2)}</span>
                                    <button class="btn-icon" style="color: #dc2626; cursor: pointer; background: none; border: none; padding: 4px 8px;" onclick="ExpenseManager.deleteLink(${link.id})" title="Remove link">🗑️</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}

                    ${remainingAmount > 0 ? `
                    <div class="new-link-form">
                        <h3 style="font-size: 1em; font-weight: 600; margin-bottom: 16px; color: #374151;">Add New Link</h3>
                        <div class="form-group">
                            <label for="linkBudgetCard">Budget Card</label>
                            <select id="linkBudgetCard" required>
                                <option value="">Select a budget card...</option>
                                ${this.budgetCards.map(card => `
                                    <option value="${card.id}">${card.name} (${card.category}) - $${parseFloat(card.remaining_amount).toFixed(2)} remaining</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="linkAmount">Amount to Link</label>
                            <input type="number" id="linkAmount" min="0.01" max="${remainingAmount}" step="0.01" value="${remainingAmount.toFixed(2)}" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="ExpenseManager.closeModal('budgetLinkModal')">Cancel</button>
                            <button class="btn-primary" onclick="ExpenseManager.saveBudgetLink()">Link to Budget Card</button>
                        </div>
                    </div>
                    ` : '<p style="text-align: center; color: #6b7280; padding: 20px 0;">This expense is fully allocated to budget cards.</p>'}
                </div>
            </div>
        `;

        document.getElementById('budgetLinkModal').innerHTML = modalContent;
        this.showModal('budgetLinkModal');
    },

    async saveBudgetLink() {
        const budgetCardId = document.getElementById('linkBudgetCard')?.value;
        const amount = document.getElementById('linkAmount')?.value;

        if (!budgetCardId || !amount) {
            console.warn('[ExpenseManager] Missing budget card or amount');
            if (typeof showErrorModal === 'function') {
                showErrorModal('Validation Error', 'Please select a budget card and enter an amount');
            } else {
                alert('Please select a budget card and enter an amount');
            }
            return;
        }

        try {
            const response = await fetch('/api/expense-budget-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expense_id: this.currentExpense.id,
                    budget_card_id: parseInt(budgetCardId),
                    amount: parseFloat(amount)
                })
            });

            if (response.ok) {
                // Refresh the modal to show updated links
                await this.showBudgetLinkModal(this.currentExpense);

                // Reload budget cards to update actual amounts
                if (typeof BudgetCards !== 'undefined' && BudgetCards.loadCards) {
                    await BudgetCards.loadCards();
                }
            } else {
                const error = await response.json();
                console.error('[ExpenseManager] Link creation failed:', error);
                if (typeof showErrorModal === 'function') {
                    showErrorModal('Link Failed', `Failed to create link: ${error.detail}`);
                } else {
                    alert(`Failed to create link: ${error.detail}`);
                }
            }
        } catch (error) {
            console.error('[ExpenseManager] Error creating link:', error);
            if (typeof showErrorModal === 'function') {
                showErrorModal('Error', 'Failed to create link: ' + error.message);
            } else {
                alert('Failed to create link: ' + error.message);
            }
        }
    },

    async deleteLink(linkId) {
        // Use confirmation modal instead of browser confirm
        if (typeof showConfirmModal === 'function') {
            const confirmed = await showConfirmModal(
                'Remove Link',
                'Remove this expense-budget link?'
            );
            if (!confirmed) return;
        } else if (!confirm('Remove this link?')) {
            return;
        }

        try {
            const response = await fetch(`/api/expense-budget-links/${linkId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Refresh the modal
                await this.showBudgetLinkModal(this.currentExpense);

                // Reload budget cards
                if (typeof BudgetCards !== 'undefined' && BudgetCards.loadCards) {
                    await BudgetCards.loadCards();
                }
            } else {
                console.error('[ExpenseManager] Link deletion failed');
                if (typeof showErrorModal === 'function') {
                    showErrorModal('Delete Failed', 'Failed to delete link');
                } else {
                    alert('Failed to delete link');
                }
            }
        } catch (error) {
            console.error('[ExpenseManager] Error deleting link:', error);
            if (typeof showErrorModal === 'function') {
                showErrorModal('Error', 'Failed to delete link: ' + error.message);
            } else {
                alert('Failed to delete link: ' + error.message);
            }
        }
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('expensesList')) {
            ExpenseManager.init();
        }
    });
} else {
    if (document.getElementById('expensesList')) {
        ExpenseManager.init();
    }
}
