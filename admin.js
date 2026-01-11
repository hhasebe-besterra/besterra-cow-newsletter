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
// ブロックエディタ
// ========================================

// ブロックデータ
let blocks = [];
let blockIdCounter = 0;
let currentEditingBlockId = null;
let draggedBlockId = null;

// ブロックタイプ定義
const BLOCK_TYPES = {
    paragraph: { label: '段落', icon: '📝' },
    heading: { label: '見出し', icon: '📌' },
    image: { label: '画像', icon: '🖼️' },
    'ai-image': { label: 'AI画像', icon: '✨' },
    quote: { label: '引用', icon: '💬' },
    list: { label: 'リスト', icon: '📋' },
    divider: { label: '区切り', icon: '➖' }
};

// ブロックを追加
function addBlock(type, index = null) {
    const newBlock = {
        id: ++blockIdCounter,
        type: type,
        content: '',
        settings: {}
    };

    // タイプ別の初期設定
    switch (type) {
        case 'heading':
            newBlock.settings.level = 'h2';
            break;
        case 'image':
        case 'ai-image':
            newBlock.settings.url = '';
            newBlock.settings.caption = '';
            newBlock.settings.align = 'center';
            break;
        case 'list':
            newBlock.settings.style = 'bullet';
            break;
    }

    // 挿入位置
    if (index !== null && index >= 0) {
        blocks.splice(index, 0, newBlock);
    } else {
        blocks.push(newBlock);
    }

    // AI画像の場合はモーダルを開く
    if (type === 'ai-image') {
        currentEditingBlockId = newBlock.id;
        openAIImageModalForBlock();
    }
    // 通常の画像の場合もモーダルを開く
    else if (type === 'image') {
        currentEditingBlockId = newBlock.id;
        openImageModalForBlock();
    }

    renderBlocks();
    updatePreview();

    return newBlock;
}

// ブロックを削除
function deleteBlock(blockId) {
    if (blocks.length === 1) {
        if (!confirm('最後のブロックを削除しますか？')) return;
    }
    blocks = blocks.filter(b => b.id !== blockId);
    renderBlocks();
    updatePreview();
}

// ブロックを移動
function moveBlock(blockId, direction) {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    renderBlocks();
    updatePreview();
}

// ブロックをレンダリング
function renderBlocks() {
    const container = document.getElementById('blocks-container');
    if (!container) return;

    if (blocks.length === 0) {
        container.innerHTML = `
            <div class="empty-blocks-message" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p>📝 下のボタンからブロックを追加してください</p>
            </div>
        `;
        return;
    }

    container.innerHTML = blocks.map((block, index) => {
        const typeInfo = BLOCK_TYPES[block.type] || { label: block.type, icon: '📦' };
        return `
            <div class="content-block" data-block-id="${block.id}" draggable="true">
                <div class="block-header">
                    <div class="block-drag-handle">
                        <span class="drag-icon">⋮⋮</span>
                        <span class="block-type-label">${typeInfo.icon} ${typeInfo.label}</span>
                    </div>
                    <div class="block-controls">
                        <button type="button" class="block-control-btn" onclick="moveBlock(${block.id}, 'up')" title="上へ移動" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button type="button" class="block-control-btn" onclick="moveBlock(${block.id}, 'down')" title="下へ移動" ${index === blocks.length - 1 ? 'disabled' : ''}>↓</button>
                        <button type="button" class="block-control-btn delete" onclick="deleteBlock(${block.id})" title="削除">🗑️</button>
                    </div>
                </div>
                <div class="block-content">
                    ${renderBlockContent(block)}
                </div>
            </div>
            ${index < blocks.length - 1 ? `
                <div class="block-inserter">
                    <button type="button" class="block-inserter-btn" onclick="showBlockMenu(${index + 1})" title="ブロックを挿入">+</button>
                </div>
            ` : ''}
        `;
    }).join('');

    // ドラッグ&ドロップのセットアップ
    setupBlockDragAndDrop();
}

// ブロックコンテンツをレンダリング
function renderBlockContent(block) {
    switch (block.type) {
        case 'paragraph':
            return `
                <div class="wysiwyg-editor">
                    <div class="wysiwyg-toolbar">
                        <button type="button" class="wysiwyg-btn" onclick="execWysiwyg('bold')" title="太字"><b>B</b></button>
                        <button type="button" class="wysiwyg-btn" onclick="execWysiwyg('italic')" title="斜体"><i>I</i></button>
                        <button type="button" class="wysiwyg-btn" onclick="execWysiwyg('underline')" title="下線"><u>U</u></button>
                        <button type="button" class="wysiwyg-btn" onclick="execWysiwyg('strikeThrough')" title="取り消し線"><s>S</s></button>
                        <button type="button" class="wysiwyg-btn" onclick="insertLink(${block.id})" title="リンク">🔗</button>
                    </div>
                    <div class="wysiwyg-content"
                         contenteditable="true"
                         data-block-id="${block.id}"
                         data-placeholder="テキストを入力..."
                         oninput="updateBlockContent(${block.id}, this.innerHTML)"
                         onfocus="setCurrentBlock(${block.id})">${block.content}</div>
                </div>
            `;

        case 'heading':
            return `
                <div class="heading-block">
                    <select onchange="updateBlockSetting(${block.id}, 'level', this.value); updateHeadingStyle(this)">
                        <option value="h2" ${block.settings.level === 'h2' ? 'selected' : ''}>見出し 大 (H2)</option>
                        <option value="h3" ${block.settings.level === 'h3' ? 'selected' : ''}>見出し 中 (H3)</option>
                    </select>
                    <input type="text"
                           class="heading-input ${block.settings.level}"
                           placeholder="見出しを入力..."
                           value="${escapeHtml(block.content)}"
                           oninput="updateBlockContent(${block.id}, this.value)">
                </div>
            `;

        case 'image':
        case 'ai-image':
            if (block.settings.url) {
                return `
                    <div class="image-block-content">
                        <div class="image-block-preview">
                            <img src="${block.settings.url}" alt="${block.settings.caption || ''}">
                        </div>
                        <div class="image-block-settings">
                            <div class="image-setting-group">
                                <label>キャプション</label>
                                <input type="text"
                                       value="${escapeHtml(block.settings.caption || '')}"
                                       placeholder="画像の説明を入力..."
                                       oninput="updateBlockSetting(${block.id}, 'caption', this.value)">
                            </div>
                            <div class="image-setting-group">
                                <label>配置</label>
                                <div class="image-align-buttons">
                                    <button type="button" class="align-btn ${block.settings.align === 'left' ? 'active' : ''}" onclick="setImageAlign(${block.id}, 'left')">左</button>
                                    <button type="button" class="align-btn ${block.settings.align === 'center' ? 'active' : ''}" onclick="setImageAlign(${block.id}, 'center')">中央</button>
                                    <button type="button" class="align-btn ${block.settings.align === 'right' ? 'active' : ''}" onclick="setImageAlign(${block.id}, 'right')">右</button>
                                    <button type="button" class="align-btn ${block.settings.align === 'full' ? 'active' : ''}" onclick="setImageAlign(${block.id}, 'full')">全幅</button>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-small btn-outline" style="margin-top: 0.5rem;" onclick="changeBlockImage(${block.id})">画像を変更</button>
                    </div>
                `;
            } else {
                return `
                    <div class="image-block-content">
                        <div class="image-block-placeholder" onclick="openImageModalForBlock(${block.id})">
                            <span class="placeholder-icon">🖼️</span>
                            <p class="placeholder-text">クリックして画像を選択</p>
                            <div class="placeholder-buttons">
                                <button type="button" class="placeholder-btn primary" onclick="event.stopPropagation(); openImageModalForBlock(${block.id})">ギャラリーから選択</button>
                                <button type="button" class="placeholder-btn" onclick="event.stopPropagation(); openAIImageModalForBlock(${block.id})">AI検索</button>
                            </div>
                        </div>
                    </div>
                `;
            }

        case 'quote':
            return `
                <div class="quote-block-content">
                    <span class="quote-icon">"</span>
                    <div class="quote-text"
                         contenteditable="true"
                         data-placeholder="引用文を入力..."
                         oninput="updateBlockContent(${block.id}, this.innerHTML)">${block.content}</div>
                </div>
            `;

        case 'list':
            return `
                <div class="list-block-content">
                    <textarea placeholder="・ 項目1
・ 項目2
・ 項目3

（各行が箇条書きの項目になります）"
                              oninput="updateBlockContent(${block.id}, this.value)">${block.content}</textarea>
                    <p class="list-hint">💡 各行が1つの項目になります。・や- で始めてください。</p>
                </div>
            `;

        case 'divider':
            return `
                <div class="divider-block-content">
                    <hr class="divider-line">
                </div>
            `;

        default:
            return `<p>未対応のブロックタイプ: ${block.type}</p>`;
    }
}

// ブロックコンテンツを更新
function updateBlockContent(blockId, content) {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
        block.content = content;
        updatePreview();
    }
}

// ブロック設定を更新
function updateBlockSetting(blockId, key, value) {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
        block.settings[key] = value;
        updatePreview();
    }
}

// 画像配置を設定
function setImageAlign(blockId, align) {
    updateBlockSetting(blockId, 'align', align);
    renderBlocks();
}

// 画像を変更
function changeBlockImage(blockId) {
    currentEditingBlockId = blockId;
    openImageModalForBlock(blockId);
}

// 現在編集中のブロックを設定
function setCurrentBlock(blockId) {
    currentEditingBlockId = blockId;
}

// WYSIWYGコマンドを実行
function execWysiwyg(command, value = null) {
    document.execCommand(command, false, value);
}

// リンクを挿入
function insertLink(blockId) {
    const url = prompt('リンクURLを入力してください:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
}

// 見出しスタイルを更新
function updateHeadingStyle(select) {
    const input = select.parentElement.querySelector('.heading-input');
    input.classList.remove('h2', 'h3');
    input.classList.add(select.value);
}

// ブロックメニューを表示
function showBlockMenu(insertIndex) {
    // シンプルに段落ブロックを追加
    addBlock('paragraph', insertIndex);
}

// ========================================
// ブロック用画像モーダル
// ========================================

function openImageModalForBlock(blockId = null) {
    if (blockId) currentEditingBlockId = blockId;

    // 既存の画像挿入モーダルを流用
    document.getElementById('image-insert-modal').style.display = 'flex';
    selectedInsertImageUrl = null;
    insertUploadedImageData = null;

    document.querySelectorAll('.insert-image-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.getElementById('insert-caption').value = '';
    document.querySelector('input[name="insert-align"][value="center"]').checked = true;
    switchInsertTab('gallery');
}

function openAIImageModalForBlock(blockId = null) {
    if (blockId) currentEditingBlockId = blockId;
    openAIImageModal();
}

// 画像をブロックに設定（画像モーダルから呼び出される）
function setBlockImage(url, caption, align) {
    if (!currentEditingBlockId) return;

    const block = blocks.find(b => b.id === currentEditingBlockId);
    if (block && (block.type === 'image' || block.type === 'ai-image')) {
        block.settings.url = url;
        block.settings.caption = caption || '';
        block.settings.align = align || 'center';
        renderBlocks();
        updatePreview();
    }
    currentEditingBlockId = null;
}

// ========================================
// ドラッグ&ドロップ
// ========================================

function setupBlockDragAndDrop() {
    const container = document.getElementById('blocks-container');
    const blockElements = container.querySelectorAll('.content-block');

    blockElements.forEach(block => {
        block.addEventListener('dragstart', handleDragStart);
        block.addEventListener('dragend', handleDragEnd);
        block.addEventListener('dragover', handleDragOver);
        block.addEventListener('drop', handleDrop);
        block.addEventListener('dragenter', handleDragEnter);
        block.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedBlockId = parseInt(e.target.dataset.blockId);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.content-block').forEach(block => {
        block.classList.remove('drag-over');
    });
    draggedBlockId = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('content-block')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('content-block')) {
        e.target.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const targetBlockId = parseInt(e.target.closest('.content-block')?.dataset.blockId);

    if (draggedBlockId && targetBlockId && draggedBlockId !== targetBlockId) {
        const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId);
        const targetIndex = blocks.findIndex(b => b.id === targetBlockId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedBlock] = blocks.splice(draggedIndex, 1);
            blocks.splice(targetIndex, 0, draggedBlock);
            renderBlocks();
            updatePreview();
        }
    }
}

// ========================================
// ブロック <-> テキスト変換
// ========================================

// ブロックをテキストに変換（保存用）
function blocksToText() {
    return blocks.map(block => {
        switch (block.type) {
            case 'paragraph':
                // HTMLタグを除去してプレーンテキストに
                const div = document.createElement('div');
                div.innerHTML = block.content;
                return div.textContent || div.innerText || '';

            case 'heading':
                const prefix = block.settings.level === 'h2' ? '## ' : '### ';
                return prefix + block.content;

            case 'image':
            case 'ai-image':
                if (block.settings.url) {
                    return `[IMAGE:${block.settings.url}|${block.settings.caption || ''}|${block.settings.align || 'center'}]`;
                }
                return '';

            case 'quote':
                const quoteDiv = document.createElement('div');
                quoteDiv.innerHTML = block.content;
                const quoteText = quoteDiv.textContent || quoteDiv.innerText || '';
                return `> ${quoteText}`;

            case 'list':
                return block.content;

            case 'divider':
                return '━━━━━━━━━━━━━━━━━━━━';

            default:
                return block.content;
        }
    }).filter(text => text.trim()).join('\n\n');
}

// テキストをブロックに変換（読み込み用）
function textToBlocks(text) {
    if (!text) return [];

    const paragraphs = text.split('\n\n');
    blocks = [];
    blockIdCounter = 0;

    paragraphs.forEach(para => {
        const trimmed = para.trim();
        if (!trimmed) return;

        // 見出し (## or ###)
        if (trimmed.startsWith('### ')) {
            blocks.push({
                id: ++blockIdCounter,
                type: 'heading',
                content: trimmed.substring(4),
                settings: { level: 'h3' }
            });
        } else if (trimmed.startsWith('## ')) {
            blocks.push({
                id: ++blockIdCounter,
                type: 'heading',
                content: trimmed.substring(3),
                settings: { level: 'h2' }
            });
        }
        // 画像
        else if (trimmed.match(/^\[IMAGE:(.+)\|(.*)?\|(left|center|right|full)\]$/)) {
            const match = trimmed.match(/^\[IMAGE:(.+)\|(.*)\|(left|center|right|full)\]$/);
            blocks.push({
                id: ++blockIdCounter,
                type: 'image',
                content: '',
                settings: {
                    url: match[1],
                    caption: match[2] || '',
                    align: match[3]
                }
            });
        }
        // 引用
        else if (trimmed.startsWith('> ')) {
            blocks.push({
                id: ++blockIdCounter,
                type: 'quote',
                content: trimmed.substring(2),
                settings: {}
            });
        }
        // 区切り線
        else if (trimmed.match(/^[━─═]{3,}$/)) {
            blocks.push({
                id: ++blockIdCounter,
                type: 'divider',
                content: '',
                settings: {}
            });
        }
        // リスト
        else if (trimmed.split('\n').every(line => line.match(/^[・\-\*◆◇●○]\s/) || !line.trim())) {
            blocks.push({
                id: ++blockIdCounter,
                type: 'list',
                content: trimmed,
                settings: { style: 'bullet' }
            });
        }
        // 通常の段落
        else {
            blocks.push({
                id: ++blockIdCounter,
                type: 'paragraph',
                content: trimmed.replace(/\n/g, '<br>'),
                settings: {}
            });
        }
    });

    return blocks;
}

// HTMLエスケープ
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

    // ブロックエディタをリセット
    blocks = [];
    blockIdCounter = 0;

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

            // 本文をブロックに変換
            textToBlocks(article.body);
        }
    } else {
        title.textContent = "新しい記事を作成";
        // 新規記事の場合、最初の段落ブロックを追加
        blocks = [{
            id: ++blockIdCounter,
            type: 'paragraph',
            content: '',
            settings: {}
        }];
    }

    // ブロックをレンダリング
    renderBlocks();

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

// アップロードされた画像のBase64データ
let uploadedImageData = null;

function switchImageTab(tab) {
    const tabs = document.querySelectorAll('.image-tab');
    const galleryContent = document.getElementById('tab-gallery');
    const uploadContent = document.getElementById('tab-upload');
    const urlContent = document.getElementById('tab-url');

    // すべてのタブを非アクティブに
    tabs.forEach(t => t.classList.remove('active'));
    galleryContent.style.display = 'none';
    uploadContent.style.display = 'none';
    urlContent.style.display = 'none';

    // 選択されたタブをアクティブに
    if (tab === 'gallery') {
        tabs[0].classList.add('active');
        galleryContent.style.display = 'block';
    } else if (tab === 'upload') {
        tabs[1].classList.add('active');
        uploadContent.style.display = 'block';
    } else if (tab === 'url') {
        tabs[2].classList.add('active');
        urlContent.style.display = 'block';
    }
}

// 画像アップロード処理
function setupImageUpload() {
    const uploadArea = document.getElementById('upload-area');
    const uploadInput = document.getElementById('image-upload');
    const placeholder = document.getElementById('upload-placeholder');

    if (!uploadArea || !uploadInput) return;

    // クリックでファイル選択
    placeholder.addEventListener('click', () => {
        uploadInput.click();
    });

    // ファイル選択時
    uploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // ドラッグ&ドロップ
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });
}

function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImageData = e.target.result;

        // プレビューを表示
        const placeholder = document.getElementById('upload-placeholder');
        const preview = document.getElementById('upload-preview');
        const previewImg = document.getElementById('upload-preview-img');

        placeholder.style.display = 'none';
        preview.style.display = 'flex';
        previewImg.src = uploadedImageData;

        // ファイル名を表示
        document.getElementById('upload-filename').textContent = file.name;

        // ファイルサイズを表示
        const fileSizeKB = (file.size / 1024).toFixed(1);
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        document.getElementById('upload-filesize').textContent =
            file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

        // 画像サイズを取得
        const img = new Image();
        img.onload = () => {
            document.getElementById('upload-dimensions').textContent =
                `${img.width} x ${img.height} ピクセル`;
        };
        img.src = uploadedImageData;

        // 選択中の画像をアップロード画像に設定
        selectedImageUrl = uploadedImageData;
        updatePreview();
    };
    reader.readAsDataURL(file);
}

function clearUploadedImage() {
    uploadedImageData = null;
    const placeholder = document.getElementById('upload-placeholder');
    const preview = document.getElementById('upload-preview');
    const uploadInput = document.getElementById('image-upload');

    placeholder.style.display = 'block';
    preview.style.display = 'none';
    uploadInput.value = '';

    // ギャラリーの最初の画像に戻す
    resetImageSelection();
}

// URL入力時の画像情報読み込み
function loadUrlImageInfo() {
    const urlInput = document.getElementById('article-image');
    const infoDiv = document.getElementById('url-image-info');
    const previewImg = document.getElementById('url-preview-img');
    const dimensionsSpan = document.getElementById('url-dimensions');

    const url = urlInput.value.trim();
    if (!url) {
        infoDiv.style.display = 'none';
        return;
    }

    // 画像を読み込んでサイズを取得
    const img = new Image();
    img.onload = () => {
        infoDiv.style.display = 'flex';
        previewImg.src = url;
        dimensionsSpan.textContent = `${img.width} x ${img.height} ピクセル`;
        selectedImageUrl = url;
        updatePreview();
    };
    img.onerror = () => {
        infoDiv.style.display = 'none';
    };
    img.src = url;
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
    const tabs = document.querySelectorAll('.image-tab');

    // アップロードタブがアクティブでアップロード画像がある場合
    if (tabs[1] && tabs[1].classList.contains('active') && uploadedImageData) {
        return uploadedImageData;
    }

    // URLタブがアクティブならURL入力を使用
    if (tabs[2] && tabs[2].classList.contains('active')) {
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

    // 本文（ブロックエディタから取得）
    const body = blocksToText() || '本文がここに表示されます...';
    document.getElementById('preview-body').innerHTML = formatBodyText(body);

    // hidden textareaにも保存（バックアップ用）
    document.getElementById('article-body').value = body;
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
    // 画像タグを変換する関数
    function convertImageTags(content) {
        // [IMAGE:URL|キャプション|配置] 形式を検出
        const imageRegex = /\[IMAGE:([^\|]+)\|([^\|]*)\|([^\]]+)\]/g;
        return content.replace(imageRegex, (match, url, caption, align) => {
            const alignClass = `embedded-image-${align || 'center'}`;
            const captionHtml = caption ? `<figcaption class="embedded-caption">${caption}</figcaption>` : '';
            return `<figure class="embedded-image ${alignClass}">
                <img src="${url}" alt="${caption || ''}" loading="lazy">
                ${captionHtml}
            </figure>`;
        });
    }

    // まず画像タグを変換
    let processed = convertImageTags(text);

    // 改行をbrタグに変換し、段落を分ける
    return processed
        .split('\n\n')
        .map(paragraph => {
            // figureタグを含む場合はそのまま返す
            if (paragraph.includes('<figure')) {
                return paragraph;
            }
            return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
        })
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

    // ブロックエディタからテキストを生成
    const body = blocksToText();

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
    if (!body || blocks.length === 0) {
        alert('本文を入力してください');
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
// 画像挿入モーダル
// ========================================

let selectedInsertImageUrl = null;
let insertUploadedImageData = null;

function openImageInsertModal() {
    document.getElementById('image-insert-modal').style.display = 'flex';
    selectedInsertImageUrl = null;
    insertUploadedImageData = null;

    // 選択をリセット
    document.querySelectorAll('.insert-image-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.getElementById('insert-caption').value = '';
    document.querySelector('input[name="insert-align"][value="center"]').checked = true;

    // ギャラリータブをアクティブに
    switchInsertTab('gallery');
}

function closeImageInsertModal() {
    document.getElementById('image-insert-modal').style.display = 'none';
}

function switchInsertTab(tab) {
    const tabs = document.querySelectorAll('.insert-tab');
    const galleryContent = document.getElementById('insert-gallery');
    const uploadContent = document.getElementById('insert-upload');
    const urlContent = document.getElementById('insert-url');

    tabs.forEach(t => t.classList.remove('active'));
    galleryContent.style.display = 'none';
    uploadContent.style.display = 'none';
    urlContent.style.display = 'none';

    if (tab === 'gallery') {
        tabs[0].classList.add('active');
        galleryContent.style.display = 'block';
    } else if (tab === 'upload') {
        tabs[1].classList.add('active');
        uploadContent.style.display = 'block';
    } else if (tab === 'url') {
        tabs[2].classList.add('active');
        urlContent.style.display = 'block';
    }
}

function getInsertImageUrl() {
    const tabs = document.querySelectorAll('.insert-tab');

    // アップロードタブがアクティブ
    if (tabs[1].classList.contains('active') && insertUploadedImageData) {
        return insertUploadedImageData;
    }

    // URLタブがアクティブ
    if (tabs[2].classList.contains('active')) {
        return document.getElementById('insert-image-url').value.trim();
    }

    // ギャラリーから選択
    return selectedInsertImageUrl;
}

function insertImageToBody() {
    const imageUrl = getInsertImageUrl();
    if (!imageUrl) {
        alert('画像を選択してください');
        return;
    }

    const caption = document.getElementById('insert-caption').value.trim();
    const align = document.querySelector('input[name="insert-align"]:checked').value;

    // ブロックエディタモードの場合
    if (currentEditingBlockId) {
        setBlockImage(imageUrl, caption, align);
        closeImageInsertModal();
        return;
    }

    // 新しい画像ブロックとして追加
    const newBlock = {
        id: ++blockIdCounter,
        type: 'image',
        content: '',
        settings: {
            url: imageUrl,
            caption: caption,
            align: align
        }
    };
    blocks.push(newBlock);
    renderBlocks();
    updatePreview();

    // モーダルを閉じる
    closeImageInsertModal();
}

function setupInsertGallery() {
    document.querySelectorAll('.insert-image-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.insert-image-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            selectedInsertImageUrl = option.dataset.url;
        });
    });
}

function setupInsertUpload() {
    const uploadArea = document.getElementById('insert-upload-area');
    const uploadInput = document.getElementById('insert-image-file');
    const uploadPreview = document.getElementById('insert-upload-preview');
    const previewImg = document.getElementById('insert-preview-img');

    if (!uploadArea || !uploadInput) return;

    uploadArea.addEventListener('click', () => {
        uploadInput.click();
    });

    uploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                insertUploadedImageData = ev.target.result;
                uploadArea.style.display = 'none';
                uploadPreview.style.display = 'block';
                previewImg.src = insertUploadedImageData;
            };
            reader.readAsDataURL(file);
        }
    });

    // ドラッグ&ドロップ
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
        uploadArea.style.background = '#fff5f5';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                insertUploadedImageData = ev.target.result;
                uploadArea.style.display = 'none';
                uploadPreview.style.display = 'block';
                previewImg.src = insertUploadedImageData;
            };
            reader.readAsDataURL(file);
        }
    });
}

// ========================================
// AI画像検索モーダル
// ========================================

let selectedAIImageUrl = null;

function openAIImageModal() {
    document.getElementById('ai-image-modal').style.display = 'flex';
    selectedAIImageUrl = null;
    document.getElementById('ai-keyword').value = '';
    document.getElementById('ai-caption').value = '';
    document.querySelector('input[name="ai-align"][value="center"]').checked = true;
    document.getElementById('ai-results').innerHTML = `
        <div class="ai-placeholder">
            <span>🎨</span>
            <p>キーワードを入力して検索してください</p>
        </div>
    `;
    document.getElementById('ai-options').style.display = 'none';
    document.getElementById('ai-insert-btn').disabled = true;
}

function closeAIImageModal() {
    document.getElementById('ai-image-modal').style.display = 'none';
}

async function searchAIImages() {
    const keyword = document.getElementById('ai-keyword').value.trim();
    if (!keyword) {
        alert('キーワードを入力してください');
        return;
    }

    const resultsDiv = document.getElementById('ai-results');
    resultsDiv.innerHTML = '<div class="ai-loading"></div>';

    try {
        // Unsplash Source APIを使用（APIキー不要）
        // 複数の画像URLを生成
        const images = [];
        const baseKeywords = encodeURIComponent(keyword);

        for (let i = 0; i < 9; i++) {
            images.push({
                url: `https://source.unsplash.com/800x600/?${baseKeywords}&sig=${Date.now() + i}`,
                thumb: `https://source.unsplash.com/400x300/?${baseKeywords}&sig=${Date.now() + i}`
            });
        }

        // 結果を表示
        resultsDiv.innerHTML = `
            <div class="ai-grid">
                ${images.map((img, index) => `
                    <div class="ai-image-option" data-url="${img.url}" onclick="selectAIImage(this)">
                        <img src="${img.thumb}" alt="検索結果 ${index + 1}" loading="lazy">
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('画像検索エラー:', error);
        resultsDiv.innerHTML = `
            <div class="ai-placeholder">
                <span>😕</span>
                <p>画像の検索に失敗しました。もう一度お試しください。</p>
            </div>
        `;
    }
}

function selectAIImage(element) {
    document.querySelectorAll('.ai-image-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedAIImageUrl = element.dataset.url;

    // オプションを表示
    document.getElementById('ai-options').style.display = 'block';
    document.getElementById('ai-insert-btn').disabled = false;
}

function insertAIImageToBody() {
    if (!selectedAIImageUrl) {
        alert('画像を選択してください');
        return;
    }

    const caption = document.getElementById('ai-caption').value.trim();
    const align = document.querySelector('input[name="ai-align"]:checked').value;

    // ブロックエディタモードの場合
    if (currentEditingBlockId) {
        setBlockImage(selectedAIImageUrl, caption, align);
        closeAIImageModal();
        return;
    }

    // 新しいAI画像ブロックとして追加
    const newBlock = {
        id: ++blockIdCounter,
        type: 'ai-image',
        content: '',
        settings: {
            url: selectedAIImageUrl,
            caption: caption,
            align: align
        }
    };
    blocks.push(newBlock);
    renderBlocks();
    updatePreview();

    // モーダルを閉じる
    closeAIImageModal();
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

    // 画像アップロードのセットアップ
    setupImageUpload();

    // プレビュー更新リスナーのセットアップ
    setupPreviewListeners();

    // 画像挿入モーダルのセットアップ
    setupInsertGallery();
    setupInsertUpload();

    // Enterキーで検索
    const aiKeywordInput = document.getElementById('ai-keyword');
    if (aiKeywordInput) {
        aiKeywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchAIImages();
            }
        });
    }

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
