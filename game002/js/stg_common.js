const VER_STG_COMMON = "0.1.0"; // 新規作成（全キャラ共通の基盤パーツ群）

window.PlayerControllers = window.PlayerControllers || {};

// 全キャラ共通のプレイヤークラス（移動や被弾処理など共通のルールだけを持つ）
class Player {
    constructor(charData) {
        this.id = charData.id; this.name = charData.name; this.color = charData.color;
        this.x = 0; this.y = 0; this.size = 20; this.speed = 5; this.bullets = []; this.isEntering = true; 
        this.maxHp = 5; this.hp = this.maxHp; this.invincibleTimer = 0; this.powerLevel = 0; 
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
    
    // 描画、射撃、ボムは「キャラ別コントローラー」に丸投げする（委譲）
    draw(ctx, advManager) {
        if (this.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return; 
        
        if (window.PlayerControllers[this.id] && window.PlayerControllers[this.id].draw) {
            window.PlayerControllers[this.id].draw(this, ctx, advManager);
        } else {
            // 専用ファイルが無いキャラのデフォルト描画（三角形）
            ctx.fillStyle = this.color; ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size); ctx.lineTo(this.x - this.size, this.y + this.size); ctx.lineTo(this.x + this.size, this.y + this.size);
            ctx.closePath(); ctx.fill();
        }
    }
    
    shoot() {
        if (this.isEntering) return;
        if (window.PlayerControllers[this.id] && window.PlayerControllers[this.id].shoot) {
            window.PlayerControllers[this.id].shoot(this);
        } else {
            // 専用ファイルが無いキャラのデフォルト射撃
            const bS = 10;
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bS, this.color, null, this.id));
        }
    }

    triggerBomb(stgManager) {
        if (window.PlayerControllers[this.id] && window.PlayerControllers[this.id].triggerBomb) {
            window.PlayerControllers[this.id].triggerBomb(this, stgManager);
        }
    }
    updateBomb(stgManager, sW, sH) {
        if (window.PlayerControllers[this.id] && window.PlayerControllers[this.id].updateBomb) {
            window.PlayerControllers[this.id].updateBomb(this, stgManager, sW, sH);
        }
    }
    drawBomb(stgManager, ctx, sW, sH, shakeX, shakeY) {
        if (window.PlayerControllers[this.id] && window.PlayerControllers[this.id].drawBomb) {
            window.PlayerControllers[this.id].drawBomb(this, stgManager, ctx, sW, sH, shakeX, shakeY);
        }
    }
}

// ==========================================
// 共通オブジェクト（弾・アイテム・爆発）
// ==========================================
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
        } else {
            // 専用弾の描画はキャラ専用ファイルで行うため、ここは敵弾などのデフォルト丸弾
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
        this.x = x; this.y = y; this.targetSize = targetSize * 1.5; 
        this.img = (advManager && advManager.assets) ? advManager.assets['baku01.png'] : null;
        this.isDead = false; this.cols = 3; this.rows = 3; this.frameIndex = 0; this.totalFrames = 9; 
        this.timer = 0; this.interval = 3; 
        if (this.img && this.img.naturalWidth > 0) {
            this.sw = this.img.width / this.cols; this.sh = this.img.height / this.rows;
        } else { this.isDead = true; }
    }
    update() {
        if (this.isDead) return;
        this.timer++;
        if (this.timer >= this.interval) {
            this.timer = 0; this.frameIndex++;
            if (this.frameIndex >= this.totalFrames) this.isDead = true; 
        }
    }
    draw(ctx) {
        if (this.isDead || !this.img) return;
        const fx = this.frameIndex % this.cols, fy = Math.floor(this.frameIndex / this.cols);
        ctx.drawImage(this.img, fx * this.sw, fy * this.sh, this.sw, this.sh, this.x - this.targetSize / 2, this.y - this.targetSize / 2, this.targetSize, this.targetSize);
    }
}
