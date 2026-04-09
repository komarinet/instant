const VER_ADV = "0.1.4"; // バージョン更新

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
        
        // 1. 中央の「ゲーム領域」を計算（100vh問題対策のためCSSピクセルで計算）
        // STGパートとADVパートが共通で使用するアスペクト比（例: 3:2）
        const gameAspectRatio = 3 / 2;
        let gameHeight = cssHeight;
        let gameWidth = gameHeight * gameAspectRatio;
        
        // 画面幅からはみ出す場合はクランプ
        if (gameWidth > cssWidth * 0.98) {
            gameWidth = cssWidth * 0.98;
            gameHeight = gameWidth / gameAspectRatio;
        }
        
        // 中央配置のオフセット
        const gameX = (cssWidth - gameWidth) / 2;
        const gameY = (cssHeight - gameHeight) / 2;

        // ★リクエスト：ビジュアルと台詞をセパレート★
        // ゲーム領域を上下に物理分割
        const visualAreaHeight = gameHeight * 0.7; // 上部7割：背景とキャラ（ビジュアルウインドウ）
        const dialogueAreaHeight = gameHeight * 0.3; // 下部3割：台詞ボックス（台詞ウインドウ）

        // --- 描画処理 ---
        
        // A. 余白（ゲーム領域外）のサイバーなデザイン描画
        this.drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight);

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

        // B-1. ビジュアルウインドウ（上部7割）
        // ウインドウの背景
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(gameX, gameY, gameWidth, visualAreaHeight);
        
        // 背景画像描画（Cover表示）
        if (currentMsg.bg) {
            const bgImg = this.assets[currentMsg.bg];
            if (bgImg) {
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

        // 立ち絵描画（解像度対策と★絶対見切れないレイアウト★）
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

                // ★絶対見切れないレイアウト：キャラクターの「全身」をビジュアルウインドウ内に収める★
                // ビジュアルウインドウの高さに合わせてキャラクターの縮尺を決定
                const scaleH = visualAreaHeight / spriteHeight * 1.0; // 高さいっぱいに表示。1.0でクランプ。
                // 論理的な描画サイズ
                const drawWidth = spriteWidth * scaleH; 
                const drawHeight = spriteHeight * scaleH;
                
                // ビジュアルウインドウの中央底辺を基準に配置。これにより足元が切れることは物理的にありません。
                ctx.drawImage(
                    charCanvas,
                    gameX + (gameWidth / 2 - drawWidth / 2) + shakeX, // X中央
                    gameY + visualAreaHeight - drawHeight + shakeY,   // Yはビジュアルエリアの底
                    drawWidth, 
                    drawHeight
                );
                
                ctx.imageSmoothingEnabled = true; // 元に戻す
            }
        }
        
        // ★リクエスト：情報表記の修正（右上）★
        if (currentMsg.place || currentMsg.time) {
            ctx.fillStyle = '#ff3366';
            ctx.font = 'bold 12px "Courier New"';
            ctx.textAlign = 'right';
            const infoPadding = 10;
            if (currentMsg.time) {
                ctx.fillText(`Time: ${currentMsg.time}`, gameX + gameWidth - infoPadding, gameY + 15);
            }
            if (currentMsg.place) {
                ctx.fillText(`Loc: ${currentMsg.place}`, gameX + gameWidth - infoPadding, gameY + 30);
            }
            ctx.textAlign = 'left'; // 元に戻す
        }

        // B-2. 台詞ウインドウ（下部3割：物理セパレート）
        const boxHeight = dialogueAreaHeight;
        const boxWidth = gameWidth;
        const boxY = gameY + visualAreaHeight; // ビジュアルウインドウの真下に配置
        const padding = 15;
        
        // RPG風ボックスの描画
        ctx.fillStyle = 'rgba(10, 10, 25, 0.9)'; // 透明度を下げて、よりソリッドなボックスに
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        if(ctx.roundRect) {
            ctx.roundRect(gameX + 2, boxY, boxWidth - 4, boxHeight - 2, 15); // 少し内側に
        } else {
            ctx.rect(gameX + 2, boxY, boxWidth - 4, boxHeight - 2);
        }
        ctx.fill();
        ctx.stroke();

        // 話者名
        if (currentMsg.speaker) {
            ctx.fillStyle = currentMsg.speaker === '猪狩' ? '#ff3366' : '#00ffff';
            ctx.font = 'bold 18px "Segoe UI", sans-serif';
            ctx.fillText(currentMsg.speaker, gameX + padding + 5, boxY + 30);
        }

        // テキスト描画（文字送り：見切れ防止）
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Segoe UI", sans-serif';
        const maxWidth = boxWidth - (padding * 2) - 10; // はみ出し防止に少し余裕を
        
        this.textTimer++;
        if (this.textTimer >= this.textInterval) {
            this.textTimer = 0;
            if (this.textIndex < currentMsg.text.length) {
                this.textIndex++;
            }
        }
        const textToDraw = currentMsg.text.substring(0, this.textIndex);
        this.wrapText(ctx, textToDraw, gameX + padding + 5, boxY + 65, maxWidth, 24);

        // タップを促すアイコン
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
        ctx.fillText('▼', gameX + boxWidth - 35, boxY + boxHeight - 15);

        ctx.restore(); // クリッピング解除
    }

    // ★リクエスト：サイバーな余白のデザインのブラッシュアップ★
    drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight) {
        // 余白全体をデータの羅列で埋める
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        
        // データの羅列（目立たない場所）
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

        // ゲーム領域の枠（太めのサイバーパンク風、ネオン効果）
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowColor = 'rgba(0, 243, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowBlur = 0; // リセット
        
        // ビジュアルと台詞の境界線
        const visualAreaHeight = gameHeight * 0.7;
        const borderY = gameY + visualAreaHeight;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gameX, borderY);
        ctx.lineTo(gameX + gameWidth, borderY);
        ctx.stroke();

        // システムログ（左下の余白）
        ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`C:AUSES_REPORT v${VER_ADV} // ${(new Date().toISOString())}`, 10, cssHeight - 10);
        ctx.textAlign = 'left'; // 元に戻す
    }

    // 日本語の1文字ずつの折り返し処理（そのまま）
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
