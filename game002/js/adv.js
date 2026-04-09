const VER_ADV = "0.1.3"; // バージョン更新

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
        
        // ★先生ご提案：中央レイアウトへの対応★
        // 1. 中央の「ゲーム領域」を計算（アスペクト比維持、クランプ）
        // STGパートとADVパートが共通で使用するアスペクト比（例: 3:2）
        const gameAspectRatio = 3 / 2;
        let gameHeight = cssHeight;
        let gameWidth = gameHeight * gameAspectRatio;
        
        // 画面幅からはみ出す場合はクランプ
        if (gameWidth > cssWidth * 0.95) {
            gameWidth = cssWidth * 0.95;
            gameHeight = gameWidth / gameAspectRatio;
        }
        
        // 中央配置のオフセット
        const gameX = (cssWidth - gameWidth) / 2;
        const gameY = (cssHeight - gameHeight) / 2;

        // 2. 「ゲーム領域」を上下に分割
        const visualAreaHeight = gameHeight * 0.7; // 上部7割：背景とキャラ
        const dialogueAreaHeight = gameHeight * 0.3; // 下部3割：台詞ボックス

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
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(gameX, gameY, gameWidth, visualAreaHeight);
        
        // 背景描画（Cover表示：ゲーム領域の上部にクランプ）
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

        // 立ち絵描画（解像度対策：オフスクリーンCanvasにNearest Neighborで拡大）
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
                
                // ★解像度対策：Nearest Neighborで切り出す★
                charCtx.imageSmoothingEnabled = false;
                charCtx.drawImage(
                    charImg,
                    col * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight,
                    0, 0, spriteWidth, spriteHeight
                );

                // 各務栞の色変更ロジック（そのまま）
                if (currentMsg.character === 'hiragi_silhouette.png' && currentMsg.speaker === '各務') {
                    const imageData = charCtx.getImageData(0, 0, spriteWidth, spriteHeight);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i] === 255 && data[i+1] === 255 && data[i+2] === 255 && data[i+3] > 0) {
                            data[i] = 0x33; data[i+1] = 0xff; data[i+2] = 0x33;
                        }
                    }
                    charCtx.putImageData(imageData, 0, 0);
                }

                // ★解像度対策：オフスクリーンCanvasをNearest Neighborで拡大して描画★
                ctx.imageSmoothingEnabled = false;

                // キャラクターの幅をゲーム領域の85%にして大きく表示
                const drawWidth = gameWidth * 0.85; 
                const drawHeight = (spriteHeight / spriteWidth) * drawWidth;
                
                // ビジュアルウインドウ下部（台詞ボックスの上）を基準に配置
                ctx.drawImage(
                    charCanvas,
                    gameX + (gameWidth / 2 - drawWidth / 2) + shakeX, 
                    gameY + visualAreaHeight - drawHeight + shakeY, 
                    drawWidth, 
                    drawHeight
                );
                
                // 拡大モードを戻す
                ctx.imageSmoothingEnabled = true;
            }
        }

        // B-2. 台詞ウインドウ（下部3割）
        // RPG風テキストボックスを中央下部に配置
        const boxHeight = dialogueAreaHeight;
        const boxWidth = gameWidth;
        const boxY = gameY + visualAreaHeight; // 下部切れる問題は解決
        const padding = 15;
        
        ctx.fillStyle = 'rgba(10, 10, 25, 0.7)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        // HTML5 CanvasのroundRect対応
        if(ctx.roundRect) {
            ctx.roundRect(gameX, boxY, boxWidth, boxHeight, 15);
        } else {
            ctx.rect(gameX, boxY, boxWidth, boxHeight);
        }
        ctx.fill();
        ctx.stroke();

        // 話者名
        if (currentMsg.speaker) {
            ctx.fillStyle = currentMsg.speaker === '猪狩' ? '#ff3366' : '#00ffff';
            ctx.font = 'bold 18px "Segoe UI", sans-serif';
            ctx.fillText(currentMsg.speaker, gameX + padding, boxY + 30);
        }

        // テキスト描画（文字送り）
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Segoe UI", sans-serif';
        const maxWidth = boxWidth - (padding * 2);
        
        this.textTimer++;
        if (this.textTimer >= this.textInterval) {
            this.textTimer = 0;
            if (this.textIndex < currentMsg.text.length) {
                this.textIndex++;
            }
        }
        const textToDraw = currentMsg.text.substring(0, this.textIndex);
        this.wrapText(ctx, textToDraw, gameX + padding, boxY + 65, maxWidth, 24);

        // タップを促すアイコン
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
        ctx.fillText('▼', gameX + boxWidth - 35, boxY + boxHeight - 15);

        ctx.restore(); // クリッピング解除
    }

    // ★先生ご提案：サイバーな余白のデザイン★
    drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight) {
        // 余白全体をサイバーブルーの薄いグリッドで埋める
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
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

        // ゲーム領域の枠（太めのサイバーパンク風）
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowColor = 'rgba(0, 243, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowBlur = 0; // リセット

        // 余白（目立たない場所）にデータの羅列
        ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`C:AUSES-REPORT:_${(new Date().toISOString())}`, 10, cssHeight - 10);
        
        // 査定ステータス（右下のゲーム領域外）
        ctx.fillStyle = '#ff3366';
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'right';
        ctx.fillText('IRREGULAR 因果査定中', gameX + gameWidth, gameY - 10);
        ctx.fillText('PREMIUM: LOST', gameX + gameWidth, gameY - 25);
        ctx.textAlign = 'left';
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
