const VER_STG_MIND = "0.7.3"; // 自機弾の速度向上・種類固定、被弾時の赤点滅と無敵時間、ゲージUI追加

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['mind'] = {
    init: function(stg, canvas) {
        stg.bgmChanged = true;
        if (typeof window.soundManager !== 'undefined') {
            window.soundManager.playBGM('boss_shiina');
        }

        if (window._bgManagerInstance) {
            window._bgManagerInstance.buildings.forEach(b => b.visible = false);
            window._bgManagerInstance.clouds.forEach(c => c.visible = false);
            if (window._bgManagerInstance.ground) window._bgManagerInstance.ground.visible = false;
            
            if (window.BGMindManager) {
                window.BGMindManager.init(window._bgManagerInstance);
            }
        }

        stg.fov = 400;

        stg.origPlayerDraw = stg.player.draw;
        stg.player.draw = function(ctx, advManager) {
            ctx.save();
            const img = advManager.assets['jikishiina01.webp'];
            let isBlinking = false;
            
            // 無敵時間中の赤点滅処理
            if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
                isBlinking = true;
            }

            if (img && img.naturalWidth > 0) {
                const drawW = 60;
                const drawH = drawW * (img.naturalHeight / img.naturalWidth);
                ctx.drawImage(img, this.x - drawW/2, this.y - drawH/2, drawW, drawH);
                
                // 赤く点滅させるオーバーレイ
                if (isBlinking) {
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
                    ctx.fillRect(this.x - drawW/2, this.y - drawH/2, drawW, drawH);
                }
            } else {
                const fallbackImg = advManager.assets['jikishi.webp'];
                if (fallbackImg && fallbackImg.naturalWidth > 0) {
                    const drawW = 40;
                    const drawH = drawW * (fallbackImg.naturalHeight / fallbackImg.naturalWidth);
                    ctx.drawImage(fallbackImg, this.x - drawW/2, this.y - drawH/2, drawW, drawH);
                } else {
                    ctx.fillStyle = isBlinking ? '#ff0000' : '#33ccff';
                    ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, Math.PI*2); ctx.fill();
                }
            }
            ctx.restore();
        };

        stg.origPlayerShoot = stg.player.shoot;
        stg.player.shoot = function() {
            if (stg.frame % 5 === 0) { 
                const pL = Math.min(8, this.powerLevel);
                const countUp = Math.floor(pL / 2);
                const shotCount = 1 + countUp;
                
                for (let i = 0; i < shotCount; i++) {
                    let offset = (shotCount === 1) ? 0 : (i - (shotCount - 1) / 2) * 8;
                    let b = new Bullet(this.x + offset, this.y, 0, 0, '#00ffff', null, this.id);
                    b.z = 0;   
                    b.vz = 60; // ★弾速を35から60へ大幅アップ
                    b.vx = offset * 0.5; 
                    b.isHoming = true;
                    b.baseSize = 10;
                    // ★4種類のうちどれか1つを固定で割り当て（アニメーションさせない）
                    b.shikiType = Math.floor(Math.random() * 4);
                    this.bullets.push(b);
                }
            }
        };

        stg.origDraw = stg.draw;
        stg.draw = function(ctx) {
            const dpr = window.devicePixelRatio || 1;
            const sW = canvas.width / dpr;
            const sH = canvas.height / dpr;
            const cx = sW / 2;
            const cy = sH / 2;

            let renderList = [];

            // ボス
            stg.enemies.forEach(e => {
                if (e.z === undefined) e.z = 1000;
                const scale = stg.fov / (Math.max(1, stg.fov + e.z)); 
                renderList.push({
                    z: e.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (e.x - cx) * scale, cy + (e.y - cy) * scale);
                        ctx.scale(scale, scale);
                        
                        let bossImg = stg.advManager.assets['shiinaboss.webp'];
                        let isFallback = false;
                        if (!bossImg || bossImg.naturalWidth === 0) {
                            bossImg = stg.advManager.assets['urashiina.webp'];
                            isFallback = true;
                        }

                        if (bossImg && bossImg.naturalWidth > 0) {
                            ctx.shadowColor = 'rgba(0,0,0,0.8)'; 
                            ctx.shadowBlur = 10;
                            
                            if (!isFallback) {
                                e.animTimer = (e.animTimer || 0) + 1;
                                const speed = 5;
                                const t = Math.floor(e.animTimer / speed) % 30;
                                const frame = t < 16 ? t : 30 - t;
                               
                                const col = frame % 4; 
                                const row = Math.floor(frame / 4);
                                const sw = bossImg.width / 4; 
                                const sh = bossImg.height / 4;
                                const drawW = e.size * 2; 
                                const drawH = drawW * (sh / sw);

                                ctx.drawImage(bossImg, col * sw, row * sh, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                            } else {
                                const sw = bossImg.width / 4; 
                                const sh = bossImg.height / 2;
                                const drawW = e.size * 2; 
                                const drawH = drawW * (sh / sw);
                                ctx.drawImage(bossImg, 0, 0, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                            }
                        } else {
                            ctx.fillStyle = '#ff0055';
                            ctx.font = "bold 30px sans-serif";
                            ctx.textAlign = "center";
                            ctx.fillText("BOSS", 0, 0);
                        }
                        ctx.restore();
                    }
                });
            });

            // 敵弾 (sans.webp)
            stg.enemyBullets.forEach(b => {
                if (b.z === undefined) b.z = 1000;
                const scale = stg.fov / (Math.max(1, stg.fov + b.z));
                renderList.push({
                    z: b.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (b.x - cx) * scale, cy + (b.y - cy) * scale);
                        ctx.scale(scale, scale);
                        
                        const distAlpha = Math.min(1, Math.max(0.1, (1000 - b.z) / 1000));
                        ctx.strokeStyle = `rgba(255, 0, 85, ${distAlpha})`;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(-20, -20, 40, 40);
                        ctx.beginPath();
                        ctx.moveTo(-25, 0); ctx.lineTo(-15, 0);
                        ctx.moveTo(15, 0); ctx.lineTo(25, 0);
                        ctx.moveTo(0, -25); ctx.lineTo(0, -15);
                        ctx.moveTo(0, 15); ctx.lineTo(0, 25);
                        ctx.stroke();

                        const sansImg = stg.advManager.assets['sans.webp'];
                        if (sansImg && sansImg.naturalWidth > 0) {
                            const charIdx = (stg.frame + b.idOffset) % 10;
                            const sw = sansImg.width / 5;
                            const sh = sansImg.height / 2;
                            const col = charIdx % 5;
                            const row = Math.floor(charIdx / 5);
                            ctx.drawImage(sansImg, col*sw, row*sh, sw, sh, -15, -15, 30, 30);
                        } else {
                            ctx.fillStyle = '#ff0055';
                            ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
                        }
                        ctx.restore();
                    }
                });
            });

            // 自機弾 (shiki.webp)
            stg.player.bullets.forEach(b => {
                if (b.z === undefined) b.z = 0;
                const scale = stg.fov / (Math.max(1, stg.fov + b.z));
                renderList.push({
                    z: b.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (b.x - cx) * scale, cy + (b.y - cy) * scale);
                        ctx.scale(scale, scale);
                        
                        const shikiImg = stg.advManager.assets['shiki.webp'];
                        const ds = b.currentSize || 10;
                        if (shikiImg && shikiImg.naturalWidth > 0) {
                            const sw = shikiImg.width / 4;
                            const sh = shikiImg.height;
                            // 発射時に割り当てられた画像をそのまま描画（アニメーションさせない）
                            const typeIdx = b.shikiType !== undefined ? b.shikiType : 0;
                            ctx.drawImage(shikiImg, typeIdx * sw, 0, sw, sh, -ds*2, -ds*2, ds*4, ds*4);
                        } else {
                            ctx.fillStyle = '#00ffff';
                            ctx.beginPath(); ctx.arc(0, 0, ds, 0, Math.PI*2); ctx.fill();
                        }
                        ctx.restore();
                    }
                });
            });

            // アイテムの描画
            stg.items.forEach(it => {
                if (it.z === undefined) return;
                const scale = stg.fov / (Math.max(1, stg.fov + it.z));
                renderList.push({
                    z: it.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (it.x - cx) * scale, cy + (it.y - cy) * scale);
                        ctx.scale(scale, scale);
                        const origX = it.x, origY = it.y;
                        it.x = 0; it.y = 0;
                        it.draw(ctx);
                        it.x = origX; it.y = origY;
                        ctx.restore();
                    }
                });
            });

            // 爆発エフェクト
            stg.explosions.forEach(exp => {
                if (exp.z === undefined) exp.z = 1000;
                const scale = stg.fov / (Math.max(1, stg.fov + exp.z));
                renderList.push({
                    z: exp.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (exp.x - cx) * scale, cy + (exp.y - cy) * scale);
                        ctx.scale(scale, scale);
                        if (exp.img && exp.img.naturalWidth > 0) {
                            const sx = (exp.frameIndex % exp.cols) * exp.sw;
                            const sy = Math.floor(exp.frameIndex / exp.cols) * exp.sh;
                            ctx.drawImage(exp.img, sx, sy, exp.sw, exp.sh, -exp.targetSize/2, -exp.targetSize/2, exp.targetSize, exp.targetSize);
                        }
                        ctx.restore();
                    }
                });
            });

            renderList.sort((a, b) => b.z - a.z);
            renderList.forEach(item => item.draw());

            stg.player.draw(ctx, stg.advManager);

            // ボスHPバー
            const boss = stg.enemies.find(e => e.type === 'boss');
            if (boss && boss.hp > 0 && !boss.isDying) {
                const barW = sW * 0.8;
                const barH = 15;
                const barX = sW * 0.1;
                const barY = 20;
                
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = '#ff0055';
                ctx.fillRect(barX, barY, barW * (boss.hp / boss.maxHp), barH);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(barX, barY, barW, barH);
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText('UNKNOWN', barX, barY - 5);
            }

            // ★修正：パワーレベルとボム数を明記したUIパネル
            const pHP = Math.max(0, stg.player.hp);
            ctx.fillStyle = 'rgba(10, 10, 25, 0.8)'; ctx.fillRect(10, sH - 50, sW - 20, 40); 
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, sH - 50, sW - 20, 40);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; 
            ctx.fillText(`HP: ${pHP}/${stg.player.maxHp}   PWR: ${stg.player.powerLevel}/8   BOMB: ${stg.player.bombs}`, 20, sH - 25);
            ctx.fillText(`SCORE: ${String(stg.player.score).padStart(4, '0')}`, sW - 140, sH - 25);
        };

        stg.origUpdateGameplay = stg.updateGameplay.bind(stg);
        stg.updateGameplay = function() {
            if (window.BGMindManager) window.BGMindManager.update(1/60);

            // 無敵時間の減少処理（他で処理されていない場合への安全策）
            if (stg.player.invincibleTimer > 0) stg.player.invincibleTimer--;

            // アイテムのZ更新と回収判定
            stg.items.forEach(it => {
                if (it.z !== undefined) {
                    it.z += it.vz;
                    if (it.z < 50 && it.z > -50 && Math.hypot(it.x - stg.player.x, it.y - stg.player.y) < 60) {
                        it.alive = false;
                        if (it.type === 'power') {
                            stg.player.score += (stg.player.powerLevel >= 8) ? 1000 : 100;
                            stg.player.powerLevel = Math.min(8, stg.player.powerLevel + 1);
                        }
                        if (it.type === 'recover') {
                            stg.player.score += (stg.player.hp >= stg.player.maxHp) ? 1000 : 100;
                            stg.player.hp = Math.min(stg.player.maxHp, stg.player.hp + 1);
                        }
                        if (it.type === 'bomb') {
                            stg.player.score += (stg.player.bombs >= 5) ? 1000 : 100;
                            stg.player.bombs = Math.min(5, stg.player.bombs + 1);
                        }
                        if (typeof window.soundManager !== 'undefined') window.soundManager.playSE('smallb');
                    }
                    if (it.z < -200) it.alive = false;
                }
            });

            stg.enemyBullets.forEach(b => {
                if (b.z === undefined) b.z = 1000;
                b.z -= 15; 
                if (b.z < -50) b.alive = false;

                if (b.z > -20 && b.z < 20 && Math.hypot(stg.player.x - b.x, stg.player.y - b.y) < 20) {
                    if (stg.player.invincibleTimer <= 0) {
                        stg.player.hp--;
                        stg.player.invincibleTimer = 90; // ★被弾時に90フレーム(約1.5秒)の無敵時間を付与
                        b.alive = false;
                    }
                }
            });

            stg.player.bullets.forEach(pb => {
                if (pb.z === undefined) pb.z = 0;
                
                let target = stg.enemies.find(e => e.type === 'boss');
                if (target && pb.isHoming) {
                    let dx = target.x - pb.x;
                    let dy = target.y - pb.y;
                    pb.x += dx * 0.05;
                    pb.y += dy * 0.05;
                }

                pb.currentSize = pb.baseSize;
                stg.enemyBullets.forEach(eb => {
                    if (eb.alive) {
                        let dist = Math.sqrt((pb.x - eb.x)**2 + (pb.y - eb.y)**2 + (pb.z - eb.z)**2);
                        if (dist < 150) pb.currentSize = pb.baseSize * 3; // 敵弾に近づくと巨大化
                    }
                });

                pb.z += pb.vz;
                pb.x += pb.vx || 0;
                if (pb.z > 1200) pb.alive = false;

                stg.enemies.forEach(e => {
                    if (pb.z > e.z - 50 && pb.z < e.z + 50 && Math.hypot(e.x - pb.x, e.y - pb.y) < e.size) {
                        e.hp--;
                        pb.alive = false;
                    }
                });

                stg.enemyBullets.forEach(eb => {
                    if (!eb.alive || !pb.alive) return;
                    if (Math.abs(pb.z - eb.z) < 50 && Math.hypot(pb.x - eb.x, pb.y - eb.y) < 40) {
                        pb.alive = false;
                        eb.alive = false;
                        stg.player.score += 50; 
                        
                        let exp = new Explosion(eb.x, eb.y, 30, stg.advManager);
                        exp.z = eb.z; 
                        stg.explosions.push(exp);
                        if (typeof window.soundManager !== 'undefined') window.soundManager.playSE('smallb');

                        // 敵弾撃ち落とし時、20%の確率でアイテムドロップ
                        if (Math.random() < 0.20) { 
                            let type = 'power';
                            let r = Math.random();
                            if (r < 0.1) type = 'bomb';
                            else if (r < 0.3) type = 'recover';
                            
                            let item = new Item(type, eb.x, eb.y);
                            item.z = eb.z;
                            item.vz = -15; // 手前へ
                            stg.items.push(item);
                        }
                    }
                });
            });

            return this.origUpdateGameplay();
        };
    },

    updateBackground: function() {},
    drawBackground: function() {},
    
    getEnemyData: function(type) {
        if (type === 'boss') return { imgSrc: 'shiinaboss.webp', size: 130, hp: 800, maxHp: 800, isBoss: true };
    },
    
    updateWaves: function(stg, timer, sW, sH) {
        if (timer === 60) {
            let boss = new Enemy('boss', sW/2, sH/2, stg.player.charData, stg.advManager, stg.stgId);
            boss.z = 1000; 
            stg.enemies.push(boss);
        }
    },
    
    updateEnemy: function(e, canvas, player) {
        e.angle = (e.angle || 0) + 0.02;
        const dpr = window.devicePixelRatio || 1;
        const sW = canvas.width / dpr;
        const sH = canvas.height / dpr;
        e.x = sW/2 + Math.sin(e.angle) * 150;
        e.y = sH/2 - 50 + Math.cos(e.angle * 2.0) * 80;
    },
    
    shootEnemy: function(e, stg) {
        if (stg.frame % 20 === 0) {
            let b = new Bullet(e.x, e.y, 0, 0, '#ff0000');
            b.z = e.z;
            b.idOffset = Math.floor(Math.random() * 10);
            
            b.x += (Math.random() - 0.5) * 200;
            b.y += (Math.random() - 0.5) * 200;
            
            stg.enemyBullets.push(b);
        }
    }
};
