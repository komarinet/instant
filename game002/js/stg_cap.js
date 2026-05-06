const VER_STG_CAP = "0.8.7"; // バージョン更新（3Dコアが画面外上部に消えてしまう座標計算ミスを完全修正）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['final'] = {
    init: function(stg, canvas) { 
        stg.phase = 1; // 1:トレンチ, 2:中ボス待ち, 3:壁スクロール＆ザコ, 4:コアボス
        stg.phaseTimer = 0;
        stg.coreTransitioned = false; 
        
        if (window._bgManagerInstance && typeof window._bgManagerInstance.setStage === 'function') {
            window._bgManagerInstance.setStage(6);
        } else if (window._bgManagerInstance) {
            window._bgManagerInstance.currentStage = 6;
        }
    },
    updateBackground: function(stg, sW, sH) {},
    drawBackground: function(stg, ctx, sW, sH) {},
    getEnemyData: function(type) {
        if (type === 'gtypea') return { imgSrc: 'gtypea.png', size: 22, hp: 2, maxHp: 2 };
        if (type === 'gtypeb') return { imgSrc: 'gtypeb.png', size: 30, hp: 5, maxHp: 5 };
        if (type === 'gtypec') return { imgSrc: 'gtypec.png', size: 26, hp: 3, maxHp: 3 };
        if (type === 'gtyped') return { imgSrc: 'gtyped.png', size: 25, hp: 8, maxHp: 8 };
        if (type === 'gtypee') return { imgSrc: 'gtypee.png', size: 28, hp: 10, maxHp: 10 };
        
        if (type === 'gtypeboss') return { imgSrc: 'gtypeboss.png', size: 45, hp: 150, maxHp: 150, isBoss: true };
        // 画像はnull（3Dコアに任せる）、当たり判定（サイズ60）を持たせる
        if (type === 'capboss') return { imgSrc: null, size: 60, hp: 1500, maxHp: 1500, isBoss: true };
    },

    updateWaves: function(stg, timer, sW, sH) {
        if (stg.phase === 1) {
            if (timer > 100 && timer < 2500) {
                if (timer % 60 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (timer % 150 === 0) stg.enemies.push(new Enemy('gtypeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (timer > 500 && timer % 120 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                
                if (timer % 180 === 0) {
                    const isLeft = Math.random() > 0.5;
                    const xPos = isLeft ? sW * 0.15 : sW * 0.85; 
                    stg.enemies.push(new Enemy('gtyped', xPos, -50, stg.player.charData, stg.advManager, stg.stgId));
                }
                if (timer > 800 && timer % 250 === 0) {
                    const xPos = sW * 0.2 + Math.random() * sW * 0.6;
                    stg.enemies.push(new Enemy('gtypee', xPos, -50, stg.player.charData, stg.advManager, stg.stgId));
                }
            }
            if (timer === 2600) {
                let b1 = new Enemy('gtypeboss', sW * 0.25, -100, stg.player.charData, stg.advManager, stg.stgId);
                let b2 = new Enemy('gtypeboss', sW * 0.75, -100, stg.player.charData, stg.advManager, stg.stgId);
                b1.startX = sW * 0.25; b2.startX = sW * 0.75;
                stg.enemies.push(b1, b2);
                stg.phase = 2;
                stg.phaseTimer = 0;
            }
        }
        
        else if (stg.phase === 2) {
            let bossAlive = stg.enemies.some(e => e.type === 'gtypeboss');
            if (!bossAlive && !stg.isTimeStopped) {
                stg.phaseTimer++;
                if (stg.phaseTimer === 60 && !stg.coreTransitioned) {
                    if (window._bgManagerInstance) {
                        if (typeof window._bgManagerInstance.transitionToCore === 'function') {
                            window._bgManagerInstance.transitionToCore(); 
                        }
                        // 床だけを非表示にする
                        if (window._bgManagerInstance.coreFloorLeft) window._bgManagerInstance.coreFloorLeft.visible = false;
                        if (window._bgManagerInstance.coreFloorRight) window._bgManagerInstance.coreFloorRight.visible = false;
                    }
                    stg.coreTransitioned = true;
                }
                if (stg.phaseTimer === 180) {
                    stg.phase = 3;
                    stg.phaseTimer = 0;
                }
            }
        }
        
        else if (stg.phase === 3) {
            stg.phaseTimer++;
            
            if (stg.phaseTimer > 0 && stg.phaseTimer < 700) {
                if (stg.phaseTimer % 60 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (stg.phaseTimer % 120 === 0) stg.enemies.push(new Enemy('gtypee', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (stg.phaseTimer % 90 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
            
            if (stg.phaseTimer === 800) {
                let boss = new Enemy('capboss', sW/2, sH + 100, stg.player.charData, stg.advManager, stg.stgId);
                // HPバーだけを描画
                boss.draw = function(ctx) {
                    ctx.save(); ctx.translate(this.x, this.y);
                    if (this.hp > 0 && !this.isDying) {
                        const bW = 100, bH = 10;
                        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bW/2, -this.size-20, bW, bH);
                        ctx.fillStyle = '#ff3366'; ctx.fillRect(-bW/2, -this.size-20, bW*(Math.max(0, this.hp)/this.maxHp), bH);
                        ctx.strokeStyle = '#fff'; ctx.strokeRect(-bW/2, -this.size-20, bW, bH);
                    }
                    ctx.restore();
                };
                stg.enemies.push(boss);
                stg.phase = 4; 
            }
        }
    },

    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        e.moveTimer = (e.moveTimer || 0) + 1;
        
        if (e.type === 'gtypea') { 
            e.y += 3.5; e.x += Math.sin(e.moveTimer * 0.05) * 3; 
        } 
        else if (e.type === 'gtypeb') { 
            if (e.y < canvas.height/dpr * 0.2) e.y += 3;
            else { e.x += Math.cos(e.moveTimer * 0.03) * 2.5; if (e.moveTimer > 250) e.y -= 2; }
        }
        else if (e.type === 'gtypec') { 
            e.y += 2.5; if (e.y < canvas.height/dpr * 0.8) e.x += (player.x - e.x) * 0.025; 
        }
        else if (e.type === 'gtyped' || e.type === 'gtypee') {
            e.y += 2.5; 
        }
        else if (e.type === 'gtypeboss') {
            const tY = canvas.height/dpr * 0.2;
            if (e.y < tY) {
                e.y += (tY - e.y) * 0.02;
            } else {
                e.x = e.startX + Math.sin(e.moveTimer * 0.02) * 50;
            }
        }
        else if (e.type === 'capboss') {
            const tY = canvas.height/dpr * 0.25;
            const startY = canvas.height/dpr + 100;
            
            if (e.y > tY) {
                e.y += (tY - e.y) * 0.02; // 奥から定位置へ移動
            } else {
                e.x = canvas.width/dpr/2 + Math.sin(e.moveTimer * 0.015) * 80;
            }

            // 3D側のコアの座標を2Dの動きと完全に同期させる
            if (window._bgManagerInstance && window._bgManagerInstance.coreReactor) {
                const cx = canvas.width/dpr/2;
                window._bgManagerInstance.coreReactor.position.x = (e.x - cx) * 0.8; 
                
                let yRatio = (e.y - tY) / (startY - tY);
                if (yRatio < 0) yRatio = 0;
                if (yRatio > 1) yRatio = 1;
                
                // ★修正：カメラアングル（-72度）に合わせた正しいY座標に補正。これで確実に画面内に映ります。
                window._bgManagerInstance.coreReactor.position.y = -340 - (yRatio * 1000);
            }
        }
    },

    shootEnemy: function(e, stg) {
        if (e.type === 'gtypea' && e.moveTimer % 45 === 0) {
            stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 7, '#ff0000'));
        }
        else if (e.type === 'gtypeb' && e.moveTimer > 50 && e.moveTimer % 80 === 0 && e.moveTimer < 250) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            for(let i = -1; i <= 1; i++) stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.2)*5, Math.sin(ang + i*0.2)*5, '#ffaa00'));
        }
        else if (e.type === 'gtypec' && e.moveTimer % 60 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*6, Math.sin(ang)*6, '#00ffff'));
        }
        else if (e.type === 'gtyped' && e.moveTimer % 40 === 0) { 
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*8, Math.sin(ang)*8, '#ff5500'));
        }
        else if (e.type === 'gtypee' && e.moveTimer % 120 === 0) { 
            for(let i=0; i<8; i++) {
                const ang = i * Math.PI * 2 / 8;
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*4, Math.sin(ang)*4, '#ff00ff'));
            }
        }
        else if (e.type === 'gtypeboss' && e.moveTimer % 60 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*5, Math.sin(ang)*5, '#ff5500'));
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang+0.2)*5, Math.sin(ang+0.2)*5, '#ff5500'));
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang-0.2)*5, Math.sin(ang-0.2)*5, '#ff5500'));
        }
        else if (e.type === 'capboss') {
            if (stg.frame % 30 === 0) {
                const ang = stg.frame * 0.05;
                for(let i=0; i<4; i++) {
                    const offset = i * Math.PI / 2;
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + offset)*3, Math.sin(ang + offset)*3, '#ff0000')); 
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(-ang + offset)*3, Math.sin(-ang + offset)*3, '#ff8800')); 
                }
            }
            if (stg.frame % 120 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i=-2; i<=2; i++) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.15)*4.5, Math.sin(ang + i*0.15)*4.5, '#ffffff'));
                }
            }
        }
    }
};
