const VER_STG_MIND = "0.7.8"; // 当たり判定を完全なスクリーン座標ベース(見た目通り)に修正、手前接近時の警告エフェクト追加

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
            
            if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
                isBlinking = true;
            }

            if (img && img.naturalWidth > 0) {
                const drawW = 60;
                const drawH = drawW * (img.naturalHeight / img.naturalWidth);
                ctx.drawImage(img, this.x - drawW/2, this.y - drawH/2, drawW, drawH);
                
                if (isBlinking) {
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
                    ctx.fillRect(this.x - drawW/2, this.y - drawH/2, drawW, drawH);
                }
                
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = '#00ffaa'; 
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
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

        stg.origPlayerTriggerBomb = stg.player.triggerBomb;
        stg.player.triggerBomb = function(player, stg_ref) {
            if (this.bombs <= 0 || stg.bombState === 'ACTIVE') return;
            this.bombs--;
            stg.bombState = 'ACTIVE';
            stg.bombTimer = 0;
            this.invincibleTimer = 180; 
            if (typeof window.soundManager !== 'undefined') window.soundManager.playSE('smallb');
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
                    b.vz = 40; 
                    b.vx = offset * 0.5; 
                    b.isHoming = true;
                    b.baseSize = 10;
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

            // 敵弾
            stg.enemyBullets.forEach(b => {
                if (b.z === undefined) b.z = 1000;
                const scale = stg.fov / (Math.max(1, stg.fov + b.z));
                renderList.push({
                    z: b.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (b.x - cx) * scale, cy + (b.y - cy) * scale);
                        ctx.scale(scale, scale);
                        
                        let distAlpha = Math.min(1, Math.max(0.2, (1000 - b.z) / 1000));
                        let shadowColor = '#ff0055';
                        let strokeColor = `rgba(255, 100, 150, ${distAlpha})`;
                        let lineWidth = 3;

                        // ★追加：戦略B 奥行きの視覚化。手前(Z < 150)に来たら強烈に光り、危険を知らせる
                        if (b.z < 150 && b.z > -20) {
                            ctx.shadowColor = '#ffffff';
                            ctx.shadowBlur = 30;
                            strokeColor = '#ffffff';
                            lineWidth = 5;
                            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                            ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI*2); ctx.fill();
                        } else {
                            ctx.shadowColor = shadowColor;
                            ctx.shadowBlur = 15;
                        }

                        ctx.strokeStyle = strokeColor;
                        ctx.lineWidth = lineWidth;
                        ctx.strokeRect(-25, -25, 50, 50);

                        const sansImg = stg.advManager.assets['sans.webp'];
                        if (sansImg && sansImg.naturalWidth > 0) {
                            const charIdx = (stg.frame + b.idOffset) % 10;
                            const sw = sansImg.width / 5;
                            const sh = sansImg.height / 2;
                            const col = charIdx % 5;
                            const row = Math.floor(charIdx / 5);
                            ctx.drawImage(sansImg, col*sw, row*sh, sw, sh, -20, -20, 40, 40);
                        } else {
                            ctx.fillStyle = '#ff0055';
                            ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
                        }
                        
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();

                        ctx.restore();
                    }
                });
            });

            // 自機弾
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
                            const typeIdx = b.shikiType !== undefined ? b.shikiType : 0;
                            
                            ctx.shadowColor = b.isBomb ? '#ff00ff' : '#00ffff';
                            ctx.shadowBlur = 15;
                            ctx.drawImage(shikiImg, typeIdx * sw, 0, sw, sh, -ds*3, -ds*3, ds*6, ds*6);
                        } else {
                            ctx.fillStyle = b.isBomb ? '#ff00ff' : '#00ffff';
                            ctx.beginPath(); ctx.arc(0, 0, ds, 0, Math.PI*2); ctx.fill();
                        }
                        
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath(); ctx.arc(0, 0, ds * 0.5, 0, Math.PI*2); ctx.fill();

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

            const pHP = Math.max(0, stg.player.hp);
            ctx.fillStyle = 'rgba(10, 10, 25, 0.8)'; 
            ctx.fillRect(10, sH - 60, sW - 20, 50); 
            ctx.strokeStyle = '#fff'; 
            ctx.lineWidth = 2; 
            ctx.strokeRect(10, sH - 60, sW - 20, 50);
            ctx.fillStyle = '#fff'; 
            
            ctx.font = 'bold clamp(10px, 3.5vw, 14px) sans-serif'; 
            ctx.textAlign = 'left';
            ctx.fillText(`HP: ${pHP}/${stg.player.maxHp}   PWR: ${stg.player.powerLevel}/8   BOMB: ${stg.player.bombs}`, 20, sH - 35);
            ctx.fillText(`SCORE: ${String(stg.player.score).padStart(6, '0')}`, 20, sH - 16);
        };

        stg.origUpdateGameplay = stg.updateGameplay.bind(stg);
        stg.updateGameplay = function() {
            if (window.BGMindManager) window.BGMindManager.update(1/60);

            if (stg.player.invincibleTimer > 0) stg.player.invincibleTimer--;

            // ★追加：スクリーン座標計算用の基礎データ
            const dpr = window.devicePixelRatio || 1;
            const sW = canvas.width / dpr;
            const sH = canvas.height / dpr;
            const cx = sW / 2;
            const cy = sH / 2;

            if (stg.bombState === 'ACTIVE') {
                stg.bombTimer++;
                if (stg.bombTimer < 100 && stg.bombTimer % 2 === 0) {
                    for(let i=0; i<4; i++) {
                        let b = new Bullet(stg.player.x, stg.player.y, 0, 0, '#ff00ff', null, stg.player.id);
                        b.z = 0;   
                        b.vz = 5 + Math.random()*5;
                        b.vx = (Math.random()-0.5)*70; 
                        b.vy = (Math.random()-0.5)*70; 
                        b.isHoming = false; 
                        b.isBomb = true; 
                        b.bombTimer = 0; 
                        b.baseSize = 15;
                        b.shikiType = Math.floor(Math.random() * 4);
                        stg.player.bullets.push(b);
                    }
                }
                if (stg.bombTimer > 180) stg.bombState = 'READY';
            }

            stg.items.forEach(it => {
                if (it.z !== undefined) {
                    it.z += it.vz;
                    
                    if (it.z < 800) { 
                        let dx = stg.player.x - it.x;
                        let dy = stg.player.y - it.y;
                        let dist = Math.hypot(dx, dy);
                        if (dist < 500) { 
                            it.x += (dx / dist) * 7; 
                            it.y += (dy / dist) * 7;
                            it.z -= 2; 
                        }
                    }

                    // ★追加：戦略A アイテム取得判定をスクリーン座標に変更
                    const scale = stg.fov / (Math.max(1, stg.fov + it.z));
                    const screenX = cx + (it.x - cx) * scale;
                    const screenY = cy + (it.y - cy) * scale;

                    if (it.z < 50 && it.z > -50 && Math.hypot(screenX - stg.player.x, screenY - stg.player.y) < 60) {
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
                b.z -= 9; 
                if (b.z < -50) b.alive = false;

                // ★追加：戦略A 敵弾の当たり判定をスクリーン座標（見た目上の位置）に変更
                const scale = stg.fov / (Math.max(1, stg.fov + b.z));
                const screenX = cx + (b.x - cx) * scale;
                const screenY = cy + (b.y - cy) * scale;

                if (b.z > -20 && b.z < 20 && Math.hypot(stg.player.x - screenX, stg.player.y - screenY) < 8) {
                    if (stg.player.invincibleTimer <= 0) {
                        stg.player.hp--;
                        stg.player.invincibleTimer = 90; 
                        b.alive = false;
                    }
                }
            });

            stg.player.bullets.forEach(pb => {
                if (pb.z === undefined) pb.z = 0;

                if (pb.isBomb) {
                    pb.bombTimer = (pb.bombTimer || 0) + 1;
                    if (pb.bombTimer <= 20) {
                        pb.vx *= 0.85; 
                        pb.vy *= 0.85;
                    } else {
                        pb.isHoming = true;
                        if (pb.vz < 40) pb.vz += 2; 
                    }
                }
                
                let homingTarget = stg.enemies.find(e => e.type === 'boss');
                let closestDist = Infinity;
                
                // ★追加：戦略A ホーミングや敵弾相殺の距離計算もスクリーン座標に変更
                const pbScale = stg.fov / (Math.max(1, stg.fov + pb.z));
                const screenPX = cx + (pb.x - cx) * pbScale;
                const screenPY = cy + (pb.y - cy) * pbScale;

                if (homingTarget) {
                    const hScale = stg.fov / (Math.max(1, stg.fov + homingTarget.z));
                    const screenHX = cx + (homingTarget.x - cx) * hScale;
                    const screenHY = cy + (homingTarget.y - cy) * hScale;
                    closestDist = Math.hypot(screenHX - screenPX, screenHY - screenPY);
                }

                stg.enemyBullets.forEach(eb => {
                    if (eb.alive && eb.z > pb.z) { 
                        const ebScale = stg.fov / (Math.max(1, stg.fov + eb.z));
                        const screenEX = cx + (eb.x - cx) * ebScale;
                        const screenEY = cy + (eb.y - cy) * ebScale;
                        let dist = Math.hypot(screenEX - screenPX, screenEY - screenPY);
                        if (dist < closestDist) {
                            closestDist = dist;
                            homingTarget = eb; 
                        }
                    }
                });

                if (homingTarget && pb.isHoming) {
                    let dx = homingTarget.x - pb.x;
                    let dy = homingTarget.y - pb.y;
                    let turnSpeed = pb.isBomb ? 0.4 : 0.3;
                    pb.x += dx * turnSpeed;
                    pb.y += dy * turnSpeed;
                }

                pb.currentSize = pb.baseSize;
                stg.enemyBullets.forEach(eb => {
                    if (eb.alive) {
                        // サイズアップ判定もスクリーン座標で
                        const ebScale = stg.fov / (Math.max(1, stg.fov + eb.z));
                        const screenEX = cx + (eb.x - cx) * ebScale;
                        const screenEY = cy + (eb.y - cy) * ebScale;
                        let dist = Math.hypot(screenPX - screenEX, screenPY - screenEY);
                        if (dist < 150 * ebScale) pb.currentSize = pb.baseSize * 3; 
                    }
                });

                pb.z += pb.vz;
                pb.x += pb.vx || 0;
                if (pb.z > 1200) pb.alive = false;

                // ★追加：戦略A ボスに対する当たり判定をスクリーン座標に変更
                stg.enemies.forEach(e => {
                    const eScale = stg.fov / (Math.max(1, stg.fov + e.z));
                    const screenEX = cx + (e.x - cx) * eScale;
                    const screenEY = cy + (e.y - cy) * eScale;
                    const hitDist = e.size * eScale;

                    if (pb.z > e.z - 50 && pb.z < e.z + 50 && Math.hypot(screenEX - screenPX, screenEY - screenPY) < hitDist) {
                        e.hp -= pb.isBomb ? 3 : 1;
                        pb.alive = false;
                    }
                });

                stg.enemyBullets.forEach(eb => {
                    if (!eb.alive || !pb.alive) return;
                    
                    const ebScale = stg.fov / (Math.max(1, stg.fov + eb.z));
                    const screenEX = cx + (eb.x - cx) * ebScale;
                    const screenEY = cy + (eb.y - cy) * ebScale;

                    if (Math.abs(pb.z - eb.z) < 150 && Math.hypot(screenPX - screenEX, screenPY - screenEY) < 100 * ebScale) {
                        pb.alive = false;
                        eb.alive = false;
                        stg.player.score += 50; 
                        
                        let exp = new Explosion(eb.x, eb.y, 30, stg.advManager);
                        exp.z = eb.z; 
                        stg.explosions.push(exp);
                        if (typeof window.soundManager !== 'undefined') window.soundManager.playSE('smallb');

                        if (Math.random() < 0.45) { 
                            let type = 'power';
                            let r = Math.random();
                            if (r < 0.1) type = 'bomb';
                            else if (r < 0.3) type = 'recover';
                            
                            let item = new Item(type, eb.x, eb.y);
                            item.z = eb.z;
                            item.vz = -8; 
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
        if (type === 'boss') return { imgSrc: 'shiinaboss.webp', size: 220, hp: 800, maxHp: 800, isBoss: true };
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
