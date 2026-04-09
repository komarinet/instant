// js/adv.js

class ADVManager {
    constructor() {
        this.currentScenario = [];
        this.index = 0;
        this.isActive = false;
        this.onComplete = null;
        this.assets = {}; // 画像アセットを管理
        this.textIndex = 0; // 現在表示している文字のインデックス
        this.textTimer = 0; // 文字送りのタイマー
        this.textInterval = 3; // 文字送りの間隔（フレーム）
        this.shakeTimer = 0; // 画面の揺れタイマー
        this.shakeAmount = 10; // 画面の揺れ幅
    }

    // 画像アセットをプリロード
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
        this.textIndex = 0; // 文字送りリセット
        this.shakeTimer = 0; // 揺れリセット
    }

    next() {
        if (!this.isActive) return;
        this.index++;
        if (this.index >= this.currentScenario.length) {
            this.isActive = false;
            if (this.onComplete) this.onComplete();
        } else {
            // 文字送りリセット。揺れリセット
            this.textIndex = 0;
            this.shakeTimer = 0;
        }
    }

    draw(ctx, canvas) {
        if (!this.isActive) return;
        const currentMsg = this.currentScenario[this.index];
        
        // 画面の揺れエフェクト
        let shakeX = 0;
        let shakeY = 0;
        if (currentMsg.effect === 'shake' || this.shakeTimer > 0) {
            if (this.shakeTimer === 0) this.shakeTimer = 30; // ズガーンの時に揺らす
            this.shakeTimer--;
            if (this.shakeTimer > 0) {
                shakeX = (Math.random() - 0.5) * this.shakeAmount;
                shakeY = (Math.random() - 0.5) * this.shakeAmount;
            }
        }

        // 背景描画
        if (currentMsg.bg) {
            const bgImg = this.assets[currentMsg.bg];
            if (bgImg) {
                ctx.drawImage(bgImg, shakeX, shakeY, canvas.width, canvas.height);
            }
        } else {
            // 背景指定がない場合は既存のグラデーション背景
            let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, '#001133');
            grad.addColorStop(1, '#000000');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 立ち絵描画
        if (currentMsg.character) {
            const charImg = this.assets[currentMsg.character];
            if (charImg) {
                // スプライトシートから切り出す
                const spriteWidth = charImg.width / 4;
                const spriteHeight = charImg.height / 3;
                const col = currentMsg.spriteIndex % 4;
                const row = Math.floor(currentMsg.spriteIndex / 4);
                
                // 立ち絵を描画するCanvas。色を変更するため
                const charCanvas = document.createElement('canvas');
                charCanvas.width = spriteWidth;
                charCanvas.height = spriteHeight;
                const charCtx = charCanvas.getContext('2d');
                
                // 切り出して描画
                charCtx.drawImage(
                    charImg,
                    col * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight,
                    0, 0, spriteWidth, spriteHeight
                );

                // 各務栞の色変更ロジック
                if (currentMsg.character === 'hiragi_silhouette.png' && currentMsg.speaker === '各務') {
                    const imageData = charCtx.getImageData(0, 0, spriteWidth, spriteHeight);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        // シルエット画像（白）の色を変更。各務のカラー（#33ff33）に
                        if (data[i] === 255 && data[i+1] === 255 && data[i+2] === 255 && data[i+3] > 0) {
                            data[i] = 0x33; data[i+1] = 0xff; data[i+2] = 0x33;
                        }
                    }
                    charCtx.putImageData(imageData, 0, 0);
                }

                // 画面中央に描画
                const drawWidth = canvas.width / 2; // 画面幅の半分
                const drawHeight = (spriteHeight / spriteWidth) * drawWidth;
                ctx.drawImage(
                    charCanvas,
                    canvas.width / 2 - drawWidth / 2 + shakeX, canvas.height - drawHeight + shakeY, drawWidth, drawHeight
                );
            }
        }

        // RPG風ボックス
        const marginX = 20; 
        const marginBottom = 40; 
        const padding = 15; 
        
        const boxHeight = 140;
        const boxWidth = canvas.width - (marginX * 2);
        const boxY = canvas.height - boxHeight - marginBottom;
        
        ctx.fillStyle = 'rgba(10, 10, 25, 0.85)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        // HTML5 CanvasのroundRect対応
        if(ctx.roundRect) {
            ctx.roundRect(10, boxY, canvas.width - 20, boxHeight, 15);
        } else {
            ctx.rect(10, boxY, canvas.width - 20, boxHeight);
        }
        ctx.fill();
        ctx.stroke();

        // 話者名
        if (currentMsg.speaker) {
            ctx.fillStyle = currentMsg.speaker === '猪狩' ? '#ff3366' : '#00ffff';
            ctx.font = 'bold 18px "Segoe UI", sans-serif';
            ctx.fillText(currentMsg.speaker, marginX + padding, boxY + 30);
        }

        // テキスト描画（文字送り）
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Segoe UI", sans-serif';
        const maxWidth = boxWidth - (padding * 2);
        
        // 文字送りロジック
        this.textTimer++;
        if (this.textTimer >= this.textInterval) {
            this.textTimer = 0;
            if (this.textIndex < currentMsg.text.length) {
                this.textIndex++;
            }
        }
        const textToDraw = currentMsg.text.substring(0, this.textIndex);
        this.wrapText(ctx, textToDraw, marginX + padding, boxY + 65, maxWidth, 24);

        // タップを促すアイコン（ボックスの右下内側に固定）
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
        ctx.fillText('▼', marginX + boxWidth - 35, boxY + boxHeight - 15);
    }

    // 日本語の1文字ずつの折り返し処理
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
