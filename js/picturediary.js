"use strict";
/* ===========   絵日記の作成   =========== */

const canvas = document.getElementById("canvas-preview");
const ctx = canvas.getContext('2d');

// ======== 初期値 ========
let textColor = "black";
let frameColor = "black";
let textFont = "Arial";
let uploadedImage = null;
let showDate = false;
let originalText = "";	// テキストの保持
let selectedDate = '';
let stampImage = null;

// ========== 描画関連の関数 ==========
// 絵日記の枠組みをつくる関数
function makingFrame() {
	ctx.strokeStyle = frameColor;
	ctx.lineWidth = 1;
	ctx.strokeRect(20, 20, 556, 350);
	ctx.strokeRect(20, 380, 556, 250);

	ctx.beginPath();
	ctx.moveTo(20, 430);
	ctx.lineTo(576, 430);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(20, 480);
	ctx.lineTo(576, 480);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(20, 530);
	ctx.lineTo(576, 530);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(20, 580);
	ctx.lineTo(576, 580);
	ctx.stroke();
}

// テキストエリアの文字を絵日記に入れる関数
function drawText(firstLine) {
	const lines = document.getElementById('picturediary-text').value.split('\n');
	ctx.textBaseline = 'middle';

	lines.forEach(function (line, index) {
		let fontSize = 30;
		ctx.font = fontSize + "px " + textFont;
		let textWidth = ctx.measureText(line).width;
		const maxWidth = canvas.width - 50;

		while (textWidth > maxWidth && fontSize > 10) {
			fontSize--;
			ctx.font = fontSize + "px " + textFont;
			textWidth = ctx.measureText(line).width;
		}

		ctx.fillStyle = textColor;
		ctx.fillText(line, 25, firstLine + (index * 50));
	});
}

// スタンプを描画する関数
function drawStamp() {
	if (stampImage) {
		// 右下に描画（枠の内側）
		const stampSize = 120;
		const x = 576 - stampSize - 2;  // 右端から2pxの余白
		const y = 630 - stampSize - 2;  // 下から2pxの余白
		ctx.drawImage(stampImage, x, y, stampSize, stampSize);
	}
}

//設定を変更する毎に再描画するための関数
function redraw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawImage();
	makingFrame();
	drawStamp();

	const textStartY = (showDate) ? 455 : 405;
	if (showDate) {
		drawDate();
	}
	drawText(textStartY);
}

//スタイルの各ボタンが押されたとき activeクラスを追加する関数
function addactiveClass(event) {
	if (event.target.tagName === 'BUTTON') {
		const container = event.currentTarget;
		container.querySelectorAll('button').forEach(btn => {
			btn.classList.remove('active');
		});
		event.target.classList.add('active');
	}
}

// 日付の表示形式を変える関数
function formatDate(dateString) {
	if (!dateString) return '';
	const date = new Date(dateString);
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${year}年${month}月${day}日`;
}

// 日付を絵日記に描画する関数
function drawDate() {
	if (selectedDate) {
		ctx.font = '25px ' + textFont;
		ctx.fillStyle = textColor;
		ctx.textBaseline = 'middle';
		ctx.fillText(selectedDate, 30, 405);
	}
}

// ユーザーが選択した画像を描画する関数
function drawImage() {
	if (uploadedImage) {
		const frameX = 20;
		const frameY = 20;
		const frameWidth = 556;
		const frameHeight = 350;

		const imgRatio = uploadedImage.width / uploadedImage.height;
		const frameRatio = frameWidth / frameHeight;

		let sourceX, sourceY, sourceWidth, sourceHeight;

		if (imgRatio > frameRatio) {
			sourceHeight = uploadedImage.height;
			sourceWidth = uploadedImage.height * frameRatio;
			sourceX = (uploadedImage.width - sourceWidth) / 2;
			sourceY = 0;
		} else {
			sourceWidth = uploadedImage.width;
			sourceHeight = uploadedImage.width / frameRatio;
			sourceX = 0;
			sourceY = (uploadedImage.height - sourceHeight) / 2;
		}

		ctx.drawImage(
			uploadedImage,
			sourceX, sourceY, sourceWidth, sourceHeight,
			frameX, frameY, frameWidth, frameHeight
		);
	}
}


// ========== 描画関連の設定 ==========
//テキストの色を変えるための設定
const textColorPicker = document.getElementById('text-colorPicker');
// カラーピッカーがクリックまたは変更されたときの共通処理
const activateColorPicker = (newColor) => {
	textColor = newColor;
	document.querySelectorAll('#text-color-container button').forEach(btn => {
		btn.classList.remove('active');
	});
	textColorPicker.classList.add('active');
	redraw();
};

//枠組みの色を変えるための設定
const frameColorPicker = document.getElementById('frame-colorPicker');
// カラーピッカーがクリックまたは変更されたときの共通処理
const activateframeColorPicker = (newColor) => {
	frameColor = newColor;
	document.querySelectorAll('#frame-color-container button').forEach(btn => {
		btn.classList.remove('active');
	});
	frameColorPicker.classList.add('active');
	// 再描画
	redraw();
};

// ========== 初期処理とイベントリスナーの設定 ==========
// googleフォントが読み込まれたタイミングで再描画
document.fonts.ready.then(function() {
    redraw();
});

// 初回描画
makingFrame();

// テキストエリアに文字が入力されたとき
document.getElementById('picturediary-text').oninput = function (event) {
	const textarea = event.target;
	const lines = textarea.value.split('\n');
	const maxLines = (showDate) ? 4 : 5;
	if (lines.length > maxLines) {
		textarea.value = lines.slice(0, maxLines).join('\n');
		return;
	}
	redraw();
};

// ユーザーがテキストの色を変更したとき
textColorPicker.oninput = function (event) {
	activateColorPicker(event.target.value);
};

// ユーザーがテキストのカラーピッカーをクリックしたとき
textColorPicker.onclick = function (event) {
	activateColorPicker(event.target.value);
};

document.getElementById('text-color-container').onclick = function (event) {
	if (event.target.tagName === 'BUTTON') {
		textColor = event.target.value;
		redraw();
		textColorPicker.classList.remove('active');
		addactiveClass(event);
	}

};

// ユーザーが枠組みの色を選択したとき
frameColorPicker.oninput = function (event) {
	activateframeColorPicker(event.target.value);
};

// ユーザーが枠組みのカラーピッカーをクリックしたとき
frameColorPicker.onclick = function (event) {
	activateframeColorPicker(event.target.value);
};

document.getElementById('frame-color-container').onclick = function (event) {
	if (event.target.tagName === 'BUTTON') {
		frameColor = event.target.value;
		redraw();
		frameColorPicker.classList.remove('active');
		addactiveClass(event);
	}
};

// 背景ボタンが押されたとき
document.getElementById('background-container').onclick = function (event) {
	if (event.target.tagName === 'BUTTON') {
		document.getElementById("canvas-wrapper").className = "back-" + event.target.value;
	}
	addactiveClass(event);
};

// フォントボタンが押されたとき
document.getElementById('font-container').onclick = function (event) {
	if (event.target.tagName === 'BUTTON') {
		const fontValue = event.target.value;
		textFont = `"${fontValue}", sans-serif`;

		redraw();
		addactiveClass(event);
	}
};

// スタンプ選択ボタンが押されたとき（モーダルを開く）
document.getElementById('stamp-selector').onclick = function () {
	document.getElementById('stamp-modal').style.display = 'block';
};

// モーダルを閉じるボタンが押されたとき
document.getElementById('stamp-modal-close').onclick = function () {
	document.getElementById('stamp-modal').style.display = 'none';
};

// モーダル外をクリックしても閉じる
document.getElementById('stamp-modal').onclick = function (event) {
	if (event.target.id === 'stamp-modal') {
		this.style.display = 'none';
	}
};

// モーダルの中のボタン（スタンプボタン・スタンプ消去ボタン）が押されたとき
document.getElementById('stamp-container').onclick = function (event) {
	const btn = event.target.closest('.stamp-btn');

	// スタンプボタンの場合
	if (btn) {
		// 全スタンプボタンとスタンプ消去ボタンからactiveを削除
		document.querySelectorAll('#stamp-container button').forEach(b => b.classList.remove('active'));
		// 押されたスタンプボタンにactiveを追加
		btn.classList.add('active');
		const stampType = btn.getAttribute('data-stamp');
		const img = new Image();
		img.onload = function () {
			stampImage = img;
			redraw();
		};
		img.src = `images/stamps/stamp-${stampType}.png`;
		document.getElementById('stamp-preview').src = `images/stamps/stamp-${stampType}.png`;
	}
};

// スタンプ消去ボタン
document.getElementById('stamp-delete').onclick = function () {
	// 全スタンプボタンからactiveを削除
	document.querySelectorAll('#stamp-container .stamp-btn').forEach(btn => btn.classList.remove('active'));
	// 消去ボタンにactiveを追加
	this.classList.add('active');
	//プレビューを消去マークに
	document.getElementById('stamp-preview').src = 'images/stamps/no-stamp.jpg';
	stampImage = null;
	redraw();
};

// スタイルリセットボタンが押されたとき
document.getElementById('style-reset').onclick = function () {
	textColor = "black";
	frameColor = "black";
	textFont = "Arial";
	stampImage = null;
	document.getElementById("canvas-wrapper").className = "back-white";

	document.querySelectorAll('.style-container button').forEach(btn => btn.classList.remove('active'));
	document.querySelectorAll('#stamp-container button').forEach(btn => btn.classList.remove('active'));

	// input[type="color"]要素を全て取得し、active解除と値を初期化
	document.querySelectorAll('input[type="color"]').forEach(picker => {
		picker.classList.remove('active');
		picker.value = '#ff4d4d';
	});

	// 初期化されたそれぞれのボタンにactiveを追加
	document.querySelector('#text-color-container button[value="black"]').classList.add('active');
	document.querySelector('#frame-color-container button[value="black"]').classList.add('active');
	document.querySelector('#background-container button[value="white"]').classList.add('active');
	document.querySelector('#font-container button[value="Arial"]').classList.add('active');
	document.querySelector('#stamp-container #stamp-delete').classList.add('active');

	document.getElementById('stamp-preview').src = 'images/stamps/no-stamp.jpg';

	redraw();
};


// 日付ボタン（あり・なし）が押されたとき
document.getElementById('date-container').onclick = function (event) {

	if (event.target.tagName === 'BUTTON' && event.target.name === 'date-toggle') {
		showDate = event.target.value === 'on';
		const dateInput = document.getElementById('date-input');
		const textarea = document.getElementById('picturediary-text');
		let lines = textarea.value.split('\n');

		dateInput.style.display = showDate ? 'inline-block' : 'none';

		// ありが押された初回は、今日の日付を選択済みの状態にする
		if (showDate) {
			if (!dateInput.value) {
				const today = new Date();
				const yyyy = today.getFullYear();
				const mm = String(today.getMonth() + 1).padStart(2, '0');
				const dd = String(today.getDate()).padStart(2, '0');
				dateInput.value = `${yyyy}-${mm}-${dd}`;
				selectedDate = formatDate(dateInput.value);
			}


			// 日付あり → オリジナルを保存
			originalText = textarea.value;
			// もし5行以上なら4行にまとめる
			if (lines.length > 4) {
				lines[3] = lines.slice(3).join(' ');
				lines = lines.slice(0, 4);
				textarea.value = lines.join('\n');
			}

		} else {
			originalText = textarea.value;;
			textarea.value = originalText;
		}

		addactiveClass(event);
		redraw();
	}
};

// 日付が選択されたとき
document.getElementById('date-input').onchange = function (event) {
	selectedDate = formatDate(event.target.value);
	redraw();
};

// 画像が選択されたとき
document.getElementById('fileInput').onchange = function (event) {
	const file = event.target.files[0];
	if (!file || !file.type.startsWith('image/')) {
		console.log('画像ファイルを選択してください');
		return;
	}
	const reader = new FileReader();
	reader.onload = function (e) {
		const img = new Image();
		img.onload = function () {
			uploadedImage = img;
			redraw();
		};
		img.src = e.target.result;
	};
	reader.readAsDataURL(file);
};

// 画像消去ボタンが押されたとき
document.getElementById('img-delete').onclick = function () {
	uploadedImage = null;
	document.getElementById('fileInput').value = '';
	redraw();
};

// ダウンロードボタンが押されたとき
document.getElementById('download').onclick = function () {
	const tempCanvas = document.createElement('canvas');
	tempCanvas.width = canvas.width;
	tempCanvas.height = canvas.height;
	const tempCtx = tempCanvas.getContext('2d');

	const bgClass = document.getElementById('canvas-wrapper').className;

	const handleDownload = () => {
		tempCtx.drawImage(canvas, 0, 0);
		const link = document.createElement('a');
		link.download = '絵日記.png';
		link.href = tempCanvas.toDataURL();
		link.click();
	};

	if (bgClass === 'back-white') {
		tempCtx.fillStyle = 'white';
		tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
		handleDownload();
	} else if (bgClass === 'back-black') {
		tempCtx.fillStyle = 'black';
		tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
		handleDownload();
	} else if (bgClass === 'back-wasi' || bgClass === 'back-kami') {
		const bgImg = new Image();
		bgImg.onload = function () {
			tempCtx.drawImage(bgImg, 0, 0, tempCanvas.width, tempCanvas.height);
			handleDownload();
		};
		bgImg.src = bgClass === 'back-wasi' ? 'images/wasi.jpg' : 'images/kami.png';
	}
};

// スタイル設定の開閉
	const toggleBtn = document.querySelector(".toggle-btn");
    const styleContents = document.querySelector(".style-contents");
	const styleContainer = document.querySelector(".style-container");

    toggleBtn.addEventListener("click", () => {
      const isOpen = styleContents.classList.toggle("open");
      toggleBtn.textContent = isOpen ? "▲スタイルの設定（閉じる）" : "▼スタイルの設定（開く）";
	  styleContainer.classList.toggle("open", isOpen);
    });
