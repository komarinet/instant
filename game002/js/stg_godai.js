const VER_STG_GODAI = "0.2.0"; // バージョン更新（新敵画像対応、固有の動き、尺を4500フレームに延長）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['godai'] = {
    init: function(stg, canvas) { 
        stg.bossSpawned = false; 
        
        if (window._bgManagerInstance && typeof window._bgManagerInstance.setStage === 'function') {
            window._bgManagerInstance.setStage(5);
        } else if (window._bgManagerInstance) {
            window._bgManagerInstance.currentStage = 5;
        }
    },
    updateBackground: function(stg, sW, sH) {
        // 3D背景側で処理するためここでは空
    },
    drawBackground: function(stg, ctx, sW, sH) {
        // キャンバス側で描く背景があれば（宇宙なので基本は3D側に任せる）
    },
    getEnemyData: function(type) {
        // ★修正：新しく登録した画像と、それぞれの特性（サイズ・HP）を設定
        if (type === 'gtypea') return { imgSrc: 'gtypea.png', size: 22, hp: 3, maxHp: 3 };
        if (type === 'gtypeb') return { imgSrc: 'gtypeb.png', size: 30, hp: 8, maxHp: 8 };
        if (type === 'gtypec') return { imgSrc: 'gtypec.png', size: 26, hp: 5, maxHp: 5 };
        if (type === 'gtypeboss') return { imgSrc: 'gtypeboss.png', size: 140, hp: 500, maxHp: 500, isBoss: true };
    },

    updateWaves: function(stg, timer, sW, sH) {
        // ★修正：ボスまでの尺を4500フレームに延長し、ウェーブ構成を構築
        // 前半 (100〜1500)
        if (timer > 100 && timer < 1500) {
            if (timer % 60 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 200 === 0) stg.enemies.push(new Enemy('gtypeb', sW * 0.2 + Math.random() * sW * 0.6, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        // 中盤 (1500〜3000)
        if (timer > 1500 && timer < 3000) {
            if (timer % 80 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 120 === 0) stg.enemies.push(new Enemy('gtypeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        // 後半 (3000〜4400)
        if (timer > 3000 && timer < 4400) {
            if (timer % 70 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 100 === 0) stg.enemies.push(new Enemy('gtypeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 110 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        // ボス登場 (4500)
        if (timer === 4500 && !stg.bossSpawned) {
            stg.enemies.push(new Enemy('gtypeboss', sW/2, -150, stg.player.charData, stg.advManager, stg.stgId));
            stg.bossSpawned = true;
        }
    },

    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        e.moveTimer = (e.moveTimer || 0) + 1;
        
        // ★修正：それぞれに異なる個性的な動きを付与
        if (e.type === 'gtypea') { 
            // 波打ちながら高速で突っ込んでくる
            e.y += 4.5; 
            e.x += Math.sin(e.moveTimer * 0.05) * 5; 
        } 
        else if (e.type === 'gtypeb') { 
            // 画面上部で一旦停止して左右移動、長時間居座ったら画面下へ離脱
            if (e.y < canvas.height/dpr * 0.25) {
                e.y += 3;
            } else {
                e.x += Math.cos(e.moveTimer * 0.02) * 2;
                if (e.moveTimer > 300) e.y += 2.5; 
            }
        }
        else if (e.type === 'gtypec') { 
            // 自機に向かってホーミング気味に斜めに飛ぶ
            e.y += 3.5; 
            if (e.y < canvas.height/dpr * 0.7) {
                e.x += (player.x - e.x) * 0.02; 
            }
        }
        else if (e.type === 'gtypeboss') {
            const tY = canvas.height/dpr * 0.22; 
            if (e.y < tY) {
                e.y += (tY - e.y) * 0.02;
            } else {
                // 威圧感のある「8の字」のゆっくりとした移動
                e.x = canvas.width/dpr/2 + Math.sin(e.moveTimer * 0.015) * (canvas.width/dpr * 0.35);
                e.y = tY + Math.sin(e.moveTimer * 0.03) * 20;
            }
        }
    },

    shootEnemy: function(e, stg) {
        if (e.type === 'gtypea' && e.moveTimer % 50 === 0) {
            stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 6, '#ff4400'));
        }
        else if (e.type === 'gtypeb') {
            // 画面中段で止まっている間だけ3WAYを撃つ
            if (e.moveTimer > 100 && e.moveTimer % 90 === 0 && e.moveTimer < 300) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i = -1; i <= 1; i++) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.25)*4, Math.sin(ang + i*0.25)*4, '#ffaa00'));
                }
            }
        }
        else if (e.type === 'gtypec' && e.moveTimer % 70 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*5, Math.sin(ang)*5, '#00ffff'));
        }
        else if (e.type === 'gtypeboss') {
            // ボスの激しい弾幕パターン
            if (stg.frame % 35 === 0) {
                for(let i=0; i<16; i++) {
                    const ang = i * Math.PI * 2 / 16 + stg.frame * 0.02;
                    stg.enemyBullets.push(new Bullet(e.x, e.y + 30, Math.cos(ang)*4.5, Math.sin(ang)*4.5, '#ff0055'));
                }
            }
            if (stg.frame % 100 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i=-2; i<=2; i++) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y + 30, Math.cos(ang + i*0.15)*7, Math.sin(ang + i*0.15)*7, '#ffff00'));
                }
            }
        }
    }
};
