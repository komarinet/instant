const VER_STG_SHIINA = "0.4.13"; // バージョン更新（敵の移動速度・出現数アップ、ボス体力倍増、背景シームレス化）
 
window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['shiina'] = {
    init: function(stg, canvas) {
        stg.bossSpawned = false; stg.bgScrollY = 0; stg.clouds = [];
       
        stg.bgmChanged = true;
       
        const dpr = window.devicePixelRatio || 1;
        for (let i=0; i<20; i++) {
            stg.clouds.push({ x: Math.random()*(canvas.width/dpr), y: Math.random()*(canvas.height/dpr), size: Math.random()*80+40, speed: Math.random()*3+2, opacity: Math.random()*0.15+0.05 });
        }
    },
    updateBackground: function(stg, sW, sH) {
        stg.bgScrollY += 1.95;
       
        if (stg.bgScrollY >= sH * 2) {
            stg.bgScrollY -= sH * 2;
        }
       
        stg.clouds.forEach(c => { c.y += c.speed * 1.3; if(c.y > sH + c.size) { c.y = -c.size; c.x = Math.random() * sW; } });
    },
    drawBackground: function(stg, ctx, sW, sH) {
        const bgImg = stg.advManager?.assets['mountain.webp'];
        if (bgImg && bgImg.naturalWidth > 0) {
            const y = stg.bgScrollY;
 
            // 1枚目（通常）
            ctx.drawImage(bgImg, 0, y, sW, sH);
 
            // 2枚目（上下反転・鏡像）
            ctx.save();
            ctx.translate(0, (y - sH) + sH / 2);
            ctx.scale(1, -1);
            ctx.drawImage(bgImg, 0, -sH / 2, sW, sH);
            ctx.restore();
 
            // 3枚目（通常）
            ctx.drawImage(bgImg, 0, y - sH * 2, sW, sH);
        } else {
            ctx.fillStyle = '#112233'; ctx.fillRect(0, 0, sW, sH);
        }
        stg.clouds.forEach(c => { ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`; ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI*2); ctx.fill(); });
    },
    getEnemyData: function(type) {
        const initShiki = (e, colIndex) => {
            e.draw = function(ctx) {
                const img = (this.advManager && this.advManager.assets) ? this.advManager.assets['shiki.webp'] : null;
                ctx.save(); ctx.translate(this.x, this.y);
               
                if (this.angle) ctx.rotate(this.angle);
               
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
 
        if (type === 'shiki_a') return { imgSrc: 'shiki.webp', size: 25, hp: 1, init: (e) => { initShiki(e, 0); } };
        if (type === 'shiki_b') return { imgSrc: 'shiki.webp', size: 30, hp: 8, init: (e) => { initShiki(e, 1); } };
        if (type === 'shiki_c') return { imgSrc: 'shiki.webp', size: 35, hp: 3, init: (e) => { initShiki(e, 2); } };
        if (type === 'shiki_d') return { imgSrc: 'shiki.webp', size: 40, hp: 16, init: (e) => { initShiki(e, 3); } };
 
        // ★修正：ボス体力を2倍 (800) に強化
        if (type === 'shiinaboss') return {
            imgSrc: 'shiinaboss.webp', size: 80, hp: 800, maxHp: 800,
            init: (e) => {
                e.animTimer = 0;
                e.isInvincible = true;
                e.ringAngle = 0;
                e.draw = function(ctx) {
                    const img = (this.advManager && this.advManager.assets) ? this.advManager.assets['shiinaboss.webp'] : null;
                    ctx.save(); ctx.translate(this.x, this.y);
 
                    if (this.isDying && this.deathTimer >= 60) {
                        ctx.globalAlpha = Math.max(0, 1.0 - (this.deathTimer - 60) / 120);
                    }
 
                    if (this.isInvincible) {
                        const sansImg = (this.advManager && this.advManager.assets) ? this.advManager.assets['sans.webp'] : null;
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
 
                    if (!this.isInvincible && this.hp > 0 && !this.isDying) {
                        const bW = this.size * 1.5, bH = 10;
                        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bW/2, this.size+10, bW, bH);
                        ctx.fillStyle = '#ff3366'; ctx.fillRect(-bW/2, this.size+10, bW*(Math.max(0, this.hp)/this.maxHp), bH);
                        ctx.strokeStyle = '#fff'; ctx.strokeRect(-bW/2, this.size+10, bW, bH);
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
            const img = (stg.advManager && stg.advManager.assets) ? stg.advManager.assets['sans.webp'] : null;
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
        const isHard = stg.player.powerLevel >= 4;
        const spawn = (type, x, y) => {
            let e = new Enemy(type, x, y, stg.player.charData, stg.advManager, stg.stgId);
            if (isHard) {
                e.hp = Math.ceil(e.hp * 1.3);
                e.maxHp = Math.ceil(e.maxHp * 1.3);
            }
            stg.enemies.push(e);
            return e;
        };
 
        if (timer === 10 && !stg.bossSpawned) {
            spawn('shiinaboss', sW/2, 90);
            stg.bossSpawned = true;
        }
 
        let boss = stg.enemies.find(e => e.type === 'shiinaboss');
 
        // ★修正：敵の頻度を上げ、編隊の機数を増やしました
        if (timer > 100 && timer < 1000) {
            let freq = isHard ? 60 : 90;
            if (timer % freq === 0) {
                let isLeft = Math.random() > 0.5;
                let startX = isLeft ? -50 : sW + 50;
                let startY = -50;
                let targetX = sW / 2;
                let targetY = sH / 2;
                let angle = Math.atan2(targetY - startY, targetX - startX);
               
                let count = isHard ? 5 : 4; // 編隊増量
                for (let i = 0; i < count; i++) {
                    let offsetX = 0; let offsetY = 0;
                    if (i === 1) {
                        offsetX = Math.cos(angle - Math.PI * 0.75) * 35;
                        offsetY = Math.sin(angle - Math.PI * 0.75) * 35;
                    } else if (i === 2) {
                        offsetX = Math.cos(angle + Math.PI * 0.75) * 35;
                        offsetY = Math.sin(angle + Math.PI * 0.75) * 35;
                    } else if (i === 3) {
                        offsetX = Math.cos(angle) * 70;
                        offsetY = Math.sin(angle) * 70;
                    } else if (i === 4) {
                        offsetX = Math.cos(angle - Math.PI * 0.75) * 70;
                        offsetY = Math.sin(angle - Math.PI * 0.75) * 70;
                    }
                    let enemy = spawn('shiki_a', startX + offsetX, startY + offsetY);
                    enemy.angleToCenter = angle;
                }
            }
        }
        else if (timer >= 1000 && timer < 2000) {
            let freq = isHard ? 45 : 60; // 頻度アップ
            if (timer % freq === 0) {
                spawn('shiki_b', Math.random() * sW, -30);
            }
        }
        else if (timer >= 2000 && timer < 3000) {
            let freq = isHard ? 80 : 110; // 頻度アップ
            if (timer % freq === 0) {
                let startX = Math.random() * (sW - 100) + 50;
                let count = isHard ? 11 : 8; // 機数アップ
                for(let i = 0; i < count; i++) {
                    spawn('shiki_c', startX, -40 - (i * 45));
                }
            }
        }
        else if (timer >= 3000 && timer < 4200) {
            let freq = isHard ? 60 : 85; // 頻度アップ
            if (timer % freq === 0) {
                spawn('shiki_d', Math.random() * sW, -50);
            }
        }
        else if (timer === 4200) {
            let midAdvData = [];
            try {
                const charId = (stg.player && stg.player.id) ? stg.player.id : 'igari';
                let charScenario = null;
                if (typeof window.scenarios !== 'undefined') {
                    charScenario = window.scenarios[charId];
                }
                if (!charScenario && typeof scenarios !== 'undefined') {
                    charScenario = scenarios[charId];
                }
 
                if (charScenario) {
                    for (let stageKey in charScenario) {
                        if (charScenario[stageKey] && charScenario[stageKey].stgId === stg.stgId && charScenario[stageKey].event_adv) {
                            midAdvData = charScenario[stageKey].event_adv;
                            break;
                        }
                    }
                }
            } catch(e) { console.warn("ADV取得エラー", e); }
 
            const onAdvEnd = () => {
                let currentBoss = stg.enemies.find(e => e.type === 'shiinaboss');
                if (currentBoss) currentBoss.isInvincible = false;
               
                if (typeof window.soundManager !== 'undefined') {
                    window.soundManager.playBGM('boss_shiina');
                }
            };
 
            if (midAdvData && midAdvData.length > 0 && typeof window.startMidStgADV !== 'undefined') {
                window.startMidStgADV(midAdvData, onAdvEnd);
            } else {
                onAdvEnd();
            }
        }
        else if (timer > 4300) {
            let freq = isHard ? 70 : 100; // ボス戦中の湧きも頻度アップ
            if (timer % freq === 0) {
                const rand = Math.random();
                if (rand < 0.25) {
                    let isLeft = Math.random() > 0.5;
                    let startX = isLeft ? -50 : sW + 50;
                    let startY = -50;
                    let angle = Math.atan2((sH / 2) - startY, (sW / 2) - startX);
                    let count = isHard ? 5 : 4;
                    for (let i = 0; i < count; i++) {
                        let offsetX = 0; let offsetY = 0;
                        if (i === 1) { offsetX = Math.cos(angle - Math.PI * 0.75) * 35; offsetY = Math.sin(angle - Math.PI * 0.75) * 35; }
                        else if (i === 2) { offsetX = Math.cos(angle + Math.PI * 0.75) * 35; offsetY = Math.sin(angle + Math.PI * 0.75) * 35; }
                        else if (i === 3) { offsetX = Math.cos(angle) * 70; offsetY = Math.sin(angle) * 70; }
                        else if (i === 4) { offsetX = Math.cos(angle - Math.PI * 0.75) * 70; offsetY = Math.sin(angle - Math.PI * 0.75) * 70; }
                        let enemy = spawn('shiki_a', startX + offsetX, startY + offsetY);
                        enemy.angleToCenter = angle;
                    }
                } else if (rand < 0.5) {
                    spawn('shiki_b', Math.random() * sW, -30);
                } else if (rand < 0.75) {
                    let startX = Math.random() * (sW - 100) + 50;
                    let count = isHard ? 11 : 8;
                    for(let i = 0; i < count; i++) spawn('shiki_c', startX, -40 - (i * 45));
                } else {
                    spawn('shiki_d', Math.random() * sW, -50);
                }
            }
        }
 
        if (boss && boss.isInvincible) boss.hp = boss.maxHp;
    },
 
    updateEnemy: function(e, canvas, player) {
        e.moveTimer = (e.moveTimer || 0) + 1;
 
        if (e.type === 'shiinaboss') {
            e.y = 90;
        }
        else if (e.type === 'shiki_a') {
            // ★修正：速度を 0.8 から 1.5 にアップ
            e.x += Math.cos(e.angleToCenter) * 1.5;
            e.y += Math.sin(e.angleToCenter) * 1.5;
            e.angle = e.angleToCenter - Math.PI / 2;
        }
        else if (e.type === 'shiki_b') {
            e.x += Math.sin(e.moveTimer * 0.1) * 3;
            e.y += 1.5 + Math.cos(e.moveTimer * 0.15) * 1.5;
        }
        else if (e.type === 'shiki_c') {
            e.y += 4;
        }
        else if (e.type === 'shiki_d') {
            e.angle = (e.angle || 0) + 0.1;
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
        }
        else if (e.type === 'shiki_a') {
            if (stg.frame % 80 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#ff5500'));
            }
        }
        else if (e.type === 'shiki_b') {
            if (stg.frame % 60 === 0) {
                const rAng = Math.random() * Math.PI * 2;
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(rAng)*2, Math.sin(rAng)*2, '#ff33cc'));
            }
        }
        else if (e.type === 'shiki_c') {
            if (stg.frame % 100 === 0 && e.y > 0) {
                stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 4.5, '#ff0055'));
            }
        }
        else if (e.type === 'shiki_d') {
            if (stg.frame % 90 === 0) {
                for (let i = 0; i < 4; i++) {
                    const ang = (e.angle || 0) + (i * Math.PI / 2);
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*2.5, Math.sin(ang)*2.5, '#ff0000'));
                }
            }
        }
    }
};
