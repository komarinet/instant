const VER_STG_CORE = "0.6.1"; // バージョン更新（奥義の回数制限追加、カットイン画像を画面縦半分のサイズに調整）

window.StageConfigs = window.StageConfigs || {};

class Player {
    constructor(charData) {
        this.id = charData.id; this.name = charData.name; this.color = charData.color;
        this.x = 0; this.y = 0; this.size = 20; this.speed = 5; this.bullets = []; this.isEntering = true; 
        this.maxHp = 5; this.hp = this.maxHp; this.invincibleTimer = 0; this.powerLevel = 0; 
        // ★新規追加：奥義の使用可能回数（デフォルト3回）
        this.bombs = 3; 
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
    
    draw(ctx, advManager) {
        if (this.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return; 
        
        let img = null;
        if (this.id === 'igari' && advManager && advManager.assets) {
            img = advManager.assets['igari_jiki.png'];
        }

        if (img && img.naturalWidth > 0) {
            const drawWidth = 60;
            const drawHeight = drawWidth * (img.height / img.width);
            ctx.drawImage(img, this.x - drawWidth / 2, this.y - drawHeight / 2, drawWidth, drawHeight);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI*2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.color; ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size); ctx.lineTo(this.x - this.size, this.y + this.size); ctx.lineTo(this.x + this.size, this.y + this.size);
            ctx.closePath(); ctx.fill();
        }
    }
    
    shoot() {
        if (this.isEntering) return;
        const bS = 10;
        if (this.powerLevel === 0) { this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bS, this.color, null, this.id)); }
        else if (this.powerLevel === 1) { this.bullets.push(new Bullet(this.x - 5, this.y - this.size, 0, -bS, this.color, null, this.id)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0, -bS, this.color, null, this.id)); }
        else if (this.powerLevel === 2) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bS, this.color, null, this.id));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1, -bS, this.color, null, this.id));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1, -bS, this.color, null, this.id));
        }
        else if (this.powerLevel === 3) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -0.5, -bS, this.color, null, this.id)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0.5, -bS, this.color, null, this.id));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1.5, -bS, this.color, null, this.id)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1.5, -bS, this.color, null, this.id));
        }
        else if (this.powerLevel === 4) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bS, this.color, null, this.id));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1, -bS, this.color, null, this.id)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1, -bS, this.color, null, this.id));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -2, -bS, this.color, null, this.id)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 2, -bS, this.color, null, this.id));
        }
        else if (this.powerLevel === 5) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -0.5, -bS, this.color, null, this.id)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0.5, -bS, this.color, null, this.id));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1.5, -bS, this.color, null, this.id)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1.5, -bS, this.color, null, this.id));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -2.5, -bS, this.color, null, this.id)); this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 2.5, -bS, this.color, null, this.id));
        }
        else if (this.powerLevel === 6) { for (let i = -3; i <= 3; i++) this.bullets.push(new Bullet(this.x, this.y - this.size, i * 1.0, -bS, this.color, null, this.id)); }
        else if (this.powerLevel === 7) { for (let i = -3; i <= 4; i++) this.bullets.push(new Bullet(this.x - 2.5, this.y - this.size, (i - 0.5) * 1.0, -bS, this.color, null, this.id)); }
        else if (this.powerLevel >= 8) { for (let i = -4; i <= 4; i++) this.bullets.push(new Bullet(this.x, this.y - this.size, i * 1.0, -bS, this.color, null, this.id)); }
    }
}

class Bullet {
    constructor(x, y, vx, vy, color, text = null, shooterId = null) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.size = text ? 12 : 4; this.color = color; this.text = text; this.alive = true;
        this.shooterId = shooterId; 
    }
    update(canvas) {
        this.x += this.vx; this.y += this.vy; const dpr = window.devicePixelRatio || 1;
        if (this.y < -this.size * 4 || this.y > canvas.height/dpr + this.size * 4 || this.x < -this.size * 4 || this.x > canvas.width/dpr + this.size * 4) this.alive = false;
    }
    draw(ctx) {
        if (this.text) {
            ctx.fillStyle = this.color; ctx.font = 'bold 20px "Segoe UI"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 5; ctx.fillText(this.text, this.x, this.y);
            ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        } else if (this.shooterId === 'igari') {
            ctx.save();
            ctx.translate(this.x, this.y);
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);
            const length = this.size * 2.5; 
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.size * 2.5; 
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;
            ctx.lineCap = 'round'; 
            ctx.beginPath();
            ctx.moveTo(-length, 0);
            ctx.lineTo(length, 0);
            ctx.stroke();
            ctx.shadowBlur = 0; 
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = this.size * 0.4;
            ctx.beginPath();
            ctx.moveTo(-length * 0.8, 0);
            ctx.lineTo(length * 0.8, 0);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
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

class BombLaser {
    constructor(canvasWidth, canvasHeight) {
        this.sW = canvasWidth;
        this.sH = canvasHeight;
        this.alive = true;
        this.state = 'WINDUP'; 
        this.timer = 0;
        this.windupHeight = 0;
        this.windupDuration = 30; 
        this.beamDuration = 60; 
        this.beamAlpha = 1.0;
    }

    update() {
        this.timer++;
        if (this.state === 'WINDUP') {
            const progress = this.timer / this.windupDuration;
            this.windupHeight = this.sH * progress; 
            if (this.timer >= this.windupDuration) {
                this.state = 'BEAM';
                this.timer = 0;
            }
        } 
        else if (this.state === 'BEAM') {
            this.beamAlpha = Math.max(0, 1.0 - (this.timer / this.beamDuration));
            if (this.timer >= this.beamDuration) {
                this.state = 'DONE';
                this.alive = false;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.state === 'WINDUP') {
            const gradient = ctx.createLinearGradient(0, this.sH, 0, this.sH - this.windupHeight);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.5, 'rgba(200, 0, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, this.sH - this.windupHeight, this.sW, this.windupHeight);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 10;
            ctx.shadowColor = 'magenta';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(0, this.sH - this.windupHeight);
            ctx.lineTo(this.sW, this.sH - this.windupHeight);
            ctx.stroke();
        }
        else if (this.state === 'BEAM') {
            ctx.globalAlpha = this.beamAlpha;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, this.sW, this.sH);
            ctx.fillStyle = 'rgba(100, 0, 255, 0.5)';
            ctx.shadowColor = 'magenta';
            ctx.shadowBlur = 50;
            ctx.fillRect(0, 0, this.sW, this.sH);
        }
        ctx.restore();
    }
}


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
        
        this.flashTimer = 0; 
        this.shakeTimer = 0;

        this.bombState = 'READY'; 
        this.bombTimer = 0;
        this.bombCutin = { x: 0, y: 0, img: null };
        this.bombLaser = null;
        this.isTimeStopped = false; 
        
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

    triggerBomb() {
        // ★奥義の残弾数が1以上の時だけ発動
        if (this.player.id !== 'igari' || this.bombState !== 'READY' || this.player.bombs <= 0) return;
        
        this.player.bombs--; // 奥義を消費
        
        this.bombState = 'ANIM_IN';
        this.bombTimer = 0;
        this.isTimeStopped = true; 
        
        const canvas = document.getElementById('gameCanvas'), dpr = window.devicePixelRatio || 1;
        this.bombCutin.x = canvas.width / dpr; 
        
        // ★中心位置を下げる（画面下半分にカットインを置くため）
        this.bombCutin.y = (canvas.height / dpr) * 0.7; 
        this.bombCutin.img = (this.advManager && this.advManager.assets) ? this.advManager.assets['igaribomb.png'] : null;
        
        this.enemyBullets = [];
        this.explosions.push(new Explosion(this.player.x, this.player.y, this.player.size * 4, this.advManager));
    }
    
    updateEntrance() { const c = document.getElementById('gameCanvas'); this.player.update(c); return !this.player.isEntering; }

    updateGameplay() {
        const canvas = document.getElementById('gameCanvas'), dpr = window.devicePixelRatio || 1, sW = canvas.width/dpr, sH = canvas.height/dpr;

        if (this.isTimeStopped) {
            this.bombTimer++;
            
            if (this.bombState === 'ANIM_IN') {
                if (this.bombTimer < 30) {
                    // ★カットインが画面縦半分のサイズになるように計算し、中心位置を止める
                    const imgH = sH * 0.5;
                    const imgW = this.bombCutin.img ? imgH * (this.bombCutin.img.width / this.bombCutin.img.height) : 200;
                    const targetX = sW - (imgW * 0.5 + 20); 
                    
                    this.bombCutin.x -= (this.bombCutin.x - targetX) * 0.2; // 少しシュバッと入れる
                }
                else if (this.bombTimer >= 60 && this.bombTimer < 80) {
                    this.bombCutin.x -= 20; 
                }
                else if (this.bombTimer >= 80) {
                    if (!this.bombLaser) {
                        this.bombLaser = new BombLaser(sW, sH);
                        this.flashTimer = 10;
                        this.shakeTimer = 30;
                    }
                    this.bombLaser.update();
                    
                    if (this.bombLaser.state === 'BEAM') {
                        this.enemies.forEach(e => {
                            if (!e.isDying && e.type !== 'typeboss') {
                                e.alive = false;
                                this.explosions.push(new Explosion(e.x, e.y, e.size * 2, this.advManager));
                            } else if (e.type === 'typeboss') {
                                e.hp -= 20; 
                                if (e.hp <= 0 && !e.isDying) {
                                    e.isDying = true; e.deathTimer = 0; this.enemyBullets = [];
                                }
                            }
                        });
                        
                        this.flashTimer = 20;
                        this.shakeTimer = 60;
                        this.bombState = 'BEAM'; 
                    }
                }
            }
            else if (this.bombState === 'BEAM') {
                this.bombLaser.update();
                if (this.bombLaser.state === 'DONE') {
                    this.isTimeStopped = false; 
                    this.bombState = 'DONE';
                    this.bombLaser = null;
                }
            }
            
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

        this.enemies.forEach(e => {
            if (e.isDying) {
                e.deathTimer++;
                
                if (e.deathTimer === 1) this.flashTimer = 15;
                if (e.deathTimer === 30) this.flashTimer = 15;
                
                if (e.deathTimer === 60) {
                    this.flashTimer = 20;
                    this.shakeTimer = 120; 
                }
                
                if (e.deathTimer >= 60 && e.deathTimer < 180) {
                    if (this.frame % 4 === 0) {
                        const exX = e.x + (Math.random() - 0.5) * e.size * 2.5;
                        const exY = e.y + (Math.random() - 0.5) * e.size * 2.5;
                        this.explosions.push(new Explosion(exX, exY, (e.size * 2) * (Math.random() * 0.5 + 0.5), this.advManager));
                    }
                }
                
                if (e.deathTimer >= 180) {
                    e.alive = false;
                    this.isStageClear = true;
                    this.explosions.push(new Explosion(e.x, e.y, e.size * 4, this.advManager));
                }
                return; 
            }

            e.update(canvas, this.player);
            if (e.alive && !this.player.isEntering && this.config.shootEnemy) this.config.shootEnemy(e, this);

            this.player.bullets.forEach(b => {
                if (b.alive && e.alive && !e.isDying && Math.sqrt((b.x-e.x)**2 + (b.y-e.y)**2) < e.size + b.size) {
                    b.alive = false; e.hp--;
                    if (e.hp <= 0) {
                        if (e.type === 'typeboss') {
                            e.isDying = true; 
                            e.deathTimer = 0;
                            this.enemyBullets = []; 
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
        
        let shakeX = 0, shakeY = 0;
        if (this.shakeTimer > 0) {
            shakeX = (Math.random() - 0.5) * 15;
            shakeY = (Math.random() - 0.5) * 15;
            ctx.translate(shakeX, shakeY);
            if (!this.isTimeStopped) this.shakeTimer--;
        }

        if (this.config && this.config.drawBackground) {
            this.config.drawBackground(this, ctx, sW, sH);
        } else {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, sW, sH);
            // 3D背景がある場合は描画しない
        }

        this.player.bullets.forEach(b => b.draw(ctx)); 
        this.enemies.forEach(e => e.draw(ctx));
        this.explosions.forEach(ex => ex.draw(ctx)); 
        this.enemyBullets.forEach(eb => eb.draw(ctx)); 
        this.items.forEach(it => it.draw(ctx)); 
        
        this.player.draw(ctx, this.advManager); 
        
        if (this.bombState === 'ANIM_IN' && this.bombCutin.img && this.bombTimer < 80) {
            ctx.save();
            ctx.translate(-shakeX, -shakeY); 
            
            // ★カットイン画像を「縦画面の半分(sH * 0.5)」のサイズで描画
            const imgH = sH * 0.5;
            const imgW = imgH * (this.bombCutin.img.width / this.bombCutin.img.height);
            
            ctx.drawImage(this.bombCutin.img, 
                          this.bombCutin.x - imgW * 0.5, 
                          this.bombCutin.y - imgH * 0.5,
                          imgW, imgH);
            ctx.restore();
        }
        
        if (this.bombLaser) {
            this.bombLaser.draw(ctx); 
        }

        if (this.flashTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer / 20})`; 
            ctx.fillRect(-shakeX, -shakeY, sW + Math.abs(shakeX)*2, sH + Math.abs(shakeY)*2);
            if (!this.isTimeStopped) this.flashTimer--;
        }
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; ctx.fillRect(10, sH - 50, 290, 40); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, sH - 50, 290, 40);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('HP:', 20, sH - 25);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(55, sH - 37, 100, 15);
        ctx.fillStyle = '#33ff33'; ctx.fillRect(55, sH - 37, 100 * (this.player.hp / this.player.maxHp), 15);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(55, sH - 37, 100, 15);
        ctx.fillStyle = '#fff'; ctx.fillText(`POWER: ${this.player.powerLevel}/8`, 170, sH - 25);
    }
}
