const VER_STG = "0.1.0";
class STGManager {
    constructor(canvas, charData) {
        this.canvas = canvas;
        this.charData = charData;
        this.bgY = 0;
        this.frame = 0; // 進行度管理用
        
        this.player = {
            x: canvas.width / 2,
            y: canvas.height + 50,
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

    updateEntrance() {
        if (this.player.y > this.player.targetY) {
            this.player.y -= 3; 
            return false;
        }
        return true; 
    }

    updateGameplay() {
        this.frame++;
        let currentFireRate = this.player.baseFireRate;
        this.isGrazing = false;

        // 短いテスト用：3秒間ザコが湧き、その後ボスが出現
        if (this.frame % 60 === 0 && this.frame < 180) {
            this.enemies.push({ type: 'zako', x: Math.random() * (this.canvas.width - 40) + 20, y: -20, hp: 30, fireTimer: 0 });
        } else if (this.frame === 240) {
            this.enemies.push({ type: 'boss', x: this.canvas.width / 2, y: -50, targetY: 100, hp: 300, fireTimer: 0 });
        }

        // 敵弾とグレイズ判定
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.x += eb.vx; eb.y += eb.vy;
            const dx = this.player.x - eb.x;
            const dy = this.player.y - eb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3 + eb.radius) return 'GAMEOVER';
            if (dist < 30) { this.isGrazing = true; currentFireRate = 4; }
            if (eb.x < 0 || eb.x > this.canvas.width || eb.y > this.canvas.height) this.enemyBullets.splice(i, 1);
        }

        // 自機ショット生成
        this.player.fireTimer++;
        if (this.player.fireTimer >= currentFireRate) {
            this.player.fireTimer = 0;
            this.bullets.push({ x: this.player.x, y: this.player.y - 10, speed: 15 });
        }

        // 自機弾の移動
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y -= b.speed;
            if (b.y < 0) this.bullets.splice(i, 1);
        }

        // 敵の挙動と当たり判定
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            let size = 15;
            
            if (e.type === 'zako') {
                e.y += 1.5;
                e.fireTimer++;
                if (e.fireTimer > 80) {
                    e.fireTimer = 0;
                    const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                    this.enemyBullets.push({x: e.x, y: e.y, vx: Math.cos(angle)*3, vy: Math.sin(angle)*3, radius: 4});
                }
            } else if (e.type === 'boss') {
                size = 30;
                if (e.y < e.targetY) e.y += 1;
                e.fireTimer++;
                if (e.fireTimer > 50 && e.y >= e.targetY) {
                    e.fireTimer = 0;
                    // ボスの扇状弾幕
                    for(let a = -1; a <= 1; a+=1) {
                        const angle = Math.PI/2 + (a * 0.3);
                        this.enemyBullets.push({x: e.x, y: e.y, vx: Math.cos(angle)*4, vy: Math.sin(angle)*4, radius: 6});
                    }
                }
            }

            // 自機弾 vs 敵
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                let b = this.bullets[j];
                if (b.x > e.x - size && b.x < e.x + size && b.y > e.y - size && b.y < e.y + size) {
                    e.hp -= 10;
                    this.bullets.splice(j, 1);
                }
            }

            if (e.hp <= 0) {
                if (e.type === 'boss') return 'STAGE_CLEAR'; // ボス撃破でクリア
                this.enemies.splice(i, 1);
            }
        }

        return 'PLAYING';
    }

    draw(ctx) {
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

        ctx.fillStyle = this.player.color;
        this.bullets.forEach(b => { ctx.fillRect(b.x - 2, b.y, 4, 15); });

        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        this.enemyBullets.forEach(eb => {
            ctx.moveTo(eb.x, eb.y);
            ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
        });
        ctx.fill();

        ctx.fillStyle = '#ffaa00';
        this.enemies.forEach(e => {
            let size = e.type === 'boss' ? 30 : 15;
            ctx.fillRect(e.x - size, e.y - size, size*2, size*2);
        });

        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y - 15);
        ctx.lineTo(this.player.x - 10, this.player.y + 10);
        ctx.lineTo(this.player.x + 10, this.player.y + 10);
        ctx.fill();
        
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.player.x - 1, this.player.y - 1, 3, 3);
    }
}
