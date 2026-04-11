const VER_ADV = "0.1.19"; // バージョン更新

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
        // ★修正：空の配列が来た場合の安全策を追加
        if (!images || images.length === 0) {
            callback();
            return;
        }

        let loaded = 0;
        const total = images.length;
        
        // ★修正：完了チェックを関数化
        const checkComplete = () => {
            loaded++;
            if (loaded === total) callback();
        };

        images.forEach(imgSrc => {
            const img = new Image();
            img.src = `img/${imgSrc}`;
            img.onload = () => {
                this.assets[imgSrc] = img;
                checkComplete();
            };
            // ★追加：画像が存在しない場合でもフリーズさせずに進行させる
            img.onerror = () => {
                console.error(`[ADVManager] 画像読み込み失敗: img/${imgSrc}`);
                checkComplete();
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
        this.textIndex = 0; 
        this.shakeTimer = 0; 
    }

    next() {
        if (!this.isActive) return;
        this.index++;
        if (this.index >= this.currentScenario.length) {
            this.isActive = false;
            if (this.onComplete) this.onComplete();
        } else {
            this.textIndex = 0;
            this.shakeTimer = 0;
        }
    }

    draw(ctx, canvas) {
        if (!this.isActive) return;
        const currentMsg = this.currentScenario[this.index];
        const cssWidth = canvas.width / (window.devicePixelRatio || 1);
        const cssHeight = canvas.height / (window.devicePixelRatio || 1);
        
        // ★解像度対策：DPR（Device Pixel Ratio）を考慮してゲーム領域を計算★
        const gameAspectRatio = 3 / 2;
        let gameHeight = cssHeight * 0.7; // スマホ画面の7割くらいの縦幅
        let gameWidth = cssWidth * 0.95;
        
        // 画面幅からはみ出す場合はクランプ
        if (gameWidth > cssWidth * 0.95) {
            gameWidth = cssWidth * 0.95;
        }
        
        // 中央配置のオフセット
        const gameX = (cssWidth - gameWidth) / 2;
        const gameY = (cssHeight - gameHeight) / 2;

        // 先に台詞ウインドウの高さを計算し、残りをビジュアル画面にする
        const padding = 15;
        const dialogueWidth = gameWidth;
        const dialogueX = gameX;
        // 文字量から必要な高さを計算（簡易）
        const lineCount = currentMsg.text.split('').length / (dialogueWidth / 24); 
        const dynamicHeight = Math.max(gameHeight * 0.2, lineCount * 24 + padding * 2 + 35); 
        
        const dialogueY = gameY + gameHeight - dynamicHeight; 
        const visualAreaHeight = gameHeight - dynamicHeight; 

        // ★修正点1：引数に dynamicHeight を追加してエラーを回避★
        this.drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, currentMsg.place, currentMsg.time, visualAreaHeight, dynamicHeight);

        // B. ゲーム領域（ビジュアルウインドウと台詞ウインドウ）の描画
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
        // ★修正：奥の3D背景を透けさせるため、黒塗りをコメントアウト★
        // ctx.fillStyle = '#0a0a0a';
        // ctx.fillRect(gameX, gameY, gameWidth, visualAreaHeight);
        
        // 背景画像描画（Cover表示）
        if (currentMsg.bg) {
            const bgImg = this.assets[currentMsg.bg];
            // ★追加：画像が存在し、かつ正常に読み込めている場合のみ描画する
            if (bgImg && bgImg.naturalWidth > 0) {
                const bgRatio = bgImg.width / bgImg.height;
                const visualRatio = gameWidth / visualAreaHeight; 
                let drawW, drawH, drawX, drawY;

                if (visualRatio > bgRatio) {
                    drawW = gameWidth;
                    drawH = gameWidth / bgRatio;
                    drawX = gameX;
                    drawY = gameY + (visualAreaHeight - drawH) / 2; 
                } else {
                    drawW = visualAreaHeight * bgRatio; 
                    drawH = visualAreaHeight;
                    drawX = gameX + (gameWidth - drawW) / 2;
                    drawY = gameY;
                }
                ctx.drawImage(bgImg, drawX + shakeX, drawY + shakeY, drawW, drawH);
            }
        }

        // 立ち絵描画（解像度対策と二人表示レイアウト）
        if (currentMsg.character) {
            const charImg = this.assets[currentMsg.character];
            // ★追加：画像が存在し、かつ正常に読み込めている場合のみ描画する
            if (charImg && charImg.naturalWidth > 0) {
                // 画像の実際のサイズから1コマ分を動的に計算
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

                ctx.imageSmoothingEnabled = false;

                const targetCharHeight = cssHeight * 0.50;
                const baseScale = targetCharHeight / spriteHeight; 
                const drawHeight = targetCharHeight; 
                const drawWidth = spriteWidth * baseScale;

                // 猪狩を右、他を左に配置
                const isIgari = currentMsg.character === 'igari01.png';
                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - drawWidth;
                const drawX = isIgari ? paddingRight : paddingLeft;

                // Y座標をビジュアルウインドウの底辺に合わせる
                const drawY = gameY + visualAreaHeight - drawHeight;

                // 通常の立ち絵をそのまま描画
                ctx.drawImage(
                    charCanvas,
                    drawX + shakeX, 
                    drawY + shakeY, 
                    drawWidth, 
                    drawHeight
                );
                
                ctx.imageSmoothingEnabled = true; 
            }
        }
        
        // 台詞ウインドウ
        ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; 
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
        
        this.textTimer++;
        if (this.textTimer >= this.textInterval) {
            this.textTimer = 0;
            if (this.textIndex < currentMsg.text.length) {
                this.textIndex++;
            }
        }
        
        const textToDraw = currentMsg.text; 
        this.wrapText(ctx, textToDraw, dialogueX + padding, dialogueY + 65, maxWidth, 24);

        // タップを促すアイコン
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
        ctx.fillText('▼', dialogueX + dialogueWidth - 35, dialogueY + dynamicHeight - 15);

        ctx.restore(); // クリッピング解除
    }

    // サイバーな余白のデザイン
    drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, placeText, timeText, visualAreaHeight, dynamicHeight) {
        // ★修正：奥の3D背景を透けさせるため、画面全体の黒塗り・2Dグリッド線・羅列をコメントアウト★
        /*
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        
        // グリッド線
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)'; 
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

        // データの羅列
        ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.font = '8px "Courier New"';
        const gridSizeX = 100;
        const gridSizeY = 15;
        for (let i = 0; i < cssWidth; i += gridSizeX) {
            for (let j = 0; j < cssHeight; j += gridSizeY) {
                if (Math.random() > 0.3) {
                    const randomHex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase();
                    ctx.fillText(`${i.toString(16)}:${j.toString(16)} [${randomHex}]`, i, j);
                }
            }
        }
        */

        // ゲーム領域の枠 (ここは残す)
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowColor = 'rgba(0, 243, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowBlur = 0; 
        
        // ★修正：背景と一体化させるため、境界線のラインもコメントアウト★
        /*
        if (visualAreaHeight) {
            const borderY = gameY + visualAreaHeight;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gameX, borderY);
            ctx.lineTo(gameX + gameWidth, borderY);
            ctx.stroke();
        }
        */

        // システムログ (ここは残す)
        ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`C:AUSES-REPORT:_${(new Date().toISOString())}`, 10, cssHeight - 10);
        
        // Loc/Time (ここは残す)
        if (placeText || timeText) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(gameX + gameWidth - 140, gameY + visualAreaHeight - dynamicHeight - 10, 140, 50); 

            ctx.fillStyle = '#ff3366';
            ctx.font = 'bold 12px "Courier New"';
            ctx.textAlign = 'right';
            const infoX = gameX + gameWidth - 10;
            const infoPaddingY = gameY + visualAreaHeight - dynamicHeight - 10; 
            if (placeText) {
                ctx.fillText(`Loc: ${placeText}`, infoX, infoPaddingY + 20); 
            }
            if (timeText) {
                ctx.fillText(`Time: ${timeText}`, infoX, infoPaddingY + 35); 
            }
            ctx.textAlign = 'left'; 
        }
    }

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
