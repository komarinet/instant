const VER_PLAYER_SHIINA = "0.2.5"; // 椎名護：ボム発動時に shiinabomb.png を用いたカットイン演出（時間停止・下から入って上に抜ける動き）を追加

window.PlayerControllers = window.PlayerControllers || {};

const ShiinaController = {
    draw: function(player, ctx, advManager) {
        player.globalTimer = (player.globalTimer || 0) + 1; 
        player._advManager = advManager; 
        player.ringAngle = (player.ringAngle || 0) + 0.05; 

        ctx.save();
        ctx.translate(player.x, player.y);

        const sansImg = (advManager && advManager.assets) ? advManager.assets['sans.png'] : null;
        if (sansImg && sansImg.naturalWidth > 0) {
            const sw = sansImg.width / 5;
            const sh = sansImg.height / 2;
            const radius = 45;

            for (let i = 0; i < 10; i++) {
                const ang = player.ringAngle + (i * Math.PI * 2 / 10);
                const col = i % 5;
                const row = Math.floor(i / 5);
                
                ctx.save();
                ctx.translate(Math.cos(ang) * radius, Math.sin(ang) * radius);
                ctx.globalAlpha = 0.8;
                ctx.drawImage(sansImg, col * sw, row * sh, sw, sh, -12, -12, 24, 24);
                ctx.restore();
            }
        }

        const jikiImg = (advManager && advManager.assets) ? advManager.assets['jikishi.png'] : null;
        if (jikiImg && jikiImg.naturalWidth > 0) {
            const animSpeed = 4; 
            const cycle = 18; 
            const t = Math.floor(player.globalTimer / animSpeed) % cycle;
            const frame = t < 10 ? t : cycle - t; 

            const col = frame % 5;
            const row = Math.floor(frame / 5);
            const sw = jikiImg.width / 5;
            const sh = jikiImg.height / 2;
            
            const drawWidth = 55;
            const drawHeight = drawWidth * (sh / sw);

            ctx.shadowColor = 'rgba(51, 204, 255, 0.8)';
            ctx.shadowBlur = 10;
            ctx.drawImage(jikiImg, col * sw, row * sh, sw, sh, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = player.color; ctx.beginPath();
            ctx.arc(0, 0, player.size, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    },

    shoot: function(player) {
        const pL = Math.min(8, player.powerLevel);
        const reloadUp = Math.floor((pL + 1) / 2); 
        const countUp = Math.floor(pL / 2);        

        const reloadLimit = Math.max(7, 20 - reloadUp * 3); 

        if (!player.lastShootFrame) player.lastShootFrame = 0;
        if (player.globalTimer - player.lastShootFrame < reloadLimit) {
            return; 
        }
        player.lastShootFrame = player.globalTimer;

        const baseSpeed = 5; 
        const baseAng = -Math.PI / 2; 
        const shotCount = 1 + countUp; 
        const isClose = player.isCloseToDanger; 

        for (let i = 0; i < shotCount; i++) {
            let offset = (shotCount === 1) ? 0 : (i - (shotCount - 1) / 2) * 0.3;
            let vx = Math.cos(baseAng + offset) * baseSpeed;
            let vy = Math.sin(baseAng + offset) * baseSpeed;
            
            let b = this.createShot(player.x, player.y - player.size, vx, vy, '#33ccff', player, isClose);
            player.bullets.push(b);
        }
    },
    
    createShot: function(x, y, vx, vy, color, player, isClose) {
        let b = new Bullet(x, y, vx, vy, color, null, 'shiina');
        
        b.power = isClose ? 2 : 1; 
        b.size = isClose ? 24 : 12; 
        b.charIndex = Math.floor(Math.random() * 10);
        b.advManager = player._advManager; 
        b.timer = 0;

        b.update = function(canvas, stg) {
            this.timer++;
            if (this.timer > 180) {
                this.alive = false;
                return;
            }

            let target = null;
            let minDist = 9999;
            
            if (!stg || !stg.enemies) {
                this.x += this.vx;
                this.y += this.vy;
                return;
            }

            stg.enemies.forEach(e => {
                if (e.alive && !e.isDying) {
                    let d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minDist) { minDist = d; target = e; }
                }
            });

            if (target && this.timer > 10) {
                let angToTarget = Math.atan2(target.y - this.y, target.x - this.x);
                let currentAng = Math.atan2(this.vy, this.vx);
                let diff = angToTarget - currentAng;
                
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                
                let turnSpeed = 0.06; 
                currentAng += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
                
                let speed = Math.hypot(this.vx, this.vy);
                if (speed < 12) speed += 0.2; 
                
                this.vx = Math.cos(currentAng) * speed;
                this.vy = Math.sin(currentAng) * speed;
            }

            this.x += this.vx;
            this.y += this.vy;
        };

        b.draw = function(ctx) {
            const sansImg = (this.advManager && this.advManager.assets) ? this.advManager.assets['sans.png'] : null;
            if (sansImg && sansImg.naturalWidth > 0) {
                const sw = sansImg.width / 5;
                const sh = sansImg.height / 2;
                const col = this.charIndex % 5;
                const row = Math.floor(this.charIndex / 5);
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI/2); 
                
                let ds = this.size; 
                
                if (this.timer > 150) {
                    ctx.globalAlpha = (Math.floor(this.timer / 4) % 2 === 0) ? 1.0 : 0.3;
                }
                
                ctx.shadowColor = this.color; ctx.shadowBlur = 10;
                ctx.drawImage(sansImg, col * sw, row * sh, sw, sh, -ds, -ds, ds*2, ds*2);
                ctx.restore();
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
            }
        };
        return b;
    },

    triggerBomb: function(player, stg) {
        // ★修正：カットイン中（CUTIN）もボムの重複発動をブロック
        if (player.bombs <= 0 || stg.bombState === 'BARRIER' || stg.bombState === 'CUTIN') return;
        player.bombs--; 
        
        // ★追加：シールドを展開する前に、まずはカットイン状態へ移行
        stg.bombState = 'CUTIN';
        stg.cutinTimer = 0; // カットイン演出用のタイマー
        
        stg.bombTimer = 0;
        stg.bombDuration = 600; 
        
        stg.bombData = { rings: [] };
        const ringRadii = [60, 100, 140]; 
        const charsPerRing = [6, 10, 14]; 
        const speeds = [0.05, -0.04, 0.03]; 
        
        for (let r = 0; r < 3; r++) {
            let chars = [];
            for (let i = 0; i < charsPerRing[r]; i++) {
                chars.push({
                    angleOffset: (i * Math.PI * 2) / charsPerRing[r],
                    hp: 1, 
                    charIndex: Math.floor(Math.random() * 10)
                });
            }
            stg.bombData.rings.push({
                radius: ringRadii[r],
                speed: speeds[r],
                baseAngle: 0,
                chars: chars
            });
        }
        if (typeof soundManager !== 'undefined') soundManager.playSE('smallb');
    },

    updateBomb: function(player, stg, sW, sH) {
        // ★追加：カットイン中の処理（ゲームの時を止め、70フレームで演出を終えてバリアへ移行）
        if (stg.bombState === 'CUTIN') {
            stg.cutinTimer++;
            stg.isTimeStopped = true; // ボム中はSTG側の時を止める
            
            if (stg.cutinTimer >= 70) {
                stg.bombState = 'BARRIER';
                stg.isTimeStopped = false; // カットイン終了で時を動かす
            }
            return;
        }

        if (stg.bombState !== 'BARRIER' || !stg.bombData) return;
        stg.bombTimer++;
        
        if (stg.bombTimer > stg.bombDuration) {
            stg.bombState = 'READY';
            stg.bombData = null;
            return;
        }

        let totalCharsActive = 0;
        
        stg.bombData.rings.forEach(ring => {
            ring.baseAngle += ring.speed;
            
            ring.chars.forEach(c => {
                if (c.hp <= 0) return; 
                totalCharsActive++;
                
                let cx = player.x + Math.cos(ring.baseAngle + c.angleOffset) * ring.radius;
                let cy = player.y + Math.sin(ring.baseAngle + c.angleOffset) * ring.radius;
                
                for (let i = stg.enemyBullets.length - 1; i >= 0; i--) {
                    let eb = stg.enemyBullets[i];
                    if (Math.hypot(eb.x - cx, eb.y - cy) < 25) { 
                        stg.enemyBullets.splice(i, 1); 
                        c.hp = 0; 
                        break; 
                    }
                }
                
                if (c.hp > 0) {
                    stg.enemies.forEach(e => {
                        if (e.alive && !e.isDying && Math.hypot(e.x - cx, e.y - cy) < e.size + 25) {
                            e.hp -= 30; 
                            
                            if (e.hp <= 0 && !e.isDying) { 
                                stg.player.score += e.isBoss ? 10000 : 100;
                                
                                if (e.isBoss) {
                                    e.isDying = true; e.deathTimer = 0; stg.enemyBullets = []; 
                                } else {
                                    e.alive = false; 
                                    stg.explosions.push(new Explosion(e.x, e.y, e.size * 2, stg.advManager));
                                    if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                                    
                                    if(Math.random()<0.1) stg.items.push(new Item('power', e.x, e.y)); 
                                    else if(Math.random()<0.15) stg.items.push(new Item('recover', e.x, e.y));
                                    else if(Math.random()<0.03) stg.items.push(new Item('bomb', e.x, e.y)); 
                                }
                            }
                            c.hp = 0; 
                        }
                    });
                }
            });
        });
        
        if (totalCharsActive === 0) {
            stg.bombState = 'READY';
            stg.bombData = null;
        }
    },

    drawBomb: function(player, stg, ctx, sW, sH, shakeX, shakeY) {
        // ★追加：カットイン演出の描画
        if (stg.bombState === 'CUTIN') {
            ctx.save();
            
            // 画面全体を少し暗くする
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, sW, sH);

            // 背景の黒帯
            const stripH = 150;
            const stripY = sH / 2 - stripH / 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, stripY, sW, stripH);
            ctx.strokeStyle = '#33ccff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, stripY, sW, stripH);

            const cutinImg = (stg.advManager && stg.advManager.assets) ? stg.advManager.assets['shiinabomb.png'] : null;
            if (cutinImg && cutinImg.naturalHeight > 0) {
                const imgH = stripH * 1.4; // 帯より少し大きめに設定
                const imgW = cutinImg.naturalWidth * (imgH / cutinImg.naturalHeight);

                const t = stg.cutinTimer;
                const targetY = sH / 2;
                let currentY = sH + imgH; 

                // イージングを用いたアニメーション（下から登場 → 少し停止 → 上へ退出）
                if (t < 15) {
                    const p = t / 15;
                    const ease = 1 - Math.pow(1 - p, 3); // 減速しながら入ってくる
                    currentY = (sH + imgH) - ((sH + imgH) - (targetY + 15)) * ease;
                } else if (t < 55) {
                    const p = (t - 15) / 40;
                    currentY = (targetY + 15) - 30 * p; // ゆっくりと上に微動
                } else {
                    const p = (t - 55) / 15;
                    const ease = p * p; // 加速しながら抜ける
                    currentY = (targetY - 15) - ((targetY - 15) - (-imgH)) * ease;
                }

                ctx.drawImage(cutinImg, sW / 2 - imgW / 2, currentY - imgH / 2, imgW, imgH);
            }
            ctx.restore();
        }

        // 既存のシールドバリアの描画
        if (stg.bombState === 'BARRIER' && stg.bombData) {
            const sansImg = (stg.advManager && stg.advManager.assets) ? stg.advManager.assets['sans.png'] : null;
            if (!sansImg) return;
            
            const sw = sansImg.width / 5;
            const sh = sansImg.height / 2;
            
            ctx.save();
            ctx.translate(-shakeX, -shakeY); 
            
            const timeLeft = stg.bombDuration - stg.bombTimer;
            let currentAlpha = 1.0;
            if (timeLeft < 90) {
                currentAlpha = (Math.floor(stg.bombTimer / 4) % 2 === 0) ? 0.8 : 0.2;
            }

            stg.bombData.rings.forEach(ring => {
                ring.chars.forEach(c => {
                    if (c.hp <= 0) return;
                    
                    let cx = player.x + Math.cos(ring.baseAngle + c.angleOffset) * ring.radius;
                    let cy = player.y + Math.sin(ring.baseAngle + c.angleOffset) * ring.radius;
                    
                    const col = c.charIndex % 5;
                    const row = Math.floor(c.charIndex / 5);
                    
                    ctx.save();
                    ctx.translate(cx, cy);
                    
                    ctx.globalAlpha = currentAlpha;
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 15;
                    
                    ctx.rotate(stg.bombTimer * 0.1); 
                    ctx.drawImage(sansImg, col * sw, row * sh, sw, sh, -16, -16, 32, 32);
                    ctx.restore();
                });
            });
            ctx.restore();
        }
    }
};

window.PlayerControllers['shiina'] = ShiinaController;
window.PlayerControllers['mamoru'] = ShiinaController;
