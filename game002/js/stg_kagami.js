const VER_STG_KAGAMI = "0.1.0";

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['kagami'] = {
    init: function(stg, canvas) { stg.bossSpawned = false; },
    updateBackground: function(stg, sW, sH) {},
    drawBackground: function(stg, ctx, sW, sH) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(0, 0, sW, sH);
    },
    getEnemyData: function(type) {
        if (type === 'typea') return { imgSrc: 'typea.png', size: 16, hp: 2 };
        if (type === 'typeb') return { imgSrc: 'typeb.png', size: 20, hp: 4 };
        if (type === 'typec') return { imgSrc: 'typec.png', size: 18, hp: 3 };
        if (type === 'typeboss') return { imgSrc: 'typeboss.png', size: 75, hp: 150 };
    },
    updateWaves: function(stg, timer, sW, sH) {
        if (timer > 120 && timer < 600 && timer % 60 === 0) stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        if (timer === 400 || timer === 430 || timer === 460) for (let i = 0; i < 3; i++) stg.enemies.push(new Enemy('typec', sW * 0.25 + i * sW * 0.25, -50, stg.player.charData, stg.advManager, stg.stgId));
        if (timer > 700 && timer < 1200 && timer % 150 === 0) stg.enemies.push(new Enemy('typeb', sW * 0.2 + Math.random() * sW * 0.6, -50, stg.player.charData, stg.advManager, stg.stgId));
        if (timer > 1000 && timer < 1800 && timer % 80 === 0) {
            stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 160 === 0) stg.enemies.push(new Enemy('typec', (timer % 160 === 0) ? 50 : sW - 50, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        if (timer > 2000 && timer < 3000) {
            if (timer % 40 === 0) stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 100 === 0) stg.enemies.push(new Enemy('typeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 120 === 0) stg.enemies.push(new Enemy('typec', sW / 2 + Math.sin(timer) * sW / 2, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        if (timer === 3200 && !stg.bossSpawned) {
            stg.enemies.push(new Enemy('typeboss', sW / 2, -150, stg.player.charData, stg.advManager, stg.stgId)); stg.bossSpawned = true;
        }
    },
    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        e.angle += 0.05;
        if (e.type === 'typea') { e.y += 4; if (e.y < canvas.height/dpr * 0.5) e.x += (player.x - e.x) * 0.01; } 
        else if (e.type === 'typeb') { if (e.y < canvas.height/dpr * 0.3) e.y += 2; else e.moveTimer++; }
        else if (e.type === 'typec') { e.y += 3; e.x += Math.sin(e.angle) * 5; }
        else if (e.type === 'typeboss') {
            const tY = canvas.height/dpr * 0.2; if (e.y < tY) e.y += (tY - e.y) * 0.02;
            e.x = canvas.width/dpr/2 + Math.sin(e.angle * 0.5) * (canvas.width/dpr * 0.3);
        }
    },
    shootEnemy: function(e, stg) {
        if (e.type === 'typeb' && e.moveTimer > 0 && e.moveTimer % 100 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*5, Math.sin(ang)*5, '#ffcc00'));
        } else if (e.type === 'typeboss') {
            if (stg.frame % 20 === 0) {
                for (let i = 0; i < 16; i++) {
                    const ang = i * Math.PI * 2 / 16 + stg.frame * 0.01;
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*4, Math.sin(ang)*4, '#ff3366'));
                }
            }
            if (stg.frame % 60 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i=-1; i<=1; i++) stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.2)*6, Math.sin(ang + i*0.2)*6, '#00ffff'));
            }
        }
    }
};
