class ADVManager {
    constructor() {
        this.currentScenario = [];
        this.index = 0;
        this.isActive = false;
        this.onComplete = null;
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
    }

    next() {
        if (!this.isActive) return;
        this.index++;
        if (this.index >= this.currentScenario.length) {
            this.isActive = false;
            if (this.onComplete) this.onComplete();
        }
    }

    draw(ctx, canvas) {
        if (!this.isActive) return;
        const currentMsg = this.currentScenario[this.index];
        
        const boxHeight = 150;
        const padding = 15;
        const boxY = canvas.height - boxHeight - 20;
        
        // RPG風の角が丸い太めの白枠ボックス
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
        ctx.fillStyle = currentMsg.speaker === '猪狩' ? '#ff3366' : '#00ffff';
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.fillText(currentMsg.speaker, 10 + padding, boxY + 30);

        // テキスト（スマホ向けに自動折り返し）
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Segoe UI", sans-serif';
        const maxWidth = canvas.width - 20 - (padding * 2);
        this.wrapText(ctx, currentMsg.text, 10 + padding, boxY + 65, maxWidth, 24);

        // タップを促すアイコン（X座標を -45 にして、確実にはみ出しを防止）
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
        ctx.fillText('▼', canvas.width - 45, boxY + boxHeight - 15);
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
