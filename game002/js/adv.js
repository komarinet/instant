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
        
        // テキストボックスの背景
        const boxHeight = 150;
        const boxY = canvas.height - boxHeight - 20;
        ctx.fillStyle = 'rgba(0, 0, 20, 0.8)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.fillRect(10, boxY, canvas.width - 20, boxHeight);
        ctx.strokeRect(10, boxY, canvas.width - 20, boxHeight);

        // 話者名
        ctx.fillStyle = '#ff3366';
        ctx.font = 'bold 20px "Courier New"';
        ctx.fillText(currentMsg.speaker, 30, boxY + 30);

        // テキスト（簡易的な折り返しなし）
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Courier New"';
        // 実際は文字送り（タイプライター効果）などを入れるとリッチになります
        ctx.fillText(currentMsg.text, 30, boxY + 70);

        // タップを促すアイコン
        ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#fff' : 'transparent';
        ctx.fillText('▼', canvas.width - 40, boxY + 130);
    }
}
