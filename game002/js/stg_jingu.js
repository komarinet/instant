const VER_STG_JINGU = "0.1.0"; // バージョン更新（ステージ4：家電ザコ敵とロボットボスの実装、背景の上下反転シームレススクロール）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['jingu'] = {
    init: function(stg, canvas) { 
        stg.bossSpawned = false; 
        stg.bgScrollY = 0; 
    },
    updateBackground: function(stg, sW, sH) {
        stg.bgScrollY += 1.5; 
        if (stg.bgScrollY >= sH) stg.bgScrollY = 0;
    },
    drawBackground: function(stg, ctx, sW, sH) {
        const bgImg = stg.advManager?.assets['snow.png'];
        if (bgImg && bgImg.naturalWidth > 0) {
            ctx.save();
            // 上下逆さまにして描画
            ctx.translate(0, sH);
            ctx.scale(1, -1);
            
            // シームレスにつなぐ
            ctx.drawImage(bgImg, 0, -stg.bgScrollY, sW, sH);
            ctx.drawImage(bgImg, 0, -stg.bgScrollY + sH, sW, sH);
            ctx.restore();
        } else {
            ctx.fillStyle = '#112233'; 
            ctx.fillRect(0, 0, sW, sH);
        }
    },
    getEnemyData: function(type) {
        if (type === 'rei') return { imgSrc: 'rei.png', size: 30, hp: 12, maxHp: 12 };
        if (type === 'renji') return { imgSrc: 'renji.png', size: 25, hp: 8, maxHp: 8 };
        if (type === 'sui') return { imgSrc: 'sui.png', size: 15, hp: 3, maxHp: 3 };
        if (type === 'tv') return { imgSrc: 'tv.png', size: 25, hp: 6, maxHp: 6 };
        if (type === 'robotboss') return { imgSrc: 'robot.png', size: 120, hp: 250, maxHp: 250 };
    },
    updateWaves: function(stg, timer, sW, sH) {
        // 前半 (100〜1500フレーム): sui, rei 多め
        if (timer > 100 && timer < 1500) {
            if (timer % 60 === 0) stg.enemies.push(new Enemy('sui', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 200 === 0) stg.enemies.push(new Enemy('rei', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        
        // 中盤 (1500〜3000フレーム): tv, renji 多め
        if (timer > 1500 && timer < 3000) {
            if (timer % 100 === 0) stg.enemies.push(new Enemy('renji', sW * 0.1 + Math.random() * sW * 0.8, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 150 === 0) stg.enemies.push(new Enemy('tv', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        
        // 後半 (3000〜4500フレーム): 全家電ミックス
        if (timer > 3000 && timer < 4500) {
            if (timer % 90 === 0) stg.enemies.push(new Enemy('sui', sW * 0.2 + Math.random() * sW * 0.6, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 120 === 0) stg.enemies.push(new Enemy('renji', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 180 === 0) stg.enemies.push(new Enemy('rei', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 250 === 0) stg.enemies.push(new Enemy('tv', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        
        // ボス登場 (4800フレーム)
        if (timer === 4800 && !stg.bossSpawned) {
            stg.enemies.push(new Enemy('robotboss', sW / 2, -150, stg.player.charData, stg.advManager, stg.stgId)); 
            stg.bossSpawned = true;
        }
    },
    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        e.angle += 0.05;
        
        if (e.type === 'rei') { 
            e.y += 1.5; // 冷蔵庫は重くて遅い
        } 
        else if (e.type === 'renji') { 
            e.y += 2.5; 
            e.x += Math.sin(e.angle * 0.5) * 2; // 電子レンジは少し揺れる
        }
        else if (e.type === 'sui') { 
            e.y += 4; // 炊飯器は速い
            if (e.y < canvas.height/dpr * 0.6) e.x += (player.x - e.x) * 0.015; // 少し自機を狙う
        }
        else if (e.type === 'tv') { 
            if (e.y < canvas.height/dpr * 0.25) e.y += 3; 
            else e.moveTimer++; // テレビは途中で止まる
        }
        else if (e.type === 'robotboss') {
            const tY = canvas.height/dpr * 0.2; 
            if (e.y < tY) e.y += (tY - e.y) * 0.02;
            e.x = canvas.width/dpr/2 + Math.sin(e.angle * 0.5) * (canvas.width/dpr * 0.3);
        }
    },
    shootEnemy: function(e, stg) {
        if (e.type === 'renji' && stg.frame % 80 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            for(let i=-1; i<=1; i++) stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.3)*4, Math.sin(ang + i*0.3)*4, '#ff9900'));
        } 
        else if (e.type === 'sui' && stg.frame % 60 === 0) {
            // お米弾（白い弾）
            stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 5, '#ffffff'));
        }
        else if (e.type === 'tv' && e.moveTimer > 0 && e.moveTimer % 100 === 0) {
            // 電波リング弾
            for (let i = 0; i < 12; i++) {
                const ang = i * Math.PI * 2 / 12 + stg.frame * 0.01;
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#00ffff'));
            }
        }
        else if (e.type === 'robotboss') {
            if (stg.frame % 20 === 0) {
                for (let i = 0; i < 16; i++) {
                    const ang = i * Math.PI * 2 / 16 + stg.frame * 0.02;
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*5, Math.sin(ang)*5, '#ff3366'));
                }
            }
            if (stg.frame % 60 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i=-2; i<=2; i++) stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.15)*7, Math.sin(ang + i*0.15)*7, '#ffcc00'));
            }
        }
    }
};
