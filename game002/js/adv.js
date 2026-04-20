const VER_ADV = "0.4.8"; // バージョン更新（シナリオ内の BGM 変更・停止コマンドに対応）

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
        this.whiteoutNextCalled = false; 
        this.bgEffectTimer = 0; 
        this.audioCtx = null; 
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
        this.bgEffectTimer = 0; 
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
            this.bgEffectTimer = 0; 
            this.playSE(); 
        }
    }

    playSE() {
        const msg = this.currentScenario[this.index];
        
        // ★追加：BGM変更コマンドの処理
        if (msg && msg.bgm) {
            if (typeof window.soundManager !== 'undefined') {
                if (msg.bgm === 'stop') {
                    window.soundManager.stopBGM();
                } else {
                    window.soundManager.playBGM(msg.bgm);
                }
            }
        }

        if (msg && msg.se) {
            if (msg.se === 'vibration.mp3' && navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                if (!this.audioCtx) this.audioCtx = new AudioContext();
                const ctx = this.audioCtx;

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
        const dpr = window.devicePixelRatio || 1;

        const cssWidth = canvas.width / dpr; 
        const cssHeight = canvas.height / dpr; 
        
        let gameHeight = cssHeight * 0.7; 
        let gameWidth = cssWidth * 0.95;
        if (gameWidth > cssWidth * 0.95) gameWidth = cssWidth * 0.95;
        
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

        // 背景描画 / マスク侵食エフェクト
        if (currentMsg.maskBg && currentMsg.bg) {
            const topBg = this.assets[currentMsg.bg]; 
            const bottomBg = this.assets[currentMsg.maskBg]; 
            const delay = currentMsg.maskDelay || 90; 

            if (topBg && bottomBg) {
                const bgRatio = topBg.width / topBg.height;
                const visualRatio = gameWidth / visualAreaHeight; 
                let drawW, drawH, drawX, drawY;

                if (visualRatio > bgRatio) {
                    drawW = gameWidth; drawH = gameWidth / bgRatio;
                    drawX = gameX; drawY = gameY + (visualAreaHeight - drawH) / 2; 
                } else {
                    drawW = visualAreaHeight * bgRatio; drawH = visualAreaHeight;
                    drawX = gameX + (gameWidth - drawW) / 2; drawY = gameY;
                }

                ctx.drawImage(bottomBg, drawX + shakeX, drawY + shakeY, drawW, drawH);

                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = canvas.width; maskCanvas.height = canvas.height;
                const mCtx = maskCanvas.getContext('2d');
                mCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                mCtx.drawImage(topBg, drawX + shakeX, drawY + shakeY, drawW, drawH);

                const progress = Math.min(1.0, this.bgEffectTimer / delay);
                const maxRadius = Math.max(gameWidth, gameHeight) * 1.5;
                
                mCtx.globalCompositeOperation = 'destination-out';
                mCtx.beginPath();
                mCtx.arc(gameX + gameWidth / 2, gameY + visualAreaHeight / 2, maxRadius * progress, 0, Math.PI * 2);
                mCtx.fill();
                mCtx.globalCompositeOperation = 'source-over';

                ctx.drawImage(maskCanvas, 0, 0, maskCanvas.width / dpr, maskCanvas.height / dpr);

                this.bgEffectTimer++;
                if (progress >= 1.0 && !this.whiteoutNextCalled) {
                    this.whiteoutNextCalled = true;
                    setTimeout(() => { this.next(); }, 300);
                }
            }
        } else if (currentMsg.bg) {
            const bgImg = this.assets[currentMsg.bg];
            if (bgImg && bgImg.naturalWidth > 0) {
                const bgRatio = bgImg.width / bgImg.height;
                const visualRatio = gameWidth / visualAreaHeight; 
                let drawW, drawH, drawX, drawY;

                if (visualRatio > bgRatio) {
                    drawW = gameWidth; drawH = gameWidth / bgRatio;
                    drawX = gameX; drawY = gameY + (visualAreaHeight - drawH) / 2; 
                } else {
                    drawW = visualAreaHeight * bgRatio; drawH = visualAreaHeight;
                    drawX = gameX + (gameWidth - drawW) / 2; drawY = gameY;
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
                isWaiting = true; charAlpha = 0;
            } else if (currentMsg.effect === 'fadeIn') {
                charAlpha = Math.min(1.0, (this.fadeTimer - delay) / 60); 
            }
        }
        ctx.globalAlpha = charAlpha; 

        // キャラクター描画（最適化版・行数判定＆左右指定処理）
        const getRows = (key) => {
            // ★修正：urashiina.pngのみ2行で計算。shiina.pngは余白ありの4行で計算。
            if (key === 'urashiina.png') return 2; 
            if (key === 'shiina.png') return 4; 
            if (key === 'igari01.png') return 3;
            return 4; // 基本の立ち絵は4行フォーマット
        };

        let mainDrawWidth = 0;
        let alignRight = true;
        if (currentMsg.character && this.assets[currentMsg.character]) {
            const mainImg = this.assets[currentMsg.character];
            const msHeight = Math.floor(mainImg.height / getRows(currentMsg.character)) - 4; 
            let mScale = 1.0;
            if (currentMsg.character === 'kagami.png') mScale = 41 / 43; 
            else if (currentMsg.character === 'hiragi01.png') mScale = 10 / 11;
            mainDrawWidth = (Math.floor(mainImg.width / 4) - 2) * ((cssHeight * 0.50 * mScale) / msHeight);

            const isIgari = currentMsg.character === 'igari01.png' || currentMsg.character === 'igari02.png';
            alignRight = currentMsg.isRight !== undefined ? currentMsg.isRight : isIgari;
        }

        const charsToDraw = [
            { key: currentMsg.character2, spIndex: currentMsg.spriteIndex2, isMain: false },
            { key: currentMsg.character, spIndex: currentMsg.spriteIndex, isMain: true }
        ];

        charsToDraw.forEach(cData => {
            if (!cData.key) return;
            const charImg = this.assets[cData.key];
            if (charImg && charImg.naturalWidth > 0) {
                const cols = 4;
                let rows = getRows(cData.key);
                const index = cData.spIndex || 0;
                
                const bleedX = 1, bleedTop = 3, bleedBottom = 1;
                const sx = Math.floor((index % cols) * (charImg.width / cols)) + bleedX;
                const sy = Math.floor(Math.floor(index / cols) * (charImg.height / rows)) + bleedTop;
                const sWidth = Math.floor(charImg.width / cols) - bleedX * 2;
                const sHeight = Math.floor(charImg.height / rows) - bleedTop - bleedBottom;

                let charScale = 1.0;
                if (cData.key === 'kagami.png') charScale = 41 / 43; 
                else if (cData.key === 'hiragi01.png') charScale = 10 / 11;

                const drawHeight = cssHeight * 0.50 * charScale; 
                const drawWidth = sWidth * (drawHeight / sHeight);

                const refWidth = mainDrawWidth || drawWidth; 
                const edgeShift = alignRight ? refWidth * 0.25 : -refWidth * 0.25;
                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - refWidth;
                const mainDrawX = (alignRight ? paddingRight : paddingLeft) + edgeShift;

                let drawX = mainDrawX;
                if (!cData.isMain) {
                    drawX = alignRight ? mainDrawX - (refWidth * 0.45) : mainDrawX + (refWidth * 0.45);
                }

                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    charImg, sx, sy, sWidth, sHeight, 
                    drawX + shakeX + slideX, (gameY + visualAreaHeight - drawHeight) + shakeY, 
                    drawWidth, drawHeight
                );
                ctx.imageSmoothingEnabled = true;
            }
        });
        
        ctx.globalAlpha = 1.0; 

        // ウインドウ描画判定
        const isMasking = currentMsg.maskBg && this.bgEffectTimer > 0;
        const isWhiteouting = currentMsg.effect === 'whiteout' && this.whiteoutAlpha > 0;
        const showTextWindow = !isWhiteouting && !isMasking; 

        if (showTextWindow) {
            ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; 
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.lineJoin = "round";
            
            ctx.beginPath();
            if(ctx.roundRect) ctx.roundRect(dialogueX, dialogueY, dialogueWidth, dynamicHeight, 15);
            else ctx.rect(dialogueX, dialogueY, dialogueWidth, dynamicHeight);
            ctx.fill(); ctx.stroke();

            if (currentMsg.speaker && !isWaiting) {
                let speakerName = currentMsg.speaker;
                let speakerRuby = "";
                let nameColor = '#00ffff'; 

                if (currentMsg.speaker === '猪狩') {
                    speakerName = '猪狩 俊基'; speakerRuby = 'いがり としき'; nameColor = '#ff3366';
                } else if (currentMsg.speaker === '柊') {
                    speakerName = '柊 千華'; speakerRuby = 'ひいらぎ ちか'; nameColor = '#cc33ff';
                } else if (currentMsg.speaker === '各務') {
                    speakerName = '各務 栞'; speakerRuby = 'かがみ しおり'; nameColor = '#33ff33';
                } else if (currentMsg.speaker === '椎名') {
                    speakerName = '椎名 護'; speakerRuby = 'しいな まもる'; nameColor = '#33ccff';
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
            
            if (!isWaiting) {
                this.textTimer++;
                if (this.textTimer >= this.textInterval) {
                    this.textTimer = 0;
                    if (this.textIndex < safeText.length) this.textIndex++;
                }
                
                this.wrapText(ctx, safeText, dialogueX + padding, dialogueY + 65, dialogueWidth - (padding * 2), 24);

                ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
                ctx.fillText('▼', dialogueX + dialogueWidth - 35, dialogueY + dynamicHeight - 15);
            }
        } else if (!isWhiteouting && !isMasking) {
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
            ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, cssWidth, cssHeight);
            
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)'; ctx.lineWidth = 1; ctx.beginPath();
            for (let i = 0; i < cssWidth; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, cssHeight); }
            for (let j = 0; j < cssHeight; j += 40) { ctx.moveTo(0, j); ctx.lineTo(cssWidth, j); }
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 243, 255, 0.1)'; ctx.font = '8px "Courier New"';
            for (let i = 0; i < cssWidth; i += 100) {
                for (let j = 0; j < cssHeight; j += 15) {
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

        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight);
        ctx.shadowColor = 'rgba(0, 243, 255, 0.8)'; ctx.shadowBlur = 10;
        ctx.strokeRect(gameX, gameY, gameWidth, gameHeight); ctx.shadowBlur = 0; 
        
        ctx.fillStyle = 'rgba(0, 243, 255, 0.3)'; ctx.font = '10px "Courier New"'; ctx.textAlign = 'left';
        ctx.fillText(`C:AUSES-REPORT:_${(new Date().toISOString())}`, 10, cssHeight - 10);
        
        if (placeText || timeText) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(gameX + gameWidth - 140, gameY + visualAreaHeight - dynamicHeight - 10, 140, 50); 
            ctx.fillStyle = '#ff3366'; ctx.font = 'bold 12px "Courier New"'; ctx.textAlign = 'right';
            const infoX = gameX + gameWidth - 10;
            const infoPaddingY = gameY + visualAreaHeight - dynamicHeight - 10; 
            if (placeText) ctx.fillText(`Loc: ${placeText}`, infoX, infoPaddingY + 20); 
            if (timeText) ctx.fillText(`Time: ${timeText}`, infoX, infoPaddingY + 35); 
            ctx.textAlign = 'left'; 
        }
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let words = text.split('');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n];
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                ctx.fillText(line, x, y); line = words[n]; y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}
