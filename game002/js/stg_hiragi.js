const VER_STG_HIRAGI = "0.1.0";

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['hiragi'] = {
    init: function(stg, canvas) { 
        stg.bossSpawned = false; stg.dragonStartX = 0; stg.dragonCount = 0; 
    },
    updateBackground: function(stg, sW, sH) {},
    drawBackground: function(stg, ctx, sW, sH) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(0, 0, sW, sH);
    },
    getEnemyData: function(type) {
        const dpr = window.devicePixelRatio || 1;
        const w = document.getElementById('gameCanvas').width / dpr;
        if (type === 'typea') return { imgSrc: '2typea.png', size: 20, hp: 3, init: (e)=>e.angle = Math.random() * Math.PI * 2 };
        if (type === 'typeb') return { imgSrc: '2typeb.png', size: 25, hp: 10, init: (e)=>e.state = 'enter' };
        if (type === 'typec') return { imgSrc: '2typec.png', size: 15, hp: 2 };
        if (type === 'typeboss') return { imgSrc: '2typeboss.png', size: w * 0.3, hp: 250 };
    },
    transformEnemy: function(e, ctx) {
        if (e.type === 'typea') ctx.rotate(e.angle * 2);
    },
    updateWaves: function(stg, timer, sW, sH) {
        if (timer > 100 && timer < 500 && timer % 150 === 0) { stg.dragonStartX = sW * 0.2 + Math.random() * sW * 0.6; stg.dragonCount = 8; }
        if (stg.dragonCount > 0 && timer % 10 === 0) { stg.enemies.push(new Enemy('typec', stg.dragonStartX, -50, stg.player.charData, stg.advManager, stg.stgId)); stg.dragonCount--; }
        if (timer > 600 && timer < 1500) {
            if (timer % 80 === 0) stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 200 === 0) stg.enemies.push(new Enemy('typeb', (timer % 400 === 0) ? sW * 0.2 : sW * 0.8, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        if (timer > 1500 && timer < 2500) {
            if (timer % 50 === 0) stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 150 === 0) stg.enemies.push(new Enemy('typeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 300 === 0) { stg.dragonStartX = sW * 0.2 + Math.random() * sW * 0.6; stg.dragonCount = 8; }
            if (stg.dragonCount > 0 && timer % 10 === 0) { stg.enemies.push(new Enemy('typec', stg.dragonStartX, -50, stg.player.charData, stg.advManager, stg.stgId)); stg.dragonCount--; }
        }
        if (timer === 2800 && !stg.bossSpawned) { stg.enemies.push(new Enemy('typeboss', sW / 2, -150, stg.player.charData, stg.advManager, stg.stgId)); stg.bossSpawned = true; }
    },
    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1; e.angle += 0.05;
        if (e.type === 'typea') { e.y += 1.5; e.x = e.startX + Math.sin(e.angle * 1.5) * 80; } 
        else if (e.type === 'typeb') {
            if (e.state === 'enter') { e.y += 2; if (e.y > canvas.height/dpr * 0.3) { e.state = 'wait'; e.moveTimer = 0; } }
            else if (e.state === 'wait') { if (++e.moveTimer > 100) e.state = 'leave'; }
            else if (e.state === 'leave') { e.y -= 2; }
        }
        else if (e.type === 'typec') { e.y += 3; e.x = e.startX + Math.sin(e.y * 0.02) * 60; }
        else if (e.type === 'typeboss') {
            const tY = canvas.height/dpr * 0.25; if (e.y < tY) e.y += (tY - e.y) * 0.02;
            e.x = canvas.width/dpr/2 + Math.sin(e.angle * 0.5) * (canvas.width/dpr * 0.2);
        }
    },
    shootEnemy: function(e, stg) {
        if (e.type === 'typea' && stg.frame % 120 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#ffaa00'));
        } else if (e.type === 'typeb' && e.state === 'wait' && e.moveTimer === 50) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            for(let i = -2; i <= 2; i++) stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.15)*2, Math.sin(ang + i*0.15)*2, '#33ccff'));
        } else if (e.type === 'typec' && stg.frame % 90 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#00ffff'));
        } else if (e.type === 'typeboss') {
            const words = ['嫌い', '浮気', '嘘', '裏切り'];
            if (stg.frame % 40 === 0) {
                const w = words[Math.floor(Math.random() * words.length)], ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                stg.enemyBullets.push(new Bullet(e.x, e.y+40, Math.cos(ang)*4, Math.sin(ang)*4, '#ff33ff', w));
            }
            if (stg.frame % 100 === 0) {
                const w = words[Math.floor(Math.random() * words.length)];
                for (let i=0; i<8; i++) stg.enemyBullets.push(new Bullet(e.x, e.y+40, Math.cos(i*Math.PI*2/8 + stg.frame*0.01)*3, Math.sin(i*Math.PI*2/8 + stg.frame*0.01)*3, '#ff0000', w));
            }
        }
    }
};
