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
    loadArticlesTable();
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

function loadArticlesTable() {
    const articles = getAllArticles();
    const views = getViews();
    const tbody = document.getElementById("articles-tbody");

    tbody.innerHTML = articles.map(article => `
        <tr>
            <td>${article.id}</td>
            <td>${article.title}</td>
            <td><span class="article-card-category" style="margin:0">${article.category}</span></td>
            <td>${article.author}</td>
            <td>${article.date}</td>
            <td>${views[article.id] || 0}</td>
            <td class="actions">
                <button class="btn btn-small btn-outline" onclick="editArticle(${article.id})">編集</button>
                <button class="btn btn-small btn-danger" onclick="confirmDeleteArticle(${article.id})">削除</button>
            </td>
        </tr>
    `).join("");
}

// ========================================
// 記事モーダル
// ========================================

function openArticleModal(articleId = null) {
    const modal = document.getElementById("article-modal");
    const form = document.getElementById("article-form");
    const title = document.getElementById("modal-title");

    form.reset();
    document.getElementById("article-id").value = "";

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
        }
    } else {
        title.textContent = "新規記事";
        // 今日の日付をデフォルトで設定
        document.getElementById("article-date").value = new Date().toISOString().split("T")[0];
    }

    modal.classList.add("active");
}

function closeArticleModal() {
    document.getElementById("article-modal").classList.remove("active");
}

function editArticle(id) {
    openArticleModal(id);
}

function confirmDeleteArticle(id) {
    if (confirm("この記事を削除しますか？この操作は取り消せません。")) {
        deleteArticle(id);
        loadArticlesTable();
        loadStats();
    }
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

    // 記事フォーム
    document.getElementById("article-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const article = {
            id: document.getElementById("article-id").value ? parseInt(document.getElementById("article-id").value) : null,
            title: document.getElementById("article-title").value,
            category: document.getElementById("article-category").value,
            author: document.getElementById("article-author").value,
            date: document.getElementById("article-date").value,
            image: document.getElementById("article-image").value || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop",
            excerpt: document.getElementById("article-excerpt").value,
            body: document.getElementById("article-body").value
        };

        saveArticle(article);
        closeArticleModal();
        loadArticlesTable();
        loadStats();
        alert(article.id ? "記事を更新しました" : "記事を追加しました");
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

    // モーダル外クリックで閉じる
    document.getElementById("article-modal").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
            closeArticleModal();
        }
    });

    // ESCキーでモーダル閉じる
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeArticleModal();
        }
    });
});
