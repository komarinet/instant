const VER_ADV = "0.1.12"; // バージョン更新

class ADVManager {
    constructor() {
        this.currentScenario = [];
        this.index = 0;
        this.isActive = false;
        this.onComplete = null;
        this.assets = {}; 
        this.textIndex = 0; 
        this.textTimer = 0; 
        this.textInterval = 3; 
        this.shakeTimer = 0; 
        this.shakeAmount = 10; 
    }

    preload(images, callback) {
        let loaded = 0;
        const total = images.length;
        images.forEach(imgSrc => {
            const img = new Image();
            img.src = `img/${imgSrc}`;
            img.onload = () => {
                this.assets[imgSrc] = img;
                loaded++;
                if (loaded === total) callback();
            };
        });
    }

    start(scenarioData, onCompleteCallback) {
        if (!scenarioData || scenarioData.length === 0) {
            if (onCompleteCallback) onCompleteCallback();
            return;
        }
        this.currentScenario = scenarioData;
        this.index = 0;
        this.isActive = true;
        this.onComplete = onCompleteCallback;
        // 文字送り廃止のため不要
        // this.textIndex = 0; 
        this.shakeTimer = 0; 
    }

    next() {
        if (!this.isActive) return;
        this.index++;
        if (this.index >= this.currentScenario.length) {
            this.isActive = false;
            if (this.onComplete) this.onComplete();
        } else {
            // 文字送り廃止のため不要
            // this.textIndex = 0; 
            this.shakeTimer = 0;
        }
    }

    draw(ctx, canvas) {
        if (!this.isActive) return;
        const currentMsg = this.currentScenario[this.index];
        const cssWidth = canvas.width / (window.devicePixelRatio || 1);
        const cssHeight = canvas.height / (window.devicePixelRatio || 1);
        
        // ★解像度対策：DPR（Device Pixel Ratio）を考慮してゲーム領域を計算★
        // 中央の「ゲーム領域」を計算（100vh問題対策のためCSSピクセルで計算）
        // STGパートとADVパートが共通で使用するアスペクト比（例: 3:2）
        const gameAspectRatio = 3 / 2;
        let gameHeight = cssHeight * 0.7; // スマホ画面の7割くらいの縦幅
        let gameWidth = cssWidth * 0.95;
        
        const gameX = (cssWidth - gameWidth) / 2;
        const gameY = (cssHeight - gameHeight) / 2;

        // ★修正：台詞ウインドウに2割を割り当て、残りをビジュアル画面にする★
        const padding = 15;
        const dialogueWidth = gameWidth;
        const dialogueX = gameX;
        // 文字送り廃止のため、常に全文で高さを計算
        // 1行に入る文字数（フォントサイズ16px想定）
        const charsPerLine = Math.max(10, Math.floor((dialogueWidth - padding * 2 - 10) / 16));
        const lineCount = Math.ceil(currentMsg.text.length / charsPerLine) || 1;
        
        const dynamicHeight = Math.max(gameHeight * 0.20, lineCount * 24 + padding * 2 + 35); 
        
        const dialogueY = gameY + gameHeight - dynamicHeight; // 下部基準で巨大化
        const visualAreaHeight = gameHeight - dynamicHeight; // ビジュアルウインドウは残りの上部すべて

        // ★修正：真っ黒バグ回避のため、一番最初に余白デザインを描画★
        this.drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, currentMsg.place, currentMsg.time, visualAreaHeight);

        // B. ゲーム領域（ビジュアルウインドウと台詞ウインドウ）の描画
        // ここをクリッピングして、余白にはみ出さないようにする
        ctx.save();
        ctx.beginPath();
        ctx.rect(gameX, gameY, gameWidth, gameHeight);
        ctx.clip();
        
        // 画面の揺れエフェクト
        let shakeX = 0;
        let shakeY = 0;
        if (currentMsg.effect === 'shake' || this.shakeTimer > 0) {
            if (this.shakeTimer === 0) this.shakeTimer = 30; 
            this.shakeTimer--;
            if (this.shakeTimer > 0) {
                shakeX = (Math.random() - 0.5) * this.shakeAmount;
                shakeY = (Math.random() - 0.5) * this.shakeAmount;
            }
        }

        // --- 描画処理 ---

        // B-1. ビジュアルウインドウ（上部全画面）
        // 背景色
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(gameX, gameY, gameWidth, visualAreaHeight); // 修正：ビジュアルエリアのみ塗りつぶし
        
        // 背景画像描画（Cover表示）
        if (currentMsg.bg) {
            const bgImg = this.assets[currentMsg.bg];
            if (bgImg) {
                const bgRatio = bgImg.width / bgImg.height;
                const visualRatio = gameWidth / visualAreaHeight; // 修正：ビジュアルエリアのアスペクト比
                let drawW, drawH, drawX, drawY;

                if (visualRatio > bgRatio) {
                    drawW = gameWidth;
                    drawH = gameWidth / bgRatio;
                    drawX = gameX;
                    drawY = gameY + (visualAreaHeight - drawH) / 2; // 修正：ビジュアルエリア内で中央配置
                } else {
                    drawW = visualAreaHeight * bgRatio; // 修正：ビジュアルエリア高さに合わせる
                    drawH = visualAreaHeight;
                    drawX = gameX + (gameWidth - drawW) / 2;
                    drawY = gameY;
                }
                ctx.drawImage(bgImg, drawX + shakeX, drawY + shakeY, drawW, drawH);
            }
        }

        // ★解像度対策：Nearest Neighborで拡大して描画★
        // シルエット生成ロジックはv0.1.11で修正済み（オフスクリーンCanvas）
        const preloadSilhouettes = () => {
            const tempSilhouettes = {};
            // data.jsにシルエット画像の指定を戻す。
            const silhouettesSrc = ['igari_silhouette.png', 'hiragi_silhouette.png'];
            silhouettesSrc.forEach(src => {
                const img = this.assets[src];
                if (img) {
                    // 色を各務カラーに変えたシルエットをオフスクリーンCanvasに生成
                    const offCanvas = document.createElement('canvas');
                    offCanvas.width = img.width; offCanvas.height = img.height;
                    const offCtx = offCanvas.getContext('2d');
                    offCtx.drawImage(img, 0, 0);
                    const imageData = offCtx.getImageData(0, 0, img.width, img.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i] === 255 && data[i+1] === 255 && data[i+2] === 255 && data[i+3] > 0) {
                            // 各務のカラー（#33ff33）に変更
                            data[i] = 0x33; data[i+1] = 0xff; data[i+2] = 0x33;
                        }
                    }
                    offCtx.putImageData(imageData, 0, 0);
                    tempSilhouettes[src] = offCanvas;
                }
            });
            return tempSilhouettes;
        };

        const silhouettes = preloadSilhouettes();

        // 立ち絵描画（解像度対策と★二人表示レイアウト★）
        if (currentMsg.character) {
            const charImg = this.assets[currentMsg.character];
            if (charImg) {
                const spriteWidth = charImg.width / 4;
                const spriteHeight = charImg.height / 3;
                const col = currentMsg.spriteIndex % 4;
                const row = Math.floor(currentMsg.spriteIndex / 4);
                
                const charCanvas = document.createElement('canvas');
                charCanvas.width = spriteWidth;
                charCanvas.height = spriteHeight;
                const charCtx = charCanvas.getContext('2d');
                
                // Nearest Neighborで切り出す（ぼやけ防止）
                charCtx.imageSmoothingEnabled = false;
                charCtx.drawImage(
                    charImg,
                    col * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight,
                    0, 0, spriteWidth, spriteHeight
                );

                // 解像度対策：Nearest Neighborで拡大して描画★
                ctx.imageSmoothingEnabled = false;

                // ★リクエスト：キャラクターを画面の縦幅半分(0.5)くらいになるように★
                // 猪狩（igari01.png）を右、柊（hiragi01.png）、各務、その他を左に配置
                const targetCharHeight = cssHeight * 0.50;
                const baseScale = targetCharHeight / spriteHeight; 
                const drawHeight = targetCharHeight;
                const drawWidth = spriteWidth * baseScale;

                // 左右対称配置
                const isIgari = currentMsg.character === 'igari01.png'; // 修正
                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - drawWidth;
                const drawX = isIgari ? paddingRight : paddingLeft; // 修正

                // ★修正：Y座標をビジュアルウインドウの底辺に合わせる★
                const drawY = gameY + visualAreaHeight - drawHeight;

                ctx.drawImage(
                    charCanvas,
                    drawX + shakeX, 
                    drawY + shakeY, 
                    drawWidth, 
                    drawHeight
                );
                
                // 解像度モードを元に戻す
                ctx.imageSmoothingEnabled = true; 
            }
        }
        
        // ★最優先：台詞ウインドウ（下部固定＆★動的巨大化★）★
        // RPG風ボックスの描画
        ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; // 0.85 -> 0.7 に変更してキャラを少し透けさせる
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        if(ctx.roundRect) {
            ctx.roundRect(dialogueX, dialogueY, dialogueWidth, dynamicHeight, 15);
        } else {
            ctx.rect(dialogueX, dialogueY, dialogueWidth, dynamicHeight);
        }
        ctx.fill();
        ctx.stroke();

        // 話者名
        if (currentMsg.speaker) {
            ctx.fillStyle = currentMsg.speaker === '猪狩' ? '#ff3366' : '#00ffff';
            ctx.font = 'bold 18px "Segoe UI", sans-serif';
            ctx.fillText(currentMsg.speaker, dialogueX + padding, dialogueY + 30);
        }

        // テキスト描画（一瞬で全文を表示）
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Segoe UI", sans-serif';
        const maxWidth = dialogueWidth - (padding * 2);
        
        /* 文字送りロジック廃止
        this.textTimer++;
        if (this.textTimer >= this.textInterval) {
            this.textTimer = 0;
            if (this.textIndex < currentMsg.text.length) {
                this.textIndex++;
            }
        }
        const textToDraw = currentMsg.text.substring(0, this.textIndex);
        */
        const textToDraw = currentMsg.text; // 全文一瞬

        this.wrapText(ctx, textToDraw, dialogueX + padding, dialogueY + 65, maxWidth, 24);

        // タップを促すアイコン
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
        ctx.fillText('▼', dialogueX + dialogueWidth - 35, dialogueY + dynamicHeight - 15);

        ctx.restore(); // クリッピング解除
    }

    // ★リクエスト：情報表記の修正とサイバーな余白のデザイン★
    drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, placeText, timeText, visualAreaHeight) {
        // 余白全体をサイバーブルーの薄いグリッドで埋める
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        
        // 旧コードを復元：データの羅列（データの羅列）廃止、グリッド線描画 (余白に)
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)'; // グリッド線
        ctx.lineWidth = 1;
        ctx.beginPath();
        const gridSize = 40;
        for (let i = 0; i < cssWidth; i += gridSize) {
            ctx.moveTo(i, 0); ctx.lineTo(i, cssHeight);
        }
        for (let j = 0; j < cssHeight; j += gridSize) {
            ctx.moveTo(0, j); ctx.lineTo(cssWidth, j);
        }
        ctx.stroke();

        // ゲーム領域の枠（太めのサイバーパンク風、ネオン効果）
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowColor = 'rgba(0, 243, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowBlur = 0; // リセット
        
        // ★消えていたビジュアルと台詞の境界線のラインを復元★
        if (visualAreaHeight) {
            const borderY = gameY + visualAreaHeight;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gameX, borderY);
            ctx.lineTo(gameX + gameWidth, borderY);
            ctx.stroke();
        }

        // 余白（目立たない場所）にデータの羅列 (薄く全画面に) -> 削除。グリッド線復活のため。

        // ★リクエスト：情報表記の修正（右上）★
        // ビジュアルと台詞をセパレートさせるため、ゲーム領域外（余白）に配置
        // グリッド線の上に描画される。見切れ修正のため薄い黒帯を復活。
        if (placeText || timeText) {
            // 文字が見えやすいように薄い黒帯を敷く
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(gameX + gameWidth - 140, gameY - dynamicHeight - 10, 140, 50); // 境界線の上に配置

            ctx.fillStyle = '#ff3366';
            ctx.font = 'bold 12px "Courier New"';
            ctx.textAlign = 'right';
            const infoX = gameX + gameWidth - 10;
            const infoPaddingY = gameY + visualAreaHeight - dynamicHeight - 10; // 境界線の上に設定
            if (placeText) ctx.fillText(`Loc: ${placeText}`, infoX, infoPaddingY + 20); // 位置調整
            if (timeText) ctx.fillText(`Time: ${timeText}`, infoX, infoPaddingY + 35); // 位置調整
            ctx.textAlign = 'left'; 
        }
    }

    // wrapText はそのまま
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let words = text.split('');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n];
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}
