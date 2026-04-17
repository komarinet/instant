const VER_STG_CORE = "0.5.5"; // バージョン更新（ボス撃破時のリッチな死亡・モザイク爆発演出を追加）

window.StageConfigs = window.StageConfigs || {};

class Player {
    constructor(charData) {
        this.id = charData.id; this.name = charData.name; this.color = charData.color;
        this.x = 0; this.y = 0; this.size = 20; this.speed = 5; this.bullets = []; this.isEntering = true; 
        this.maxHp = 5; this.hp = this.maxHp; this.invincibleTimer = 0; this.powerLevel = 0; 
    }
    initPosition(canvas) { const dpr = window.devicePixelRatio || 1; this.x = canvas.width / dpr / 2; this.y = canvas.height / dpr + this.size * 2; }
    update(canvas) {
        const dpr = window.devicePixelRatio || 1;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.isEntering) {
            const tY = canvas.height / dpr * 0.8; this.y -= (this.y - tY) * 0.05;
            if (Math.abs(this.y - tY) < 1) { this.y = tY; this.isEntering = false; } return; 
        }
        if (this.x < this.size) this.x = this.size; if (this.x > canvas.width/dpr - this.size) this.x = canvas.width/dpr - this.size;
        if (this.y < this.size) this.y = this.size; if (this.y > canvas.height/dpr - this.size) this.y = canvas.height/dpr - this.size;
    }
    draw(ctx) {
        if (this.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return; 
        ctx.fillStyle = this.color; ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size); ctx.lineTo(this.x - this.size, this.y + this.size); ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.closePath(); ctx.fill();
    }
    shoot() {
        if (this.isEntering) return;
        const bS = 10;
        if (this.powerLevel === 0) { this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bS, this.color)); }
        else if (this.powerLevel === 1) { this.bullets.push(new Bullet(this.x - 5, this.y - this.size, 0, -bS, this.color)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0, -bS, this.color)); }
        else if (this.powerLevel === 2) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bS, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1, -bS, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1, -bS, this.color));
        }
        else if (this.powerLevel === 3) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -0.5, -bS, this.color)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0.5, -bS, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1.5, -bS, this.color)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1.5, -bS, this.color));
        }
        else if (this.powerLevel === 4) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bS, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1, -bS, this.color)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1, -bS, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -2, -bS, this.color)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 2, -bS, this.color));
        }
        else if (this.powerLevel === 5) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -0.5, -bS, this.color)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0.5, -bS, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1.5, -bS, this.color)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1.5, -bS, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -2.5, -bS, this.color)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 2.5, -bS, this.color));
        }
        else if (this.powerLevel === 6) { for (let i = -3; i <= 3; i++) this.bullets.push(new Bullet(this.x, this.y - this.size, i * 1.0, -bS, this.color)); }
        else if (this.powerLevel === 7) { for (let i = -3; i <= 4; i++) this.bullets.push(new Bullet(this.x - 2.5, this.y - this.size, (i - 0.5) * 1.0, -bS, this.color)); }
        else if (this.powerLevel >= 8) { for (let i = -4; i <= 4; i++) this.bullets.push(new Bullet(this.x, this.y - this.size, i * 1.0, -bS, this.color)); }
    }
}

class Bullet {
    constructor(x, y, vx, vy, color, text = null) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.size = text ? 12 : 4; this.color = color; this.text = text; this.alive = true;
    }
    update(canvas) {
        this.x += this.vx; this.y += this.vy; const dpr = window.devicePixelRatio || 1;
        if (this.y < -this.size || this.y > canvas.height/dpr + this.size || this.x < -this.size || this.x > canvas.width/dpr + this.size) this.alive = false;
    }
    draw(ctx) {
        if (this.text) {
            ctx.fillStyle = this.color; ctx.font = 'bold 20px "Segoe UI"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 5; ctx.fillText(this.text, this.x, this.y);
            ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        } else { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
}

class Item {
    constructor(type, x, y) { this.type = type; this.x = x; this.y = y; this.size = 15; this.alive = true; this.vy = 2; this.angle = 0; }
    update(canvas) { this.y += this.vy; this.angle += 0.1; this.x += Math.sin(this.angle) * 1; if (this.y > canvas.height/(window.devicePixelRatio||1) + this.size) this.alive = false; }
    draw(ctx) {
        ctx.fillStyle = this.type === 'power' ? '#ffaa00' : '#33ff33'; ctx.beginPath();
        if (this.type === 'power') {
            for (let i = 0; i < 5; i++) { const ang = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.lineTo(this.x + Math.cos(ang) * this.size, this.y + Math.sin(ang) * this.size); }
        } else {
            ctx.rect(this.x - this.size, this.y - this.size / 3, this.size * 2, this.size / 1.5); ctx.fill(); ctx.beginPath(); ctx.rect(this.x - this.size / 3, this.y - this.size, this.size / 1.5, this.size * 2);
        }
        ctx.closePath(); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(this.type === 'power' ? 'P' : 'H', this.x, this.y + 6); ctx.textAlign = 'left'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }
}

class Explosion {
    constructor(x, y, targetSize, advManager) {
        this.x = x; 
        this.y = y;
        this.targetSize = targetSize * 1.5; 
        this.img = (advManager && advManager.assets) ? advManager.assets['baku01.png'] : null;
        this.isDead = false;

        this.cols = 3; 
        this.rows = 3; 
        this.frameIndex = 0;
        this.totalFrames = this.cols * this.rows; 
        
        this.timer = 0;
        this.interval = 3; 

        if (this.img && this.img.naturalWidth > 0) {
            this.sw = this.img.width / this.cols;
            this.sh = this.img.height / this.rows;
        } else {
            this.isDead = true; 
        }
    }

    update() {
        if (this.isDead) return;
        this.timer++;
        if (this.timer >= this.interval) {
            this.timer = 0;
            this.frameIndex++;
            if (this.frameIndex >= this.totalFrames) {
                this.isDead = true; 
            }
        }
    }

    draw(ctx) {
        if (this.isDead || !this.img) return;
        const fx = this.frameIndex % this.cols;
        const fy = Math.floor(this.frameIndex / this.cols);
        const cx = fx * this.sw;
        const cy = fy * this.sh;

        ctx.drawImage(
            this.img,
            cx, cy, this.sw, this.sh,
            this.x - this.targetSize / 2, this.y - this.targetSize / 2, this.targetSize, this.targetSize
        );
    }
}

class Enemy {
    constructor(type, x, y, charData, advManager, stgId) {
        this.type = type; this.x = x; this.y = y; this.startX = x; this.startY = y;
        this.charData = charData; this.alive = true; this.angle = 0; this.moveTimer = 0; 
        this.advManager = advManager; 
        
        // ★新規追加：ボスの死亡演出用パラメータ
        this.isDying = false; 
        this.deathTimer = 0;
        
        if (!stgId) {
            if (typeof currentStage !== 'undefined') {
                if (currentStage === 1) stgId = 'kagami';
                else if (currentStage === 2) stgId = 'hiragi';
                else if (currentStage === 3) stgId = 'shiina';
                else stgId = 'kagami';
            } else {
                stgId = 'kagami';
            }
        }
        this.config = window.StageConfigs[stgId] || {};

        let data = null;
        if (this.config.getEnemyData) {
            data = this.config.getEnemyData(type);
        }
        if (!data) {
            data = { imgSrc: null, size: 20, hp: 1, maxHp: 1 };
        }

        this.imgSrc = data.imgSrc; 
        this.size = data.size || 20; 
        this.hp = data.hp || 1; 
        this.maxHp = data.maxHp || data.hp || 1;
        if(data.init) data.init(this);
    }
    
    update(canvas, player) {
        if(this.config.updateEnemy) this.config.updateEnemy(this, canvas, player);
        const dpr = window.devicePixelRatio || 1;
        if (this.y > canvas.height/dpr + this.size * 2 || (this.state === 'leave' && this.y < -this.size * 2)) this.alive = false;
    }
    
    draw(ctx) {
        const img = (this.advManager && this.advManager.assets) ? this.advManager.assets[this.imgSrc] : null;
        ctx.save(); ctx.translate(this.x, this.y);
        
        if (this.config.transformEnemy) this.config.transformEnemy(this, ctx);

        if (img && img.naturalWidth > 0) {
            const ar = img.width / img.height; let dW, dH;
            if (ar > 1) { dW = this.size * 2; dH = dW / ar; } else { dH = this.size * 2; dW = dH * ar; }
            
            // ★新規追加：ボス撃破時のモザイク状に消えていく演出
            if (this.isDying && this.deathTimer >= 60) {
                const progress = (this.deathTimer - 60) / 120; // 0.0 ~ 1.0
                const block = Math.max(1, Math.floor(progress * 15)); // 時間経過でモザイクのブロックが荒くなる
                
                if (block > 1) {
                    if (!this.mosaicCanvas) {
                        this.mosaicCanvas = document.createElement('canvas');
                        this.mosaicCtx = this.mosaicCanvas.getContext('2d');
                    }
                    this.mosaicCanvas.width = Math.max(1, Math.floor(dW / block));
                    this.mosaicCanvas.height = Math.max(1, Math.floor(dH / block));
                    this.mosaicCtx.clearRect(0, 0, this.mosaicCanvas.width, this.mosaicCanvas.height);
                    this.mosaicCtx.drawImage(img, 0, 0, this.mosaicCanvas.width, this.mosaicCanvas.height);
                    
                    ctx.imageSmoothingEnabled = false; // ピクセルをくっきりさせてモザイク感を出す
                    ctx.globalAlpha = Math.max(0, 1.0 - progress); // だんだん透けて消える
                    ctx.drawImage(this.mosaicCanvas, -dW/2, -dH/2, dW, dH);
                    ctx.imageSmoothingEnabled = true;
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.drawImage(img, -dW/2, -dH/2, dW, dH);
                }
            } else {
                ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.drawImage(img, -dW/2, -dH/2, dW, dH);
            }
        } else { 
            ctx.fillStyle = this.type === 'typeboss' ? '#ff00ff' : '#00ffff'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); 
        }

        // 死亡演出中はHPバーを表示しない
        if (this.type === 'typeboss' && this.hp > 0 && !this.isDying) {
            const bW = this.size * 1.5, bH = 10;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bW/2, -this.size-20, bW, bH);
            ctx.fillStyle = '#ff3366'; ctx.fillRect(-bW/2, -this.size-20, bW*(this.hp/this.maxHp), bH);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(-bW/2, -this.size-20, bW, bH);
        }
        ctx.restore();
    }
}

class STGManager {
    constructor(canvas, charData, stgId) {
        this.player = new Player(charData); this.player.initPosition(canvas);
        
        this.enemies = []; this.enemyBullets = []; this.items = []; this.explosions = []; this.frame = 0; this.bossSpawned = false;
        
        this.stageTimer = 0; this.isStageClear = false; 
        this.advManager = (typeof advManager !== 'undefined') ? advManager : null; 
        
        // ★新規追加：フラッシュと画面揺れ用のタイマー
        this.flashTimer = 0; 
        this.shakeTimer = 0;
        
        this.stgId = stgId;
        if (!this.stgId) {
            if (typeof currentStage !== 'undefined') {
                if (currentStage === 1) this.stgId = 'kagami';
                else if (currentStage === 2) this.stgId = 'hiragi';
                else if (currentStage === 3) this.stgId = 'shiina';
                else this.stgId = 'kagami';
            } else {
                this.stgId = 'kagami';
            }
        }
        
        this.config = window.StageConfigs[this.stgId] || {};
        if (this.config && this.config.init) this.config.init(this, canvas);
    }
    
    updateEntrance() { const c = document.getElementById('gameCanvas'); this.player.update(c); return !this.player.isEntering; }

    updateGameplay() {
        this.frame++; this.stageTimer++;
        const canvas = document.getElementById('gameCanvas'), dpr = window.devicePixelRatio || 1, sW = canvas.width/dpr, sH = canvas.height/dpr;
        
        this.player.update(canvas); if (!this.player.isEntering && this.frame % 8 === 0) this.player.shoot(); 
        
        if(this.config.updateBackground) this.config.updateBackground(this, sW, sH);
        if(this.config.updateWaves) this.config.updateWaves(this, this.stageTimer, sW, sH);

        this.player.bullets.forEach(b => b.update(canvas)); this.enemyBullets.forEach(b => b.update(canvas));
        this.player.bullets = this.player.bullets.filter(b => b.alive); this.enemyBullets = this.enemyBullets.filter(b => b.alive);
        this.items.forEach(it => it.update(canvas)); this.items = this.items.filter(it => it.alive);
        
        this.explosions.forEach(ex => ex.update()); this.explosions = this.explosions.filter(ex => !ex.isDead);

        this.enemies.forEach(e => {
            // ★新規追加：ボスが死亡演出中の場合のタイムライン処理
            if (e.isDying) {
                e.deathTimer++;
                
                // 1. フラッシュ1回目
                if (e.deathTimer === 1) this.flashTimer = 15;
                
                // 2. フラッシュ2回目
                if (e.deathTimer === 30) this.flashTimer = 15;
                
                // 3. 画面全体がゴゴゴと揺れ始める（フラッシュ3回目）
                if (e.deathTimer === 60) {
                    this.flashTimer = 20;
                    this.shakeTimer = 120; // 約2秒間揺れる
                }
                
                // 4. モザイク＆振動中、ボスの体の上で連鎖爆発！
                if (e.deathTimer >= 60 && e.deathTimer < 180) {
                    if (this.frame % 4 === 0) {
                        const exX = e.x + (Math.random() - 0.5) * e.size * 2.5;
                        const exY = e.y + (Math.random() - 0.5) * e.size * 2.5;
                        this.explosions.push(new Explosion(exX, exY, (e.size * 2) * (Math.random() * 0.5 + 0.5), this.advManager));
                    }
                }
                
                // 5. 演出完了。最後に大爆発して完全に消滅＆クリア
                if (e.deathTimer >= 180) {
                    e.alive = false;
                    this.isStageClear = true;
                    this.explosions.push(new Explosion(e.x, e.y, e.size * 4, this.advManager));
                }
                return; // 死亡演出中は移動や弾の発射を行わない
            }

            e.update(canvas, this.player);
            if (e.alive && !this.player.isEntering && this.config.shootEnemy) this.config.shootEnemy(e, this);

            this.player.bullets.forEach(b => {
                if (b.alive && e.alive && !e.isDying && Math.sqrt((b.x-e.x)**2 + (b.y-e.y)**2) < e.size + b.size) {
                    b.alive = false; e.hp--;
                    if (e.hp <= 0) {
                        // ★修正：ボスか雑魚敵かで撃破時の処理を分岐
                        if (e.type === 'typeboss') {
                            e.isDying = true; // 死亡演出ステートに移行
                            e.deathTimer = 0;
                            this.enemyBullets = []; // ボスを倒した瞬間に画面の敵弾を全消去して安全に！
                        } else {
                            e.alive = false;
                            this.explosions.push(new Explosion(e.x, e.y, e.size * 2, this.advManager));
                            if(Math.random()<0.1) this.items.push(new Item('power', e.x, e.y)); else if(Math.random()<0.15) this.items.push(new Item('recover', e.x, e.y));
                        }
                    }
                }
            });
            if (e.alive && !this.player.isEntering && this.player.invincibleTimer === 0 && Math.sqrt((e.x-this.player.x)**2 + (e.y-this.player.y)**2) < (e.size+this.player.size)/2) {
                this.player.hp--; this.player.invincibleTimer = 90; if (this.player.hp <= 0) return 'GAMEOVER';
            }
        });
        this.enemies = this.enemies.filter(e => e.alive);
        
        this.enemyBullets.forEach(eb => {
            if (eb.alive && !this.player.isEntering && this.player.invincibleTimer === 0 && Math.sqrt((eb.x-this.player.x)**2 + (eb.y-this.player.y)**2) < (eb.size+this.player.size)/2) {
                eb.alive = false; this.player.hp--; this.player.invincibleTimer = 90; if (this.player.hp <= 0) return 'GAMEOVER';
            }
        });
        
        this.items.forEach(it => {
            if (it.alive && !this.player.isEntering && Math.sqrt((it.x-this.player.x)**2 + (it.y-this.player.y)**2) < it.size + this.player.size) {
                it.alive = false;
                if (it.type === 'power') this.player.powerLevel = Math.min(8, this.player.powerLevel + 1);
                else if (it.type === 'recover') this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
            }
        });

        if (this.isStageClear) return 'STAGE_CLEAR';
        return 'PLAYING';
    }

    draw(ctx) {
        const c = document.getElementById('gameCanvas'), dpr = window.devicePixelRatio || 1, sW = c.width/dpr, sH = c.height/dpr;
        
        ctx.save();
        
        // ★新規追加：画面揺れ（シェイク）の適用。UIには影響させないよう背景とキャラのみ揺らす
        let shakeX = 0, shakeY = 0;
        if (this.shakeTimer > 0) {
            shakeX = (Math.random() - 0.5) * 15;
            shakeY = (Math.random() - 0.5) * 15;
            ctx.translate(shakeX, shakeY);
        }

        if (this.config && this.config.drawBackground) {
            this.config.drawBackground(this, ctx, sW, sH);
        } else {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, sW, sH);
            ctx.fillStyle = '#ff3366'; ctx.font = 'bold 16px sans-serif';
            ctx.fillText("【エラー】ステージデータが読み込まれていません！", 20, 60);
            ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
            ctx.fillText(`・stg_${this.stgId}.js が index.html に記述されているか確認してください。`, 20, 90);
        }

        this.player.bullets.forEach(b => b.draw(ctx)); 
        this.enemies.forEach(e => e.draw(ctx));
        this.explosions.forEach(ex => ex.draw(ctx)); 
        this.enemyBullets.forEach(eb => eb.draw(ctx)); 
        this.items.forEach(it => it.draw(ctx)); 
        this.player.draw(ctx);
        
        // ★新規追加：フラッシュ（白画面）の適用
        if (this.flashTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer / 20})`; // 時間経過でだんだん透明に
            // 画面揺れで隙間ができないように少し広めに塗りつぶす
            ctx.fillRect(-shakeX, -shakeY, sW + Math.abs(shakeX)*2, sH + Math.abs(shakeY)*2);
        }
        
        ctx.restore();
        
        // --- 以降はUI（体力バーなど）。画面揺れの影響を受けずに静止して描画される ---
        ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; ctx.fillRect(10, sH - 50, 290, 40); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, sH - 50, 290, 40);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('HP:', 20, sH - 25);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(55, sH - 37, 100, 15);
        ctx.fillStyle = '#33ff33'; ctx.fillRect(55, sH - 37, 100 * (this.player.hp / this.player.maxHp), 15);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(55, sH - 37, 100, 15);
        ctx.fillStyle = '#fff'; ctx.fillText(`POWER: ${this.player.powerLevel}/8`, 170, sH - 25);
    }
}
