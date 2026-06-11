const VER_STG_JINGU = "0.2.5"; // バージョン更新（椎名ルート時にザコ敵を2倍に増量）
 
window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['jingu'] = {
    init: function(stg, canvas) {
        stg.bossSpawned = false;
        stg.bgScrollY = 0;
    },
    updateBackground: function(stg, sW, sH) {
        stg.bgScrollY += 1.5;
        if (stg.bgScrollY >= sH * 2) {
            stg.bgScrollY -= sH * 2;
        }
    },
    drawBackground: function(stg, ctx, sW, sH) {
        const bgImg = stg.advManager?.assets['snow.webp'];
        if (bgImg && bgImg.naturalWidth > 0) {
            const y = stg.bgScrollY;
 
            ctx.drawImage(bgImg, 0, y, sW, sH);
 
            ctx.save();
            ctx.translate(0, (y - sH) + sH / 2);
            ctx.scale(1, -1);
            ctx.drawImage(bgImg, 0, -sH / 2, sW, sH);
            ctx.restore();
 
            ctx.drawImage(bgImg, 0, y - sH * 2, sW, sH);
 
        } else {
            ctx.fillStyle = '#112233';
            ctx.fillRect(0, 0, sW, sH);
        }
    },
    getEnemyData: function(type) {
        if (type === 'rei') return { imgSrc: 'rei.webp', size: 45, hp: 12, maxHp: 12 };
        if (type === 'renji') return { imgSrc: 'renji.webp', size: 38, hp: 8, maxHp: 8 };
        if (type === 'sui') return { imgSrc: 'sui.webp', size: 23, hp: 3, maxHp: 3 };
        if (type === 'tv') return { imgSrc: 'tv.webp', size: 38, hp: 6, maxHp: 6 };
       
        if (type === 'robotboss') return { imgSrc: 'robot.webp', size: 120, hp: 1000, maxHp: 1000, isBoss: true };
    },
    updateWaves: function(stg, timer, sW, sH) {
        // ★追加：自機が椎名（護）かどうかを判定し、出現数倍率を設定
        const isShiina = (stg.player.id === 'shiina' || stg.player.id === 'mamoru');
        const multiplier = isShiina ? 2 : 1;

        if (timer > 100 && timer < 1500) {
            if (timer % 60 === 0) {
                for (let i = 0; i < multiplier; i++) stg.enemies.push(new Enemy('sui', Math.random() * sW, -50 - i*30, stg.player.charData, stg.advManager, stg.stgId));
            }
            if (timer % 200 === 0) {
                for (let i = 0; i < multiplier; i++) stg.enemies.push(new Enemy('rei', Math.random() * sW, -50 - i*30, stg.player.charData, stg.advManager, stg.stgId));
            }
        }
       
        if (timer > 1500 && timer < 3000) {
            if (timer % 100 === 0) {
                for (let i = 0; i < multiplier; i++) stg.enemies.push(new Enemy('renji', sW * 0.1 + Math.random() * sW * 0.8, -50 - i*30, stg.player.charData, stg.advManager, stg.stgId));
            }
            if (timer % 150 === 0) {
                for (let i = 0; i < multiplier; i++) stg.enemies.push(new Enemy('tv', Math.random() * sW, -50 - i*30, stg.player.charData, stg.advManager, stg.stgId));
            }
        }
       
        if (timer > 3000 && timer < 4500) {
            if (timer % 90 === 0) {
                for (let i = 0; i < multiplier; i++) stg.enemies.push(new Enemy('sui', sW * 0.2 + Math.random() * sW * 0.6, -50 - i*30, stg.player.charData, stg.advManager, stg.stgId));
            }
            if (timer % 120 === 0) {
                for (let i = 0; i < multiplier; i++) stg.enemies.push(new Enemy('renji', Math.random() * sW, -50 - i*30, stg.player.charData, stg.advManager, stg.stgId));
            }
            if (timer % 180 === 0) {
                for (let i = 0; i < multiplier; i++) stg.enemies.push(new Enemy('rei', Math.random() * sW, -50 - i*30, stg.player.charData, stg.advManager, stg.stgId));
            }
            if (timer % 250 === 0) {
                for (let i = 0; i < multiplier; i++) stg.enemies.push(new Enemy('tv', Math.random() * sW, -50 - i*30, stg.player.charData, stg.advManager, stg.stgId));
            }
        }
       
        if (timer > 4500 && stg.enemies.length === 0 && !stg.bossSpawned) {
            stg.bossSpawned = true;
            stg.enemies.push(new Enemy('robotboss', sW / 2, -150, stg.player.charData, stg.advManager, stg.stgId));
        }
    },
    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        e.angle += 0.05;
       
        if (e.type === 'rei') {
            e.y += 1.5;
        }
        else if (e.type === 'renji') {
            e.y += 2.5;
            e.x += Math.sin(e.angle * 0.5) * 2;
        }
        else if (e.type === 'sui') {
            e.y += 4;
            if (e.y < canvas.height/dpr * 0.6) e.x += (player.x - e.x) * 0.015;
        }
        else if (e.type === 'tv') {
            if (e.y < canvas.height/dpr * 0.25) {
                e.y += 3;
            } else {
                e.moveTimer++;
                if (e.moveTimer > 400) {
                    e.y += 3;
                }
            }
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
            for(let i=-1; i<=1; i++) stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.3)*4, Math.sin(ang + i*0.3)*4, '#ff4400'));
        }
        else if (e.type === 'sui' && stg.frame % 60 === 0) {
            stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 5, '#0000cc'));
        }
        else if (e.type === 'tv' && e.moveTimer > 0 && e.moveTimer % 100 === 0) {
            for (let i = 0; i < 12; i++) {
                const ang = i * Math.PI * 2 / 12 + stg.frame * 0.01;
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#0066cc'));
            }
        }
        else if (e.type === 'robotboss') {
            if (stg.frame % 20 === 0) {
                for (let i = 0; i < 16; i++) {
                    const ang = i * Math.PI * 2 / 16 + stg.frame * 0.02;
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*5, Math.sin(ang)*5, '#ff0033'));
                }
            }
            if (stg.frame % 60 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i=-2; i<=2; i++) stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.15)*7, Math.sin(ang + i*0.15)*7, '#ccaa00'));
            }
        }
    }
};
