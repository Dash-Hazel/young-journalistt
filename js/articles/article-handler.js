
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

function formatArticleContent(content) {
    if (!content) return '<p>Съдържанието не е налично.</p>';
    
    return content
        .split('\n')
        .filter(paragraph => paragraph.trim())
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
}

function showError(message) {
    document.getElementById('articleContent').innerHTML = 
        `<div class="error-message">${message}</div>`;
}
