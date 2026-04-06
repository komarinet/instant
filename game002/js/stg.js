class STGManager {
    constructor(canvas, charData) {
        this.canvas = canvas;
        this.charData = charData;
        this.bgY = 0;
        
        this.player = {
            x: canvas.width / 2,
            y: canvas.height + 50, // 画面外下部からスタート
            targetY: canvas.height * 0.8,
            color: charData.color,
            baseFireRate: 15,
            fireTimer: 0
        };

        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
    }

    // プレイヤーの入場アニメーション
    updateEntrance() {
        if (this.player.y > this.player.targetY) {
            this.player.y -= 3; // スーッと上がってくる
            return false; // まだ入場中
        }
        return true; // 入場完了
    }

    updateGameplay() {
        // --- 猪狩のシステム：接近連射加速（グレイズ判定） ---
        let currentFireRate = this.player.baseFireRate;
        this.isGrazing = false;

        // 弾幕処理など（前回のloopの中身を移植）
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.x += eb.vx; eb.y += eb.vy;
            const dx = this.player.x - eb.x;
            const dy = this.player.y - eb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3 + eb.radius) {
                return 'GAMEOVER'; // 被弾
            }
            if (dist < 30) {
                this.isGrazing = true;
                currentFireRate = 4;
            }
            if (eb.x < 0 || eb.x > this.canvas.width || eb.y > this.canvas.height) this.enemyBullets.splice(i, 1);
        }

        // ショット生成
        this.player.fireTimer++;
        if (this.player.fireTimer >= currentFireRate) {
            this.player.fireTimer = 0;
            this.bullets.push({ x: this.player.x, y: this.player.y - 10, speed: 15 });
        }

        // 弾の移動
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y -= b.speed;
            if (b.y < 0) this.bullets.splice(i, 1);
        }

        return 'PLAYING';
    }

    draw(ctx) {
        // サイバー空間風のスクロール背景
        this.bgY = (this.bgY + 2) % 50;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -50; i < this.canvas.height; i += 50) {
            ctx.moveTo(0, i + this.bgY);
            ctx.lineTo(this.canvas.width, i + this.bgY);
        }
        for (let j = 0; j < this.canvas.width; j += 50) {
            ctx.moveTo(j, 0);
            ctx.lineTo(j, this.canvas.height);
        }
        ctx.stroke();

        // プレイヤー弾
        ctx.fillStyle = this.player.color;
        this.bullets.forEach(b => { ctx.fillRect(b.x - 2, b.y, 4, 15); });

        // 敵弾
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        this.enemyBullets.forEach(eb => {
            ctx.moveTo(eb.x, eb.y);
            ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
        });
        ctx.fill();

        // 自機本体
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y - 15);
        ctx.lineTo(this.player.x - 10, this.player.y + 10);
        ctx.lineTo(this.player.x + 10, this.player.y + 10);
        ctx.fill();
        
        // 1点当たり判定表示
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.player.x - 1, this.player.y - 1, 3, 3);
    }
}
