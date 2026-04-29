
let allArticles = [];
let initialArticles = []; 
let selectedArticles = new Set();

console.log('articles-list.js loading...');

if (typeof firebase === 'undefined') {
    console.error('FATAL: Firebase SDK not loaded!');
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('articlesContainer').innerHTML = `
            <div class="firebase-error">
                <h3>❌ Firebase не е зареден</h3>
                <p>Моля, презаредете страницата.</p>
            </div>
        `;
    });
}

if (typeof db === 'undefined') {
    console.error('FATAL: Firebase database (db) not defined!');
    console.log('Make sure firebase-config.js is loaded BEFORE articles-list.js');
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function filterArticlesByStatus(articles) {
    console.log('Filtering articles by status...');
    
    return articles.filter(article => {
        const status = article.status || 'no-status';
        
        
        
        
        
        const shouldShow = status === 'published';
        
        if (!shouldShow) {
            console.log(`   HIDDEN: "${article.title}" - Status: ${status}`);
        }
        
        return shouldShow;
    });
}

function loadAllArticles() {
    console.log('Loading articles from Firebase...');
    
    db.ref('articles').orderByChild('date').once('value')
        .then((snapshot) => {
            allArticles = [];
            snapshot.forEach((childSnapshot) => {
                const article = childSnapshot.val();
                article.id = childSnapshot.key;
                allArticles.push(article);
            });
            
            console.log(`Loaded ${allArticles.length} articles from Firebase`);
            
            
            const statusCounts = {};
            allArticles.forEach(article => {
                const status = article.status || 'no-status';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            console.log('Status counts:', statusCounts);
            
            
            allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
           
initialArticles = filterArticlesByStatus(allArticles);  
            
            
            const filteredInitial = filterArticlesByStatus(initialArticles);
            console.log(`Initial articles after filter: ${filteredInitial.length}`);
            
            
            displayArticles(initialArticles, '', true);  
        })
        .catch((error) => {
            console.error('Error loading articles:', error);
        });
}

function displayArticles(articles, searchTerm = '', showImages = true) {
    console.log(`Displaying ${articles.length} articles, search: "${searchTerm}", showImages: ${showImages}`);
    

    
    const filteredArticles = filterArticlesByStatus(articles);
    console.log(`After status filter: ${filteredArticles.length} articles to show`);
    
    
    const container = document.getElementById('articlesContainer');
    const resultsInfo = document.getElementById('searchResultsInfo');
    
    if (!container) {
        console.error('ERROR: articlesContainer element not found!');
        return;
    }
    
    if (articles.length === 0) {
        container.innerHTML = '<div class="no-articles">Няма намерени статии</div>';
        resultsInfo.textContent = 'Няма намерени статии, отговарящи на търсенето.';
        updateNewspaperControls();
        return;
    }
    
    container.innerHTML = articles.map(article => {
        
        let highlightedTitle = article.title;
        if (searchTerm) {
            const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
            highlightedTitle = article.title.replace(regex, '<mark>$1</mark>');
        }
        
        
        let imageHTML = '';
        let cardClass = 'with-thumbnail'; 
        let contentClass = '';

        
        if (searchTerm === '' && showImages) {
            cardClass = 'with-full-image';
            
            if (article.imageUrl) {
                imageHTML = `
                    <div class="article-card-image">
                        <img src="${article.imageUrl}" alt="${article.title}" loading="lazy">
                    </div>
                `;
            }
        } else {
            
            if (article.imageUrl) {
                imageHTML = `
                    <div class="article-card-thumbnail">
                        <img src="${article.imageUrl}" alt="${article.title}" loading="lazy">
                    </div>
                `;
            }
        }
        
        
        const isSelected = selectedArticles.has(article.id);
        
        
        return `
            <article class="article-card ${cardClass} ${isSelected ? 'selected' : ''}" data-article-id="${article.id}">
                <input type="checkbox" class="article-select-checkbox" 
                       data-id="${article.id}" 
                       ${isSelected ? 'checked' : ''}>
                
                <div class="article-card-inner">
                    ${imageHTML}
                    <div class="article-card-content ${contentClass}">
                        <span class="article-category">${getCategoryName(article.category)}</span>
                        <h3 class="article-card-title">${highlightedTitle}</h3>
                        <p class="article-card-excerpt">${article.excerpt}</p>
                        <div class="article-card-meta">
                            <span class="article-author">✍️ ${article.author}</span>
                            <span class="article-date">📅 ${formatDate(article.date)}</span>
                        </div>
                        <a href="pages/article.html?id=${article.id}" class="article-read-more">Прочети повече →</a>
                    </div>
                </div>
            </article>
        `;
    }).join('');
    

    
    
    container.querySelectorAll('.article-select-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const articleId = this.dataset.id;
            const isChecked = this.checked;
            toggleArticleSelection(articleId, isChecked);
        });
    });
    
    
    if (searchTerm) {
        container.parentElement.classList.add('search-results');
    } else {
        container.parentElement.classList.remove('search-results');
    }
    
    
    if (searchTerm) {
        resultsInfo.textContent = `Намерени ${articles.length} статии за "${searchTerm}"`;
    } else if (articles === initialArticles) {
        resultsInfo.textContent = `Показване на най-новите ${articles.length} статии`;
    } else {
        resultsInfo.textContent = `Показване на ${articles.length} статии`;
    }
    
    updateNewspaperControls();
}

function getCategoryName(category) {
    const categories = {
        'news': 'Новини',
        'interview': 'Интервю',
        'opinion': 'Мнение',
        'culture': 'Култура'
    };
    return categories[category] || category;
}

function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return 'Невалидна дата';
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

function setupSearch() {
    const searchInput = document.getElementById('articleSearch');
    const clearButton = document.getElementById('clearSearch');
    let searchTimeout;
    
    if (!searchInput) {
        console.warn('Search input not found, skipping search setup');
        return;
    }
    
   
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(this.value);
        }, 300);
    });
    
    
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            performSearch('');
            this.blur(); 
        }
        if (e.key === 'Enter') {
            
            clearTimeout(searchTimeout);
            performSearch(this.value);
        }
    });
    
   
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            performSearch('');
            searchInput.focus();
        });
    }
    

    function performSearch(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        
        const filteredInitial = filterArticlesByStatus(initialArticles);
        displayArticles(filteredInitial, '', true);
        if (clearButton) clearButton.style.display = 'none';
        return;
    }
    
    if (clearButton) clearButton.style.display = 'block';
    
    
    const filteredArticles = allArticles.filter(article => {
        const inTitle = article.title.toLowerCase().includes(term);
        const inContent = article.content ? article.content.toLowerCase().includes(term) : false;
        const inExcerpt = article.excerpt ? article.excerpt.toLowerCase().includes(term) : false;
        return inTitle || inContent || inExcerpt;
    });
    
    
    const filteredSearchResults = filterArticlesByStatus(filteredArticles);
    
    
    displayArticles(filteredSearchResults, term, false);
}
   
}

function setupSearchSuggestions() {
    const searchInput = document.getElementById('articleSearch');
    if (!searchInput) return;
    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    searchInput.parentNode.appendChild(suggestionsContainer);
    
    searchInput.addEventListener('input', function() {
        const term = this.value.toLowerCase().trim();
        
        if (term.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        
        const suggestions = allArticles.filter(article => 
            article.title.toLowerCase().includes(term) ||
            (article.excerpt && article.excerpt.toLowerCase().includes(term))
        ).slice(0, 5); 
        
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        
        suggestionsContainer.innerHTML = suggestions.map(article => {
          
            let highlightedTitle = article.title;
            let excerptText = article.excerpt ? article.excerpt.substring(0, 80) : '';
            let highlightedExcerpt = excerptText;
            
            if (term) {
                const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
                highlightedTitle = article.title.replace(regex, '<mark>$1</mark>');
                if (excerptText) {
                    highlightedExcerpt = excerptText.replace(regex, '<mark>$1</mark>');
                }
            }
            
            return `
                <div class="suggestion-item" data-id="${article.id}">
                    <div class="suggestion-title">${highlightedTitle}</div>
                    ${excerptText ? `<div class="suggestion-excerpt">${highlightedExcerpt}...</div>` : ''}
                </div>
            `;
        }).join('');
        
        suggestionsContainer.style.display = 'block';
        
      
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const articleId = item.dataset.id;
                window.location.href = `pages/article.html?id=${articleId}`;
            });
        });
    });
    
   
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
    
   
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            suggestionsContainer.style.display = 'none';
        }
    });
}

function toggleArticleSelection(articleId, isSelected) {
    if (isSelected) {
        selectedArticles.add(articleId);
    } else {
        selectedArticles.delete(articleId);
    }
    
   
    const articleCard = document.querySelector(`[data-article-id="${articleId}"]`);
    if (articleCard) {
        articleCard.classList.toggle('selected', isSelected);
    }
    
    updateNewspaperControls();
}

function updateNewspaperControls() {
    const controls = document.getElementById('newspaperControls');
    const countElement = document.getElementById('selectedCount');
    const createBtn = document.getElementById('createNewspaperBtn');
    
    if (!controls || !countElement || !createBtn) {
        console.warn('Newspaper controls not found');
        return;
    }
    
    countElement.textContent = selectedArticles.size;
    
    if (selectedArticles.size > 0) {
        controls.style.display = 'flex';
        createBtn.disabled = false;
    } else {
        controls.style.display = 'none';
    }
}

function clearArticleSelection() {
    selectedArticles.clear();
    
    
    document.querySelectorAll('.article-select-checkbox:checked').forEach(checkbox => {
        checkbox.checked = false;
        const articleCard = checkbox.closest('.article-card');
        if (articleCard) {
            articleCard.classList.remove('selected');
        }
    });
    
    updateNewspaperControls();
}

async function createNewspaper() {
    if (selectedArticles.size === 0) {
        alert('Моля, изберете поне една статия за вестника.');
        return;
    }
    
    
    const modal = document.getElementById('newspaperModal');
    const loading = document.getElementById('newspaperLoading');
    const content = document.getElementById('newspaperContent');
    
    if (!modal || !loading || !content) {
        alert('Възникна грешка при създаването на вестника.');
        return;
    }
    
    modal.style.display = 'block';
    loading.style.display = 'block';
    content.style.display = 'none';
    
    try {
        
        const articlesData = [];
        for (const articleId of selectedArticles) {
            const article = allArticles.find(a => a.id === articleId);
            if (article) {
                articlesData.push({
                    title: article.title,
                    author: article.author,
                    excerpt: article.excerpt,
                    content: article.content || article.excerpt,
                    date: formatDate(article.date),
                    category: getCategoryName(article.category),
                    imageUrl: article.imageUrl,
                    id: article.id
                });
            }
        }
        
        
        const useAI = confirm('Искате ли да използвате AI за генериране на вестника?\n\n✅ Да - AI ще създаде професионален дизайн\n❌ Не - Базов шаблон ще се използва');
        
        let newspaperHTML;
        
        if (useAI && window.GEMINI_API_KEY) {
            
            loading.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div class="loading-spinner"></div>
                    <p>🤖 AI генерира вестника... Може да отнеме 10-15 секунди.</p>
                    <small>Използваме Google Gemini AI</small>
                </div>
            `;
            
            newspaperHTML = await generateWithAI(articlesData);
        } else {
            
            articlesData.sort((a, b) => new Date(b.date) - new Date(a.date));
            newspaperHTML = generateBasicNewspaper(articlesData);
        }
        
        
        content.innerHTML = newspaperHTML;
        loading.style.display = 'none';
        content.style.display = 'block';
        
    } catch (error) {
        console.error('Error creating newspaper:', error);
        loading.innerHTML = `
            <div style="color: #d32f2f; text-align: center; padding: 40px;">
                <h3>❌ Грешка при създаване на вестника</h3>
                <p>${error.message}</p>
                <button onclick="generateBasicNewspaperFallback()" class="btn">Покажи базов вестник</button>
            </div>
        `;
    }
}

function generateBasicNewspaperFallback() {
    const articlesData = [];
    for (const articleId of selectedArticles) {
        const article = allArticles.find(a => a.id === articleId);
        if (article) {
            articlesData.push({
                title: article.title,
                author: article.author,
                excerpt: article.excerpt,
                content: article.content || article.excerpt,
                date: formatDate(article.date),
                category: getCategoryName(article.category),
                imageUrl: article.imageUrl,
                id: article.id
            });
        }
    }
    
    const content = document.getElementById('newspaperContent');
    if (content) {
        content.innerHTML = generateBasicNewspaper(articlesData);
        document.getElementById('newspaperLoading').style.display = 'none';
        content.style.display = 'block';
    }
}

async function generateWithAI(articlesData) {
    const API_KEY = window.GEMINI_API_KEY;
    
    if (!API_KEY || API_KEY === 'your-actual-api-key-here') {
        throw new Error('Моля, добавете Gemini API ключ във firebase-config.js');
    }
    
    
    const fullArticles = [];
    for (const articleData of articlesData) {
        const fullArticle = allArticles.find(a => a.title === articleData.title);
        if (fullArticle) {
            fullArticles.push({
                title: fullArticle.title,
                author: fullArticle.author,
                content: fullArticle.content || fullArticle.excerpt,
                imageUrl: fullArticle.imageUrl,
                date: formatDate(fullArticle.date),
                category: getCategoryName(fullArticle.category)
            });
        }
    }
    
    const prompt = `Създай професионална българска заглавна страница на училищен вестник "CampusHub" 
    базирана на следните ПЪЛНИ статии. Включи снимки ако има такива. Използвай тона на младежки вестник, бъди креативен и вдъхновяващ. Използвай готов Canva template за улеснение.

ПЪЛНИ СТАТИИ ЗА ВКЛЮЧВАНЕ:
${fullArticles.map((article, index) => 
    `\n${index + 1}. "${article.title}" (автор: ${article.author})
   Категория: ${article.category}
   Дата: ${article.date}
   Пълно съдържание: ${article.content}
   ${article.imageUrl ? 'Има снимка към статията' : 'Няма снимка'}`
).join('\n\n')}

ВАЖНО: Върни HTML код, който включва:
1. Заглавие на вестника
2. Подзаглавие
3. Основна статия с ПЪЛНОТО й съдържание
4. Други статии с техните пълни съдържания
5. Снимки ако статиите имат такива (използвай <img src="${fullArticles[0]?.imageUrl}"> ако има)
6. Цитати
7. Авторски имена и дати
8. Професионален дизайн като истински вестник
9. С форматиране като в прогрмата Word
10. Ако има повече от 3 статии направи нова страница със същото форматиране
11. Използвай готов Canva template за вестника

Използвай този HTML шаблон, но го направи ПЪЛЕН с реалното съдържание на статиите:
<div class="ai-newspaper">
    <header class="newspaper-header">
        <h1>ТВОРЧЕСКО ЗАГЛАВИЕ</h1>
        <p class="subtitle">ПОДЗАГЛАВИЕ</p>
    </header>
    <div class="main-article">
        <h2>${fullArticles[0]?.title || 'Основна статия'}</h2>
        ${fullArticles[0]?.imageUrl ? `<img src="${fullArticles[0].imageUrl}" alt="${fullArticles[0].title}">` : ''}
        <div class="article-content">${fullArticles[0]?.content || ''}</div>
        <div class="article-meta">Автор: ${fullArticles[0]?.author || ''} | Дата: ${fullArticles[0]?.date || ''}</div>
    </div>
    <div class="other-articles">
        ${fullArticles.slice(1).map(article => `
            <article class="article">
                <h3>${article.title}</h3>
                ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.title}" style="max-width: 200px;">` : ''}
                <p>${article.content.substring(0, 300)}...</p>
                <div class="meta">${article.author} | ${article.date}</div>
            </article>
        `).join('')}
    </div>
</div>

Бъди креативен и включи ВСИЧКО реално съдържание от статиите!`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        let aiContent = data.candidates[0].content.parts[0].text;
        
        
        const htmlMatch = aiContent.match(/<div class="ai-newspaper">[\s\S]*?<\/div>/);
        if (htmlMatch) {
            return htmlMatch[0];
        }
        
       
        return `
            <div class="ai-newspaper">
                <header class="newspaper-header">
                    <h1>🤖 AI-Генериран Вестник</h1>
                    <p class="subtitle">Създаден на базата на ${fullArticles.length} статии</p>
                </header>
                
                ${fullArticles.map((article, index) => `
                    <article class="ai-article ${index === 0 ? 'main-article' : ''}">
                        <h2>${article.title}</h2>
                        ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.title}" class="article-image">` : ''}
                        <div class="article-content">
                            ${article.content || 'Няма съдържание'}
                        </div>
                        <div class="article-meta">
                            <span>✍️ ${article.author}</span>
                            <span>📅 ${article.date}</span>
                            <span>🏷️ ${article.category}</span>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('AI generation failed:', error);
        throw error;
    }
}

function generateBasicNewspaper(articlesData) {
    const today = new Date().toLocaleDateString('bg-BG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    
    const fullArticles = [];
    for (const articleData of articlesData) {
        const fullArticle = allArticles.find(a => a.title === articleData.title);
        if (fullArticle) {
            fullArticles.push(fullArticle);
        }
    }
    
    return `
        <div class="newspaper-container">
            <!-- Newspaper Header -->
            <header class="newspaper-header">
                <h1 class="newspaper-title">📰 CampusHub</h1>
                <div class="newspaper-subtitle">
                    <span class="edition-info">Специално издание</span>
                    <span class="newspaper-date">${today}</span>
                </div>
                <div class="newspaper-meta">
                    <span>Брой статии: ${fullArticles.length}</span>
                    <span>Създадено автоматично</span>
                </div>
            </header>
            
            <!-- Main Content -->
            <div class="newspaper-content">
                ${fullArticles.map((article, index) => {
                    const isMainStory = index === 0;
                    
                    return `
                        <article class="newspaper-article ${isMainStory ? 'main-story' : 'regular-story'}">
                            ${isMainStory ? `<div class="main-story-label">📌 ОСНОВНА СТАТИЯ</div>` : ''}
                            
                            <div class="article-header">
                                <h2 class="article-title">${article.title}</h2>
                                <div class="article-meta">
                                    <span class="article-author">✍️ ${article.author}</span>
                                    <span class="article-date">📅 ${formatDate(article.date)}</span>
                                    <span class="article-category">🏷️ ${getCategoryName(article.category)}</span>
                                </div>
                            </div>
                            
                            ${article.imageUrl ? `
                            <div class="article-image">
                                <img src="${article.imageUrl}" alt="${article.title}" loading="lazy">
                                ${article.imageCaption ? `<p class="image-caption">${article.imageCaption}</p>` : ''}
                            </div>
                            ` : ''}
                            
                            <div class="article-content">
                                ${article.content ? `
                                    <p>${article.content}</p>
                                ` : `
                                    <p>${article.excerpt}</p>
                                `}
                            </div>
                            
                            ${article.tags ? `
                            <div class="article-tags">
                                ${article.tags.split(',').map(tag => 
                                    `<span class="tag">#${tag.trim()}</span>`
                                ).join('')}
                            </div>
                            ` : ''}
                        </article>
                    `;
                }).join('')}
            </div>
            
            <!-- Newspaper Footer -->
            <footer class="newspaper-footer">
                <div class="footer-content">
                    <div class="footer-info">
                        <h3>CampusHub</h3>
                        <p>Училищен клуб по журналистика</p>
                        <p>Това издание е генерирано автоматично от избрани статии</p>
                    </div>
                    <div class="footer-stats">
                        <p><strong>Статистика на изданието:</strong></p>
                        <p>Общо статии: ${fullArticles.length}</p>
                        <p>Снимки: ${fullArticles.filter(a => a.imageUrl).length}</p>
                        <p>Автори: ${[...new Set(fullArticles.map(a => a.author))].length}</p>
                    </div>
                </div>

            </footer>
        </div>
    `;
}

function setupNewspaperControls() {
    const createBtn = document.getElementById('createNewspaperBtn');
    const clearBtn = document.getElementById('clearSelectionBtn');
    const closeBtn = document.getElementById('closeNewspaperBtn');
    const downloadBtn = document.getElementById('downloadNewspaperBtn');
    const printBtn = document.getElementById('printNewspaperBtn');
    const shareBtn = document.getElementById('shareNewspaperBtn');
    const modal = document.getElementById('newspaperModal');
    
    if (!createBtn) {
        console.warn('Newspaper create button not found');
        return;
    }
    
    createBtn.addEventListener('click', createNewspaper);
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearArticleSelection);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadNewspaper);
    }
    
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', shareNewspaper);
    }
    
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

function downloadNewspaper() {
    const content = document.getElementById('newspaperContent');
    if (!content) return;
    
    const newspaperHTML = content.innerHTML;
    const today = new Date().toISOString().split('T')[0];
    
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>CampusHub - ${today}</title>
            <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; }
                .newspaper-frontpage { max-width: 800px; margin: 0 auto; }
                .newspaper-title { text-align: center; font-size: 2.5rem; }
                .newspaper-article { margin: 20px 0; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${newspaperHTML}
            <div class="no-print" style="text-align: center; margin-top: 40px;">
                <button onclick="window.print()">🖨️ Принтирай</button>
                <button onclick="window.close()">✕ Затвори</button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function shareNewspaper() {
    if (navigator.share) {
        navigator.share({
            title: 'Моят цифров вестник',
            text: 'Гледайте специалното издание на "Гласът на коридора"!',
            url: window.location.href
        });
    } else {
        alert('Копирайте линка на тази страница, за да споделите вестника.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing articles...');
    
    
    setTimeout(() => {
        console.log('Starting initialization...');
        loadAllArticles();
        setupSearch();
        setupSearchSuggestions();
        setupNewspaperControls();
    }, 100);
});
