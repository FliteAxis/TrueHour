// Budget Cards Management
const BudgetCards = {
    cards: [],
    currentYear: new Date().getFullYear(),
    currentMonth: null,

    init: async function() {
        console.log('[BudgetCards] Initializing...');
        await this.loadCards();
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        // Add budget card button
        const addBtn = document.getElementById('addBudgetCardBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Month selector
        const monthSelector = document.getElementById('budgetMonthSelector');
        if (monthSelector) {
            monthSelector.addEventListener('change', (e) => {
                this.currentMonth = e.target.value;
                this.renderCards();
            });
        }

        // Year selector
        const yearSelector = document.getElementById('budgetYearSelector');
        if (yearSelector) {
            yearSelector.addEventListener('change', (e) => {
                this.currentYear = parseInt(e.target.value);
                this.loadCards();
            });
        }
    },

    loadCards: async function() {
        try {
            const response = await fetch('/api/budget-cards/');
            if (response.ok) {
                this.cards = await response.json();
                console.log('[BudgetCards] Loaded cards:', this.cards);
                this.renderCards();
                this.renderSummary();
            } else {
                console.error('[BudgetCards] Failed to load cards:', response.statusText);
            }
        } catch (error) {
            console.error('[BudgetCards] Error loading cards:', error);
        }
    },

    renderCards: function() {
        const container = document.getElementById('budgetCardsList');
        if (!container) return;

        // Filter cards by selected month if any
        let filteredCards = this.cards;
        if (this.currentMonth) {
            filteredCards = this.cards.filter(card => {
                const cardMonth = card.when_date.substring(0, 7); // YYYY-MM
                return cardMonth === this.currentMonth;
            });
        }

        if (filteredCards.length === 0) {
            container.innerHTML = '<div class="empty-state">No budget cards found. Click "Add Budget Card" to create one.</div>';
            return;
        }

        // Group by month
        const byMonth = {};
        filteredCards.forEach(card => {
            const month = card.when_date.substring(0, 7); // YYYY-MM
            if (!byMonth[month]) byMonth[month] = [];
            byMonth[month].push(card);
        });

        // Render
        let html = '';
        Object.keys(byMonth).sort().reverse().forEach(month => {
            const cards = byMonth[month];
            const monthDate = new Date(month + '-01');
            const monthName = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            html += `
                <div class="budget-month-section">
                    <h3 class="budget-month-header">${monthName}</h3>
                    <div class="budget-cards-grid">
                        ${cards.map(card => this.renderCard(card)).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    renderCard: function(card) {
        const percentUsed = card.budgeted_amount > 0
            ? (parseFloat(card.actual_amount) / parseFloat(card.budgeted_amount) * 100).toFixed(1)
            : 0;

        const isOverBudget = parseFloat(card.actual_amount) > parseFloat(card.budgeted_amount);
        const statusClass = isOverBudget ? 'over-budget' : '';

        return `
            <div class="budget-card ${statusClass}" data-card-id="${card.id}">
                <div class="budget-card-header">
                    <div class="budget-card-title">
                        <span class="budget-card-name">${card.name}</span>
                        <span class="budget-card-category badge badge-${card.category.toLowerCase()}">${card.category}</span>
                    </div>
                    <div class="budget-card-actions">
                        <button class="btn-icon" onclick="BudgetCards.editCard(${card.id})" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="BudgetCards.deleteCard(${card.id})" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="budget-card-amounts">
                    <div class="budget-amount-row">
                        <span class="budget-label">Budgeted:</span>
                        <span class="budget-value">$${parseFloat(card.budgeted_amount).toFixed(2)}</span>
                    </div>
                    <div class="budget-amount-row">
                        <span class="budget-label">Actual:</span>
                        <span class="budget-value ${isOverBudget ? 'over-budget' : ''}">$${parseFloat(card.actual_amount).toFixed(2)}</span>
                    </div>
                    <div class="budget-amount-row total">
                        <span class="budget-label">Remaining:</span>
                        <span class="budget-value ${isOverBudget ? 'over-budget' : ''}">$${parseFloat(card.remaining_amount).toFixed(2)}</span>
                    </div>
                </div>
                <div class="budget-progress-bar">
                    <div class="budget-progress-fill ${isOverBudget ? 'over-budget' : ''}" style="width: ${Math.min(percentUsed, 100)}%"></div>
                </div>
                <div class="budget-progress-label">${percentUsed}% used</div>
                ${card.notes ? `<div class="budget-card-notes">${card.notes}</div>` : ''}
            </div>
        `;
    },

    renderSummary: async function() {
        try {
            const response = await fetch(`/api/budget-cards/summary/category?year=${this.currentYear}`);
            if (response.ok) {
                const summary = await response.json();
                this.updateSummaryDisplay(summary);
            }
        } catch (error) {
            console.error('[BudgetCards] Error loading summary:', error);
        }
    },

    updateSummaryDisplay: function(summary) {
        const container = document.getElementById('budgetSummary');
        if (!container) return;

        const totalBudgeted = summary.reduce((sum, cat) => sum + parseFloat(cat.total_budgeted), 0);
        const totalActual = summary.reduce((sum, cat) => sum + parseFloat(cat.total_actual), 0);
        const totalRemaining = totalBudgeted - totalActual;

        container.innerHTML = `
            <div class="summary-card">
                <div class="summary-label">Total Budgeted</div>
                <div class="summary-value">$${totalBudgeted.toFixed(2)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Total Actual</div>
                <div class="summary-value">$${totalActual.toFixed(2)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Remaining</div>
                <div class="summary-value ${totalRemaining < 0 ? 'over-budget' : ''}">$${totalRemaining.toFixed(2)}</div>
            </div>
        `;
    },

    showCreateModal: function() {
        console.log('[BudgetCards] Show create modal');
        this.currentEditingId = null;

        // Reset form
        document.getElementById('budgetCardForm').reset();
        document.getElementById('budgetCardFormTitle').textContent = 'Add Budget Card';
        document.getElementById('budgetCardStatus').value = 'active';

        // Set default date to first of next month (use ISO string to avoid timezone issues)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        const year = nextMonth.getFullYear();
        const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
        document.getElementById('budgetCardDate').value = `${year}-${month}-01`;

        // Show modal
        document.getElementById('budgetCardFormModal').style.display = 'flex';

        // Setup form submit handler
        const form = document.getElementById('budgetCardForm');
        form.onsubmit = (e) => this.handleFormSubmit(e);
    },

    closeCreateModal: function() {
        document.getElementById('budgetCardFormModal').style.display = 'none';
        this.currentEditingId = null;
    },

    editCard: function(cardId) {
        console.log('[BudgetCards] Edit card:', cardId);
        this.currentEditingId = cardId;

        // Find the card
        const card = this.cards.find(c => c.id === cardId);
        if (!card) {
            alert('Budget card not found');
            return;
        }

        // Populate form
        document.getElementById('budgetCardName').value = card.name;
        document.getElementById('budgetCardCategory').value = card.category;
        document.getElementById('budgetCardFrequency').value = card.frequency;
        document.getElementById('budgetCardDate').value = card.when_date;
        document.getElementById('budgetCardAmount').value = parseFloat(card.budgeted_amount);
        document.getElementById('budgetCardHours').value = card.associated_hours || '';
        document.getElementById('budgetCardNotes').value = card.notes || '';
        document.getElementById('budgetCardStatus').value = card.status;

        // Update modal title
        document.getElementById('budgetCardFormTitle').textContent = 'Edit Budget Card';

        // Show modal
        document.getElementById('budgetCardFormModal').style.display = 'flex';

        // Setup form submit handler
        const form = document.getElementById('budgetCardForm');
        form.onsubmit = (e) => this.handleFormSubmit(e);
    },

    handleFormSubmit: async function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('budgetCardName').value,
            category: document.getElementById('budgetCardCategory').value,
            frequency: document.getElementById('budgetCardFrequency').value,
            when_date: document.getElementById('budgetCardDate').value,
            budgeted_amount: parseFloat(document.getElementById('budgetCardAmount').value),
            associated_hours: parseFloat(document.getElementById('budgetCardHours').value) || null,
            notes: document.getElementById('budgetCardNotes').value || null,
            status: document.getElementById('budgetCardStatus').value
        };

        try {
            let response;
            if (this.currentEditingId) {
                // Update existing card
                response = await fetch(`/api/budget-cards/${this.currentEditingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new card
                response = await fetch('/api/budget-cards/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            if (response.ok) {
                console.log('[BudgetCards] Card saved successfully');
                this.closeCreateModal();
                await this.loadCards();
            } else {
                const error = await response.json();
                alert(`Failed to save budget card: ${error.detail || response.statusText}`);
            }
        } catch (error) {
            console.error('[BudgetCards] Error saving card:', error);
            alert('Error saving budget card');
        }
    },

    deleteCard: async function(cardId) {
        if (!confirm('Are you sure you want to delete this budget card?')) return;

        try {
            const response = await fetch(`/api/budget-cards/${cardId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('[BudgetCards] Card deleted');
                await this.loadCards();
            } else {
                alert('Failed to delete budget card');
            }
        } catch (error) {
            console.error('[BudgetCards] Error deleting card:', error);
            alert('Error deleting budget card');
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BudgetCards.init());
} else {
    BudgetCards.init();
}
