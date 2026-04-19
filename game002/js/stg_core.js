const VER_STG_CORE = "0.7.4"; // バージョン更新（ボス撃破判定の汎用化、HPゲージと数値の表示最適化）

window.StageConfigs = window.StageConfigs || {};

class Enemy {
    constructor(type, x, y, charData, advManager, stgId) {
        this.type = type; this.x = x; this.y = y; this.startX = x; this.startY = y;
        this.charData = charData; this.alive = true; this.angle = 0; this.moveTimer = 0; 
        this.advManager = advManager; 
        
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
        if (this.config.getEnemyData) { data = this.config.getEnemyData(type); }
        if (!data) { data = { imgSrc: null, size: 20, hp: 1, maxHp: 1 }; }

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
            
            if (this.isDying && this.deathTimer >= 60) {
                const progress = (this.deathTimer - 60) / 120; 
                const block = Math.max(1, Math.floor(progress * 15)); 
                
                if (block > 1) {
                    if (!this.mosaicCanvas) {
                        this.mosaicCanvas = document.createElement('canvas');
                        this.mosaicCtx = this.mosaicCanvas.getContext('2d');
                    }
                    this.mosaicCanvas.width = Math.max(1, Math.floor(dW / block));
                    this.mosaicCanvas.height = Math.max(1, Math.floor(dH / block));
                    this.mosaicCtx.clearRect(0, 0, this.mosaicCanvas.width, this.mosaicCanvas.height);
                    this.mosaicCtx.drawImage(img, 0, 0, this.mosaicCanvas.width, this.mosaicCanvas.height);
                    
                    ctx.imageSmoothingEnabled = false; 
                    ctx.globalAlpha = Math.max(0, 1.0 - progress); 
                    ctx.drawImage(this.mosaicCanvas, -dW/2, -dH/2, dW, dH);
                    ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 1.0;
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.drawImage(img, -dW/2, -dH/2, dW, dH);
                }
            } else {
                ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.drawImage(img, -dW/2, -dH/2, dW, dH);
            }
        } else { 
            // ★修正：ボス描画のフォールバック色判定を拡張
            ctx.fillStyle = this.type.includes('boss') ? '#ff00ff' : '#00ffff'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); 
        }

        // ★修正：ボスのHPゲージ描画条件を拡張＆ゲージのマイナス描画防止
        if (this.type.includes('boss') && this.hp > 0 && !this.isDying) {
            const bW = this.size * 1.5, bH = 10;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bW/2, -this.size-20, bW, bH);
            ctx.fillStyle = '#ff3366'; ctx.fillRect(-bW/2, -this.size-20, bW*(Math.max(0, this.hp)/this.maxHp), bH);
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
        
        this.flashTimer = 0; this.shakeTimer = 0;

        this.bombState = 'READY'; 
        this.bombTimer = 0;
        this.bombData = null; 
        this.isTimeStopped = false; 
        
        this.stgId = stgId;
        if (!this.stgId) {
            if (typeof currentStage !== 'undefined') {
                if (currentStage === 1) this.stgId = 'kagami';
                else if (currentStage === 2) this.stgId = 'hiragi';
                else if (currentStage === 3) this.stgId = 'shiina';
                else this.stgId = 'kagami';
            } else { this.stgId = 'kagami'; }
        }
        
        this.config = window.StageConfigs[this.stgId] || {};
        if (this.config && this.config.init) this.config.init(this, canvas);
    }

    triggerBomb() {
        this.player.triggerBomb(this);
    }
    
    updateEntrance() { const c = document.getElementById('gameCanvas'); this.player.update(c); return !this.player.isEntering; }

    updateGameplay() {
        const canvas = document.getElementById('gameCanvas'), dpr = window.devicePixelRatio || 1, sW = canvas.width/dpr, sH = canvas.height/dpr;

        if (this.isTimeStopped) {
            this.player.updateBomb(this, sW, sH);
            this.explosions.forEach(ex => ex.update());
            this.explosions = this.explosions.filter(ex => !ex.isDead);
            return 'PLAYING'; 
        }

        this.frame++; this.stageTimer++;
        
        this.player.update(canvas); if (!this.player.isEntering && this.frame % 8 === 0) this.player.shoot(); 
        
        if(this.config.updateBackground) this.config.updateBackground(this, sW, sH);
        if(this.config.updateWaves) this.config.updateWaves(this, this.stageTimer, sW, sH);

        this.player.bullets.forEach(b => b.update(canvas)); this.enemyBullets.forEach(b => b.update(canvas));
        this.player.bullets = this.player.bullets.filter(b => b.alive); this.enemyBullets = this.enemyBullets.filter(b => b.alive);
        this.items.forEach(it => it.update(canvas)); this.items = this.items.filter(it => it.alive);
        
        this.explosions.forEach(ex => ex.update()); this.explosions = this.explosions.filter(ex => !ex.isDead);

        for (let e of this.enemies) {
            if (e.isDying) {
                e.deathTimer++;
                if (e.deathTimer === 1) this.flashTimer = 15;
                if (e.deathTimer === 30) this.flashTimer = 15;
                if (e.deathTimer === 60) { this.flashTimer = 20; this.shakeTimer = 120; }
                if (e.deathTimer >= 60 && e.deathTimer < 180) {
                    if (this.frame % 4 === 0) {
                        const exX = e.x + (Math.random() - 0.5) * e.size * 2.5; const exY = e.y + (Math.random() - 0.5) * e.size * 2.5;
                        this.explosions.push(new Explosion(exX, exY, (e.size * 2) * (Math.random() * 0.5 + 0.5), this.advManager));
                        if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                    }
                }
                if (e.deathTimer >= 180) {
                    e.alive = false; this.isStageClear = true;
                    this.explosions.push(new Explosion(e.x, e.y, e.size * 4, this.advManager));
                    if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                }
                continue; 
            }

            e.update(canvas, this.player);
            if (e.alive && !this.player.isEntering && this.config.shootEnemy) this.config.shootEnemy(e, this);

            this.player.bullets.forEach(b => {
                if (b.alive && e.alive && !e.isDying && Math.sqrt((b.x-e.x)**2 + (b.y-e.y)**2) < e.size + b.size) {
                    b.alive = false; e.hp--;
                    if (e.hp <= 0) {
                        // ★修正：'typeboss'だけでなく、名前に'boss'が含まれていればクリア演出に移行する
                        if (e.type.includes('boss')) {
                            e.isDying = true; e.deathTimer = 0; this.enemyBullets = []; 
                        } else {
                            e.alive = false; this.explosions.push(new Explosion(e.x, e.y, e.size * 2, this.advManager));
                            if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                            if(Math.random()<0.1) this.items.push(new Item('power', e.x, e.y)); else if(Math.random()<0.15) this.items.push(new Item('recover', e.x, e.y));
                        }
                    }
                }
            });
            
            if (e.alive && !this.player.isEntering && this.player.invincibleTimer === 0 && Math.sqrt((e.x-this.player.x)**2 + (e.y-this.player.y)**2) < (e.size+this.player.size)/2) {
                this.player.hp--; this.player.invincibleTimer = 90; 
                if (this.player.hp <= 0) return 'GAMEOVER';
            }
        }
        this.enemies = this.enemies.filter(e => e.alive);
        
        for (let eb of this.enemyBullets) {
            if (eb.alive && !this.player.isEntering && this.player.invincibleTimer === 0 && Math.sqrt((eb.x-this.player.x)**2 + (eb.y-this.player.y)**2) < (eb.size+this.player.size)/2) {
                eb.alive = false; this.player.hp--; this.player.invincibleTimer = 90; 
                if (this.player.hp <= 0) return 'GAMEOVER';
            }
        }
        
        this.items.forEach(it => {
            if (it.alive && !this.player.isEntering && Math.sqrt((it.x-this.player.x)**2 + (it.y-this.player.y)**2) < it.size + this.player.size) {
                it.alive = false;
                if (it.type === 'power') this.player.powerLevel = Math.min(8, this.player.powerLevel + 1);
                // ★HP回復時、最大値を超えないように制御（既存のまま正常動作）
                else if (it.type === 'recover') this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
            }
        });

        if (this.isStageClear) return 'STAGE_CLEAR';
        return 'PLAYING';
    }

    draw(ctx) {
        const c = document.getElementById('gameCanvas'), dpr = window.devicePixelRatio || 1, sW = c.width/dpr, sH = c.height/dpr;
        ctx.save();
        
        let shakeX = 0, shakeY = 0;
        if (this.shakeTimer > 0) {
            shakeX = (Math.random() - 0.5) * 15; shakeY = (Math.random() - 0.5) * 15;
            ctx.translate(shakeX, shakeY);
            if (!this.isTimeStopped) this.shakeTimer--;
        }

        if (this.config && this.config.drawBackground) { this.config.drawBackground(this, ctx, sW, sH); } 
        else {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, sW, sH);
            ctx.fillStyle = '#ff3366'; ctx.font = 'bold 16px sans-serif'; ctx.fillText("【エラー】ステージデータが読み込まれていません！", 20, 60);
        }

        this.player.bullets.forEach(b => b.draw(ctx)); 
        this.enemies.forEach(e => e.draw(ctx));
        this.explosions.forEach(ex => ex.draw(ctx)); 
        this.enemyBullets.forEach(eb => eb.draw(ctx)); 
        this.items.forEach(it => it.draw(ctx)); 
        
        this.player.draw(ctx, this.advManager); 
        this.player.drawBomb(this, ctx, sW, sH, shakeX, shakeY);

        if (this.flashTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer / 20})`; 
            ctx.fillRect(-shakeX, -shakeY, sW + Math.abs(shakeX)*2, sH + Math.abs(shakeY)*2);
            if (!this.isTimeStopped) this.flashTimer--;
        }
        ctx.restore();
        
        // ★修正：枠の幅を広げ、HPの「数値（値）」をテキストで表示してチグハグ感を解消
        const pHP = Math.max(0, this.player.hp);
        ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; ctx.fillRect(10, sH - 50, 310, 40); 
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, sH - 50, 310, 40);
        
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; 
        ctx.fillText(`HP: ${pHP}/${this.player.maxHp}`, 20, sH - 25);
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(90, sH - 37, 100, 15);
        ctx.fillStyle = '#33ff33'; ctx.fillRect(90, sH - 37, 100 * (pHP / this.player.maxHp), 15);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(90, sH - 37, 100, 15);
        
        ctx.fillStyle = '#fff'; ctx.fillText(`POWER: ${this.player.powerLevel}/8`, 205, sH - 25);
    }
}
