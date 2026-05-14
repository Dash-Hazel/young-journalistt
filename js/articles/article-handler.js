document.addEventListener('DOMContentLoaded', function() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    const categoryNames = {
        'news': 'Новини',
        'interview': 'Интервю',
        'opinion': 'Мнение',
        'culture': 'Култура'
    };
    
    if (articleId) {
        loadArticle(articleId, categoryNames);
    } else {
        showError('Невалидна статия');
    }
});

function loadArticle(articleId, categoryNames) {
    document.getElementById('articleContent').innerHTML = 
        '<div class="loading">Зареждане на статията...</div>';
    
    db.ref('articles/' + articleId).once('value')
        .then((snapshot) => {
            const article = snapshot.val();
            if (article) {
                displayArticle(article, categoryNames);
            } else {
                showError('Статията не е намерена');
            }
        })
        .catch((error) => {
            console.error('Error loading article:', error);
            showError('Грешка при зареждане на статията');
        });
}

function displayArticle(article, categoryNames) {
    document.title = `${article.title} - Млад Журналист`;
    
    const categoryName = categoryNames[article.category] || article.category;
    
    let formattedDate;
    try {
        formattedDate = new Date(article.date).toLocaleDateString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        formattedDate = 'Невалидна дата';
    }
    
    let imageHTML = generateImageHTML(article);
    
    document.getElementById('articleContent').innerHTML = `
        <div class="article-header">
            <h1 class="article-title">${article.title}</h1>
            <div class="article-meta">
                <span>✍️ ${article.author}</span>
                <span>📅 ${formattedDate}</span>
                <span>🏷️ ${categoryName}</span>
            </div>
        </div>
        ${imageHTML}
        <div class="article-body">
            ${formatArticleContent(article.content)}
        </div>
    `;

    loadLinkPreviews();
}

function generateImageHTML(article) {
    const imageFields = [
        'imageUrl', 'imageUrl2', 'imageUrl3', 'imageUrl4', 'imageUrl5', 'imageUrl6'
    ];
    
    let imagesHTML = '';
    
    imageFields.forEach(field => {
        if (article[field] && article[field].trim() !== '') {
            imagesHTML += `
                <div class="article-image">
                    <img src="${article[field]}" alt="${article.title}" />
                </div>
            `;
        }
    });
    
    return imagesHTML;
}

// ── URL Detection ─────────────────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

function formatArticleContent(content) {
    if (!content) return '<p>Съдържанието не е налично.</p>';
    
    return content
        .split('\n')
        .filter(paragraph => paragraph.trim())
        .map(paragraph => {
            const trimmed = paragraph.trim();
            
            // Whole paragraph is a URL → render a preview card placeholder
            if (/^https?:\/\/\S+$/.test(trimmed)) {
                const id = 'lp-' + Math.random().toString(36).substr(2, 9);
                return `<div class="link-preview-card" id="${id}" data-url="${trimmed}">
                    <div class="link-preview-loading">
                        <div class="link-preview-spinner"></div>
                        <span>Зареждане на преглед...</span>
                    </div>
                </div>`;
            }
            
            // Otherwise make inline URLs clickable
            const withLinks = trimmed.replace(URL_REGEX, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="article-inline-link">${url}</a>`;
            });
            
            return `<p>${withLinks}</p>`;
        })
        .join('');
}

// ── Link Preview Fetching ─────────────────────────────────────────────────────

async function loadLinkPreviews() {
    const cards = document.querySelectorAll('.link-preview-card[data-url]');
    const fetchPromises = Array.from(cards).map(card => fetchAndRenderPreview(card));
    await Promise.allSettled(fetchPromises);
}

async function fetchAndRenderPreview(card) {
    const url = card.getAttribute('data-url');
    try {
        const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.status === 'success') {
            renderPreviewCard(card, url, data.data);
        } else {
            renderFallbackCard(card, url);
        }
    } catch (err) {
        renderFallbackCard(card, url);
    }
}

function renderPreviewCard(card, url, meta) {
    const title = meta.title || '';
    const description = meta.description || '';
    const image = meta.image && meta.image.url ? meta.image.url : '';
    const siteName = meta.publisher || extractDomain(url);
    
    card.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-preview-inner">
            ${image ? `<div class="link-preview-image">
                <img src="${image}" alt="${title}" onerror="this.parentElement.style.display='none'" />
            </div>` : ''}
            <div class="link-preview-text">
                ${siteName ? `<span class="link-preview-site">${siteName}</span>` : ''}
                ${title ? `<p class="link-preview-title">${title}</p>` : ''}
                ${description ? `<p class="link-preview-desc">${description}</p>` : ''}
                <span class="link-preview-url">${url}</span>
            </div>
        </a>
    `;
    card.classList.add('loaded');
}

function renderFallbackCard(card, url) {
    const domain = extractDomain(url);
    card.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-preview-inner link-preview-fallback">
            <div class="link-preview-icon">🔗</div>
            <div class="link-preview-text">
                <span class="link-preview-site">${domain}</span>
                <span class="link-preview-url">${url}</span>
            </div>
        </a>
    `;
    card.classList.add('loaded', 'fallback');
}

function extractDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}

function showError(message) {
    document.getElementById('articleContent').innerHTML = 
        `<div class="error-message">${message}</div>`;
}
