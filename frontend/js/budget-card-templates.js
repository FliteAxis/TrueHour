/**
 * Budget Card Templates
 * Pre-defined templates for common aviation expenses
 */

const BudgetCardTemplates = {
    templates: [
        {
            name: 'Flight Instruction',
            category: 'Training',
            description: 'Flight and ground instruction costs',
            suggestedAmount: 5000,
            icon: '✈️'
        },
        {
            name: 'Aircraft Rental',
            category: 'Training',
            description: 'Aircraft rental for training flights',
            suggestedAmount: 8000,
            icon: '🛩️'
        },
        {
            name: 'Medical Exam',
            category: 'Certifications',
            description: 'FAA medical examination',
            suggestedAmount: 300,
            icon: '🏥'
        },
        {
            name: 'FAA Knowledge Test',
            category: 'Certifications',
            description: 'Written exam fee',
            suggestedAmount: 250,
            icon: '📝'
        },
        {
            name: 'Checkride',
            category: 'Certifications',
            description: 'Practical exam with DPE',
            suggestedAmount: 1000,
            icon: '✓'
        },
        {
            name: 'Aviation Headset',
            category: 'Equipment',
            description: 'Headset and accessories',
            suggestedAmount: 500,
            icon: '🎧'
        },
        {
            name: 'Books & Materials',
            category: 'Equipment',
            description: 'Study materials and supplies',
            suggestedAmount: 300,
            icon: '📚'
        },
        {
            name: 'ForeFlight Subscription',
            category: 'Subscriptions',
            description: 'Annual EFB subscription',
            suggestedAmount: 275,
            icon: '📱'
        },
        {
            name: 'Ground School',
            category: 'Subscriptions',
            description: 'Online ground school course',
            suggestedAmount: 300,
            icon: '💻'
        },
        {
            name: 'Renter\'s Insurance',
            category: 'Administrative',
            description: 'Annual renter\'s insurance',
            suggestedAmount: 1150,
            icon: '🛡️'
        }
    ],

    /**
     * Create budget card from template
     */
    async createFromTemplate(template) {
        console.log('[BudgetCardTemplates] Creating card from template:', template);

        const card = {
            name: template.name,
            category: template.category,
            frequency: 'once', // Templates are one-time expenses
            when_date: new Date().toISOString().split('T')[0], // Today
            budgeted_amount: template.suggestedAmount,
            notes: template.description,
            status: 'active'
        };

        try {
            const response = await fetch('/api/budget-cards/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(card)
            });

            if (response.ok) {
                const createdCard = await response.json();
                console.log('[BudgetCardTemplates] Card created:', createdCard);

                // Reload budget cards
                if (typeof BudgetCards !== 'undefined' && BudgetCards.loadCards) {
                    await BudgetCards.loadCards();
                }

                // Trigger budget summary recalculation
                if (typeof calculateBudgetSummary === 'function') {
                    await calculateBudgetSummary();
                }

                return createdCard;
            } else {
                const errorData = await response.json();
                console.error('[BudgetCardTemplates] API Error:', errorData);

                // Handle validation errors (422)
                let errorMessage = 'Failed to create budget card';
                if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => err.msg).join(', ');
                } else if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('[BudgetCardTemplates] Error creating card:', error);
            const errorMessage = error.message || 'Failed to connect to server. Please check that the API is running.';
            if (typeof showErrorModal === 'function') {
                showErrorModal('Error Creating Card', errorMessage);
            } else {
                alert('Error creating card: ' + errorMessage);
            }
            throw error;
        }
    },

    /**
     * Show template selection modal
     */
    showTemplateModal() {
        console.log('[BudgetCardTemplates] Showing template modal');
        const modal = document.getElementById('budgetTemplateModal');
        const container = document.getElementById('templateCardsContainer');

        if (!modal || !container) {
            console.error('[BudgetCardTemplates] Modal elements not found');
            return;
        }

        container.innerHTML = this.templates.map((template, index) => `
            <div class="template-card" data-template-index="${index}">
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-amount">$${template.suggestedAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
                <div class="template-description">${template.description}</div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.template-card').forEach((card, index) => {
            card.addEventListener('click', async () => {
                // Prevent multiple clicks
                if (card.classList.contains('creating') || card.classList.contains('created')) {
                    return;
                }

                // Show creating state
                card.classList.add('creating');
                card.style.opacity = '0.6';
                card.style.pointerEvents = 'none';

                try {
                    await this.createFromTemplate(this.templates[index]);

                    // Show success state
                    card.classList.remove('creating');
                    card.classList.add('created');
                    card.style.opacity = '1';
                    card.style.backgroundColor = '#d1fae5';
                    card.style.borderColor = '#10b981';

                    // Add checkmark
                    const icon = card.querySelector('.template-icon');
                    if (icon) {
                        icon.textContent = '✓';
                        icon.style.color = '#10b981';
                    }

                    // Show success toast
                    if (typeof showToast === 'function') {
                        showToast(`Created "${this.templates[index].name}"`, 'success');
                    }
                } catch (error) {
                    // Reset on error
                    card.classList.remove('creating');
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                }
            });
        });

        modal.style.display = 'flex';
    },

    closeTemplateModal() {
        const modal = document.getElementById('budgetTemplateModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * Create all templates at once (for quick setup)
     */
    async createAll() {
        console.log('[BudgetCardTemplates] Creating all templates...');

        const confirmed = typeof showConfirmModal === 'function'
            ? await showConfirmModal(
                'Create All Templates',
                'This will create 10 budget cards with suggested amounts. You can edit or delete them later.',
                'Create All'
            )
            : confirm('Create all 10 template budget cards?');

        if (!confirmed) return;

        let successCount = 0;
        let failCount = 0;

        for (const template of this.templates) {
            try {
                await this.createFromTemplate(template);
                successCount++;
            } catch (error) {
                failCount++;
                console.error('[BudgetCardTemplates] Failed to create:', template.name, error);
            }
        }

        this.closeTemplateModal();

        const message = failCount > 0
            ? `Created ${successCount} budget cards. ${failCount} failed to create.`
            : `Successfully created ${successCount} budget cards!`;

        if (typeof showErrorModal === 'function') {
            showErrorModal('Templates Created', message);
        } else {
            alert(message);
        }
    }
};
