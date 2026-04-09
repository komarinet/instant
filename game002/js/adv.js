const VER_ADV = "0.1.9"; // バージョン更新

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
        
        // ★解像度対策：DPR（Device Pixel Ratio）を考慮してゲーム領域を計算★
        // 中央の「ゲーム領域」を計算（100vh問題対策のためCSSピクセルで計算）
        // STGパートとADVパートが共通で使用するアスペクト比（例: 3:2）
        const gameAspectRatio = 3 / 2;
        let gameHeight = cssHeight * 0.7; // スマホ画面の7割くらいの縦幅にできる？
        let gameWidth = cssWidth * 0.95;
        
        // 画面幅からはみ出す場合はクランプ
        if (gameWidth > cssWidth * 0.95) {
            gameWidth = cssWidth * 0.95;
            // gameHeight = gameWidth / gameAspectRatio; // 縦幅固定のため無効化
        }
        
        // 中央配置のオフセット
        const gameX = (cssWidth - gameWidth) / 2;
        const gameY = (cssHeight - gameHeight) / 2;

        // ★追加・修正：先に台詞ウインドウの高さを計算し、残りをビジュアル画面にする★
        const padding = 15;
        const dialogueWidth = gameWidth;
        const dialogueX = gameX;
        // 文字量から必要な高さを計算（簡易）
        const lineCount = currentMsg.text.split('').length / (dialogueWidth / 24); // 1行10文字と仮定
        const dynamicHeight = Math.max(gameHeight * 0.2, lineCount * 24 + padding * 2 + 35); // 2割くらいを台詞ウインドウに
        
        const dialogueY = gameY + gameHeight - dynamicHeight; // 下部基準で巨大化
        const visualAreaHeight = gameHeight - dynamicHeight; // ビジュアルウインドウは残りの上部すべて

        // ★修正：真っ黒バグ回避のため、一番最初に余白デザインを描画★
        this.drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, currentMsg.place, currentMsg.time);

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

                // ★リクエスト：キャラクター、やや右、やや左に★
                // 猪狩（igari.png）を左、柊（hiragi.png）を右に配置
                const isLeft = currentMsg.character === 'igari.png';
                // ★修正：ビジュアル画面の高さに合わせる★
                const targetCharHeight = cssHeight * 0.5; // キャラクターを画面の縦幅半分くらいになるように
                const baseScale = targetCharHeight / spriteHeight; 
                // 解像度を落とさず（ピクセル感を残して）大きく表示。頭が切れないよう少しだけ余裕を(0.95)
                const drawHeight = spriteHeight * baseScale; // 余裕(0.95)は外して指定サイズに
                const drawWidth = spriteWidth * baseScale;

                // 左右中央配置（左右対称、中央からのオフセット）
                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - drawWidth;
                const drawX = isLeft ? paddingLeft : paddingRight;

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

        // テキスト描画（文字送り：★最優先。見切れ防止★）
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Segoe UI", sans-serif';
        const maxWidth = dialogueWidth - (padding * 2);
        
        // 文字送りロジック
        this.textTimer++;
        if (this.textTimer >= this.textInterval) {
            this.textTimer = 0;
            if (this.textIndex < currentMsg.text.length) {
                this.textIndex++;
            }
        }
        const textToDraw = currentMsg.text.substring(0, this.textIndex);
        this.wrapText(ctx, textToDraw, dialogueX + padding, dialogueY + 65, maxWidth, 24);

        // タップを促すアイコン
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
        ctx.fillText('▼', dialogueX + dialogueWidth - 35, dialogueY + dynamicHeight - 15);

        ctx.restore(); // クリッピング解除
    }

    // ★リクエスト：情報表記の修正とサイバーな余白のデザイン★
    drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, placeText, timeText) {
        // 余白全体をサイバーブルーの薄いグリッドで埋める
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
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
        
        // 余白（目立たない場所）にデータの羅列
        ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`C:AUSES-REPORT:_${(new Date().toISOString())}`, 10, cssHeight - 10);
        
        // ★リクエスト：情報表記の修正（右上）★
        if (placeText || timeText) {
            ctx.fillStyle = '#ff3366';
            ctx.font = 'bold 12px "Courier New"';
            ctx.textAlign = 'right';
            const infoPaddingX = gameX + gameWidth;
            const infoPaddingY = gameY - 10;
            if (placeText) {
                // 場所：Loc:
                ctx.fillText(`Loc: ${placeText}`, infoPaddingX, infoPaddingY);
            }
            if (timeText) {
                // 時期：Time:
                ctx.fillText(`Time: ${timeText}`, infoPaddingX, infoPaddingY + 15);
            }
            ctx.textAlign = 'left'; // 元に戻す
        }
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
