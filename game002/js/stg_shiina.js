const VER_STG_SHIINA = "0.1.0";

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
        if (type === 'typea') return { imgSrc: 'typea.png', size: 16, hp: 4 };
        if (type === 'typeb') return { imgSrc: 'typeb.png', size: 20, hp: 8 };
        if (type === 'typec') return { imgSrc: 'typec.png', size: 18, hp: 6 };
        if (type === 'typeboss') return { imgSrc: 'typeboss.png', size: 75, hp: 300 };
    },
    updateWaves: function(stg, timer, sW, sH) {
        if (timer > 120 && timer < 600 && timer % 60 === 0) stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        if (timer === 400 || timer === 430 || timer === 460) for (let i=0; i<3; i++) stg.enemies.push(new Enemy('typec', sW*0.25 + i*sW*0.25, -50, stg.player.charData, stg.advManager, stg.stgId));
        if (timer > 700 && timer < 1500 && timer % 100 === 0) stg.enemies.push(new Enemy('typeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        if (timer === 2000 && !stg.bossSpawned) { stg.enemies.push(new Enemy('typeboss', sW/2, -150, stg.player.charData, stg.advManager, stg.stgId)); stg.bossSpawned = true; }
    },
    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1; e.angle += 0.05;
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
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x); stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*5, Math.sin(ang)*5, '#ffcc00'));
        } else if (e.type === 'typeboss') {
            if (stg.frame % 30 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x); stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*6, Math.sin(ang)*6, '#ff3366'));
            }
        }
    }
};
