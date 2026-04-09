const VER_ADV = "0.1.11"; // バージョン更新

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
        const gameAspectRatio = 3 / 2;
        let gameHeight = cssHeight * 0.7; // スマホ画面の7割くらいの縦幅
        let gameWidth = cssWidth * 0.95;
        
        // 中央配置のオフセット
        const gameX = (cssWidth - gameWidth) / 2;
        const gameY = (cssHeight - gameHeight) / 2;

        // ★追加・修正：先に台詞ウインドウの高さを計算し、残りをビジュアル画面にする★
        const padding = 15;
        const dialogueWidth = gameWidth;
        const dialogueX = gameX;
        const lineCount = currentMsg.text.split('').length / (dialogueWidth / 24); 
        const dynamicHeight = Math.max(gameHeight * 0.2, lineCount * 24 + padding * 2 + 35); // 2割くらいを台詞ウインドウに
        
        const dialogueY = gameY + gameHeight - dynamicHeight; 
        const visualAreaHeight = gameHeight - dynamicHeight; 

        // ★修正：真っ黒バグ回避のため、一番最初に余白デザインを描画★
        this.drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, currentMsg.place, currentMsg.time, visualAreaHeight);

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

        // B-1. ビジュアルウインドウ（上部）
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

        // ★修正：新しい解像度の画像から動的にシルエットを生成するロジック★
        const preloadSilhouettes = () => {
            const tempSilhouettes = {};
            const charactersSrc = ['igari01.png', 'hiragi01.png'];
            charactersSrc.forEach(src => {
                const img = this.assets[src];
                if (img) {
                    // 全身のシルエットをオフスクリーンCanvasに生成
                    const offCanvas = document.createElement('canvas');
                    offCanvas.width = img.width; offCanvas.height = img.height;
                    const offCtx = offCanvas.getContext('2d');
                    offCtx.drawImage(img, 0, 0);
                    const imageData = offCtx.getImageData(0, 0, img.width, img.height);
                    const data = imageData.data;
                    
                    // まずアルファ値がある（透明でない）ピクセルを白くする（シルエット）
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i+3] > 0) {
                            data[i] = 255; data[i+1] = 255; data[i+2] = 255;
                        }
                    }
                    offCtx.putImageData(imageData, 0, 0);

                    // 旧コードを復元：生成した白いシルエットの色を各務カラーに変える
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i] === 255 && data[i+1] === 255 && data[i+2] === 255 && data[i+3] > 0) {
                            // 各務のカラー（#33ff33）に変更
                            data[i] = 0x33; data[i+1] = 0xff; data[i+2] = 0x33;
                        }
                    }
                    offCtx.putImageData(imageData, 0, 0);
                    tempSilhouettes[src] = offCanvas; // キー名は立ち絵のファイル名にする
                }
            });
            return tempSilhouettes;
        };

        const silhouettes = preloadSilhouettes();

        // 立ち絵描画（解像度対策と二人表示レイアウト）
        if (currentMsg.character) {
            const charImg = this.assets[currentMsg.character];
            if (charImg) {
                // ★修正：高解像度画像（1333x1500）に合わせて整数値で切り出し計算をやり直し★
                // 1333 / 4 = 333.25 となるが、小数点以下のピクセル滲みを防ぐため整数にする。
                // 立ち絵描画はNearest Neighbor拡大を維持するため、小数点以下を整数ピクセルとして扱う。
                const spriteWidth = 333; // 整数ピクセルで切り出す
                const spriteHeight = 500; // 1500 / 3

                const col = currentMsg.spriteIndex % 4;
                const row = Math.floor(currentMsg.spriteIndex / 4);
                
                const charCanvas = document.createElement('canvas');
                charCanvas.width = spriteWidth;
                charCanvas.height = spriteHeight;
                const charCtx = charCanvas.getContext('2d');
                
                // Nearest Neighborで切り出す（先生のドット感を大切にするため）
                charCtx.imageSmoothingEnabled = false;
                charCtx.drawImage(
                    charImg,
                    col * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight,
                    0, 0, spriteWidth, spriteHeight
                );

                // 解像度対策：Nearest Neighborで拡大して描画★
                ctx.imageSmoothingEnabled = false;

                // ★リクエスト：キャラクターを画面の縦幅半分(0.5)くらいになるように★
                const targetCharHeight = cssHeight * 0.50;
                const baseScale = targetCharHeight / spriteHeight; 
                const drawHeight = targetCharHeight; // 小数点以下を維持して縮小描画（ぼやけ防止は Nearest Neighbor で）
                const drawWidth = spriteWidth * baseScale;

                // 左右中央配置（左右対称、中央からのオフセット）
                const isLeft = currentMsg.character === 'igari01.png';
                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - drawWidth;
                const drawX = isLeft ? paddingLeft : paddingRight;

                // Y座標：ビジュアルウインドウの「底辺」にぴったり合わせる（セパレート完了）
                const drawY = gameY + visualAreaHeight - drawHeight;

                ctx.drawImage(
                    charCanvas,
                    drawX + shakeX, 
                    drawY + shakeY, 
                    drawWidth, 
                    drawHeight
                );
                
                ctx.imageSmoothingEnabled = true; // 解像度モードを元に戻す
            }
        }
        
        // ★最優先：台詞ウインドウ（下部固定＆★動的巨大化★）★
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
    drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, placeText, timeText, visualAreaHeight) {
        // 余白全体を黒で塗りつぶす
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        
        // 旧コードを復元：データの羅列（マトリックス風ライン）
        ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.font = '8px "Courier New"';
        const gridSizeX = 100;
        const gridSizeY = 15;
        for (let i = 0; i < cssWidth; i += gridSizeX) {
            for (let j = 0; j < cssHeight; j += gridSizeY) {
                // ランダムにHex値を羅列し、マトリックス風の演出を作る
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
        
        // 旧コードを復元：ビジュアルと台詞の境界線のライン
        if (visualAreaHeight) {
            const borderY = gameY + visualAreaHeight;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gameX, borderY);
            ctx.lineTo(gameX + gameWidth, borderY);
            ctx.stroke();
        }

        // 余白（目立たない場所）にシステムログ
        ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
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
