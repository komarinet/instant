const VER_PLAYER_IGARI = "0.2.3"; // バージョン更新（ボムの多重ヒットバグ修正、ボス名対応）

window.PlayerControllers = window.PlayerControllers || {};

class BombLaserIgari {
    constructor(canvasWidth, canvasHeight) {
        this.sW = canvasWidth; this.sH = canvasHeight;
        this.alive = true; this.state = 'WINDUP'; this.timer = 0;
        this.windupHeight = 0; this.windupDuration = 20; 
        this.beamDuration = 60; this.beamAlpha = 1.0;
        this.hasHit = false; // ★追加：1回のボムで1回だけダメージ処理させるフラグ
    }
    update() {
        this.timer++;
        if (this.state === 'WINDUP') {
            const progress = this.timer / this.windupDuration;
            this.windupHeight = this.sH * (progress * progress); 
            if (this.timer >= this.windupDuration) { this.state = 'BEAM'; this.timer = 0; }
        } else if (this.state === 'BEAM') {
            this.beamAlpha = Math.max(0, 1.0 - (this.timer / this.beamDuration));
            if (this.timer >= this.beamDuration) { this.state = 'DONE'; this.alive = false; }
        }
    }
    draw(ctx) {
        ctx.save();
        if (this.state === 'WINDUP' && this.windupHeight > 0) {
            const targetY = Math.max(0, this.sH - this.windupHeight);
            if (targetY < this.sH) {
                const gradient = ctx.createLinearGradient(0, this.sH, 0, targetY);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0)'); gradient.addColorStop(0.5, 'rgba(200, 0, 255, 0.8)'); gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
                ctx.fillStyle = gradient; ctx.fillRect(0, targetY, this.sW, this.windupHeight);
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.shadowColor = 'magenta'; ctx.shadowBlur = 20;
                ctx.beginPath(); ctx.moveTo(0, targetY); ctx.lineTo(this.sW, targetY); ctx.stroke();
            }
        } else if (this.state === 'BEAM') {
            ctx.globalAlpha = this.beamAlpha;
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, this.sW, this.sH);
            ctx.fillStyle = 'rgba(150, 0, 255, 0.7)'; ctx.shadowColor = 'magenta'; ctx.shadowBlur = 50; ctx.fillRect(0, 0, this.sW, this.sH);
        }
        ctx.restore();
    }
}

window.PlayerControllers['igari'] = {
    draw: function(player, ctx, advManager) {
        let img = (advManager && advManager.assets) ? advManager.assets['igari_jiki.png'] : null;
        if (img && img.naturalHeight > 0) {
            const drawWidth = 60;
            const drawHeight = drawWidth * (img.naturalHeight / img.naturalWidth);
            ctx.drawImage(img, player.x - drawWidth / 2, player.y - drawHeight / 2, drawWidth, drawHeight);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath(); ctx.arc(player.x, player.y, 4, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = player.color; ctx.beginPath();
            ctx.moveTo(player.x, player.y - player.size); ctx.lineTo(player.x - player.size, player.y + player.size); ctx.lineTo(player.x + player.size, player.y + player.size);
            ctx.closePath(); ctx.fill();
        }
    },

    shoot: function(player) {
        const bS = 10;
        const pL = player.powerLevel;
        if (pL === 0) { player.bullets.push(this.createLaser(player.x, player.y - player.size, 0, -bS, player.color)); }
        else if (pL === 1) { player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, 0, -bS, player.color)); player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 0, -bS, player.color)); }
        else if (pL === 2) {
            player.bullets.push(this.createLaser(player.x, player.y - player.size, 0, -bS, player.color));
            player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, -1, -bS, player.color));
            player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 1, -bS, player.color));
        }
        else if (pL === 3) {
            player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, -0.5, -bS, player.color)); player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 0.5, -bS, player.color));
            player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, -1.5, -bS, player.color)); player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 1.5, -bS, player.color));
        }
        else if (pL === 4) {
            player.bullets.push(this.createLaser(player.x, player.y - player.size, 0, -bS, player.color));
            player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, -1, -bS, player.color)); player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 1, -bS, player.color));
            player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, -2, -bS, player.color)); player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 2, -bS, player.color));
        }
        else if (pL === 5) {
            player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, -0.5, -bS, player.color)); player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 0.5, -bS, player.color));
            player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, -1.5, -bS, player.color)); player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 1.5, -bS, player.color));
            player.bullets.push(this.createLaser(player.x - 5, player.y - player.size, -2.5, -bS, player.color)); player.bullets.push(this.createLaser(player.x + 5, player.y - player.size, 2.5, -bS, player.color));
        }
        else if (pL === 6) { for (let i = -3; i <= 3; i++) player.bullets.push(this.createLaser(player.x, player.y - player.size, i * 1.0, -bS, player.color)); }
        else if (pL === 7) { for (let i = -3; i <= 4; i++) player.bullets.push(this.createLaser(player.x - 2.5, player.y - player.size, (i - 0.5) * 1.0, -bS, player.color)); }
        else if (pL >= 8) { for (let i = -4; i <= 4; i++) player.bullets.push(this.createLaser(player.x, player.y - player.size, i * 1.0, -bS, player.color)); }
    },
    
    createLaser: function(x, y, vx, vy, color) {
        let b = new Bullet(x, y, vx, vy, color, null, 'igari');
        b.draw = function(ctx) {
            ctx.save(); ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.vy, this.vx));
            const length = this.size * 2.5; 
            ctx.shadowColor = this.color; ctx.shadowBlur = this.size * 2.5; 
            ctx.strokeStyle = this.color; ctx.lineWidth = this.size; ctx.lineCap = 'round'; 
            ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length, 0); ctx.stroke();
            ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = this.size * 0.4;
            ctx.beginPath(); ctx.moveTo(-length * 0.8, 0); ctx.lineTo(length * 0.8, 0); ctx.stroke();
            ctx.restore();
        };
        return b;
    },

    triggerBomb: function(player, stg) {
        if (player.bombs <= 0 || stg.bombState !== 'READY') return;
        player.bombs--; 
        stg.bombState = 'ANIM_IN';
        stg.bombTimer = 0;
        stg.isTimeStopped = true; 
        
        stg.bombData = {
            img: (stg.advManager && stg.advManager.assets) ? stg.advManager.assets['igaribomb.png'] : null,
            laser: null
        };
        stg.enemyBullets = [];
        stg.explosions.push(new Explosion(player.x, player.y, player.size * 4, stg.advManager));
    },

    updateBomb: function(player, stg, sW, sH) {
        stg.bombTimer++;
        let bd = stg.bombData;
        
        if (stg.bombState === 'ANIM_IN') {
            if (stg.bombTimer >= 70) {
                if (!bd.laser) {
                    bd.laser = new BombLaserIgari(sW, sH);
                    stg.flashTimer = 10; stg.shakeTimer = 30;
                }
                bd.laser.update();
                
                // ★修正：BEAM状態になった「最初の一瞬」だけダメージ処理とアイテムドロップを行う
                if (bd.laser.state === 'BEAM' && !bd.laser.hasHit) {
                    bd.laser.hasHit = true; // 2回目以降はスキップ
                    
                    stg.enemies.forEach(e => {
                        // ★修正：ボス名が「typeboss」以外（shiinaboss等）でも正しく判定するように変更
                        if (!e.isDying && !e.type.includes('boss')) {
                            e.alive = false; 
                            stg.explosions.push(new Explosion(e.x, e.y, e.size * 2, stg.advManager));
                            if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                            
                            // アイテムドロップ（1体の敵から適正にドロップさせる）
                            if (Math.random() < 0.2) stg.items.push(new Item('power', e.x, e.y)); 
                            else if (Math.random() < 0.3) stg.items.push(new Item('recover', e.x, e.y));
                            
                        } else if (e.type.includes('boss')) {
                            e.hp -= 20; 
                            if (e.hp <= 0 && !e.isDying) { e.isDying = true; e.deathTimer = 0; stg.enemyBullets = []; }
                        }
                    });
                    stg.flashTimer = 20; stg.shakeTimer = 60; stg.bombState = 'BEAM'; 
                }
            }
        }
        else if (stg.bombState === 'BEAM') {
            bd.laser.update();
            if (bd.laser.state === 'DONE') {
                stg.isTimeStopped = false; 
                stg.bombState = 'READY'; 
                stg.bombData = null;
            }
        }
    },

    drawBomb: function(player, stg, ctx, sW, sH, shakeX, shakeY) {
        let bd = stg.bombData;
        if (!bd) return;

        if (stg.bombState === 'ANIM_IN' && stg.bombTimer < 70) {
            ctx.save(); 
            ctx.translate(-shakeX, -shakeY); 
            
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.6, stg.bombTimer / 15)})`;
            ctx.fillRect(0, 0, sW, sH);

            const stripH = sH * 0.35; 
            const stripY = (sH - stripH) / 2; 
            
            ctx.fillStyle = 'rgba(200, 0, 100, 0.4)';
            ctx.fillRect(0, stripY, sW, stripH);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, stripY, sW, stripH);

            if (bd.img && bd.img.naturalHeight > 0) {
                const img = bd.img;
                const imgH = stripH * 1.3; 
                const imgW = img.naturalWidth * (imgH / img.naturalHeight);

                let currentX = sW + imgW; 
                const t = stg.bombTimer;
                const targetX = sW / 2; 

                if (t < 15) {
                    const p = t / 15;
                    const ease = 1 - Math.pow(1 - p, 3); 
                    currentX = (sW + imgW) - ((sW + imgW) - (targetX + 40)) * ease;
                } else if (t < 55) {
                    const p = (t - 15) / 40;
                    currentX = (targetX + 40) - 80 * p; 
                } else {
                    const p = (t - 55) / 15;
                    const ease = p * p; 
                    currentX = (targetX - 40) - ((targetX - 40) - (-imgW)) * ease;
                }

                ctx.drawImage(img, currentX - imgW / 2, sH / 2 - imgH / 2, imgW, imgH);
            } else if (stg.bombTimer > 15) {
                ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('NIL-ELEC-MAGNETIC', sW/2, sH/2 - 10);
                ctx.fillText('ACCELERATOR', sW/2, sH/2 + 20);
            }
            ctx.restore();
        }
        
        if (bd.laser) bd.laser.draw(ctx); 
    }
};
