const VER_STG = "0.4.0"; // バージョン更新（ステージ3の背景スクロール・擬似3D雲・敵強化対応）

// --- クラス定義 ---

class Player {
    constructor(charData) {
        this.id = charData.id;
        this.name = charData.name;
        this.color = charData.color;
        this.x = 0; 
        this.y = 0; 
        this.size = 20; 
        this.speed = 5;
        this.bullets = [];
        this.isEntering = true; 
        
        this.maxHp = 5; 
        this.hp = this.maxHp; 
        this.invincibleTimer = 0; 
        this.powerLevel = 0; 
    }

    initPosition(canvas) {
        const dpr = window.devicePixelRatio || 1;
        this.x = canvas.width / dpr / 2;
        this.y = canvas.height / dpr + this.size * 2; 
    }

    update(canvas) {
        const dpr = window.devicePixelRatio || 1;
        
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        if (this.isEntering) {
            const targetY = canvas.height / dpr * 0.8;
            this.y -= (this.y - targetY) * 0.05;
            if (Math.abs(this.y - targetY) < 1) {
                this.y = targetY;
                this.isEntering = false;
            }
            return; 
        }

        const limitX = canvas.width / dpr;
        const limitY = canvas.height / dpr;
        if (this.x < this.size) this.x = this.size;
        if (this.x > limitX - this.size) this.x = limitX - this.size;
        if (this.y < this.size) this.y = this.size;
        if (this.y > limitY - this.size) this.y = limitY - this.size;
    }

    draw(ctx) {
        if (this.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            return; 
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x - this.size, this.y + this.size);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();
    }

    shoot() {
        if (this.isEntering) return;
        
        const bulletSpeed = 10;
        
        if (this.powerLevel === 0) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 1) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, 0, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 2) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 3) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -0.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1.5, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 4) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -2, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 2, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 5) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -0.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -2.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 2.5, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 6) {
            for (let i = -3; i <= 3; i++) {
                this.bullets.push(new Bullet(this.x, this.y - this.size, i * 1.0, -bulletSpeed, this.color));
            }
        }
        else if (this.powerLevel === 7) {
            for (let i = -3; i <= 4; i++) {
                this.bullets.push(new Bullet(this.x - 2.5, this.y - this.size, (i - 0.5) * 1.0, -bulletSpeed, this.color));
            }
        }
        else if (this.powerLevel >= 8) {
            for (let i = -4; i <= 4; i++) {
                this.bullets.push(new Bullet(this.x, this.y - this.size, i * 1.0, -bulletSpeed, this.color));
            }
        }
    }
}

class Bullet {
    constructor(x, y, vx, vy, color, text = null) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.size = text ? 12 : 4; 
        this.color = color;
        this.text = text;
        this.alive = true;
    }
    update(canvas) {
        this.x += this.vx; this.y += this.vy;
        const dpr = window.devicePixelRatio || 1;
        if (this.y < -this.size || this.y > canvas.height / dpr + this.size ||
            this.x < -this.size || this.x > canvas.width / dpr + this.size) {
            this.alive = false;
        }
    }
    draw(ctx) {
        if (this.text) {
            ctx.fillStyle = this.color;
            ctx.font = 'bold 20px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 5;
            ctx.fillText(this.text, this.x, this.y);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
    }
}

class Enemy {
    constructor(type, x, y, charData, advManager, stage = 1) {
        this.type = type;
        this.x = x; this.y = y;
        this.startX = x; 
        this.startY = y;
        this.charData = charData;
        this.alive = true;
        this.angle = 0; 
        this.moveTimer = 0; 
        this.stage = stage;
        this.advManager = advManager; 

        const canvas = document.getElementById('gameCanvas');
        const dpr = window.devicePixelRatio || 1;
        
        // ★修正：ステージ1と3で画像を流用しつつ、ステージ3はHPを強化
        if (stage === 1 || stage === 3) {
            if (type === 'typea') { this.imgSrc = 'typea.png'; this.size = 16; this.hp = (stage === 3) ? 4 : 2; }
            else if (type === 'typeb') { this.imgSrc = 'typeb.png'; this.size = 20; this.hp = (stage === 3) ? 8 : 4; }
            else if (type === 'typec') { this.imgSrc = 'typec.png'; this.size = 18; this.hp = (stage === 3) ? 6 : 3; }
            else if (type === 'typeboss') { this.imgSrc = 'typeboss.png'; this.size = 75; this.hp = (stage === 3) ? 300 : 150; }
        } else if (stage === 2) {
            if (type === 'typea') { 
                this.imgSrc = '2typea.png'; this.size = 20; this.hp = 3; 
                this.angle = Math.random() * Math.PI * 2; 
            }
            else if (type === 'typeb') { 
                this.imgSrc = '2typeb.png'; this.size = 25; this.hp = 10; 
                this.state = 'enter'; 
            }
            else if (type === 'typec') { 
                this.imgSrc = '2typec.png'; this.size = 15; this.hp = 2; 
            }
            else if (type === 'typeboss') { 
                this.imgSrc = '2typeboss.png'; 
                this.size = (canvas.width / dpr) * 0.3; 
                this.hp = 250; 
            }
        } else {
            this.size = 15; this.hp = 1; this.imgSrc = null;
        }
    }

    update(canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        this.angle += 0.05; 

        // ★修正：ステージ1と3で同じ動きを流用
        if (this.stage === 1 || this.stage === 3) {
            if (this.type === 'typea') {
                this.y += 4;
                if (this.y < canvas.height / dpr * 0.5) { this.x += (player.x - this.x) * 0.01; }
            } 
            else if (this.type === 'typeb') {
                if (this.y < canvas.height / dpr * 0.3) { this.y += 2; } else { this.moveTimer++; }
            }
            else if (this.type === 'typec') {
                this.y += 3; this.x += Math.sin(this.angle) * 5; 
            }
            else if (this.type === 'typeboss') {
                const targetY = canvas.height / dpr * 0.2;
                if (this.y < targetY) { this.y += (targetY - this.y) * 0.02; }
                this.x = canvas.width / dpr / 2 + Math.sin(this.angle * 0.5) * (canvas.width / dpr * 0.3);
            }
        } else if (this.stage === 2) {
            if (this.type === 'typea') {
                this.y += 1.5;
                this.x = this.startX + Math.sin(this.angle * 1.5) * 80;
            } 
            else if (this.type === 'typeb') {
                if (this.state === 'enter') {
                    this.y += 2;
                    if (this.y > canvas.height / dpr * 0.3) {
                        this.state = 'wait';
                        this.moveTimer = 0;
                    }
                } else if (this.state === 'wait') {
                    this.moveTimer++;
                    if (this.moveTimer > 100) {
                        this.state = 'leave';
                    }
                } else if (this.state === 'leave') {
                    this.y -= 2; 
                }
            }
            else if (this.type === 'typec') {
                this.y += 3;
                this.x = this.startX + Math.sin(this.y * 0.02) * 60;
            }
            else if (this.type === 'typeboss') {
                const targetY = canvas.height / dpr * 0.25;
                if (this.y < targetY) {
                    this.y += (targetY - this.y) * 0.02;
                }
                this.x = canvas.width / dpr / 2 + Math.sin(this.angle * 0.5) * (canvas.width / dpr * 0.2);
            }
        }

        // 画面外処理
        if (this.stage === 2 && this.type === 'typeb' && this.state === 'leave' && this.y < -this.size * 2) {
            this.alive = false; 
        } else if (this.y > canvas.height / dpr + this.size * 2) {
            this.alive = false;
        }
    }

    draw(ctx) {
        const img = (this.advManager && this.advManager.assets) ? this.advManager.assets[this.imgSrc] : null;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.stage === 2 && this.type === 'typea') {
            ctx.rotate(this.angle * 2); 
        }

        if (img && img.naturalWidth > 0) {
            const aspectRatio = img.width / img.height;
            let drawW, drawH;
            if (aspectRatio > 1) {
                drawW = this.size * 2; drawH = drawW / aspectRatio;
            } else {
                drawH = this.size * 2; drawW = drawH * aspectRatio;
            }
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;

            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            ctx.fillStyle = (this.type === 'typeboss') ? '#ff00ff' : '#00ffff'; 
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2); 
            ctx.fill(); 
        }

        if (this.type === 'typeboss' && this.hp > 0) {
            const barW = this.size * 1.5; const barH = 10;
            let maxHp = 150;
            if (this.stage === 2) maxHp = 250;
            if (this.stage === 3) maxHp = 300; // ★ステージ3のHPゲージ対応
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-barW / 2, -this.size - 20, barW, barH);
            ctx.fillStyle = '#ff3366'; ctx.fillRect(-barW / 2, -this.size - 20, barW * (this.hp / maxHp), barH);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(-barW / 2, -this.size - 20, barW, barH);
        }
        ctx.restore();
    }
}

class Item {
    constructor(type, x, y) {
        this.type = type; 
        this.x = x; this.y = y;
        this.size = 15;
        this.alive = true;
        this.vy = 2; 
        this.angle = 0; 
    }
    update(canvas) {
        this.y += this.vy; this.angle += 0.1; this.x += Math.sin(this.angle) * 1; 
        const dpr = window.devicePixelRatio || 1;
        if (this.y > canvas.height / dpr + this.size) this.alive = false;
    }
    draw(ctx) {
        ctx.fillStyle = (this.type === 'power') ? '#ffaa00' : '#33ff33';
        ctx.beginPath();
        if (this.type === 'power') {
            for (let i = 0; i < 5; i++) {
                const ang = i * Math.PI * 2 / 5 - Math.PI / 2;
                ctx.lineTo(this.x + Math.cos(ang) * this.size, this.y + Math.sin(ang) * this.size);
            }
        } else {
            ctx.rect(this.x - this.size, this.y - this.size / 3, this.size * 2, this.size / 1.5); ctx.fill(); ctx.beginPath();
            ctx.rect(this.x - this.size / 3, this.y - this.size, this.size / 1.5, this.size * 2);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText((this.type === 'power') ? 'P' : 'H', this.x, this.y + 6);
        ctx.textAlign = 'left'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }
}


// --- マネージャークラス ---

class STGManager {
    constructor(canvas, charData, currentStage = 1) {
        this.player = new Player(charData);
        this.player.initPosition(canvas);
        this.enemies = [];
        this.enemyBullets = [];
        this.items = []; 
        this.frame = 0;
        this.bossSpawned = false;
        
        this.stageTimer = 0;
        this.isStageClear = false;
        this.currentStage = currentStage; 

        this.advManager = (typeof advManager !== 'undefined') ? advManager : null; 
        
        this.dragonStartX = 0;
        this.dragonCount = 0;
        
        // ★追加：ステージ3用の背景スクロールと雲パーティクル管理変数
        this.bgScrollY = 0;
        this.clouds = [];
        
        if (currentStage === 3) {
            const dpr = window.devicePixelRatio || 1;
            for (let i = 0; i < 20; i++) {
                this.clouds.push({
                    x: Math.random() * (canvas.width / dpr),
                    y: Math.random() * (canvas.height / dpr),
                    size: Math.random() * 80 + 40, // 40~120pxのランダムサイズ
                    speed: Math.random() * 3 + 2, // サイズに関係なく手前に見えるよう少し速め
                    opacity: Math.random() * 0.15 + 0.05 // 薄い透明度
                });
            }
        }
    }

    updateEntrance() {
        const canvas = document.getElementById('gameCanvas');
        this.player.update(canvas);
        return !this.player.isEntering; 
    }

    updateGameplay() {
        this.frame++;
        this.stageTimer++;
        const canvas = document.getElementById('gameCanvas');
        const dpr = window.devicePixelRatio || 1;
        const screenW = canvas.width / dpr;
        const screenH = canvas.height / dpr;

        this.player.update(canvas);
        if (!this.player.isEntering) {
            if (this.frame % 8 === 0) this.player.shoot(); 
        }
        
        // ★追加：ステージ3の背景スクロールと雲のアニメーション処理
        if (this.currentStage === 3) {
            this.bgScrollY += 1.5; // スクロール速度
            if (this.bgScrollY >= screenH) {
                this.bgScrollY = 0;
            }
            this.clouds.forEach(cloud => {
                cloud.y += cloud.speed;
                if (cloud.y > screenH + cloud.size) {
                    cloud.y = -cloud.size;
                    cloud.x = Math.random() * screenW;
                }
            });
        }

        const timer = this.stageTimer;
        
        // ★修正：ステージ1と3で同じウェーブパターンを流用
        if (this.currentStage === 1 || this.currentStage === 3) {
            if (timer > 120 && timer < 600 && timer % 60 === 0) {
                this.enemies.push(new Enemy('typea', Math.random() * screenW, -50, this.player.charData, this.advManager, this.currentStage));
            }
            if (timer === 400 || timer === 430 || timer === 460) {
                for (let i = 0; i < 3; i++) {
                    this.enemies.push(new Enemy('typec', screenW * 0.25 + i * screenW * 0.25, -50, this.player.charData, this.advManager, this.currentStage));
                }
            }
            if (timer > 700 && timer < 1200 && timer % 150 === 0) {
                this.enemies.push(new Enemy('typeb', screenW * 0.2 + Math.random() * screenW * 0.6, -50, this.player.charData, this.advManager, this.currentStage));
            }
            if (timer > 1000 && timer < 1800 && timer % 80 === 0) {
                this.enemies.push(new Enemy('typea', Math.random() * screenW, -50, this.player.charData, this.advManager, this.currentStage));
                if (timer % 160 === 0) this.enemies.push(new Enemy('typec', (timer % 160 === 0) ? 50 : screenW - 50, -50, this.player.charData, this.advManager, this.currentStage));
            }
            if (timer > 2000 && timer < 3000) {
                if (timer % 40 === 0) this.enemies.push(new Enemy('typea', Math.random() * screenW, -50, this.player.charData, this.advManager, this.currentStage));
                if (timer % 100 === 0) this.enemies.push(new Enemy('typeb', Math.random() * screenW, -50, this.player.charData, this.advManager, this.currentStage));
                if (timer % 120 === 0) this.enemies.push(new Enemy('typec', screenW / 2 + Math.sin(timer) * screenW / 2, -50, this.player.charData, this.advManager, this.currentStage));
            }

            if (timer === 3200 && !this.bossSpawned) {
                const boss = new Enemy('typeboss', screenW / 2, -150, this.player.charData, this.advManager, this.currentStage);
                this.enemies.push(boss);
                this.bossSpawned = true;
            }
        } 
        else if (this.currentStage === 2) {
            if (timer > 100 && timer < 500 && timer % 150 === 0) {
                this.dragonStartX = screenW * 0.2 + Math.random() * screenW * 0.6;
                this.dragonCount = 8;
            }
            if (this.dragonCount > 0 && timer % 10 === 0) {
                this.enemies.push(new Enemy('typec', this.dragonStartX, -50, this.player.charData, this.advManager, 2));
                this.dragonCount--;
            }

            if (timer > 600 && timer < 1500) {
                if (timer % 80 === 0) {
                    this.enemies.push(new Enemy('typea', Math.random() * screenW, -50, this.player.charData, this.advManager, 2));
                }
                if (timer % 200 === 0) {
                    this.enemies.push(new Enemy('typeb', (timer % 400 === 0) ? screenW * 0.2 : screenW * 0.8, -50, this.player.charData, this.advManager, 2));
                }
            }

            if (timer > 1500 && timer < 2500) {
                if (timer % 50 === 0) this.enemies.push(new Enemy('typea', Math.random() * screenW, -50, this.player.charData, this.advManager, 2));
                if (timer % 150 === 0) this.enemies.push(new Enemy('typeb', Math.random() * screenW, -50, this.player.charData, this.advManager, 2));
                
                if (timer % 300 === 0) {
                    this.dragonStartX = screenW * 0.2 + Math.random() * screenW * 0.6;
                    this.dragonCount = 8;
                }
                if (this.dragonCount > 0 && timer % 10 === 0) {
                    this.enemies.push(new Enemy('typec', this.dragonStartX, -50, this.player.charData, this.advManager, 2));
                    this.dragonCount--;
                }
            }

            if (timer === 2800 && !this.bossSpawned) {
                const boss = new Enemy('typeboss', screenW / 2, -150, this.player.charData, this.advManager, 2);
                this.enemies.push(boss);
                this.bossSpawned = true;
            }
        }

        this.player.bullets.forEach(b => b.update(canvas));
        this.enemyBullets.forEach(b => b.update(canvas));
        this.player.bullets = this.player.bullets.filter(b => b.alive);
        this.enemyBullets = this.enemyBullets.filter(b => b.alive);

        this.items.forEach(it => it.update(canvas));
        this.items = this.items.filter(it => it.alive);

        this.enemies.forEach(e => {
            e.update(canvas, this.player);

            if (e.alive && !this.player.isEntering) {
                // ★修正：ステージ1と3で敵の射撃アルゴリズムを流用
                if (this.currentStage === 1 || this.currentStage === 3) {
                    if (e.type === 'typeb' && e.moveTimer > 0 && e.moveTimer % 100 === 0) {
                        const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                        this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(angle) * 5, Math.sin(angle) * 5, '#ffcc00'));
                    }
                    else if (e.type === 'typeboss') {
                        if (this.frame % 20 === 0) {
                            for (let i = 0; i < 16; i++) {
                                const ang = i * Math.PI * 2 / 16 + this.frame * 0.01;
                                this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang) * 4, Math.sin(ang) * 4, '#ff3366'));
                            }
                        }
                        if (this.frame % 60 === 0) {
                            const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                            for(let i=-1; i<=1; i++) {
                                this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(angle + i*0.2) * 6, Math.sin(angle + i*0.2) * 6, '#00ffff'));
                            }
                        }
                    }
                } 
                else if (this.currentStage === 2) {
                    if (e.type === 'typea' && this.frame % 120 === 0) {
                        const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                        this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(angle) * 3, Math.sin(angle) * 3, '#ffaa00'));
                    }
                    else if (e.type === 'typeb' && e.state === 'wait') {
                        if (e.moveTimer === 50) {
                            const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                            for(let i = -2; i <= 2; i++) {
                                this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(angle + i*0.15) * 2, Math.sin(angle + i*0.15) * 2, '#33ccff'));
                            }
                        }
                    }
                    else if (e.type === 'typec' && this.frame % 90 === 0) {
                        const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                        this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(angle) * 3, Math.sin(angle) * 3, '#00ffff'));
                    }
                    else if (e.type === 'typeboss') {
                        const words = ['嫌い', '浮気', '嘘', '裏切り'];
                        if (this.frame % 40 === 0) {
                            const word = words[Math.floor(Math.random() * words.length)];
                            const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                            this.enemyBullets.push(new Bullet(e.x, e.y + 40, Math.cos(angle) * 4, Math.sin(angle) * 4, '#ff33ff', word));
                        }
                        if (this.frame % 100 === 0) {
                            const word = words[Math.floor(Math.random() * words.length)];
                            for (let i = 0; i < 8; i++) {
                                const ang = i * Math.PI * 2 / 8 + this.frame * 0.01;
                                this.enemyBullets.push(new Bullet(e.x, e.y + 40, Math.cos(ang) * 3, Math.sin(ang) * 3, '#ff0000', word));
                            }
                        }
                    }
                }
            }

            this.player.bullets.forEach(b => {
                if (b.alive && e.alive) {
                    const dx = b.x - e.x, dy = b.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < e.size + b.size) {
                        b.alive = false; e.hp--;
                        if (e.hp <= 0) {
                            e.alive = false;
                            
                            const roll = Math.random();
                            if (roll < 0.1) { 
                                this.items.push(new Item('power', e.x, e.y));
                            } else if (roll < 0.15) { 
                                this.items.push(new Item('recover', e.x, e.y));
                            }

                            if (e.type === 'typeboss') this.isStageClear = true; 
                        }
                    }
                }
            });

            if (e.alive && !this.player.isEntering && this.player.invincibleTimer === 0) {
                const dx = e.x - this.player.x, dy = e.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < (e.size + this.player.size) / 2) {
                    this.player.hp--; 
                    this.player.invincibleTimer = 90; 
                    if (this.player.hp <= 0) return 'GAMEOVER'; 
                }
            }
        });
        this.enemies = this.enemies.filter(e => e.alive);

        this.enemyBullets.forEach(eb => {
            if (eb.alive && !this.player.isEntering && this.player.invincibleTimer === 0) {
                const dx = eb.x - this.player.x, dy = eb.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < (eb.size + this.player.size) / 2) {
                    eb.alive = false;
                    this.player.hp--; 
                    this.player.invincibleTimer = 90; 
                    if (this.player.hp <= 0) return 'GAMEOVER';
                }
            }
        });

        this.items.forEach(it => {
            if (it.alive && !this.player.isEntering) {
                const dx = it.x - this.player.x, dy = it.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < (it.size + this.player.size)) {
                    it.alive = false;
                    if (it.type === 'power') {
                        this.player.powerLevel = Math.min(8, this.player.powerLevel + 1);
                    } else if (it.type === 'recover') {
                        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
                    }
                }
            }
        });

        if (this.isStageClear) return 'STAGE_CLEAR';
        return 'PLAYING';
    }

    draw(ctx) {
        const canvas = document.getElementById('gameCanvas');
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.width / dpr;
        const cssH = canvas.height / dpr;
        
        // ★追加：ステージ3の背景スクロールと雲描画
        if (this.currentStage === 3) {
            const bgImg = this.advManager && this.advManager.assets ? this.advManager.assets['mountain.png'] : null;
            if (bgImg && bgImg.naturalWidth > 0) {
                // y座標をスクロールさせつつ、途切れないように2枚描画
                ctx.drawImage(bgImg, 0, this.bgScrollY, cssW, cssH);
                ctx.drawImage(bgImg, 0, this.bgScrollY - cssH, cssW, cssH);
            } else {
                ctx.fillStyle = '#112233'; 
                ctx.fillRect(0, 0, cssW, cssH);
            }
            
            // 雲パーティクルの描画
            this.clouds.forEach(cloud => {
                ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
                ctx.fill();
            });
        } else {
            // ステージ1, 2の通常の黒半透明背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, cssW, cssH);
        }

        this.player.bullets.forEach(b => b.draw(ctx));
        this.enemies.forEach(e => e.draw(ctx));
        this.enemyBullets.forEach(eb => eb.draw(ctx));
        this.items.forEach(it => it.draw(ctx)); 
        this.player.draw(ctx);
        
        ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; 
        ctx.fillRect(10, cssH - 50, 290, 40); 
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, cssH - 50, 290, 40);

        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('HP:', 20, cssH - 25);
        const barW = 100, barH = 15;
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(55, cssH - 37, barW, barH);
        ctx.fillStyle = '#33ff33'; 
        ctx.fillRect(55, cssH - 37, barW * (this.player.hp / this.player.maxHp), barH);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(55, cssH - 37, barW, barH);
        
        ctx.fillStyle = '#fff'; ctx.fillText(`POWER: ${this.player.powerLevel}/8`, 170, cssH - 25);
    }
}
