const VER_STG_ZONBI = "0.2.2"; // ボス全回復時に15秒待たずに即ADVへ移行、顔のウネウネ移動強化

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['zonbi'] = {
    init: function(stg, canvas) {
        stg.bossSpawned = false;
        stg.totalBossMaxHp = 1000; 
        stg.totalBossHp = stg.totalBossMaxHp;
        stg.lastActiveHeadsCount = 8; 

        stg.zonbiPhase = 1; 
        stg.advTriggeredPhase2 = false;

        stg.allyIgari = {
            active: false,
            x: canvas.width / (window.devicePixelRatio || 1) / 2,
            y: canvas.height / (window.devicePixelRatio || 1) * 0.85,
            moveTimer: 0
        };
        stg.allyBullets = []; 

        if (window._bgManagerInstance) {
            window._bgManagerInstance.buildings.forEach(b => b.visible = false);
            window._bgManagerInstance.clouds.forEach(c => c.visible = false);
            if (window._bgManagerInstance.ground) window._bgManagerInstance.ground.visible = false;
            
            if (window.BGZonbiManager) {
                window.BGZonbiManager.init(window._bgManagerInstance);
            }
        }
    },

    updateBackground: function(stg, sW, sH) {},
    drawBackground: function(stg, ctx, sW, sH) {},

    getEnemyData: function(type) {
        if (type === 'zombie_0') return { size: 24, hp: 2, maxHp: 2, speed: 2.2 }; 
        if (type === 'zombie_1') return { size: 28, hp: 5, maxHp: 5, speed: 1.2 }; 
        if (type === 'zombie_2') return { size: 24, hp: 2, maxHp: 2, speed: 2.6 }; 
        if (type === 'zombie_3') return { size: 26, hp: 3, maxHp: 3, speed: 1.8 }; 
        if (type === 'zombie_4') return { size: 24, hp: 4, maxHp: 4, speed: 1.5 }; 

        if (type === 'orochi_head') return { imgSrc: 'yamahead.webp', size: 45, hp: 125, maxHp: 125, isBoss: true };
    },

    spawnOrochiHeads: function(stg, sW, sH) {
        for (let i = 0; i < 8; i++) {
            let hX = sW * 0.12 + i * (sW * 0.11);
            let head = new Enemy('orochi_head', hX, -100, stg.player.charData, stg.advManager, stg.stgId);
            head.headIndex = i; 
            head.targetY = sH * 0.2 + (i % 2) * 30; 
            
            head.draw = function(ctx) {
                if (this.isHidden || !this.alive) return;
                ctx.save();
                ctx.translate(this.x, this.y);

                const img = (this.advManager && this.advManager.assets) ? this.advManager.assets['yamahead.webp'] : null;
                if (img && img.naturalWidth > 0) {
                    ctx.shadowColor = 'rgba(255,0,0,0.5)';
                    ctx.shadowBlur = 15;
                    const drawW = this.size * 2;
                    const drawH = drawW * (img.height / img.width);
                    ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
                } else {
                    ctx.fillStyle = '#aa0055';
                    ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
            };
            stg.enemies.push(head);
        }
    },

    updateWaves: function(stg, timer, sW, sH) {
        if (timer > 60 && timer < 3500) {
            let spawnInterval = stg.player.powerLevel >= 4 ? 25 : 40;
            if (timer % spawnInterval === 0) {
                const zType = 'zombie_' + Math.floor(Math.random() * 5);
                stg.enemies.push(new Enemy(zType, Math.random() * (sW - 60) + 30, -40, stg.player.charData, stg.advManager, stg.stgId));
                stg.enemies.push(new Enemy(zType, Math.random() * (sW - 60) + 30, -80, stg.player.charData, stg.advManager, stg.stgId));
            }
        }

        if (timer === 3700 && !stg.bossSpawned) {
            stg.bossSpawned = true;
            this.spawnOrochiHeads(stg, sW, sH);
        }

        if (stg.bossSpawned && !stg.isTimeStopped) {
            const heads = stg.enemies.filter(e => e.type === 'orochi_head' && !e.isDying);
            let currentHpSum = 0;
            heads.forEach(h => currentHpSum += Math.max(0, h.hp));
            stg.totalBossHp = currentHpSum;

            // ★修正：体力が半分になった瞬間、フル回復と同時にADVを即起動させる
            if (stg.zonbiPhase === 1 && stg.totalBossHp <= stg.totalBossMaxHp / 2) {
                stg.zonbiPhase = 2;
                stg.totalBossHp = stg.totalBossMaxHp;
                stg.lastActiveHeadsCount = 8;
                
                stg.enemies = stg.enemies.filter(e => e.type !== 'orochi_head');
                stg.explosions.push(new Explosion(sW/2, sH*0.2, 300, stg.advManager)); 
                if (typeof soundManager !== 'undefined') soundManager.playSE('smallb');
                this.spawnOrochiHeads(stg, sW, sH);

                // 即座に中間2番目のADVを呼び出す
                stg.advTriggeredPhase2 = true;
                let midAdvData = [];
                try {
                    const charId = (stg.player && stg.player.id) ? stg.player.id : 'mamoru';
                    let charScenario = null;
                    if (typeof window.scenarios !== 'undefined') charScenario = window.scenarios[charId];
                    if (charScenario && charScenario[6] && charScenario[6].mid1_adv) {
                        midAdvData = charScenario[6].mid1_adv;
                    }
                } catch(e) { console.warn("ADV取得エラー", e); }

                const onAdvEnd = () => {
                    stg.zonbiPhase = 3; 
                    stg.allyIgari.active = true; 
                    stg.enemyBullets = []; 
                };

                if (midAdvData && midAdvData.length > 0 && typeof window.startMidStgADV !== 'undefined') {
                    window.startMidStgADV(midAdvData, onAdvEnd);
                } else {
                    onAdvEnd();
                }
            }

            let expectedHeadsCount = Math.ceil(stg.totalBossHp / 125);
            if (stg.totalBossHp <= 0) expectedHeadsCount = 0;

            if (expectedHeadsCount < stg.lastActiveHeadsCount && heads.length > 0) {
                let targetHead = heads[heads.length - 1];
                if (targetHead) {
                    targetHead.isDying = true;
                    targetHead.deathTimer = 0;
                    stg.explosions.push(new Explosion(targetHead.x, targetHead.y, targetHead.size * 3, stg.advManager));
                    if (typeof soundManager !== 'undefined') soundManager.playSE('smallb');
                }
                stg.lastActiveHeadsCount = expectedHeadsCount;
            }

            if (stg.zonbiPhase === 3 && stg.totalBossHp <= 0 && !stg.isStageClear) {
                stg.enemies.forEach(e => { e.alive = false; });
                stg.isStageClear = true;
            }
        }
    },

    updateEnemy: function(e, canvas, player) {
        e.moveTimer = (e.moveTimer || 0) + 1;
        const dpr = window.devicePixelRatio || 1;
        const sH = canvas.height / dpr;

        if (e.type.includes('zombie')) {
            let zSpeed = e.config && e.config.getEnemyData ? e.config.getEnemyData(e.type).speed : 1.5;
            e.y += zSpeed;
            e.x += Math.sin(e.moveTimer * 0.03 + e.startX) * 0.6;
            return;
        }

        if (e.type === 'orochi_head') {
            if (e.y < e.targetY) {
                e.y += (e.targetY - e.y) * 0.03;
            } else {
                // ★修正：顔（頭部）の移動幅と速度を拡張し、大蛇らしくもっとウネウネと広範囲に移動させる
                e.x = e.startX + Math.sin(e.moveTimer * 0.03 + e.headIndex * 1.5) * 80;
                e.y = e.targetY + Math.cos(e.moveTimer * 0.045 + e.headIndex * 2.0) * 50;
            }
        }
    },

    transformEnemy: function(e, ctx) {
        if (e.type.includes('zombie')) {
            const img = (e.advManager && e.advManager.assets) ? e.advManager.assets['zonbi.webp'] : null;
            if (img && img.naturalWidth > 0) {
                const typeIdx = parseInt(e.type.split('_')[1], 10);
                const animeFrame = Math.floor(e.moveTimer / 40) % 2;
                const sw = img.width / 2;    
                const sh = img.height / 5;   
                const sx = animeFrame * sw;
                const sy = typeIdx * sh;

                const drawW = e.size * 2;
                const drawH = drawW * (sh / sw);

                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 5;
                ctx.drawImage(img, sx, sy, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                ctx.globalAlpha = 0.0;
            }
        }
    },

    shootEnemy: function(e, stg) {
        if (e.type.includes('zombie')) return;

        if (e.type === 'orochi_head' && !e.isDying) {
            if ((stg.frame + e.headIndex * 30) % 140 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for (let i = -1; i <= 1; i++) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i * 0.25) * 4, Math.sin(ang + i * 0.25) * 4, '#ff00ff'));
                }
            }

            if (stg.player.powerLevel >= 4 && (stg.frame + e.headIndex * 45) % 200 === 0) {
                for (let i = 0; i < 6; i++) {
                    const ang = (i * Math.PI * 2 / 6) + stg.frame * 0.02;
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, '#ff5500'));
                }
            }
        }
    },

    drawCenterTextExtension: function(stg, ctx, sW, sH) {
        if (stg.bossSpawned && stg.totalBossHp > 0) {
            const barW = sW * 0.8;
            const barH = 16;
            const barX = sW * 0.1;
            const barY = 25;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX, barY, barW, barH);
            
            ctx.fillStyle = '#cc0033'; 
            ctx.fillRect(barX, barY, barW * (stg.totalBossHp / stg.totalBossMaxHp), barH);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barW, barH);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`BOSS: ヤマタノオロチ (${stg.totalBossHp}/${stg.totalBossMaxHp})`, barX + 5, barY - 6);
        }
    }
};

if (window.StageConfigs && window.StageConfigs['zonbi']) {
    const origUpdate = STGManager.prototype.updateGameplay;
    STGManager.prototype.updateGameplay = function() {
        const res = origUpdate.call(this);
        if (this.stgId === 'zonbi') {
            if (window.StageConfigs['zonbi'].drawCenterTextExtension) {
                this.customBarDraw = window.StageConfigs['zonbi'].drawCenterTextExtension;
            }

            if (this.allyIgari && this.allyIgari.active && !this.isTimeStopped) {
                const c = document.getElementById('gameCanvas');
                const dpr = window.devicePixelRatio || 1;
                const sW = c.width / dpr;

                this.allyIgari.moveTimer++;
                this.allyIgari.x = (sW / 2) + Math.sin(this.allyIgari.moveTimer * 0.04) * (sW * 0.4);

                if (this.frame % 8 === 0) {
                    const bS = 20; 
                    const cColor = '#00ffff';
                    const ax = this.allyIgari.x;
                    const ay = this.allyIgari.y - 20;
                    
                    this.allyBullets.push(new Bullet(ax, ay, 0, -bS, cColor, null, 'ally_igari'));
                    this.allyBullets.push(new Bullet(ax - 5, ay, -1.5, -bS, cColor, null, 'ally_igari'));
                    this.allyBullets.push(new Bullet(ax + 5, ay, 1.5, -bS, cColor, null, 'ally_igari'));
                    this.allyBullets.push(new Bullet(ax - 5, ay, -3.0, -bS, cColor, null, 'ally_igari'));
                    this.allyBullets.push(new Bullet(ax + 5, ay, 3.0, -bS, cColor, null, 'ally_igari'));
                }

                this.allyBullets.forEach(b => {
                    b.x += b.vx; b.y += b.vy;
                    if (b.y < -50 || b.x < -50 || b.x > sW + 50) b.alive = false;

                    this.enemies.forEach(e => {
                        if (b.alive && e.alive && !e.isDying && Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                            b.alive = false; 
                            e.hp -= 2; 
                            if (e.hp <= 0 && !e.isBoss) {
                                e.alive = false;
                                this.explosions.push(new Explosion(e.x, e.y, e.size * 2, this.advManager));
                                if (typeof soundManager !== 'undefined') soundManager.playSE('smallb');
                            }
                        }
                    });
                });
                this.allyBullets = this.allyBullets.filter(b => b.alive);
            }
        }
        return res;
    };

    const origDraw = STGManager.prototype.draw;
    STGManager.prototype.draw = function(ctx) {
        origDraw.call(this, ctx);
        if (this.stgId === 'zonbi') {
            const c = document.getElementById('gameCanvas');
            const dpr = window.devicePixelRatio || 1;
            
            if (this.allyIgari && this.allyIgari.active) {
                ctx.save();
                const igariImg = this.advManager.assets['igari_jiki.webp'];
                if (igariImg && igariImg.naturalHeight > 0) {
                    const drawWidth = 50;
                    const drawHeight = drawWidth * (igariImg.naturalHeight / igariImg.naturalWidth);
                    ctx.drawImage(igariImg, this.allyIgari.x - drawWidth / 2, this.allyIgari.y - drawHeight / 2, drawWidth, drawHeight);
                } else {
                    ctx.fillStyle = '#00ffff'; 
                    ctx.beginPath();
                    ctx.moveTo(this.allyIgari.x, this.allyIgari.y - 20); 
                    ctx.lineTo(this.allyIgari.x - 20, this.allyIgari.y + 20); 
                    ctx.lineTo(this.allyIgari.x + 20, this.allyIgari.y + 20);
                    ctx.fill();
                }

                this.allyBullets.forEach(b => {
                    ctx.save(); ctx.translate(b.x, b.y);
                    ctx.rotate(Math.atan2(b.vy, b.vx));
                    const length = 15;
                    ctx.shadowColor = b.color; ctx.shadowBlur = 10;
                    ctx.strokeStyle = b.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length, 0); ctx.stroke();
                    ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(-length * 0.8, 0); ctx.lineTo(length * 0.8, 0); ctx.stroke();
                    ctx.restore();
                });
                ctx.restore();
            }

            if (this.customBarDraw) {
                this.customBarDraw(this, ctx, c.width/dpr, c.height/dpr);
            }
        }
    };
}
