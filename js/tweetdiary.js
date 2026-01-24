"use strict";

const CONFIG = {
    MAX_MEMOS: 8,
    MAX_IMAGE_SIZE: 300,
    KANAZAWA_STATION: [36.5781, 136.6478]
};

// 初期値
let map;
let memos = [];
let selectedLocation = null;
let currentMarker = null;
let highlightedCard = null;
let pinMarkers = new Map();
let highlightedPin = null;


// ピンの画像設定
const ICONS = {
    temp: L.icon({
        iconUrl: 'images/pins/pin-temp.png',
        iconSize: [50, 50],
        iconAnchor: [25, 50]
    }),
    saved: L.icon({
        iconUrl: 'images/pins/pin-saved.png',
        iconSize: [50, 50],
        iconAnchor: [25, 50]
    }),
    highlighted: L.icon({
        iconUrl: 'images/pins/pin-highlighted.png',
        iconSize: [80, 80],
        iconAnchor: [40, 80]
    })
};
document.addEventListener('DOMContentLoaded', function () {
    initMap();
    loadMemos();
    updateDisplay();
    bindEvents();
    initToggleButton();
    setupEventListeners();
});

function initToggleButton() {
    const inputContainer = document.getElementById('inputContainer');
    const formContent = document.getElementById('formContent');

    // デスクトップではフォームを常に表示
    if (window.innerWidth > 768) {
        formContent.classList.add('show');
        inputContainer.classList.remove('collapsed', 'expanded');
    } else {
        // スマホでは初期状態は折りたたみ
        inputContainer.classList.add('collapsed');
    }

    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            formContent.classList.add('show');
            inputContainer.classList.remove('collapsed', 'expanded');
        } else {
            if (!formContent.classList.contains('show')) {
                inputContainer.classList.add('collapsed');
                inputContainer.classList.remove('expanded');
            } else {
                // フォームが開いている場合
                inputContainer.classList.remove('collapsed');
                inputContainer.classList.add('expanded');
                toggleBtn.textContent = '折りたたむ';
                toggleBtn.classList.add('active');
            }
        }
    });
}

function toggleForm() {
    const formContent = document.getElementById('formContent');
    const toggleBtn = document.getElementById('toggleBtn');
    const inputContainer = document.getElementById('inputContainer');

    if (formContent.classList.contains('show')) {
        // 閉じる
        formContent.classList.remove('show');
        toggleBtn.textContent = 'ひとこと日記を追加';
        toggleBtn.classList.remove('active');
        inputContainer.classList.add('collapsed');
        inputContainer.classList.remove('expanded');
    } else {
        // 開く
        formContent.classList.add('show');
        toggleBtn.textContent = '折りたたむ';
        toggleBtn.classList.add('active');
        inputContainer.classList.remove('collapsed');
        inputContainer.classList.add('expanded');
    }
}

function initMap() {
    map = L.map('map').setView(CONFIG.KANAZAWA_STATION, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        const isDuplicate = memos.some(memo => {
            const distance = getDistance(lat, lng, memo.lat, memo.lng);
            return distance < 0.1;
        });

        if (isDuplicate) {
            alert('この場所には既に日記があります。別の場所を選択してください。');
            return;
        }

        setSelectedLocation(lat, lng);
    });
}

function setSelectedLocation(lat, lng) {
    selectedLocation = { lat, lng };
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    currentMarker = L.marker([lat, lng], { icon: ICONS.temp }).addTo(map);
    // ステップ1完了 → ステップ2を有効化
    updateStepProgress('pin', 'date');
    enableStep('date');
    enableForm();
}

function enableForm() {
     const dateField = document.getElementById('date');
    // 入力可能に
    dateField.disabled = false;
}

function enableStep(step) {
    const field = document.getElementById(step);
    const label = document.getElementById(`label-${step}`);

    if (field) {
        field.disabled = false;
    }
    if (label) {
        label.classList.remove('disabled');
    }
}

function updateStepProgress(completedStep, nextStep) {
    // 完了したステップを通常色に
    if (completedStep) {
        const completedLabel = document.getElementById(`label-${completedStep}`);
        if (completedLabel) {
            completedLabel.classList.remove('active');
            completedLabel.classList.add('completed');
        }
    }

    // 次のステップを青色・太字に
    if (nextStep) {
        const nextLabel = document.getElementById(`label-${nextStep}`);
        if (nextLabel) {
            nextLabel.classList.add('active');
            nextLabel.classList.remove('disabled');
        }
    }
}

function bindEvents() {
    const form = document.getElementById('diaryForm');
    const commentField = document.getElementById('comment');
    const charCount = document.getElementById('charCount');
    const dateField = document.getElementById('date');

    // 日付入力時 → ステップ2完了、ステップ3を有効化
    dateField.addEventListener('change', function () {
        if (this.value) {
            updateStepProgress('date', 'comment');
            enableStep('comment');
        }
    });

    // 感想入力時 → ステップ3完了、ステップ4を有効化
    commentField.addEventListener('input', function () {
        const count = this.value.length;
        charCount.textContent = count;
        charCount.style.color = count > 90 ? '#dc3545' : '#666';

        // 1文字以上入力されたら次のステップへ
        if (count > 0 && !commentField.dataset.progressUpdated) {
            updateStepProgress('comment', 'photo');
            enableStep('photo');
            // 保存ボタンも有効化
            document.getElementById('saveBtn').disabled = false;
            commentField.dataset.progressUpdated = 'true';
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        saveMemo();
    });

    document.getElementById('saveBtn').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        saveMemo();
    });
}

function saveMemo() {
    if (!selectedLocation) {
        alert('地図上で場所を選択してください。');
        return;
    }

    if (memos.length >= CONFIG.MAX_MEMOS) {
        alert('メモの最大保存数（8つ）を超えました。');
        return;
    }

    const formData = new FormData(document.getElementById('diaryForm'));
    const photoFile = formData.get('photo');

    if (photoFile && photoFile.size > 0) {
        resizeImage(photoFile, (resizedImage) => {
            createMemo(formData, resizedImage);
        });
    } else {
        createMemo(formData, null);
    }
}

function resizeImage(file, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
        try {
            const maxSize = CONFIG.MAX_IMAGE_SIZE;
            let { width, height } = img;

            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
            callback(resizedImage);
        } catch (error) {
            console.error('画像リサイズエラー:', error);
            alert('画像の処理に失敗しました。別の画像を試してください。');
        }
    };

    img.onerror = function () {
        alert('画像の読み込みに失敗しました。');
    };

    try {
        img.src = URL.createObjectURL(file);
    } catch (error) {
        alert('ファイルの読み込みに失敗しました。');
    }
}

function createMemo(formData, imageData) {
    try {
        const memo = {
            id: Date.now(),
            date: formData.get('date'),
            comment: formData.get('comment'),
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            image: imageData,
            createdAt: new Date().toISOString()
        };

        memos.push(memo);
        saveMemos();
        updateDisplay();
        resetForm();

        alert('ひとこと日記を追加しました！');
    } catch (error) {
        console.error('日記作成エラー:', error);
        alert('日記の追加に失敗しました。');
    }
}

function resetForm() {
    document.getElementById('diaryForm').reset();
    document.getElementById('charCount').textContent = '0';
    document.getElementById('saveBtn').disabled = true;

    // プログレス状態をリセット
    const commentField = document.getElementById('comment');
    if (commentField) {
        delete commentField.dataset.progressUpdated;
    }

    // 全てのラベルを通常状態に
    document.querySelectorAll('.form-group label').forEach(label => {
        label.classList.remove('active', 'completed');
    });

    // 全ての入力欄を無効化（ステップ1以外）
    document.getElementById('date').disabled = true;
    document.getElementById('comment').disabled = true;
    document.getElementById('photo').disabled = true;

    // ラベルも無効化状態に
    document.getElementById('label-date').classList.add('disabled');
    document.getElementById('label-comment').classList.add('disabled');
    document.getElementById('label-photo').classList.add('disabled');

    // ステップ1を再びアクティブに
    const pinLabel = document.getElementById('label-pin');
    if (pinLabel) {
        pinLabel.classList.add('active');
    }

    selectedLocation = null;

    if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
    }
}

function updateDisplay() {
    updateMemoCount();
    displayMemos();
    displayPins();
}

function updateMemoCount() {
    document.getElementById('memoCount').textContent = memos.length;
}

function displayMemos() {
    const grid = document.getElementById('cardsGrid');

    if (memos.length === 0) {
        grid.innerHTML = '<div class="status-message">地図をクリックして日記を追加してください</div>';
        return;
    }

    const sortedMemos = [...memos].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    grid.innerHTML = sortedMemos.map(memo => {
        const hasImage = memo.image && memo.image.length > 0;
        return `
                    <div class="memo-card" data-id="${memo.id}" onclick="highlightPin(${memo.id})">
                        <div class="card-date">${formatDate(memo.date)}</div>
                        ${hasImage ? `<img src="${memo.image}" alt="写真" class="card-image">` : ''}
                        <div class="card-content ${!hasImage ? 'no-image' : ''}">${escapeHtml(memo.comment)}</div>
                        <button class="delete-btn" onclick="deleteMemo(${memo.id}, event)">削除</button>
                    </div>
                `;
    }).join('');
}

function displayPins() {
    pinMarkers.forEach(marker => map.removeLayer(marker));
    pinMarkers.clear();

    memos.forEach(memo => {
        const marker = L.marker([memo.lat, memo.lng], {
            icon: ICONS.saved
        }).addTo(map);

        // コメントを10文字にして「…」追加
        let shortComment = memo.comment ? memo.comment.slice(0, 5) : "";
        if (memo.comment && memo.comment.length > 5) {
            shortComment += "…";
        }

        // 日付とコメントを2行に
        const labelText = `${formatDate(memo.date)}<br>${shortComment}`;

        marker.bindTooltip(labelText, {
            permanent: true,
            direction: 'top',
            offset: [0, -40],
            className: 'pin-label'
        });

        pinMarkers.set(memo.id, marker);

        marker.on('click', function () {
            highlightCard(memo.id);
        });
    });
}

function highlightCard(memoId) {
    if (highlightedCard) {
        highlightedCard.classList.remove('highlighted');
    }

    const card = document.querySelector(`[data-id="${memoId}"]`);
    if (card) {
        card.classList.add('highlighted');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        highlightedCard = card;

        setTimeout(() => {
            if (highlightedCard) {
                highlightedCard.classList.remove('highlighted');
                highlightedCard = null;
            }
        }, 3000);
    }
}


function highlightPin(memoId) {
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return;

    if (highlightedPin) {
        const oldMarker = pinMarkers.get(highlightedPin);
        if (oldMarker) {
            oldMarker.setIcon(ICONS.saved);
            
            // 前のマーカーのツールチップ位置を元に戻す
            const oldTooltip = oldMarker.getTooltip();
            if (oldTooltip) {
                oldTooltip.options.offset = [0, -40];
                oldMarker.setTooltipContent(oldTooltip.getContent());
            }
        }
    }

    const marker = pinMarkers.get(memoId);
    if (marker) {
        marker.setIcon(ICONS.highlighted);

        // ツールチップの位置を上に移動
        const tooltip = marker.getTooltip();
        if (tooltip) {
            tooltip.options.offset = [0, -65];  // -40 → -65 に変更（20px上に）
            marker.setTooltipContent(tooltip.getContent());
        }

        highlightedPin = memoId;

        map.setView([memo.lat, memo.lng], 17, {
            animate: true,
            duration: 1
        });

        setTimeout(() => {
            if (highlightedPin === memoId) {
                marker.setIcon(ICONS.saved);
                
                // ツールチップの位置を元に戻す
                const tooltip = marker.getTooltip();
                if (tooltip) {
                    tooltip.options.offset = [0, -40];
                    marker.setTooltipContent(tooltip.getContent());
                }
                
                highlightedPin = null;
            }
        }, 3000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" })[m];
    });
}

function saveMemos() {
    try {
        localStorage.setItem('diary_memos', JSON.stringify(memos));
    } catch (e) {
        console.error('データの保存に失敗しました:', e);
        alert('データの保存に失敗しました。ブラウザの容量制限に達している可能性があります。');
    }
}

function loadMemos() {
    try {
        const saved = localStorage.getItem('diary_memos');
        if (saved) {
            memos = JSON.parse(saved);
        }
    } catch (e) {
        console.error('データの読み込みに失敗しました:', e);
        memos = [];
    }
}

function deleteMemo(memoId, event) {
    if (event) {
        event.stopPropagation();
    }

    if (!confirm('この日記を削除しますか？')) {
        return;
    }

    const marker = pinMarkers.get(memoId);
    if (marker) {
        map.removeLayer(marker);
        pinMarkers.delete(memoId);
    }

    if (highlightedPin === memoId) {
        highlightedPin = null;
    }
    if (highlightedCard && highlightedCard.dataset.id == memoId) {
        highlightedCard = null;
    }

    memos = memos.filter(memo => memo.id !== memoId);

    saveMemos();
    updateDisplay();

    alert('日記を削除しました');
}

function deleteAllMemos() {
    if (memos.length === 0) {
        alert('削除する日記がありません');
        return;
    }

    if (!confirm(`全ての日記（${memos.length}件）を削除しますか？\nこの操作は取り消せません。`)) {
        return;
    }

    // 全てのピンを削除
    pinMarkers.forEach(marker => map.removeLayer(marker));
    pinMarkers.clear();

    // ハイライト状態をクリア
    highlightedPin = null;
    highlightedCard = null;

    // 仮マーカーも削除
    if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
    }

    // 日記を全削除
    memos = [];

    // データを保存
    saveMemos();

    // 表示を更新
    updateDisplay();

    // フォームをリセット
    resetForm();

    alert('全ての日記を削除しました');
}

/**
 * イベントリスナーのセットアップ
 */
function setupEventListeners() {
    // トグルボタン
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleForm);
    }

    // 全削除ボタン
    const deleteAllBtn = document.querySelector('.delete-all-btn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllMemos);
    }

    // カードのクリック（イベント委譲）
    const cardsGrid = document.getElementById('cardsGrid');
    if (cardsGrid) {
        cardsGrid.addEventListener('click', handleCardClick);
    }
}

/**
 * カードクリック時の処理
 */
function handleCardClick(e) {
    // 削除ボタンのクリック
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const memoId = parseInt(deleteBtn.dataset.memoId);
        deleteMemo(memoId, e);
        return;
    }

    // カード本体のクリック
    const card = e.target.closest('.memo-card');
    if (card) {
        const memoId = parseInt(card.dataset.id);
        highlightPin(memoId);
    }
}