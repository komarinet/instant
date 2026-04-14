const VER_ADV = "0.4.2"; // バージョン更新（マスク侵食エフェクトの高DPR環境表示修正）

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
        this.slideTimer = 0; 
        this.fadeTimer = 0;  
        this.whiteoutAlpha = 0; 
        this.whiteoutNextCalled = false; // 自動進行の重複防止フラグ
        this.bgEffectTimer = 0; // 背景エフェクト（侵食）用タイマー
    }

    preload(images, callback) {
        if (!images || images.length === 0) {
            callback();
            return;
        }

        let loaded = 0;
        const total = images.length;
        
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
        this.slideTimer = 0; 
        this.fadeTimer = 0;  
        this.whiteoutAlpha = 0; 
        this.whiteoutNextCalled = false; 
        this.bgEffectTimer = 0; // 初期化
        this.playSE(); 
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
            this.slideTimer = 0; 
            this.fadeTimer = 0;  
            this.whiteoutAlpha = 0; 
            this.whiteoutNextCalled = false; 
            this.bgEffectTimer = 0; // 初期化
            this.playSE(); 
        }
    }

    playSE() {
        const msg = this.currentScenario[this.index];
        if (msg && msg.se) {
            if (msg.se === 'vibration.mp3' && navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();

                if (msg.se === 'vibration.mp3') {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth'; 
                    osc.frequency.setValueAtTime(40, ctx.currentTime); 
                    
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.6);
                } else if (msg.se === 'alarm.mp3') {
                    const playBeep = (delay) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(880, ctx.currentTime + delay); 
                        
                        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
                        
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(ctx.currentTime + delay);
                        osc.stop(ctx.currentTime + delay + 0.1);
                    };
                    playBeep(0);
                    playBeep(0.15);
                    playBeep(0.3);
                }
            }
        }
    }

    draw(ctx, canvas, isTransparent = false) {
        if (!this.isActive) return;
        const currentMsg = this.currentScenario[this.index];
        
        // DPR(Device Pixel Ratio)を取得
        const dpr = window.devicePixelRatio || 1; // ★追加：DPR取得

        const cssWidth = canvas.width / dpr; // ★修正
        const cssHeight = canvas.height / dpr; // ★修正
        
        const gameAspectRatio = 3 / 2;
        let gameHeight = cssHeight * 0.7; 
        let gameWidth = cssWidth * 0.95;
        
        if (gameWidth > cssWidth * 0.95) {
            gameWidth = cssWidth * 0.95;
        }
        
        const gameX = (cssWidth - gameWidth) / 2;
        const gameY = (cssHeight - gameHeight) / 2;

        const padding = 15;
        const dialogueWidth = gameWidth;
        const dialogueX = gameX;
        
        const safeText = currentMsg.text || ''; 
        const textLength = safeText.split('').length;
        const lineCount = textLength / (dialogueWidth / 24); 
        const dynamicHeight = Math.max(gameHeight * 0.2, lineCount * 24 + padding * 2 + 35); 
        
        const dialogueY = gameY + gameHeight - dynamicHeight; 
        const visualAreaHeight = gameHeight - dynamicHeight; 

        this.cyberMarginAlpha = this.isActive ? 1.0 : 0.2; 
        this.drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, currentMsg.place, currentMsg.time, visualAreaHeight, dynamicHeight, isTransparent);

        ctx.save();
        ctx.beginPath();
        ctx.rect(gameX, gameY, gameWidth, gameHeight);
        ctx.clip();
        
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

        let slideX = 0;
        if (currentMsg.effect === 'slideOutLeft') {
            this.slideTimer += 15; 
            slideX = -this.slideTimer;
        }

        // ★★★ 背景描画 / マスク侵食エフェクト ★★★
        if (currentMsg.maskBg && currentMsg.bg) {
            // 背景が2枚指定されている場合（侵食演出）
            const topBg = this.assets[currentMsg.bg]; // 侵食されて消えていく手前の背景
            const bottomBg = this.assets[currentMsg.maskBg]; // 露出してくる奥の背景
            const delay = currentMsg.maskDelay || 90; // 演出にかけるフレーム数

            if (topBg && bottomBg) {
                // 背景の描画位置・サイズ計算（手前と奥で共通、CSSピクセル値）
                const bgRatio = topBg.width / topBg.height;
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

                // 1. まず奥の背景（侵食後の世界）を描画
                // メインctxはDPRでscaleされているのでCSSピクセル指定でOK
                ctx.drawImage(bottomBg, drawX + shakeX, drawY + shakeY, drawW, drawH);

                // 2. マスク用に一時的なオフスクリーンCanvasを作成
                // ★修正：サイズはDPRを考慮した内部ピクセルサイズにする
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = canvas.width;
                maskCanvas.height = canvas.height;
                const mCtx = maskCanvas.getContext('2d');

                // ★超修正：オフスクリーンCanvasのctxにもDPRスケールを適用する
                // これにより、mCtxへの描画もCSSピクセル値で行えるようになる
                mCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

                // 手前の背景を描画（CSSピクセル指定で、内部的にDPR倍されて描画される）
                mCtx.drawImage(topBg, drawX + shakeX, drawY + shakeY, drawW, drawH);

                // 3. destination-outで中心から円状に切り抜く
                // 円の中心座標と半径もCSSピクセル指定でOK
                const progress = Math.min(1.0, this.bgEffectTimer / delay);
                const maxRadius = Math.max(gameWidth, gameHeight) * 1.5; // 画面を覆い尽くすサイズ
                const currentRadius = maxRadius * progress;

                mCtx.globalCompositeOperation = 'destination-out';
                mCtx.beginPath();
                mCtx.arc(gameX + gameWidth / 2, gameY + visualAreaHeight / 2, currentRadius, 0, Math.PI * 2);
                mCtx.fill();
                mCtx.globalCompositeOperation = 'source-over';

                // 4. メインのCanvasに、一部が切り抜かれた手前の背景を重ねる
                // ★超修正：メインctxはDPRスケール中なので、描画元（maskCanvas）のサイズを
                // DPRで割ってCSSピクセルサイズとして指定し、正しい位置・サイズで描画する
                ctx.drawImage(maskCanvas, 0, 0, maskCanvas.width / dpr, maskCanvas.height / dpr);

                this.bgEffectTimer++;
                
                // 演出が完了したら自動で次へ
                if (progress >= 1.0 && !this.whiteoutNextCalled) {
                    this.whiteoutNextCalled = true;
                    setTimeout(() => { this.next(); }, 300);
                }
            }
        } else if (currentMsg.bg) {
            // 通常の背景描画
            const bgImg = this.assets[currentMsg.bg];
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

        let isWaiting = false;
        let charAlpha = 1.0;
        if (currentMsg.delay || currentMsg.effect === 'fadeIn') {
            const delay = currentMsg.delay || 0; 
            this.fadeTimer++;
            if (this.fadeTimer < delay) {
                isWaiting = true; 
                charAlpha = 0;
            } else if (currentMsg.effect === 'fadeIn') {
                charAlpha = Math.min(1.0, (this.fadeTimer - delay) / 60); 
            }
        }
        ctx.globalAlpha = charAlpha; 

        // ★★★ 背面キャラクター描画 ★★★
        if (currentMsg.character2) {
            const charImg2 = this.assets[currentMsg.character2];
            if (charImg2 && charImg2.naturalWidth > 0) {
                const cols = 4;
                // rowsの切り替えは、以前設定した通り
                let rows = 3;
                if (currentMsg.character2 === 'igari02.png') {
                    rows = 4;
                } else if (currentMsg.character2 === 'kagami.png') {
                    rows = 4;
                } else if (currentMsg.character2 === 'hiragi01.png') { 
                    rows = 4; 
                }
                
                const spriteWidth = charImg2.width / cols; 
                const spriteHeight = charImg2.height / rows; 

                const spIndex2 = currentMsg.spriteIndex2 || 0;
                const col = spIndex2 % cols;
                const row = Math.floor(spIndex2 / cols);

                const bleedX = 1;
                const bleedTop = 3; 
                const bleedBottom = 1;
                const sx = Math.floor(col * spriteWidth) + bleedX;
                const sy = Math.floor(row * spriteHeight) + bleedTop;
                const sWidth = Math.floor(spriteWidth) - bleedX * 2;
                const sHeight = Math.floor(spriteHeight) - bleedTop - bleedBottom;

                let charScale = 1.0;
                let yOffset = 0; 
                if (currentMsg.character2 === 'kagami.png') {
                    charScale = 41 / 43; 
                } else if (currentMsg.character2 === 'hiragi01.png') {
                    charScale = 10 / 11;
                } else if (currentMsg.character2 === 'igari01.png' || currentMsg.character2 === 'igari02.png') {
                    charScale = 1.0; 
                }

                const targetCharHeight = cssHeight * 0.50 * charScale;
                const baseScale = targetCharHeight / sHeight; 
                const drawHeight = targetCharHeight; 
                const drawWidth = sWidth * baseScale;

                let mainDrawWidth = drawWidth;
                if (currentMsg.character && this.assets[currentMsg.character]) {
                    const mainImg = this.assets[currentMsg.character];
                    let mainRows = 3;
                    if (currentMsg.character === 'igari02.png') {
                        mainRows = 4;
                    } else if (currentMsg.character === 'kagami.png') {
                        mainRows = 4;
                    } else if (currentMsg.character === 'hiragi01.png') { 
                        mainRows = 4; 
                    }
                    const msWidth = Math.floor(mainImg.width / 4) - bleedX * 2;
                    const msHeight = Math.floor(mainImg.height / mainRows) - bleedTop - bleedBottom;
                    
                    let mScale = 1.0;
                    if (currentMsg.character === 'kagami.png') { mScale = 41 / 43; } 
                    else if (currentMsg.character === 'hiragi01.png') { mScale = 10 / 11; }
                    else if (currentMsg.character === 'igari01.png' || currentMsg.character === 'igari02.png') { mScale = 1.0; }
                    
                    const mTargetHeight = cssHeight * 0.50 * mScale;
                    mainDrawWidth = msWidth * (mTargetHeight / msHeight);
                }

                const isIgari = currentMsg.character === 'igari01.png' || currentMsg.character === 'igari02.png';
                const alignRight = currentMsg.isRight !== undefined ? currentMsg.isRight : isIgari;

                const edgeShift = alignRight ? mainDrawWidth * 0.25 : -mainDrawWidth * 0.25;
                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - mainDrawWidth;
                let mainDrawX = (alignRight ? paddingRight : paddingLeft) + edgeShift;

                const distanceOffset = mainDrawWidth * 0.45;
                let drawX = alignRight ? mainDrawX - distanceOffset : mainDrawX + distanceOffset;
                const drawY = gameY + visualAreaHeight - drawHeight + yOffset; 

                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    charImg2,
                    sx, sy, sWidth, sHeight, 
                    drawX + shakeX + slideX, 
                    drawY + shakeY, 
                    drawWidth, 
                    drawHeight
                );
                ctx.imageSmoothingEnabled = true; 
            }
        }

        // ★★★ メインキャラクター描画 ★★★
        if (currentMsg.character) {
            const charImg = this.assets[currentMsg.character];
            if (charImg && charImg.naturalWidth > 0) {
                const cols = 4;
                let rows = 3;
                if (currentMsg.character === 'igari02.png') {
                    rows = 4;
                } else if (currentMsg.character === 'kagami.png') {
                    rows = 4;
                } else if (currentMsg.character === 'hiragi01.png') { 
                    rows = 4; 
                }
                
                const spriteWidth = charImg.width / cols; 
                const spriteHeight = charImg.height / rows; 

                const col = currentMsg.spriteIndex % cols;
                const row = Math.floor(currentMsg.spriteIndex / cols);

                const bleedX = 1;
                const bleedTop = 3; 
                const bleedBottom = 1;
                const sx = Math.floor(col * spriteWidth) + bleedX;
                const sy = Math.floor(row * spriteHeight) + bleedTop;
                const sWidth = Math.floor(spriteWidth) - bleedX * 2;
                const sHeight = Math.floor(spriteHeight) - bleedTop - bleedBottom;

                let charScale = 1.0;
                let yOffset = 0;
                if (currentMsg.character === 'kagami.png') {
                    charScale = 41 / 43; 
                } else if (currentMsg.character === 'hiragi01.png') {
                    charScale = 10 / 11;
                } else if (currentMsg.character === 'igari01.png' || currentMsg.character === 'igari02.png') {
                    charScale = 1.0;
                }

                const targetCharHeight = cssHeight * 0.50 * charScale;
                const baseScale = targetCharHeight / sHeight; 
                const drawHeight = targetCharHeight; 
                const drawWidth = sWidth * baseScale;

                const isIgari = currentMsg.character === 'igari01.png' || currentMsg.character === 'igari02.png';
                const alignRight = currentMsg.isRight !== undefined ? currentMsg.isRight : isIgari;

                const edgeShift = alignRight ? drawWidth * 0.25 : -drawWidth * 0.25;
                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - drawWidth;
                const drawX = (alignRight ? paddingRight : paddingLeft) + edgeShift;

                const drawY = gameY + visualAreaHeight - drawHeight + yOffset; 

                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    charImg,
                    sx, sy, sWidth, sHeight, 
                    drawX + shakeX + slideX, 
                    drawY + shakeY, 
                    drawWidth, 
                    drawHeight
                );
                ctx.imageSmoothingEnabled = true; 
            }
        }
        
        ctx.globalAlpha = 1.0; 

        // 侵食中やホワイトアウト時は強制的にウインドウとタップアイコンを非表示にする
        const isMasking = currentMsg.maskBg && this.bgEffectTimer > 0;
        const isWhiteouting = currentMsg.effect === 'whiteout' && this.whiteoutAlpha > 0;
        const showTextWindow = !isWhiteouting && !isMasking; 

        if (showTextWindow) {
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

            if (currentMsg.speaker && !isWaiting) {
                let speakerName = currentMsg.speaker;
                let speakerRuby = "";
                let nameColor = '#00ffff'; 

                if (currentMsg.speaker === '猪狩') {
                    speakerName = '猪狩 俊基';
                    speakerRuby = 'いがり としき';
                    nameColor = '#ff3366';
                } else if (currentMsg.speaker === '柊') {
                    speakerName = '柊 千華';
                    speakerRuby = 'ひいらぎ ちか';
                    nameColor = '#cc33ff';
                } else if (currentMsg.speaker === '各務') {
                    speakerName = '各務 栞';
                    speakerRuby = 'かがみ しおり';
                    nameColor = '#33ff33';
                }

                ctx.fillStyle = nameColor;

                if (speakerRuby !== "") {
                    ctx.font = '10px "Segoe UI", sans-serif';
                    ctx.fillText(speakerRuby, dialogueX + padding, dialogueY + 12);
                }

                ctx.font = 'bold 18px "Segoe UI", sans-serif';
                ctx.fillText(speakerName, dialogueX + padding, dialogueY + 30);
            }

            ctx.fillStyle = '#fff';
            ctx.font = '16px "Segoe UI", sans-serif';
            const maxWidth = dialogueWidth - (padding * 2);
            
            if (!isWaiting) {
                this.textTimer++;
                if (this.textTimer >= this.textInterval) {
                    this.textTimer = 0;
                    if (this.textIndex < safeText.length) { 
                        this.textIndex++;
                    }
                }
                
                const textToDraw = safeText; 
                this.wrapText(ctx, textToDraw, dialogueX + padding, dialogueY + 65, maxWidth, 24);

                ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
                ctx.fillText('▼', dialogueX + dialogueWidth - 35, dialogueY + dynamicHeight - 15);
            }
        } else if (showTextWindow) {
            ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
            ctx.font = '24px "Segoe UI", sans-serif';
            ctx.fillText('▼', gameX + gameWidth - 40, gameY + gameHeight - 30);
        }

        if (currentMsg.effect === 'whiteout') {
            this.whiteoutAlpha = Math.min(1.0, this.whiteoutAlpha + 0.02);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteoutAlpha})`;
            ctx.fillRect(gameX, gameY, gameWidth, gameHeight);

            if (this.whiteoutAlpha >= 1.0 && !this.whiteoutNextCalled) {
                this.whiteoutNextCalled = true;
                setTimeout(() => { this.next(); }, 300);
            }
        }

        ctx.restore(); 
    }

    drawCyberMargin(ctx, cssWidth, cssHeight, gameX, gameY, gameWidth, gameHeight, placeText, timeText, visualAreaHeight, dynamicHeight, isTransparent) {
        if (!isTransparent) {
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, cssWidth, cssHeight);
            
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

            if (visualAreaHeight) {
                const borderY = gameY + visualAreaHeight;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(gameX, borderY);
                ctx.lineTo(gameX + gameWidth, borderY);
                ctx.stroke();
            }
        }

        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowColor = 'rgba(0, 243, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowBlur = 0; 
        
        ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.font = '10px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`C:AUSES-REPORT:_${(new Date().toISOString())}`, 10, cssHeight - 10);
        
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
