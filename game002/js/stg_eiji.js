const VER_STG_EIJI = "0.2.0"; // バージョン更新（勝敗を撃破数に変更、パワーアップアイテム禁止、敵の数を2倍に増加）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['eiji'] = {
    init: function(stg, canvas) { 
        const dpr = window.devicePixelRatio || 1;
        
        // 制限時間（120秒 = 7200フレーム）
        stg.timeLimit = 7200; 
        
        // ★追加：撃破数カウンターの初期化
        stg.playerKills = 0;
        stg.cpuKills = 0;

        // 衛二（CPU）のステータス
        stg.cpuX = (canvas.width/dpr) * 0.7; // 右側に配置
        stg.cpuY = (canvas.height/dpr) * 0.8;
        stg.cpuBullets = [];
        stg.cpuTimer = 0;

        // 背景スクロール用雲（シームレス背景の上に重ねる演出）
        stg.clouds = [];
        for (let i=0; i<15; i++) {
            stg.clouds.push({ x: Math.random()*(canvas.width/dpr), y: Math.random()*(canvas.height/dpr), size: Math.random()*80+40, speed: Math.random()*3+2, opacity: Math.random()*0.15+0.05 });
        }

        // STGManager の描画メソッドをモンキーパッチして、UIとCPUを最前面に描画
        stg.origDraw = stg.draw.bind(stg);
        stg.draw = function(ctx) {
            // ★追加：パワーアップアイテム（P）のみ強制削除する特別ルール
            this.items = this.items.filter(it => it.type !== 'power');

            this.origDraw(ctx); // 元の描画（背景、敵、自機など）
            
            const sW = canvas.width/dpr;
            const sH = canvas.height/dpr;

            ctx.save();
            // --- CPU（衛二）の描画 ---
            if (!this.isTimeStopped && this.timeLimit > 0) {
                const eijiImg = (this.advManager && this.advManager.assets) ? this.advManager.assets['playereiji.png'] : null;
                if (eijiImg && eijiImg.naturalHeight > 0) {
                    const drawWidth = 55;
                    const drawHeight = drawWidth * (eijiImg.naturalHeight / eijiImg.naturalWidth);
                    ctx.drawImage(eijiImg, this.cpuX - drawWidth/2, this.cpuY - drawHeight/2, drawWidth, drawHeight);
                } else {
                    // フォールバック
                    ctx.fillStyle = '#0055ff'; ctx.beginPath();
                    ctx.moveTo(this.cpuX, this.cpuY - 20); ctx.lineTo(this.cpuX - 20, this.cpuY + 20); ctx.lineTo(this.cpuX + 20, this.cpuY + 20);
                    ctx.fill();
                }
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.beginPath(); ctx.arc(this.cpuX, this.cpuY, 4, 0, Math.PI*2); ctx.fill();
            }

            // --- CPUの弾描画 ---
            this.cpuBullets.forEach(b => {
                ctx.fillStyle = b.color;
                ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI*2); ctx.fill();
            });

            // --- UIの描画（タイマーと撃破数スコア） ---
            // 1. 制限時間タイマー
            ctx.fillStyle = this.timeLimit < 600 ? '#ff3366' : '#fff';
            ctx.font = 'bold 24px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`TIME: ${Math.ceil(this.timeLimit / 60)}`, 20, 35);

            // 2. 撃破数ボード（中央に縦積み）
            const boardW = 200;
            const boardH = 60;
            const boardX = sW / 2 - boardW / 2; // 画面中央
            const boardY = 55;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(boardX, boardY, boardW, boardH);
            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
            ctx.strokeRect(boardX, boardY, boardW, boardH);

            ctx.font = 'bold 16px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            
            // ★修正：護の撃破数を表示
            ctx.fillStyle = '#33ccff';
            ctx.fillText(`護(YOU) : ${this.playerKills} 撃破`, boardX + 15, boardY + 25);
            
            // ★修正：衛二の撃破数を表示
            ctx.fillStyle = '#0055ff';
            ctx.fillText(`衛二(CPU) : ${this.cpuKills} 撃破`, boardX + 15, boardY + 48);
            
            ctx.restore();
        };
    },
    
    updateBackground: function(stg, sW, sH) {
        // 雲の更新
        stg.clouds.forEach(c => { c.y += c.speed; if(c.y > sH + c.size) { c.y = -c.size; c.x = Math.random() * sW; } });
    },

    drawBackground: function(stg, ctx, sW, sH) {
        let bgImg = (stg.advManager && stg.advManager.assets) ? stg.advManager.assets['nightmtstg.png'] : null;
        let loadFailed = false;

        if (!bgImg || bgImg.naturalWidth === 0) {
            bgImg = (stg.advManager && stg.advManager.assets) ? stg.advManager.assets['nightmt.png'] : null;
            loadFailed = true;
        }

        if (bgImg && bgImg.naturalWidth > 0) {
            const imgRatio = bgImg.height / bgImg.width;
            const drawW = sW;
            const drawH = sW * imgRatio;
            const speed = 1.5; 
            const cycle = drawH * 2; 
            const offset = (stg.stageTimer * speed) % cycle;
            let startY = offset - cycle;

            ctx.save();
            for (let i = 0; i < 4; i++) {
                let y = startY + (i * drawH);
                if (y > sH || y + drawH < 0) continue; 
                ctx.save();
                if (i % 2 === 1) {
                    ctx.translate(0, y + drawH);
                    ctx.scale(1, -1);
                    ctx.drawImage(bgImg, 0, 0, drawW, drawH);
                } else {
                    ctx.translate(0, y);
                    ctx.drawImage(bgImg, 0, 0, drawW, drawH);
                }
                ctx.restore();
            }
            ctx.restore();
            
            ctx.fillStyle = 'rgba(10, 10, 25, 0.4)';
            ctx.fillRect(0, 0, sW, sH);

            if (loadFailed) {
                ctx.fillStyle = '#ff3366';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText("⚠ nightmtstg.png読込失敗", 10, 20);
            }
        } else { 
            ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, sW, sH); 
        }
        
        stg.clouds.forEach(c => { ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`; ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI*2); ctx.fill(); });
    },

    getEnemyData: function(type) {
        const initShiki = (e, colIndex) => {
            e.draw = function(ctx) {
                const img = (this.advManager && this.advManager.assets) ? this.advManager.assets['shiki.png'] : null;
                ctx.save(); ctx.translate(this.x, this.y);
                if (this.angle) ctx.rotate(this.angle);
                if (img && img.naturalWidth > 0) {
                    const sw = img.width / 4; const sh = img.height / 1;
                    const drawW = this.size * 2; const drawH = drawW * (sh / sw);
                    if (this.isDying && this.deathTimer >= 60) ctx.globalAlpha = Math.max(0, 1.0 - (this.deathTimer - 60) / 120); 
                    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
                    ctx.drawImage(img, colIndex * sw, 0, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                } else {
                    ctx.fillStyle = '#ff5500'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            };
        };
        if (type === 'shiki_a') return { imgSrc: 'shiki.png', size: 25, hp: 2, init: (e) => { initShiki(e, 0); } };
        if (type === 'shiki_b') return { imgSrc: 'shiki.png', size: 30, hp: 6, init: (e) => { initShiki(e, 1); } };
        if (type === 'shiki_c') return { imgSrc: 'shiki.png', size: 35, hp: 3, init: (e) => { initShiki(e, 2); } };
    },

    updateWaves: function(stg, timer, sW, sH) {
        if (stg.isTimeStopped) return;

        stg.timeLimit--;

        // ★追加：自機の撃破数をカウントするため、毎フレーム敵のHP変動を監視
        stg.enemies.forEach(e => {
            if (e._prevHp === undefined) e._prevHp = e.hp;
            if (e._prevHp > 0 && e.hp <= 0) {
                // CPUが倒したフラグが立っていなければ、自機（またはボム）による撃破とみなす
                if (!e._killedByCpu) {
                    stg.playerKills++;
                }
            }
            e._prevHp = e.hp;
        });

        if (stg.timeLimit > 0) {
            // ★修正：敵の出現数を2倍にするため、フレーム間隔を半分に短縮
            if (stg.frame % 30 === 0) {
                let e = new Enemy('shiki_a', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId);
                e.angleToCenter = Math.atan2((sH / 2) - (-50), (sW / 2) - e.x);
                stg.enemies.push(e);
            }
            if (stg.frame % 50 === 0) {
                stg.enemies.push(new Enemy('shiki_b', Math.random() * sW, -30, stg.player.charData, stg.advManager, stg.stgId));
            }
            if (stg.frame % 75 === 0) {
                stg.enemies.push(new Enemy('shiki_c', Math.random() * (sW - 100) + 50, -40, stg.player.charData, stg.advManager, stg.stgId));
            }
        }

        stg.cpuTimer++;
        stg.cpuY = sH * 0.8 + Math.sin(stg.cpuTimer * 0.05) * 20;
        
        let target = null;
        let minDist = Infinity;
        stg.enemies.forEach(e => {
            if(e.alive && !e.isDying) {
                let d = Math.hypot(e.x - stg.cpuX, e.y - stg.cpuY);
                if (d < minDist) { minDist = d; target = e; }
            }
        });
        if (target) {
            stg.cpuX += Math.sign(target.x - stg.cpuX) * 4; 
        }

        if (stg.cpuX < 30) stg.cpuX = 30;
        if (stg.cpuX > sW - 30) stg.cpuX = sW - 30;

        // ★修正：衛二の攻撃頻度と手数を増やし、敵倍増に対応できる強さに調整
        if (stg.cpuTimer % 8 === 0) {
            stg.cpuBullets.push({ x: stg.cpuX - 15, y: stg.cpuY - 20, vx: 0, vy: -15, size: 6, color: '#0055ff', alive: true });
            stg.cpuBullets.push({ x: stg.cpuX + 15, y: stg.cpuY - 20, vx: 0, vy: -15, size: 6, color: '#0055ff', alive: true });
            stg.cpuBullets.push({ x: stg.cpuX, y: stg.cpuY - 20, vx: -4, vy: -15, size: 6, color: '#0055ff', alive: true });
            stg.cpuBullets.push({ x: stg.cpuX, y: stg.cpuY - 20, vx: 4, vy: -15, size: 6, color: '#0055ff', alive: true });
        }

        stg.cpuBullets.forEach(b => {
            b.x += b.vx; b.y += b.vy;
            if (b.y < -50) b.alive = false;

            stg.enemies.forEach(e => {
                if (b.alive && e.alive && !e.isDying && Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                    b.alive = false; 
                    e.hp--;
                    if (e.hp <= 0) {
                        e.alive = false; 
                        stg.cpuKills++; // ★修正：スコアではなく撃破数を加算
                        e._killedByCpu = true; // ★追加：CPUが倒したマークを付ける
                        stg.explosions.push(new Explosion(e.x, e.y, e.size * 2, stg.advManager));
                        if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                    }
                }
            });
        });
        stg.cpuBullets = stg.cpuBullets.filter(b => b.alive);

        if (stg.timeLimit <= 0 && !stg.isTimeStopped) {
            stg.isTimeStopped = true;
            
            stg.enemies = []; stg.enemyBullets = [];
            
            // ★修正：勝敗判定をスコアから撃破数に変更
            if (stg.playerKills >= stg.cpuKills) {
                stg.isStageClear = true; 
            } else {
                let charId = stg.player.id || 'mamoru';
                let lossAdv = [];
                try {
                    lossAdv = window.scenarios[charId][1].loss_adv || [];
                } catch(e) {}

                window.startMidStgADV(lossAdv, () => {
                    stg.player.hp = 0; 
                    stg.isTimeStopped = false;
                });
            }
        }
    },

    updateEnemy: function(e, canvas, player) {
        e.moveTimer = (e.moveTimer || 0) + 1; 
        if (e.type === 'shiki_a') {
            e.x += Math.cos(e.angleToCenter) * 1.5;
            e.y += Math.sin(e.angleToCenter) * 1.5;
            e.angle = e.angleToCenter - Math.PI / 2;
        } 
        else if (e.type === 'shiki_b') {
            e.x += Math.sin(e.moveTimer * 0.1) * 3;
            e.y += 2.0 + Math.cos(e.moveTimer * 0.15) * 1.5;
        } 
        else if (e.type === 'shiki_c') {
            e.y += 4.5;
        } 
    },

    shootEnemy: function(e, stg) {
        const targetX = (Math.abs(stg.player.x - e.x) < Math.abs(stg.cpuX - e.x)) ? stg.player.x : stg.cpuX;
        const targetY = (Math.abs(stg.player.x - e.x) < Math.abs(stg.cpuX - e.x)) ? stg.player.y : stg.cpuY;

        if (e.type === 'shiki_a' && stg.frame % 80 === 0) {
            const ang = Math.atan2(targetY - e.y, targetX - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#ff5500')); 
        } 
        else if (e.type === 'shiki_b' && stg.frame % 60 === 0) {
            const rAng = Math.random() * Math.PI * 2;
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(rAng)*2, Math.sin(rAng)*2, '#ff33cc')); 
        } 
    }
};
