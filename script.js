// ========================================
// BEST COW 社内報 - JavaScript
// ========================================

// サンプル記事データ
const articlesData = [
    {
        id: 1,
        title: "No.1 人事部・石井/社長室・牛山",
        category: "人事部",
        author: "牛山",
        date: "2026-01-09",
        excerpt: "新年あけましておめでとうございます。人事部の石井と社長室の牛山より、新年のご挨拶を申し上げます。",
        body: `新年あけましておめでとうございます。

人事部の石井と社長室の牛山より、新年のご挨拶を申し上げます。

昨年は皆様のご協力のおかげで、様々なプロジェクトを成功させることができました。心より感謝申し上げます。

今年も引き続き、社員一同で力を合わせて、さらなる飛躍の年にしていきたいと思います。

本年もどうぞよろしくお願いいたします。`,
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
    },
    {
        id: 2,
        title: "新入社員歓迎会を開催しました",
        category: "人事部",
        author: "田中",
        date: "2026-01-05",
        excerpt: "1月入社の新入社員3名を迎え、歓迎会を開催しました。和やかな雰囲気の中、交流を深めることができました。",
        body: `1月入社の新入社員3名を迎え、歓迎会を開催しました。

今回入社されたのは、営業部の山田さん、開発部の佐藤さん、総務部の鈴木さんの3名です。

歓迎会では、各部署の紹介や先輩社員との交流タイムを設け、和やかな雰囲気の中で親睦を深めることができました。

新入社員の皆さん、これからよろしくお願いします！`,
        image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop"
    },
    {
        id: 3,
        title: "社長年頭挨拶",
        category: "社長室",
        author: "社長",
        date: "2026-01-01",
        excerpt: "新年あけましておめでとうございます。社長より、今年の方針と目標についてお話しさせていただきます。",
        body: `社員の皆様、新年あけましておめでとうございます。

昨年は大変お世話になりました。皆様の頑張りのおかげで、売上目標を達成することができました。

今年の方針として、以下の3つを掲げます：

1. 顧客満足度の更なる向上
2. 新規事業への挑戦
3. 働きやすい職場環境の整備

一人ひとりの力を結集して、最高の一年にしましょう。

本年もよろしくお願いいたします。`,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"
    },
    {
        id: 4,
        title: "営業部 第4四半期 成績発表",
        category: "営業部",
        author: "営業部長",
        date: "2025-12-28",
        excerpt: "第4四半期の営業成績を発表いたします。目標達成率120%という素晴らしい結果を収めることができました。",
        body: `第4四半期の営業成績を発表いたします。

【結果サマリー】
・売上目標達成率：120%
・新規顧客獲得数：45社
・既存顧客リピート率：89%

特に優秀な成績を収めたメンバー：
・MVP：営業1課 高橋さん
・新人賞：営業2課 伊藤さん

皆様の日々の努力の賜物です。来期も引き続き頑張っていきましょう！`,
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
    },
    {
        id: 5,
        title: "開発部 新システムリリースのお知らせ",
        category: "開発部",
        author: "開発部長",
        date: "2025-12-20",
        excerpt: "社内業務効率化のための新システムをリリースしました。主な機能と使い方についてご説明します。",
        body: `開発部より、新システムリリースのお知らせです。

【新システムの概要】
社内業務効率化のため、以下の機能を持つ新システムをリリースしました。

主な機能：
・タスク管理機能
・ファイル共有機能
・チャット機能
・スケジュール管理機能

使い方については、別途マニュアルを配布いたします。

ご不明点があれば、開発部までお問い合わせください。`,
        image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop"
    },
    {
        id: 6,
        title: "社内イベント：忘年会レポート",
        category: "人事部",
        author: "イベント委員会",
        date: "2025-12-15",
        excerpt: "12月14日に開催された忘年会の様子をレポートします。今年も大盛況で楽しい時間を過ごせました。",
        body: `12月14日に開催された忘年会の様子をレポートします。

今年の忘年会は、〇〇ホテルにて開催されました。

【プログラム】
・乾杯の挨拶（社長）
・食事＆歓談
・余興タイム
・ビンゴ大会
・締めの挨拶

余興タイムでは、各部署からの出し物があり、大変盛り上がりました。

ビンゴ大会では豪華景品が当たり、皆さん大喜びでした。

来年も楽しいイベントを企画しますので、お楽しみに！`,
        image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=400&fit=crop"
    }
];

// リアクションの種類
const reactionTypes = [
    { emoji: "👍", name: "いいね" },
    { emoji: "❤️", name: "ハート" },
    { emoji: "😊", name: "笑顔" },
    { emoji: "🎉", name: "お祝い" },
    { emoji: "👏", name: "拍手" }
];

// ローカルストレージのキー
const STORAGE_KEYS = {
    reactions: "bestcow_reactions",
    comments: "bestcow_comments"
};

// ========================================
// データ管理
// ========================================

// リアクションデータの取得
function getReactions() {
    const data = localStorage.getItem(STORAGE_KEYS.reactions);
    return data ? JSON.parse(data) : {};
}

// リアクションデータの保存
function saveReactions(reactions) {
    localStorage.setItem(STORAGE_KEYS.reactions, JSON.stringify(reactions));
}

// コメントデータの取得
function getComments() {
    const data = localStorage.getItem(STORAGE_KEYS.comments);
    return data ? JSON.parse(data) : {};
}

// コメントデータの保存
function saveComments(comments) {
    localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(comments));
}

// 記事のリアクション数を取得
function getArticleReactions(articleId) {
    const reactions = getReactions();
    return reactions[articleId] || {};
}

// 記事のコメントを取得
function getArticleComments(articleId) {
    const comments = getComments();
    return comments[articleId] || [];
}

// ========================================
// 記事一覧表示
// ========================================

function renderArticles(filter = "all") {
    const grid = document.getElementById("articles-grid");
    grid.innerHTML = "";

    const filteredArticles = filter === "all"
        ? articlesData
        : articlesData.filter(article => article.category === filter);

    filteredArticles.forEach(article => {
        const reactions = getArticleReactions(article.id);
        const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
        const comments = getArticleComments(article.id);

        const card = document.createElement("div");
        card.className = "article-card";
        card.innerHTML = `
            <img src="${article.image}" alt="${article.title}" class="article-card-image" onerror="this.style.background='linear-gradient(135deg, #e0e7ff, #c7d2fe)'">
            <div class="article-card-content">
                <span class="article-card-category">${article.category}</span>
                <h3 class="article-card-title">${article.title}</h3>
                <p class="article-card-excerpt">${article.excerpt}</p>
                <div class="article-card-meta">
                    <span>${article.date} | ${article.author}</span>
                    <div class="article-card-stats">
                        <span>👍 ${totalReactions}</span>
                        <span>💬 ${comments.length}</span>
                    </div>
                </div>
            </div>
        `;
        card.addEventListener("click", () => openArticle(article.id));
        grid.appendChild(card);
    });
}

// ========================================
// 記事詳細表示
// ========================================

function openArticle(articleId) {
    const article = articlesData.find(a => a.id === articleId);
    if (!article) return;

    const modal = document.getElementById("article-modal");
    const detail = document.getElementById("article-detail");

    detail.innerHTML = `
        <img src="${article.image}" alt="${article.title}" class="article-detail-image" onerror="this.style.background='linear-gradient(135deg, #e0e7ff, #c7d2fe)'">
        <div class="article-detail-content">
            <span class="article-detail-category">${article.category}</span>
            <h1 class="article-detail-title">${article.title}</h1>
            <div class="article-detail-meta">
                <span>📅 ${article.date}</span>
                <span>✍️ ${article.author}</span>
            </div>
            <div class="article-detail-body">
                ${article.body.split('\n').map(p => p ? `<p>${p}</p>` : '').join('')}
            </div>

            <!-- リアクション -->
            <div class="reactions-section">
                <div class="reactions-title">この記事にリアクションする</div>
                <div class="reactions-buttons" id="reactions-${articleId}">
                    ${renderReactionButtons(articleId)}
                </div>
            </div>

            <!-- コメント -->
            <div class="comments-section">
                <h3 class="comments-title">💬 コメント</h3>
                <div class="comment-form">
                    <textarea class="comment-input" id="comment-input-${articleId}" placeholder="コメントを入力..." rows="2"></textarea>
                    <button class="comment-submit" onclick="addComment(${articleId})">送信</button>
                </div>
                <div class="comments-list" id="comments-list-${articleId}">
                    ${renderComments(articleId)}
                </div>
            </div>
        </div>
    `;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    const modal = document.getElementById("article-modal");
    modal.classList.remove("active");
    document.body.style.overflow = "";
    renderArticles(getCurrentFilter());
}

// ========================================
// リアクション機能
// ========================================

function renderReactionButtons(articleId) {
    const reactions = getArticleReactions(articleId);

    return reactionTypes.map(type => {
        const count = reactions[type.emoji] || 0;
        const isActive = localStorage.getItem(`reaction_${articleId}_${type.emoji}`) === "true";
        return `
            <button class="reaction-btn ${isActive ? 'active' : ''}" onclick="toggleReaction(${articleId}, '${type.emoji}')">
                <span class="emoji">${type.emoji}</span>
                <span class="count">${count}</span>
            </button>
        `;
    }).join('');
}

function toggleReaction(articleId, emoji) {
    const reactions = getReactions();
    if (!reactions[articleId]) {
        reactions[articleId] = {};
    }

    const key = `reaction_${articleId}_${emoji}`;
    const isActive = localStorage.getItem(key) === "true";

    if (isActive) {
        reactions[articleId][emoji] = Math.max(0, (reactions[articleId][emoji] || 0) - 1);
        localStorage.removeItem(key);
    } else {
        reactions[articleId][emoji] = (reactions[articleId][emoji] || 0) + 1;
        localStorage.setItem(key, "true");
    }

    saveReactions(reactions);

    // リアクションボタンを更新
    const container = document.getElementById(`reactions-${articleId}`);
    if (container) {
        container.innerHTML = renderReactionButtons(articleId);
    }
}

// ========================================
// コメント機能
// ========================================

function renderComments(articleId) {
    const comments = getArticleComments(articleId);

    if (comments.length === 0) {
        return '<p class="no-comments">まだコメントはありません。最初のコメントを投稿してみましょう！</p>';
    }

    return comments.map((comment, index) => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">👤 ${comment.author}</span>
                <div>
                    <span class="comment-date">${comment.date}</span>
                    <button class="comment-delete" onclick="deleteComment(${articleId}, ${index})">削除</button>
                </div>
            </div>
            <p class="comment-body">${escapeHtml(comment.body)}</p>
        </div>
    `).join('');
}

function addComment(articleId) {
    const input = document.getElementById(`comment-input-${articleId}`);
    const body = input.value.trim();

    if (!body) {
        alert("コメントを入力してください");
        return;
    }

    const comments = getComments();
    if (!comments[articleId]) {
        comments[articleId] = [];
    }

    const newComment = {
        author: "ゲスト", // 認証機能がないため固定
        body: body,
        date: new Date().toLocaleString("ja-JP")
    };

    comments[articleId].unshift(newComment);
    saveComments(comments);

    // コメント欄を更新
    const container = document.getElementById(`comments-list-${articleId}`);
    if (container) {
        container.innerHTML = renderComments(articleId);
    }

    input.value = "";
}

function deleteComment(articleId, index) {
    if (!confirm("このコメントを削除しますか？")) return;

    const comments = getComments();
    if (comments[articleId]) {
        comments[articleId].splice(index, 1);
        saveComments(comments);

        const container = document.getElementById(`comments-list-${articleId}`);
        if (container) {
            container.innerHTML = renderComments(articleId);
        }
    }
}

// ========================================
// ユーティリティ
// ========================================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentFilter() {
    const activeBtn = document.querySelector(".nav-btn.active");
    return activeBtn ? activeBtn.dataset.filter : "all";
}

// ========================================
// イベントリスナー
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    // 記事一覧を表示
    renderArticles();

    // フィルターボタン
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderArticles(btn.dataset.filter);
        });
    });

    // モーダル閉じる
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.getElementById("article-modal").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    });

    // ESCキーでモーダル閉じる
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
        }
    });
});
