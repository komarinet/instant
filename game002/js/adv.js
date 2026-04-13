const VER_ADV = "0.2.2"; // バージョン更新：一時Canvas生成を廃止し描画負荷を劇的に軽減＋立ち絵の重なりと端寄せを正確に修正（コメント類完全保持）

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
        this.slideTimer = 0; // ★追加：スライド演出用
        this.fadeTimer = 0;  // ★追加：フェードイン演出用
        this.whiteoutAlpha = 0; // ★追加：ホワイトアウト演出用
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
        this.slideTimer = 0; // ★追加
        this.fadeTimer = 0;  // ★追加
        this.whiteoutAlpha = 0; // ★追加
        this.playSE(); // ★追加：最初のシーンの音を鳴らす
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
            this.slideTimer = 0; // ★追加
            this.fadeTimer = 0;  // ★追加
            this.whiteoutAlpha = 0; // ★追加
            this.playSE(); // ★追加：次のシーンの音を鳴らす
        }
    }

    // ★修正：音声ファイル不要。プログラムで直接ビープ音を生成する処理
    playSE() {
        const msg = this.currentScenario[this.index];
        if (msg && msg.se) {
            // スマホ実機なら物理バイブレーションも作動させる
            if (msg.se === 'vibration.mp3' && navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }

            // Web Audio APIを使用して音源なしで音を生成する
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();

                if (msg.se === 'vibration.mp3') {
                    // バイブレーション風の低音（ブーッ）
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth'; // 濁った音色
                    osc.frequency.setValueAtTime(40, ctx.currentTime); // かなり低音
                    
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.6);
                } else if (msg.se === 'alarm.mp3') {
                    // アラーム風の電子音（ピピッ、ピピッ、ピピッ）
                    const playBeep = (delay) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(880, ctx.currentTime + delay); // 高めの音
                        
                        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
                        
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(ctx.currentTime + delay);
                        osc.stop(ctx.currentTime + delay + 0.1);
                    };
                    // 3回連続で鳴らす
                    playBeep(0);
                    playBeep(0.15);
                    playBeep(0.3);
                }
            }
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
        
        // ★追加: テキストが空なら高さを計算しない（ただしウインドウは表示するため safeText を使用）
        const safeText = currentMsg.text || ''; // ★修正：テキスト未定義時は空文字として扱う
        const textLength = safeText.split('').length;
        const lineCount = textLength / (dialogueWidth / 24); 
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

        // ★追加：スライドはけ演出
        let slideX = 0;
        if (currentMsg.effect === 'slideOutLeft') {
            this.slideTimer += 15; // 毎フレーム15px左へ移動
            slideX = -this.slideTimer;
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

        // ★修正：待機(delay)とフェードの処理を分離し、ウインドウを消さないように調整
        let isWaiting = false;
        let charAlpha = 1.0;
        if (currentMsg.delay || currentMsg.effect === 'fadeIn') {
            const delay = currentMsg.delay || 0; // ★追加：遅延時間
            this.fadeTimer++;
            if (this.fadeTimer < delay) {
                isWaiting = true; // 待機中（キャラ・テキストを隠す）
                charAlpha = 0;
            } else if (currentMsg.effect === 'fadeIn') {
                charAlpha = Math.min(1.0, (this.fadeTimer - delay) / 60); // 1秒(60f)かけてフェードイン
            }
        }
        ctx.globalAlpha = charAlpha; // 立ち絵にのみアルファ値を適用

        // ★追加：背面キャラクター（character2）の描画★
        if (currentMsg.character2) {
            const charImg2 = this.assets[currentMsg.character2];
            if (charImg2 && charImg2.naturalWidth > 0) {
                const cols = 4;
                const rows = currentMsg.character2 === 'igari02.png' ? 4 : 3;
                const spriteWidth = charImg2.width / cols; 
                const spriteHeight = charImg2.height / rows; 

                const spIndex2 = currentMsg.spriteIndex2 || 0;
                const col = spIndex2 % cols;
                const row = Math.floor(spIndex2 / cols);

                const targetCharHeight = cssHeight * 0.50;
                const baseScale = targetCharHeight / spriteHeight; 
                const drawHeight = targetCharHeight; 
                const drawWidth = spriteWidth * baseScale;

                // ★メインキャラの幅を計算してX座標の基準を合わせる
                let mainDrawWidth = drawWidth;
                if (currentMsg.character && this.assets[currentMsg.character]) {
                    const mainImg = this.assets[currentMsg.character];
                    const mainRows = currentMsg.character === 'igari02.png' ? 4 : 3;
                    mainDrawWidth = (mainImg.width / 4) * (targetCharHeight / (mainImg.height / mainRows));
                }

                // isIgari判定はメインキャラ基準で行う
                const isIgari = currentMsg.character === 'igari01.png' || currentMsg.character === 'igari02.png';
                const alignRight = currentMsg.isRight !== undefined ? currentMsg.isRight : isIgari;

                // ★大修正：透明余白を無視して画面端に寄せるためのシフト量（幅の25%）
                const edgeShift = alignRight ? mainDrawWidth * 0.25 : -mainDrawWidth * 0.25;

                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - mainDrawWidth;
                let mainDrawX = (alignRight ? paddingRight : paddingLeft) + edgeShift;

                // ★大修正：透明余白同士がぶつからないよう、枠を45%食い込ませて配置する
                const distanceOffset = mainDrawWidth * 0.45;
                // 右揃え（メインが右）なら、サブキャラは左(マイナス)へ。左揃えなら右(プラス)へ。
                let drawX = alignRight ? mainDrawX - distanceOffset : mainDrawX + distanceOffset;

                const drawY = gameY + visualAreaHeight - drawHeight;

                // ★修正：一時Canvas作成を廃止し、9引数で直接描画
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    charImg2,
                    col * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight,
                    drawX + shakeX + slideX, 
                    drawY + shakeY, 
                    drawWidth, 
                    drawHeight
                );
                
                ctx.imageSmoothingEnabled = true; 
            }
        }

        // 立ち絵描画（解像度対策と二人表示レイアウト）
        if (currentMsg.character) {
            const charImg = this.assets[currentMsg.character];
            // ★追加：画像が存在し、かつ正常に読み込めている場合のみ描画する
            if (charImg && charImg.naturalWidth > 0) {
                // ★修正：画像の実際のサイズから1コマ分を動的に計算（igari02.png は4行に対応）
                const cols = 4;
                const rows = currentMsg.character === 'igari02.png' ? 4 : 3;
                const spriteWidth = charImg.width / cols; 
                const spriteHeight = charImg.height / rows; 

                const col = currentMsg.spriteIndex % cols;
                const row = Math.floor(currentMsg.spriteIndex / cols);

                const targetCharHeight = cssHeight * 0.50;
                const baseScale = targetCharHeight / spriteHeight; 
                const drawHeight = targetCharHeight; 
                const drawWidth = spriteWidth * baseScale;

                // ★修正：猪狩を右、他を左に配置（igari02.pngも右に配置する）
                const isIgari = currentMsg.character === 'igari01.png' || currentMsg.character === 'igari02.png';
                
                // ★追加：isRightが指定されている場合はそちらを優先する
                const alignRight = currentMsg.isRight !== undefined ? currentMsg.isRight : isIgari;

                // ★大修正：ここでも同様に余白補正をかけて、猪狩をしっかり画面右端へ寄せる
                const edgeShift = alignRight ? drawWidth * 0.25 : -drawWidth * 0.25;

                const paddingLeft = gameX + gameWidth * 0.05;
                const paddingRight = gameX + gameWidth * 0.95 - drawWidth;
                const drawX = (alignRight ? paddingRight : paddingLeft) + edgeShift;

                // Y座標をビジュアルウインドウの底辺に合わせる
                const drawY = gameY + visualAreaHeight - drawHeight;

                // ★修正：一時Canvas作成を廃止し、9引数で直接描画
                ctx.imageSmoothingEnabled = false;
                // 通常の立ち絵をそのまま描画（slideXの加算を追加）
                ctx.drawImage(
                    charImg,
                    col * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight,
                    drawX + shakeX + slideX, 
                    drawY + shakeY, 
                    drawWidth, 
                    drawHeight
                );
                
                ctx.imageSmoothingEnabled = true; 
            }
        }
        
        // ★立ち絵を描き終わったら必ずアルファを1.0に戻す（これで空のウインドウが最初から表示される）
        ctx.globalAlpha = 1.0; 

        // ★追加：文字が空文字でない場合のみ台詞ウインドウを描画する
        // const showTextWindow = currentMsg.text !== undefined && currentMsg.text !== '';
        const showTextWindow = true; // ★修正：テキストが空欄でもウインドウを消さないように変更

        if (showTextWindow) {
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

            // 話者名（待機中でない場合のみ描画）
            if (currentMsg.speaker && !isWaiting) {
                ctx.fillStyle = currentMsg.speaker === '猪狩' ? '#ff3366' : '#00ffff';
                ctx.font = 'bold 18px "Segoe UI", sans-serif';
                ctx.fillText(currentMsg.speaker, dialogueX + padding, dialogueY + 30);
            }

            // テキスト描画（一瞬で全文を表示、待機中でない場合のみ）
            ctx.fillStyle = '#fff';
            ctx.font = '16px "Segoe UI", sans-serif';
            const maxWidth = dialogueWidth - (padding * 2);
            
            if (!isWaiting) {
                this.textTimer++;
                if (this.textTimer >= this.textInterval) {
                    this.textTimer = 0;
                    if (this.textIndex < safeText.length) { // ★修正：エラー回避のため safeText を使用
                        this.textIndex++;
                    }
                }
                
                const textToDraw = safeText; // ★修正：エラー回避のため safeText を使用
                this.wrapText(ctx, textToDraw, dialogueX + padding, dialogueY + 65, maxWidth, 24);

                // タップを促すアイコン
                ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
                ctx.fillText('▼', dialogueX + dialogueWidth - 35, dialogueY + dynamicHeight - 15);
            }
        } else {
            // ★追加：ウインドウがない場合でも、画面右下にタップ可能であることを示す▼を表示
            ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
            ctx.font = '24px "Segoe UI", sans-serif';
            ctx.fillText('▼', gameX + gameWidth - 40, gameY + gameHeight - 30);
        }

        // ★追加：ホワイトアウト演出
        if (currentMsg.effect === 'whiteout') {
            this.whiteoutAlpha = Math.min(1.0, this.whiteoutAlpha + 0.02);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteoutAlpha})`;
            ctx.fillRect(gameX, gameY, gameWidth, gameHeight);
        }

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
