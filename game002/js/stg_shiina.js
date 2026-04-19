const VER_STG_SHIINA = "0.3.0"; // バージョン更新（式神のサイズアップ、ボスフラグ統一）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['shiina'] = {
    init: function(stg, canvas) { 
        stg.bossSpawned = false; stg.bgScrollY = 0; stg.clouds = [];
        const dpr = window.devicePixelRatio || 1;
        for (let i=0; i<20; i++) {
            stg.clouds.push({ x: Math.random()*(canvas.width/dpr), y: Math.random()*(canvas.height/dpr), size: Math.random()*80+40, speed: Math.random()*3+2, opacity: Math.random()*0.15+0.05 });
        }
    },
    updateBackground: function(stg, sW, sH) {
        stg.bgScrollY += 1.5; if (stg.bgScrollY >= sH) stg.bgScrollY = 0;
        stg.clouds.forEach(c => { c.y += c.speed; if(c.y > sH + c.size) { c.y = -c.size; c.x = Math.random() * sW; } });
    },
    drawBackground: function(stg, ctx, sW, sH) {
        const bgImg = stg.advManager?.assets['mountain.png'];
        if (bgImg && bgImg.naturalWidth > 0) {
            ctx.drawImage(bgImg, 0, stg.bgScrollY, sW, sH); ctx.drawImage(bgImg, 0, stg.bgScrollY - sH, sW, sH);
        } else { ctx.fillStyle = '#112233'; ctx.fillRect(0, 0, sW, sH); }
        stg.clouds.forEach(c => { ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`; ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI*2); ctx.fill(); });
    },
    getEnemyData: function(type) {
        const initShiki = (e, colIndex) => {
            e.draw = function(ctx) {
                const img = (this.advManager && this.advManager.assets) ? this.advManager.assets['shiki.png'] : null;
                ctx.save(); ctx.translate(this.x, this.y);
                if (this.config && this.config.transformEnemy) this.config.transformEnemy(this, ctx); 

                if (img && img.naturalWidth > 0) {
                    const sw = img.width / 4; const sh = img.height / 1;
                    const drawW = this.size * 2; const drawH = drawW * (sh / sw);
                    
                    if (this.isDying && this.deathTimer >= 60) {
                        ctx.globalAlpha = Math.max(0, 1.0 - (this.deathTimer - 60) / 120); 
                    }
                    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
                    ctx.drawImage(img, colIndex * sw, 0, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                } else {
                    ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            };
        };

        // ★修正：サイズを全体的にアップ（A:25, B:30, C:35, D:40）
        if (type === 'shiki_a') return { imgSrc: 'shiki.png', size: 25, hp: 4, init: (e) => { initShiki(e, 0); } };
        if (type === 'shiki_b') return { imgSrc: 'shiki.png', size: 30, hp: 8, init: (e) => { initShiki(e, 1); } };
        if (type === 'shiki_c') return { imgSrc: 'shiki.png', size: 35, hp: 12, init: (e) => { initShiki(e, 2); } };
        if (type === 'shiki_d') return { imgSrc: 'shiki.png', size: 40, hp: 16, init: (e) => { initShiki(e, 3); } };

        if (type === 'shiinaboss') return {
            imgSrc: 'shiinaboss.png', size: 80, hp: 400, maxHp: 400,
            init: (e) => {
                e.animTimer = 0;
                e.isInvincible = true; 
                e.ringAngle = 0;
                e.draw = function(ctx) {
                    const img = (this.advManager && this.advManager.assets) ? this.advManager.assets['shiinaboss.png'] : null;
                    ctx.save(); ctx.translate(this.x, this.y);

                    // 1. バリアリング(sans.png)
                    if (this.isInvincible) {
                        const sansImg = (this.advManager && this.advManager.assets) ? this.advManager.assets['sans.png'] : null;
                        if (sansImg && sansImg.naturalWidth > 0) {
                            this.ringAngle += 0.02;
                            const sw = sansImg.width / 5; const sh = sansImg.height / 2;
                            const radius = this.size * 1.5;
                            for(let i=0; i<10; i++) {
                                const ang = this.ringAngle + (i * Math.PI * 2 / 10);
                                const col = i % 5; const row = Math.floor(i / 5);
                                ctx.save();
                                ctx.translate(Math.cos(ang) * radius, Math.sin(ang) * radius);
                                ctx.drawImage(sansImg, col * sw, row * sh, sw, sh, -15, -15, 30, 30);
                                ctx.restore();
                            }
                        }
                    }

                    // 2. ボス本体
                    if (img && img.naturalWidth > 0) {
                        this.animTimer++;
                        const speed = 5; 
                        const t = Math.floor(this.animTimer / speed) % 30; 
                        const frame = t < 16 ? t : 30 - t; 
                        
                        const col = frame % 4; const row = Math.floor(frame / 4);
                        const sw = img.width / 4; const sh = img.height / 4;
                        const drawW = this.size * 2; const drawH = drawW * (sh / sw);

                        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
                        ctx.drawImage(img, col * sw, row * sh, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                    } else {
                        ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
                    }

                    // 3. HPバー
                    if (!this.isInvincible && this.hp > 0 && !this.isDying) {
                        const bW = this.size * 1.5, bH = 10;
                        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bW/2, -this.size-20, bW, bH);
                        ctx.fillStyle = '#ff3366'; ctx.fillRect(-bW/2, -this.size-20, bW*(this.hp/this.maxHp), bH);
                        ctx.strokeStyle = '#fff'; ctx.strokeRect(-bW/2, -this.size-20, bW, bH);
                    }
                    ctx.restore();
                };
            }
        };
    },
    
    createSansBullet: function(stg, x, y, vx, vy) {
        let b = new Bullet(x, y, vx, vy, '#fff');
        b.charIndex = Math.floor(Math.random() * 10); 
        b.size = 12; 
        b.draw = function(ctx) {
            const img = (stg.advManager && stg.advManager.assets) ? stg.advManager.assets['sans.png'] : null;
            if (img && img.naturalWidth > 0) {
                const col = this.charIndex % 5; const row = Math.floor(this.charIndex / 5);
                const sw = img.width / 5; const sh = img.height / 2;
                ctx.drawImage(img, col * sw, row * sh, sw, sh, this.x - 15, this.y - 15, 30, 30);
            } else {
                ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            }
        };
        stg.enemyBullets.push(b);
    },

    updateWaves: function(stg, timer, sW, sH) {
        if (timer === 10 && !stg.bossSpawned) {
            stg.enemies.push(new Enemy('shiinaboss', sW/2, 150, stg.player.charData, stg.advManager, stg.stgId));
            stg.bossSpawned = true;
        }

        if (timer > 100 && timer < 1000) { 
            if (timer % 80 === 0) stg.enemies.push(new Enemy('shiki_a', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        } 
        else if (timer >= 1000 && timer < 2000) { 
            if (timer % 90 === 0) stg.enemies.push(new Enemy('shiki_b', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 150 === 0) stg.enemies.push(new Enemy('shiki_a', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        } 
        else if (timer >= 2000 && timer < 3000) { 
            if (timer % 100 === 0) stg.enemies.push(new Enemy('shiki_c', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        } 
        else if (timer >= 3000 && timer < 4200) { 
            if (timer % 120 === 0) stg.enemies.push(new Enemy('shiki_d', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        } 
        else if (timer === 4200) {
            if (typeof window.startMidStgADV !== 'undefined') {
                window.startMidStgADV([
                    { character: 'urashiina.png', spriteIndex: 2, speaker: '椎名', text: 'まさかここまで抵抗するとはな', isRight: false },
                    { character: 'urashiina.png', spriteIndex: 0, speaker: '椎名', text: '俺も本気で対応しよう', isRight: false }
                ], () => {
                    let boss = stg.enemies.find(e => e.type === 'shiinaboss');
                    if (boss) boss.isInvincible = false;
                });
            } else {
                let boss = stg.enemies.find(e => e.type === 'shiinaboss');
                if (boss) boss.isInvincible = false;
            }
        } 
        else if (timer > 4300) { 
            if (timer % 150 === 0) {
                const types = ['shiki_a', 'shiki_b', 'shiki_c', 'shiki_d'];
                const rType = types[Math.floor(Math.random() * types.length)];
                stg.enemies.push(new Enemy(rType, Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
        }

        let boss = stg.enemies.find(e => e.type === 'shiinaboss');
        if (boss && boss.isInvincible) boss.hp = boss.maxHp;
    },

    updateEnemy: function(e, canvas, player) {
        if (e.type === 'shiinaboss') {
            e.y = 150; 
        } else if (e.type.startsWith('shiki_')) {
            e.y += 2.5;
        }
    },

    shootEnemy: function(e, stg) {
        if (e.type === 'shiinaboss') {
            if (!e.isInvincible) {
                if (stg.frame % 20 === 0) {
                    const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                    this.createSansBullet(stg, e.x, e.y, Math.cos(ang)*4, Math.sin(ang)*4);
                    for(let i=0; i<2; i++) {
                        const rAng = Math.random() * Math.PI * 2;
                        this.createSansBullet(stg, e.x, e.y, Math.cos(rAng)*3, Math.sin(rAng)*3);
                    }
                }
            }
        } else if (e.type.startsWith('shiki_')) {
            if (stg.frame % 150 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#00ffff'));
            }
        }
    }
};
