const VER_STG_MIND = "0.5.0"; // 更新：ボスの描画を urashiina の立ち絵から、stg_shiina と同じ shiinaboss.webp のアニメーションに修正

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['mind'] = {
    init: function(stg, canvas) {
        stg.bgmChanged = true;
        if (typeof window.soundManager !== 'undefined') {
            window.soundManager.playBGM('boss_shiina');
        }

        if (window._bgManagerInstance) {
            window._bgManagerInstance.buildings.forEach(b => b.visible = false);
            if (window._bgManagerInstance.ground) window._bgManagerInstance.ground.visible = false;
            
            if (window.BGMindManager) {
                window.BGMindManager.init(window._bgManagerInstance);
            }
        }

        stg.fov = 400;

        stg.origPlayerDraw = stg.player.draw;
        stg.player.draw = function(ctx, advManager) {
            const img = advManager.assets['jikishiina01.webp'];
            if (img && img.naturalWidth > 0) {
                ctx.drawImage(img, this.x - 25, this.y - 25, 50, 50);
            } else {
                const fallbackImg = advManager.assets['jikishi.webp'];
                if (fallbackImg && fallbackImg.naturalWidth > 0) {
                    const sw = fallbackImg.width / 5;
                    const sh = fallbackImg.height / 2;
                    ctx.drawImage(fallbackImg, 0, 0, sw, sh, this.x - 20, this.y - 30, 40, 60);
                } else {
                    ctx.fillStyle = '#33ccff';
                    ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, Math.PI*2); ctx.fill();
                }
            }
        };

        // 自機の弾を shikiw.webp に変更して奥へ発射
        stg.origPlayerShoot = stg.player.shoot;
        stg.player.shoot = function() {
            if (stg.frame % 5 === 0) { 
                let b = new Bullet(this.x, this.y, 0, 0, '#00ffff', null, this.id);
                b.z = 0;   
                b.vz = 35; 
                this.bullets.push(b);
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

            // ボス(裏椎名)の登録
            stg.enemies.forEach(e => {
                if (e.z === undefined) e.z = 1000;
                const scale = stg.fov / (Math.max(1, stg.fov + e.z)); 
                renderList.push({
                    z: e.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (e.x - cx) * scale, cy + (e.y - cy) * scale);
                        ctx.scale(scale, scale);
                        
                        // ★修正：stg_shiina と同じ shiinaboss.webp のアニメーション処理を適用
                        const bossImg = stg.advManager.assets['shiinaboss.webp'];
                        if (bossImg && bossImg.naturalWidth > 0) {
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

                            ctx.shadowColor = 'rgba(0,0,0,0.8)'; 
                            ctx.shadowBlur = 10;
                            ctx.drawImage(bossImg, col * sw, row * sh, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                        } else {
                            ctx.fillStyle = '#ff00ff';
                            ctx.beginPath(); ctx.arc(0, 0, e.size, 0, Math.PI*2); ctx.fill();
                        }
                        
                        if (e.hp < e.maxHp) {
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(-e.size, e.size + 20, e.size*2 * (e.hp/e.maxHp), 8);
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

            // 自機弾 (shikiw.webp)
            stg.player.bullets.forEach(b => {
                if (b.z === undefined) b.z = 0;
                const scale = stg.fov / (Math.max(1, stg.fov + b.z));
                renderList.push({
                    z: b.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (b.x - cx) * scale, cy + (b.y - cy) * scale);
                        ctx.scale(scale, scale);
                        const shikiImg = stg.advManager.assets['shikiw.webp'];
                        if (shikiImg && shikiImg.naturalWidth > 0) {
                            const sw = shikiImg.width / 4;
                            const sh = shikiImg.height;
                            const frame = Math.floor(stg.frame / 4) % 4;
                            ctx.drawImage(shikiImg, frame * sw, 0, sw, sh, -20, -20, 40, 40);
                        } else {
                            ctx.fillStyle = '#00ffff';
                            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
                        }
                        ctx.restore();
                    }
                });
            });

            renderList.sort((a, b) => b.z - a.z);
            renderList.forEach(item => item.draw());

            stg.player.draw(ctx, stg.advManager);

            const pHP = Math.max(0, stg.player.hp);
            ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; ctx.fillRect(10, sH - 50, 310, 40); 
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, sH - 50, 310, 40);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; 
            ctx.fillText(`HP: ${pHP}/${stg.player.maxHp}`, 20, sH - 25);
            ctx.fillText(`SCORE: ${String(stg.player.score).padStart(4, '0')}`, sW - 150, 35);
        };

        stg.origUpdateGameplay = stg.updateGameplay.bind(stg);
        stg.updateGameplay = function() {
            if (window._bgManagerInstance) {
                window._bgManagerInstance.buildings.forEach(b => b.visible = false);
                window._bgManagerInstance.clouds.forEach(c => c.visible = false);
                if (window._bgManagerInstance.ground) window._bgManagerInstance.ground.visible = false;
            }

            if (window.BGMindManager) window.BGMindManager.update(1/60);

            stg.enemyBullets.forEach(b => {
                if (b.z === undefined) b.z = 1000;
                b.z -= 18; 
                if (b.z < -50) b.alive = false;

                if (b.z > -20 && b.z < 20 && Math.hypot(stg.player.x - b.x, stg.player.y - b.y) < 20) {
                    if (stg.player.invincibleTimer <= 0) {
                        stg.player.hp--;
                        stg.player.invincibleTimer = 60;
                        b.alive = false;
                    }
                }
            });

            stg.player.bullets.forEach(pb => {
                if (pb.z === undefined) pb.z = 0;
                pb.z += pb.vz;
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
                    }
                });
            });

            return this.origUpdateGameplay();
        };
    },

    updateBackground: function() {},
    drawBackground: function() {},
    
    getEnemyData: function(type) {
        // ★修正：画像ソースを shiinaboss.webp に指定
        if (type === 'boss') return { imgSrc: 'shiinaboss.webp', size: 80, hp: 800, maxHp: 800, isBoss: true };
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
