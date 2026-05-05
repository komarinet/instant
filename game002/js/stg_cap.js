const VER_STG_CAP = "0.8.0"; // バージョン更新（コアを2Dボスに変更、背景の床暗闇化を実装）

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
        // ★修正：コアを2Dボスとして設定。画像とサイズ（当たり判定）を付与
        if (type === 'capboss') return { imgSrc: 'core_reactor.png', size: 60, hp: 1500, maxHp: 1500, isBoss: true };
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
                        // ★修正：床を暗闇（非表示）にし、3Dのコアも非表示にする（2Dボスとして出すため）
                        if (window._bgManagerInstance.coreFloorLeft) window._bgManagerInstance.coreFloorLeft.visible = false;
                        if (window._bgManagerInstance.coreFloorRight) window._bgManagerInstance.coreFloorRight.visible = false;
                        if (window._bgManagerInstance.coreReactor) window._bgManagerInstance.coreReactor.visible = false;
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
            
            // ★修正：壁だけが流れる中で少しザコと戦う（尺を少し短縮してテンポ調整）
            if (stg.phaseTimer > 0 && stg.phaseTimer < 700) {
                if (stg.phaseTimer % 60 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (stg.phaseTimer % 120 === 0) stg.enemies.push(new Enemy('gtypee', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (stg.phaseTimer % 90 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
            
            // ★修正：コアが2Dボスとして上から登場
            if (stg.phaseTimer === 800) {
                let boss = new Enemy('capboss', sW/2, -150, stg.player.charData, stg.advManager, stg.stgId);
                // カスタムdrawを削除し、stg_core.jsの共通描画（画像＋HPバー）に任せる
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
            // ★修正：固定位置ではなく、上から降りてきて揺れる動きを追加
            const tY = canvas.height/dpr * 0.25;
            if (e.y < tY) {
                e.y += (tY - e.y) * 0.02;
            } else {
                e.x = canvas.width/dpr/2 + Math.sin(e.moveTimer * 0.01) * 30;
                e.y = tY + Math.sin(e.moveTimer * 0.015) * 10;
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
                    stg.enemyBullets.push(new Bullet(e.x, e.y + 40, Math.cos(ang + offset)*3, Math.sin(ang + offset)*3, '#ff0000')); 
                    stg.enemyBullets.push(new Bullet(e.x, e.y + 40, Math.cos(-ang + offset)*3, Math.sin(-ang + offset)*3, '#ff8800')); 
                }
            }
            if (stg.frame % 120 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i=-2; i<=2; i++) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y + 40, Math.cos(ang + i*0.15)*4.5, Math.sin(ang + i*0.15)*4.5, '#ffffff'));
                }
            }
        }
    }
};
