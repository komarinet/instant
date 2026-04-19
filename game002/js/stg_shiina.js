const VER_STG_SHIINA = "0.2.0"; // バージョン更新（B案：スプライトアニメーションの個別実装と仕様変更）

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
        // shiki.png (1行4列) を切り抜くための共通処理
        const initShiki = (e, colIndex) => {
            e.draw = function(ctx) {
                const img = (this.advManager && this.advManager.assets) ? this.advManager.assets['shiki.png'] : null;
                ctx.save(); ctx.translate(this.x, this.y);
                if (this.config && this.config.transformEnemy) this.config.transformEnemy(this, ctx); // 共通の回転処理など

                if (img && img.naturalWidth > 0) {
                    const sw = img.width / 4; const sh = img.height / 1;
                    const drawW = this.size * 2; const drawH = drawW * (sh / sw);
                    
                    // 被弾時のモザイク・透過処理など（コアの処理を簡易移植）
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

        if (type === 'shiki_a') return { imgSrc: 'shiki.png', size: 20, hp: 4, init: (e) => { initShiki(e, 0); } };
        if (type === 'shiki_b') return { imgSrc: 'shiki.png', size: 20, hp: 8, init: (e) => { initShiki(e, 1); } };
        if (type === 'shiki_c') return { imgSrc: 'shiki.png', size: 20, hp: 12, init: (e) => { initShiki(e, 2); } };
        if (type === 'shiki_d') return { imgSrc: 'shiki.png', size: 20, hp: 16, init: (e) => { initShiki(e, 3); } };

        if (type === 'shiinaboss') return {
            imgSrc: 'shiinaboss.png', size: 80, hp: 400, maxHp: 400,
            init: (e) => {
                e.animTimer = 0;
                e.isInvincible = true; // 最初はバリアあり
                e.ringAngle = 0;
                e.draw = function(ctx) {
                    const img = (this.advManager && this.advManager.assets) ? this.advManager.assets['shiinaboss.png'] : null;
                    ctx.save(); ctx.translate(this.x, this.y);

                    // 1. バリアリング(sans.png)の描画
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

                    // 2. ボス本体のアニメーション描画
                    if (img && img.naturalWidth > 0) {
                        this.animTimer++;
                        const speed = 5; // アニメーション速度
                        const t = Math.floor(this.animTimer / speed) % 30; // 0~29でループ
                        const frame = t < 16 ? t : 30 - t; // 0〜15まで進み、14〜1に戻る
                        
                        const col = frame % 4; const row = Math.floor(frame / 4);
                        const sw = img.width / 4; const sh = img.height / 4;
                        const drawW = this.size * 2; const drawH = drawW * (sh / sw);

                        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
                        ctx.drawImage(img, col * sw, row * sh, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                    } else {
                        ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
                    }

                    // 3. HPバー (バリア解除後のみ描画)
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
    
    // sans.pngを弾丸として生成するための独自関数
    createSansBullet: function(stg, x, y, vx, vy) {
        let b = new Bullet(x, y, vx, vy, '#fff');
        b.charIndex = Math.floor(Math.random() * 10); // 10文字からランダム
        b.size = 12; // 当たり判定のサイズ
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
        // 最初からボスが出現
        if (timer === 10 && !stg.bossSpawned) {
            // 無敵処理はHPではなく boolean フラグで管理（被弾時は無敵フラグがあればHPを減らさない処理がcore側に必要ですが、今回は回復させ続けるか、そもそも喰らい判定で減らさないか。簡易的に↓で対応）
            stg.enemies.push(new Enemy('shiinaboss', sW/2, 150, stg.player.charData, stg.advManager, stg.stgId));
            stg.bossSpawned = true;
        }

        // --- フェーズ進行（仮のフレーム数） ---
        // 前半: shiki_a
        if (timer > 100 && timer < 1000) { 
            if (timer % 80 === 0) stg.enemies.push(new Enemy('shiki_a', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        } 
        // 中盤前半: shiki_bメイン
        else if (timer >= 1000 && timer < 2000) { 
            if (timer % 90 === 0) stg.enemies.push(new Enemy('shiki_b', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 150 === 0) stg.enemies.push(new Enemy('shiki_a', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        } 
        // 中盤後半: shiki_cメイン
        else if (timer >= 2000 && timer < 3000) { 
            if (timer % 100 === 0) stg.enemies.push(new Enemy('shiki_c', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        } 
        // 終盤: shiki_dメイン
        else if (timer >= 3000 && timer < 4200) { 
            if (timer % 120 === 0) stg.enemies.push(new Enemy('shiki_d', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        } 
        // ★ ADV挿入タイミング（仮：コンソールログのみで強行突破）
        else if (timer === 4200) {
            console.log("【要修正】ここでADVシーン「まさかここまで抵抗するとはな...」を差し込む");
            // ボスのバリアを解除
            let boss = stg.enemies.find(e => e.type === 'shiinaboss');
            if (boss) {
                boss.isInvincible = false;
            }
        } 
        // 後半：本気モード（shikiとsans弾幕）
        else if (timer > 4300) { 
            if (timer % 150 === 0) {
                const types = ['shiki_a', 'shiki_b', 'shiki_c', 'shiki_d'];
                const rType = types[Math.floor(Math.random() * types.length)];
                stg.enemies.push(new Enemy(rType, Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
        }

        // バリア中は常にHPをMAXに保つ（HPが減らない簡易処理）
        let boss = stg.enemies.find(e => e.type === 'shiinaboss');
        if (boss && boss.isInvincible) boss.hp = boss.maxHp;
    },

    updateEnemy: function(e, canvas, player) {
        if (e.type === 'shiinaboss') {
            // ボスは定位置キープ
            e.y = 150; 
        } else if (e.type.startsWith('shiki_')) {
            // shiki の共通移動（とりあえず下に降りるだけ。後で固有の動きが必要なら変更）
            e.y += 2.5;
        }
    },

    shootEnemy: function(e, stg) {
        if (e.type === 'shiinaboss') {
            if (!e.isInvincible) {
                // バリア解除後（本気モード）：sans弾幕をやたらめったら発射
                if (stg.frame % 20 === 0) {
                    const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                    this.createSansBullet(stg, e.x, e.y, Math.cos(ang)*4, Math.sin(ang)*4);
                    // ランダムな方向にも飛ばす
                    for(let i=0; i<2; i++) {
                        const rAng = Math.random() * Math.PI * 2;
                        this.createSansBullet(stg, e.x, e.y, Math.cos(rAng)*3, Math.sin(rAng)*3);
                    }
                }
            }
        } else if (e.type.startsWith('shiki_')) {
            // shikiからの射撃
            if (stg.frame % 150 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#00ffff'));
            }
        }
    }
};
