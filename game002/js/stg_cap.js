const VER_STG_CAP = "0.1.0"; // 最終ステージ（科学文明軍リーダー）新規作成

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['final'] = {
    init: function(stg, canvas) { 
        stg.bossSpawned = false; 
        stg.coreTransitioned = false; // コア突入フラグ
        
        // 3D背景側に「ステージ6（最終面）」の表示を指令
        if (window._bgManagerInstance && typeof window._bgManagerInstance.setStage === 'function') {
            window._bgManagerInstance.setStage(6);
        } else if (window._bgManagerInstance) {
            window._bgManagerInstance.currentStage = 6;
        }
    },
    updateBackground: function(stg, sW, sH) {
        // 3D背景側で処理するためここでは空
    },
    drawBackground: function(stg, ctx, sW, sH) {
        // キャンバス側で描く背景があれば（基本は3D側に任せる）
    },
    getEnemyData: function(type) {
        if (type === 'gtypea') return { imgSrc: 'gtypea.png', size: 22, hp: 3, maxHp: 3 };
        if (type === 'gtypeb') return { imgSrc: 'gtypeb.png', size: 30, hp: 8, maxHp: 8 };
        if (type === 'gtypec') return { imgSrc: 'gtypec.png', size: 26, hp: 5, maxHp: 5 };
        // ★新規追加：固定砲台
        if (type === 'gtyped') return { imgSrc: 'gtyped.png', size: 25, hp: 12, maxHp: 12 };
        if (type === 'gtypee') return { imgSrc: 'gtypee.png', size: 28, hp: 18, maxHp: 18 };
        // ★STG用ボス機体（capboss.pngをご用意ください）
        if (type === 'capboss') return { imgSrc: 'capboss.png', size: 130, hp: 1000, maxHp: 1000, isBoss: true };
    },

    updateWaves: function(stg, timer, sW, sH) {
        // 0〜4000：トレンチ（溝）の激しい防衛線を突破
        if (timer > 100 && timer < 4000) {
            // 飛行部隊
            if (timer % 60 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 150 === 0) stg.enemies.push(new Enemy('gtypeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer > 1000 && timer % 120 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            
            // 固定砲台（背景と同じ速度でスクロールしてくる）
            if (timer % 180 === 0) {
                // 左壁か右壁の近くに配置
                const isLeft = Math.random() > 0.5;
                const xPos = isLeft ? sW * 0.1 : sW * 0.9;
                stg.enemies.push(new Enemy('gtyped', xPos, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
            if (timer > 1500 && timer % 250 === 0) {
                const xPos = sW * 0.2 + Math.random() * sW * 0.6;
                stg.enemies.push(new Enemy('gtypee', xPos, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
        }

        // コア突入演出（4200フレーム）
        if (timer === 4200 && !stg.coreTransitioned) {
            if (window._bgManagerInstance && typeof window._bgManagerInstance.transitionToCore === 'function') {
                window._bgManagerInstance.transitionToCore(); // 3D背景の壁を開く
            }
            stg.coreTransitioned = true;
        }

        // ボス登場 (4500フレーム)
        if (timer === 4500 && !stg.bossSpawned) {
            stg.enemies.push(new Enemy('capboss', sW/2, -150, stg.player.charData, stg.advManager, stg.stgId));
            stg.bossSpawned = true;
        }
    },

    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        e.moveTimer = (e.moveTimer || 0) + 1;
        
        if (e.type === 'gtypea') { 
            e.y += 5; e.x += Math.sin(e.moveTimer * 0.1) * 3; 
        } 
        else if (e.type === 'gtypeb') { 
            if (e.y < canvas.height/dpr * 0.2) e.y += 3;
            else { e.x += Math.cos(e.moveTimer * 0.03) * 2.5; if (e.moveTimer > 250) e.y -= 2; }
        }
        else if (e.type === 'gtypec') { 
            e.y += 4; if (e.y < canvas.height/dpr * 0.8) e.x += (player.x - e.x) * 0.025; 
        }
        // 固定砲台（背景と同じ速度で下にスクロールするだけ）
        else if (e.type === 'gtyped' || e.type === 'gtypee') {
            e.y += 2.5; 
        }
        else if (e.type === 'capboss') {
            const tY = canvas.height/dpr * 0.25; 
            if (e.y < tY) {
                e.y += (tY - e.y) * 0.02;
            } else {
                e.x = canvas.width/dpr/2 + Math.sin(e.moveTimer * 0.02) * (canvas.width/dpr * 0.35);
                e.y = tY + Math.cos(e.moveTimer * 0.04) * 30;
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
        else if (e.type === 'gtyped' && e.moveTimer % 40 === 0) { // 連射砲台
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*8, Math.sin(ang)*8, '#ff5500'));
        }
        else if (e.type === 'gtypee' && e.moveTimer % 120 === 0) { // 全方位ミサイルポッド
            for(let i=0; i<8; i++) {
                const ang = i * Math.PI * 2 / 8;
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*4, Math.sin(ang)*4, '#ff00ff'));
            }
        }
        else if (e.type === 'capboss') {
            // ボス（隊長）の最終鬼畜弾幕
            if (stg.frame % 20 === 0) {
                const ang = stg.frame * 0.05;
                for(let i=0; i<4; i++) {
                    const offset = i * Math.PI / 2;
                    stg.enemyBullets.push(new Bullet(e.x, e.y + 40, Math.cos(ang + offset)*5, Math.sin(ang + offset)*5, '#ff0000'));
                    stg.enemyBullets.push(new Bullet(e.x, e.y + 40, Math.cos(-ang + offset)*5, Math.sin(-ang + offset)*5, '#ff8800'));
                }
            }
            if (stg.frame % 90 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i=-3; i<=3; i++) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y + 40, Math.cos(ang + i*0.1)*8, Math.sin(ang + i*0.1)*8, '#ffffff'));
                }
            }
        }
    }
};
