const VER_STG_MIND = "0.1.0"; // 新設：精神世界STGロジック（奥スクロール＆相殺システム）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['mind'] = {
    init: function(stg, canvas) {
        stg.bgmChanged = true;
        if (typeof window.soundManager !== 'undefined') {
            window.soundManager.playBGM('boss_shiina');
        }

        // 既存の3D背景を非表示にし、精神世界を起動
        if (window._bgManagerInstance) {
            window._bgManagerInstance.buildings.forEach(b => b.visible = false);
            if (window._bgManagerInstance.ground) window._bgManagerInstance.ground.visible = false;
            
            if (window.BGMindManager) {
                window.BGMindManager.init(window._bgManagerInstance);
            }
        }

        // --- 疑似3D空間の定義 ---
        stg.fov = 400; // 視野角（遠近感の強さ）

        // --- 自機の描画と射撃のオーバーライド ---
        stg.origPlayerDraw = stg.player.draw;
        stg.player.draw = function(ctx, advManager) {
            const img = advManager.assets['jikishiina01.webp'];
            if (img && img.naturalWidth > 0) {
                ctx.drawImage(img, this.x - 25, this.y - 25, 50, 50);
            } else {
                stg.origPlayerDraw.call(this, ctx, advManager);
            }
        };

        // shiki.webpを奥(Z方向)に向かって発射
        stg.origPlayerShoot = stg.player.shoot;
        stg.player.shoot = function() {
            if (stg.frame % 5 === 0) { // 連射速度
                let b = new Bullet(this.x, this.y, 0, 0, '#00ffff', null, this.id);
                b.z = 0;   // 手前からスタート
                b.vz = 35; // 奥へ向かう速度
                this.bullets.push(b);
            }
        };

        // --- Zソート対応の完全新規描画ループ ---
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
                const scale = stg.fov / (stg.fov + e.z);
                renderList.push({
                    z: e.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (e.x - cx) * scale, cy + (e.y - cy) * scale);
                        ctx.scale(scale, scale);
                        // 裏椎名の画像（シナリオ指定のものか、無ければurashiina）
                        const bossImg = stg.advManager.assets['urashiina.webp'];
                        if (bossImg) ctx.drawImage(bossImg, 0, 0, bossImg.width/4, bossImg.height/2, -e.size, -e.size, e.size*2, e.size*2);
                        
                        // ボスHPバー
                        if (e.hp < e.maxHp) {
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(-e.size, e.size + 10, e.size*2 * (e.hp/e.maxHp), 5);
                        }
                        ctx.restore();
                    }
                });
            });

            // 敵弾 (sans.webp)
            stg.enemyBullets.forEach(b => {
                if (b.z === undefined) b.z = 1000;
                const scale = stg.fov / (stg.fov + b.z);
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

            // 自機弾 (shiki.webp)
            stg.player.bullets.forEach(b => {
                if (b.z === undefined) b.z = 0;
                const scale = stg.fov / (stg.fov + b.z);
                renderList.push({
                    z: b.z,
                    draw: () => {
                        ctx.save();
                        ctx.translate(cx + (b.x - cx) * scale, cy + (b.y - cy) * scale);
                        ctx.scale(scale, scale);
                        const shikiImg = stg.advManager.assets['shiki.webp'];
                        if (shikiImg && shikiImg.naturalWidth > 0) {
                            ctx.drawImage(shikiImg, 0, 0, shikiImg.width/4, shikiImg.height, -20, -20, 40, 40);
                        } else {
                            ctx.fillStyle = '#00ffff';
                            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
                        }
                        ctx.restore();
                    }
                });
            });

            // Zが大きい(奥の)ものから順に描画
            renderList.sort((a, b) => b.z - a.z);
            renderList.forEach(item => item.draw());

            // 自機は一番手前
            stg.player.draw(ctx, stg.advManager);

            // UI
            const pHP = Math.max(0, stg.player.hp);
            ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; ctx.fillRect(10, sH - 50, 310, 40); 
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, sH - 50, 310, 40);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; 
            ctx.fillText(`HP: ${pHP}/${stg.player.maxHp}`, 20, sH - 25);
            ctx.fillText(`SCORE: ${String(stg.player.score).padStart(4, '0')}`, sW - 150, 35);
        };

        // --- Z軸アップデート＆【相殺】処理 ---
        stg.origUpdateGameplay = stg.updateGameplay.bind(stg);
        stg.updateGameplay = function() {
            if (window.BGMindManager) window.BGMindManager.update(1/60);

            // 敵弾の迫ってくる処理
            stg.enemyBullets.forEach(b => {
                if (b.z === undefined) b.z = 1000;
                b.z -= 18; // 弾のスピード
                if (b.z < -50) b.alive = false;

                // 被弾判定 (手前Z=0付近で、自機とXYが近いか)
                if (b.z > -20 && b.z < 20 && Math.hypot(stg.player.x - b.x, stg.player.y - b.y) < 20) {
                    if (stg.player.invincibleTimer <= 0) {
                        stg.player.hp--;
                        stg.player.invincibleTimer = 60;
                        b.alive = false;
                    }
                }
            });

            // 自機弾の進行と相殺処理
            stg.player.bullets.forEach(pb => {
                if (pb.z === undefined) pb.z = 0;
                pb.z += pb.vz;
                if (pb.z > 1200) pb.alive = false;

                // ボスへのダメージ判定
                stg.enemies.forEach(e => {
                    if (pb.z > e.z - 50 && pb.z < e.z + 50 && Math.hypot(e.x - pb.x, e.y - pb.y) < e.size) {
                        e.hp--;
                        pb.alive = false;
                    }
                });

                // ★ 相殺システム (鍔迫り合い)
                stg.enemyBullets.forEach(eb => {
                    if (!eb.alive || !pb.alive) return;
                    // Zの距離が近く、XY距離も近ければ相殺して消滅
                    if (Math.abs(pb.z - eb.z) < 50 && Math.hypot(pb.x - eb.x, pb.y - eb.y) < 40) {
                        pb.alive = false;
                        eb.alive = false;
                        stg.player.score += 50; // 相殺ボーナス
                    }
                });
            });

            return this.origUpdateGameplay();
        };
    },

    updateBackground: function() {},
    drawBackground: function() {},
    
    getEnemyData: function(type) {
        if (type === 'boss') return { imgSrc: null, size: 100, hp: 800, maxHp: 800, isBoss: true };
    },
    
    updateWaves: function(stg, timer, sW, sH) {
        if (timer === 60) {
            let boss = new Enemy('boss', sW/2, sH/2, stg.player.charData, stg.advManager, stg.stgId);
            boss.z = 1000; // はるか奥に配置
            stg.enemies.push(boss);
        }
    },
    
    updateEnemy: function(e, canvas, player) {
        e.angle = (e.angle || 0) + 0.02;
        const dpr = window.devicePixelRatio || 1;
        const sW = canvas.width / dpr;
        const sH = canvas.height / dpr;
        // 画面の奥で8の字にフワフワ移動する
        e.x = sW/2 + Math.sin(e.angle) * 200;
        e.y = sH/2 - 50 + Math.cos(e.angle * 2.0) * 100;
    },
    
    shootEnemy: function(e, stg) {
        // sans.webp をばらまく
        if (stg.frame % 20 === 0) {
            let b = new Bullet(e.x, e.y, 0, 0, '#ff0000');
            b.z = e.z;
            b.idOffset = Math.floor(Math.random() * 10);
            
            // 弾をボスの周囲から散らして発射
            b.x += (Math.random() - 0.5) * 250;
            b.y += (Math.random() - 0.5) * 250;
            
            stg.enemyBullets.push(b);
        }
    }
};
