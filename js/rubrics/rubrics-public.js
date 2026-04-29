// ========== PUBLIC RUBRICS DISPLAY ========== //
// This displays rubrics on the public page

class PublicRubricsDisplay {
    constructor() {
        this.rubrics = [];
        this.currentFilter = 'all';
        this.types = {
            recipes: '🍽️ Рецепти',
            interesting: '🔍 Интересно',
            jokes: '😂 Шеги'
        };
        
        this.init();
    }
    
    async init() {
        // Load the database if not already loaded
        if (!window.RubricsDB) {
            await this.loadDatabase();
        }
        
        await this.loadRubrics();
        this.setupEventListeners();
    }
    
    async loadDatabase() {
        return new Promise((resolve) => {
            if (window.RubricsDB) {
                resolve();
                return;
            }
            
            // Load the database script
            const script = document.createElement('script');
            script.src = '../js/rubrics/rubrics-database.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    
    async loadRubrics() {
        try {
            // Show loading state
            this.showLoading();
            
            const result = await window.RubricsDB.getAllRubrics(50);
            
            if (result.success) {
                this.rubrics = result.rubrics;
                this.displayRubrics();
            } else {
                this.showError('Не можахме да заредим рубриките.');
            }
            
        } catch (error) {
            console.error('Error loading rubrics:', error);
            this.showError('Грешка при зареждане на рубриките.');
        }
    }
    
    openRubricModal(rubricId) {
        const rubric = this.rubrics.find(r => (r.id || r.title.replace(/\s+/g, '-')) === rubricId);
        if (!rubric) return;

        const typeInfo = window.RubricsDB.getTypeById(rubric.type);
        const date = new Date(rubric.date).toLocaleDateString('bg-BG', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const fullContent = rubric.content.includes('\n')
            ? rubric.content.split('\n').map(p => p ? `<p>${p}</p>` : '').join('')
            : `<p>${rubric.content}</p>`;

        const modal = document.getElementById('rubricModal');
        const modalBody = document.getElementById('rubricModalBody');
        modalBody.innerHTML = `
            <div class="rubric-modal-type-badge ${rubric.type}">
                ${typeInfo.icon} ${typeInfo.name}
            </div>
            <h2 class="rubric-modal-title">${rubric.title}</h2>
            <div class="rubric-modal-meta">
                <span>👤 ${rubric.author}</span>
                <span>📅 ${date}</span>
            </div>
            ${rubric.imageUrl ? `
            <div class="rubric-modal-image">
                <img src="${rubric.imageUrl}" alt="${rubric.title}" onerror="this.style.display='none'">
            </div>` : ''}
            <div class="rubric-modal-content">${fullContent}</div>
            ${rubric.tags ? `
            <div class="rubric-modal-tags">
                ${rubric.tags.split(',').map(tag => `<span class="tag">#${tag.trim()}</span>`).join('')}
            </div>` : ''}
        `;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeRubricModal() {
        const modal = document.getElementById('rubricModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    displayRubrics() {
        const container = document.getElementById('rubricsContent');
        if (!container) return;
        
        // Filter rubrics
        let filtered = this.rubrics;
        if (this.currentFilter !== 'all') {
            filtered = this.rubrics.filter(r => r.type === this.currentFilter);
        }
        
        if (filtered.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }
        
        container.innerHTML = `
            <div class="rubrics-count" style="margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <span style="font-weight: 600; color: #2c3e50;">
                    Показваме ${filtered.length} публикации
                    ${this.currentFilter !== 'all' ? `в рубрика "${this.types[this.currentFilter]}"` : 'от всички рубрики'}
                </span>
            </div>
            
            <div class="rubrics-grid">
                ${filtered.map(rubric => this.createRubricCard(rubric)).join('')}
            </div>
        `;
        
        // Add animation classes
        setTimeout(() => {
            container.querySelectorAll('.rubric-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('visible');
            });
        }, 100);
    }
    
    createRubricCard(rubric) {
        const typeInfo = window.RubricsDB.getTypeById(rubric.type);
        const date = new Date(rubric.date).toLocaleDateString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Truncate content for card
        const contentPreview = rubric.content.length > 200 
            ? rubric.content.substring(0, 200) + '...' 
            : rubric.content;
        
        // Format content with paragraphs if it has newlines
        const formattedContent = contentPreview.includes('\n') 
            ? contentPreview.split('\n').map(p => `<p>${p}</p>`).join('')
            : `<p>${contentPreview}</p>`;
        
        const isTruncated = rubric.content.length > 200;
        const rubricId = rubric.id || rubric.title.replace(/\s+/g, '-');

        return `
            <div class="rubric-card scroll-animate" data-rubric-id="${rubricId}">
                <div class="rubric-header">
                    <div class="rubric-type-badge ${rubric.type}">
                        ${typeInfo.icon} ${typeInfo.name}
                    </div>
                    <h3 class="rubric-title">${rubric.title}</h3>
                </div>
                
                ${rubric.imageUrl ? `
                <div class="rubric-image">
                    <img src="${rubric.imageUrl}" alt="${rubric.title}" loading="lazy"
                         onerror="this.style.display='none'">
                </div>
                ` : ''}
                
                <div class="rubric-content">
                    ${formattedContent}
                </div>
                
                <div class="rubric-footer">
                    <div class="rubric-meta">
                        <span class="author">👤 ${rubric.author}</span>
                        <span class="date">📅 ${date}</span>
                    </div>
                    
                    ${rubric.tags ? `
                    <div class="rubric-tags">
                        ${rubric.tags.split(',').slice(0, 3).map(tag => 
                            `<span class="tag">#${tag.trim()}</span>`
                        ).join('')}
                    </div>
                    ` : ''}

                    ${isTruncated ? `
                    <button class="rubric-read-more-btn" onclick="window.publicRubricsDisplay.openRubricModal('${rubricId}')">
                        Прочети повече →
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    setupUI() {
        // Setup tabs if they exist
        const tabsContainer = document.getElementById('rubricsTabs');
        if (tabsContainer) {
            // Tabs are already in HTML, just add event listeners
        }
    }
    
    setupEventListeners() {
        // Tab clicks
        document.querySelectorAll('.rubric-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                
                // Update active tab
                document.querySelectorAll('.rubric-tab').forEach(t => {
                    t.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                
                // Update content
                this.currentFilter = type;
                this.displayRubrics();
                
                // Update URL
                history.pushState({ type: type }, '', `?type=${type}`);
            });
        });
        
        // Check URL for type parameter
        const urlParams = new URLSearchParams(window.location.search);
        const typeParam = urlParams.get('type');
        
        if (typeParam && ['all', 'recipes', 'interesting', 'jokes'].includes(typeParam)) {
            // Set active tab
            const tab = document.querySelector(`.rubric-tab[data-type="${typeParam}"]`);
            if (tab) {
                setTimeout(() => tab.click(), 100);
            }
        }
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.type) {
                const tab = document.querySelector(`.rubric-tab[data-type="${event.state.type}"]`);
                if (tab) tab.click();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeRubricModal();
        });
    }
    
    showLoading() {
        const container = document.getElementById('rubricsContent');
        if (container) {
            container.innerHTML = `
                <div class="loading-rubrics">
                    <div class="spinner"></div>
                    <p>Зареждане на забавното съдържание...</p>
                </div>
            `;
        }
    }
    
    showError(message) {
        const container = document.getElementById('rubricsContent');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Грешка при зареждане</h3>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" class="btn">
                        Опитай отново
                    </button>
                </div>
            `;
        }
    }
    
    getEmptyState() {
        const typeName = this.currentFilter !== 'all' ? this.types[this.currentFilter] : 'рубрики';
        
        return `
            <div class="empty-rubrics">
                <div class="empty-icon">📭</div>
                <h3>Все още няма публикации</h3>
                <p>
                    ${this.currentFilter !== 'all' 
                        ? `Все още няма публикации в рубрика "${typeName}".` 
                        : 'Все още няма публикувани рубрики.'}
                </p>
                <p style="margin-top: 20px; font-size: 0.9rem; color: #95a5a6;">
                    Запишете се в клуба, за да добавите първата публикация!
                </p>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the rubrics page
    if (document.querySelector('.rubrics-content-section')) {
        window.publicRubricsDisplay = new PublicRubricsDisplay();
    }
});