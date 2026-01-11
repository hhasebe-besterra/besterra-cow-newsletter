// ========================================
// ベステラ社内報 - 管理画面 JavaScript
// ========================================

// デフォルトパスワード（初回のみ使用、変更後はローカルストレージに保存）
const DEFAULT_PASSWORD_HASH = "besterra2026";

// ストレージキー
const ADMIN_STORAGE_KEYS = {
    passwordHash: "bestcow_admin_password",
    isLoggedIn: "bestcow_admin_logged_in",
    customArticles: "bestcow_custom_articles"
};

// 選択中の画像URL
let selectedImageUrl = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop";

// ========================================
// 認証
// ========================================

function getPasswordHash() {
    return localStorage.getItem(ADMIN_STORAGE_KEYS.passwordHash) || DEFAULT_PASSWORD_HASH;
}

function setPasswordHash(password) {
    localStorage.setItem(ADMIN_STORAGE_KEYS.passwordHash, password);
}

function isLoggedIn() {
    return sessionStorage.getItem(ADMIN_STORAGE_KEYS.isLoggedIn) === "true";
}

function login(password) {
    const correctPassword = getPasswordHash();
    if (password === correctPassword) {
        sessionStorage.setItem(ADMIN_STORAGE_KEYS.isLoggedIn, "true");
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem(ADMIN_STORAGE_KEYS.isLoggedIn);
    location.reload();
}

// ========================================
// 記事データ管理
// ========================================

function getCustomArticles() {
    const data = localStorage.getItem(ADMIN_STORAGE_KEYS.customArticles);
    return data ? JSON.parse(data) : null;
}

function saveCustomArticles(articles) {
    localStorage.setItem(ADMIN_STORAGE_KEYS.customArticles, JSON.stringify(articles));
}

function getAllArticles() {
    const customArticles = getCustomArticles();
    if (customArticles) {
        return customArticles;
    }
    // script.js の articlesData を使用
    return typeof articlesData !== 'undefined' ? [...articlesData] : [];
}

function saveArticle(article) {
    const articles = getAllArticles();

    if (article.id) {
        // 更新
        const index = articles.findIndex(a => a.id === article.id);
        if (index !== -1) {
            articles[index] = article;
        }
    } else {
        // 新規
        const maxId = articles.reduce((max, a) => Math.max(max, a.id), 0);
        article.id = maxId + 1;
        articles.unshift(article);
    }

    saveCustomArticles(articles);
    return article;
}

function deleteArticle(id) {
    const articles = getAllArticles();
    const filtered = articles.filter(a => a.id !== id);
    saveCustomArticles(filtered);
}

// ========================================
// UI更新
// ========================================

function showAdminPanel() {
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("admin-container").style.display = "block";
    loadStats();
    loadArticlesList();
}

function loadStats() {
    const articles = getAllArticles();
    const views = getViews();
    const comments = getComments();
    const reactions = getReactions();

    const totalViews = Object.values(views).reduce((sum, v) => sum + v, 0);
    const totalComments = Object.values(comments).reduce((sum, c) => sum + c.length, 0);
    const totalReactions = Object.values(reactions).reduce((sum, r) => {
        return sum + Object.values(r).reduce((s, v) => s + v, 0);
    }, 0);

    document.getElementById("stat-articles").textContent = articles.length;
    document.getElementById("stat-views").textContent = totalViews;
    document.getElementById("stat-comments").textContent = totalComments;
    document.getElementById("stat-reactions").textContent = totalReactions;
}

// 記事リストをカード形式で表示
function loadArticlesList() {
    const articles = getAllArticles();
    const views = getViews();
    const container = document.getElementById("articles-list");

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="no-articles">
                <p>まだ記事がありません</p>
                <p>「新しい記事を作成」ボタンから記事を追加してください</p>
            </div>
        `;
        return;
    }

    container.innerHTML = articles.map(article => `
        <div class="article-item" onclick="editArticle(${article.id})">
            <img src="${article.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=100&fit=crop'}"
                 alt="" class="article-item-image">
            <div class="article-item-content">
                <div class="article-item-header">
                    <span class="article-item-category">${article.category}</span>
                    <span class="article-item-date">${formatDate(article.date)}</span>
                </div>
                <h3 class="article-item-title">${article.title}</h3>
                <p class="article-item-excerpt">${article.excerpt}</p>
                <div class="article-item-footer">
                    <span class="article-item-author">👤 ${article.author}</span>
                    <span class="article-item-views">👁️ ${views[article.id] || 0} 閲覧</span>
                </div>
            </div>
            <button class="article-item-delete" onclick="event.stopPropagation(); confirmDeleteArticle(${article.id})" title="削除">
                🗑️
            </button>
        </div>
    `).join("");
}

// 日付フォーマット
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

// ========================================
// フルスクリーンエディター
// ========================================

function openArticleModal(articleId = null) {
    const overlay = document.getElementById("editor-overlay");
    const title = document.getElementById("editor-title");

    // フォームをリセット
    document.getElementById("article-id").value = "";
    document.getElementById("article-title").value = "";
    document.getElementById("article-category").value = "";
    document.getElementById("article-author").value = "";
    document.getElementById("article-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("article-image").value = "";
    document.getElementById("article-excerpt").value = "";
    document.getElementById("article-body").value = "";

    // 画像選択をリセット
    resetImageSelection();

    if (articleId) {
        title.textContent = "記事を編集";
        const articles = getAllArticles();
        const article = articles.find(a => a.id === articleId);
        if (article) {
            document.getElementById("article-id").value = article.id;
            document.getElementById("article-title").value = article.title;
            document.getElementById("article-category").value = article.category;
            document.getElementById("article-author").value = article.author;
            document.getElementById("article-date").value = article.date;
            document.getElementById("article-image").value = article.image || "";
            document.getElementById("article-excerpt").value = article.excerpt;
            document.getElementById("article-body").value = article.body;

            // 画像を選択状態にする
            selectImageByUrl(article.image);
        }
    } else {
        title.textContent = "新しい記事を作成";
    }

    // プレビューを更新
    updatePreview();

    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeArticleModal() {
    document.getElementById("editor-overlay").style.display = "none";
    document.body.style.overflow = "";
}

function editArticle(id) {
    openArticleModal(id);
}

function confirmDeleteArticle(id) {
    if (confirm("この記事を削除しますか？この操作は取り消せません。")) {
        deleteArticle(id);
        loadArticlesList();
        loadStats();
    }
}

// ========================================
// 画像選択機能
// ========================================

function switchImageTab(tab) {
    const galleryTab = document.querySelector('.image-tab:nth-child(1)');
    const urlTab = document.querySelector('.image-tab:nth-child(2)');
    const galleryContent = document.getElementById('tab-gallery');
    const urlContent = document.getElementById('tab-url');

    if (tab === 'gallery') {
        galleryTab.classList.add('active');
        urlTab.classList.remove('active');
        galleryContent.style.display = 'block';
        urlContent.style.display = 'none';
    } else {
        galleryTab.classList.remove('active');
        urlTab.classList.add('active');
        galleryContent.style.display = 'none';
        urlContent.style.display = 'block';
    }
}

function resetImageSelection() {
    // 全ての画像オプションから選択を解除
    document.querySelectorAll('.image-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    // 最初の画像を選択
    const firstOption = document.querySelector('.image-option');
    if (firstOption) {
        firstOption.classList.add('selected');
        selectedImageUrl = firstOption.dataset.url;
    }
    // ギャラリータブに戻す
    switchImageTab('gallery');
}

function selectImageByUrl(url) {
    if (!url) return;

    // ギャラリーから一致する画像を探す
    const options = document.querySelectorAll('.image-option');
    let found = false;

    options.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.url === url) {
            opt.classList.add('selected');
            selectedImageUrl = url;
            found = true;
        }
    });

    // ギャラリーにない場合はURLタブに切り替え
    if (!found) {
        document.getElementById('article-image').value = url;
        selectedImageUrl = url;
        switchImageTab('url');
    }
}

function setupImageGallery() {
    document.querySelectorAll('.image-option').forEach(option => {
        option.addEventListener('click', () => {
            // 全ての選択を解除
            document.querySelectorAll('.image-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            // クリックした画像を選択
            option.classList.add('selected');
            selectedImageUrl = option.dataset.url;
            // プレビューを更新
            updatePreview();
        });
    });
}

function getSelectedImageUrl() {
    // URLタブがアクティブならURL入力を使用
    const urlTab = document.querySelector('.image-tab:nth-child(2)');
    if (urlTab && urlTab.classList.contains('active')) {
        const urlInput = document.getElementById('article-image');
        return urlInput.value || selectedImageUrl;
    }
    return selectedImageUrl;
}

// ========================================
// テンプレート挿入機能
// ========================================

function insertTemplate(type) {
    const bodyTextarea = document.getElementById('article-body');
    const cursorPos = bodyTextarea.selectionStart;
    const currentText = bodyTextarea.value;

    let template = '';

    switch (type) {
        case 'greeting':
            template = `皆さん、こんにちは！

今回は〇〇についてご紹介します。

`;
            break;
        case 'list':
            template = `◆ ポイント1
内容をここに記載

◆ ポイント2
内容をここに記載

◆ ポイント3
内容をここに記載

`;
            break;
        case 'divider':
            template = `
━━━━━━━━━━━━━━━━━━━━

`;
            break;
        case 'signature':
            const author = document.getElementById('article-author').value || '著者名';
            template = `
━━━━━━━━━━━━━━━━━━━━
${author}
`;
            break;
    }

    // カーソル位置にテンプレートを挿入
    bodyTextarea.value = currentText.substring(0, cursorPos) + template + currentText.substring(cursorPos);

    // カーソル位置を更新
    bodyTextarea.selectionStart = cursorPos + template.length;
    bodyTextarea.selectionEnd = cursorPos + template.length;
    bodyTextarea.focus();

    // プレビューを更新
    updatePreview();
}

// ========================================
// リアルタイムプレビュー
// ========================================

function updatePreview() {
    // タイトル
    const title = document.getElementById('article-title').value || 'タイトルがここに表示されます';
    document.getElementById('preview-title').textContent = title;

    // カテゴリ
    const category = document.getElementById('article-category').value || 'カテゴリ';
    const categoryText = category ? getCategoryDisplay(category) : 'カテゴリ';
    document.getElementById('preview-category').textContent = categoryText;

    // 要約
    const excerpt = document.getElementById('article-excerpt').value || '要約がここに表示されます...';
    document.getElementById('preview-excerpt').textContent = excerpt;

    // 日付
    const dateValue = document.getElementById('article-date').value;
    const dateText = dateValue ? formatDate(dateValue) : formatDate(new Date().toISOString().split('T')[0]);
    document.getElementById('preview-date').textContent = dateText;

    // 著者
    const author = document.getElementById('article-author').value || '著者名';
    document.getElementById('preview-author').textContent = author;

    // 画像
    const imageUrl = getSelectedImageUrl();
    document.getElementById('preview-image').src = imageUrl;

    // 本文
    const body = document.getElementById('article-body').value || '本文がここに表示されます...';
    document.getElementById('preview-body').innerHTML = formatBodyText(body);
}

function getCategoryDisplay(category) {
    const categoryIcons = {
        '人事部': '👥 人事部',
        '社長室': '👔 社長室',
        '営業部': '💼 営業部',
        '開発部': '💻 開発部'
    };
    return categoryIcons[category] || category;
}

function formatBodyText(text) {
    // 改行をbrタグに変換し、段落を分ける
    return text
        .split('\n\n')
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

function setupPreviewListeners() {
    // 各入力フィールドにイベントリスナーを追加
    const fields = ['article-title', 'article-category', 'article-author', 'article-date', 'article-excerpt', 'article-body', 'article-image'];

    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('input', updatePreview);
            element.addEventListener('change', updatePreview);
        }
    });
}

// ========================================
// 記事保存
// ========================================

function saveArticleFromEditor() {
    // バリデーション
    const title = document.getElementById('article-title').value.trim();
    const category = document.getElementById('article-category').value;
    const author = document.getElementById('article-author').value.trim();
    const date = document.getElementById('article-date').value;
    const excerpt = document.getElementById('article-excerpt').value.trim();
    const body = document.getElementById('article-body').value.trim();

    if (!title) {
        alert('タイトルを入力してください');
        document.getElementById('article-title').focus();
        return;
    }
    if (!category) {
        alert('カテゴリを選択してください');
        document.getElementById('article-category').focus();
        return;
    }
    if (!author) {
        alert('著者名を入力してください');
        document.getElementById('article-author').focus();
        return;
    }
    if (!date) {
        alert('投稿日を入力してください');
        document.getElementById('article-date').focus();
        return;
    }
    if (!excerpt) {
        alert('要約を入力してください');
        document.getElementById('article-excerpt').focus();
        return;
    }
    if (!body) {
        alert('本文を入力してください');
        document.getElementById('article-body').focus();
        return;
    }

    const article = {
        id: document.getElementById('article-id').value ? parseInt(document.getElementById('article-id').value) : null,
        title: title,
        category: category,
        author: author,
        date: date,
        image: getSelectedImageUrl(),
        excerpt: excerpt,
        body: body
    };

    const isNew = !article.id;
    saveArticle(article);
    closeArticleModal();
    loadArticlesList();
    loadStats();
    alert(isNew ? '記事を追加しました！' : '記事を更新しました！');
}

// ========================================
// イベントリスナー
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    // ログイン状態チェック
    if (isLoggedIn()) {
        showAdminPanel();
    }

    // ログインフォーム
    document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const password = document.getElementById("admin-password").value;
        const errorEl = document.getElementById("login-error");

        if (login(password)) {
            showAdminPanel();
        } else {
            errorEl.textContent = "パスワードが正しくありません";
            document.getElementById("admin-password").value = "";
        }
    });

    // パスワード変更フォーム
    document.getElementById("password-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (newPassword !== confirmPassword) {
            alert("パスワードが一致しません");
            return;
        }

        if (newPassword.length < 4) {
            alert("パスワードは4文字以上にしてください");
            return;
        }

        setPasswordHash(newPassword);
        alert("パスワードを変更しました");
        document.getElementById("password-form").reset();
    });

    // 画像ギャラリーのセットアップ
    setupImageGallery();

    // プレビュー更新リスナーのセットアップ
    setupPreviewListeners();

    // ESCキーでエディターを閉じる
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const overlay = document.getElementById("editor-overlay");
            if (overlay && overlay.style.display !== "none") {
                if (confirm("編集内容を破棄してエディターを閉じますか？")) {
                    closeArticleModal();
                }
            }
        }
    });
});
