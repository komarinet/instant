const VER_STG_KAGAMI = "0.2.1"; // バージョン更新（将来のADV追加を見据えてボスタグを付与）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['kagami'] = {
    init: function(stg, canvas) { stg.bossSpawned = false; },
    updateBackground: function(stg, sW, sH) {},
    drawBackground: function(stg, ctx, sW, sH) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(0, 0, sW, sH);
    },
    getEnemyData: function(type) {
        // ★修正：新しいHPバー表示に対応するため maxHp を追加
        if (type === 'typea') return { imgSrc: 'typea.png', size: 16, hp: 2, maxHp: 2 };
        if (type === 'typeb') return { imgSrc: 'typeb.png', size: 20, hp: 4, maxHp: 4 };
        if (type === 'typec') return { imgSrc: 'typec.png', size: 18, hp: 3, maxHp: 3 };
        // ★修正：ボスを1.5倍の大きさに（75 × 1.5 ＝ 約112）＋将来のADV用にボスタグを追加
        if (type === 'typeboss') return { imgSrc: 'typeboss.png', size: 112, hp: 150, maxHp: 150, isBoss: true };
    },
    updateWaves: function(stg, timer, sW, sH) {
        // ★修正：ステージを全体で約4800フレーム（約80秒）に延長し、比率に緩急をつける
        
        // 前半 (100〜1500フレーム): typea 多め
        if (timer > 100 && timer < 1500) {
            if (timer % 60 === 0) stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer === 500 || timer === 1000) {
                for (let i = 0; i < 3; i++) stg.enemies.push(new Enemy('typea', sW * 0.25 + i * sW * 0.25, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
        }
        
        // 中盤 (1500〜3000フレーム): typeb 多め
        if (timer > 1500 && timer < 3000) {
            if (timer % 80 === 0) stg.enemies.push(new Enemy('typeb', sW * 0.1 + Math.random() * sW * 0.8, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 150 === 0) stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        
        // 後半 (3000〜4500フレーム): typec 多め
        if (timer > 3000 && timer < 4500) {
            if (timer % 90 === 0) stg.enemies.push(new Enemy('typec', sW * 0.2 + Math.random() * sW * 0.6, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 120 === 0) stg.enemies.push(new Enemy('typeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 200 === 0) stg.enemies.push(new Enemy('typea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
        }
        
        // ボス登場 (4800フレーム)
        if (timer === 4800 && !stg.bossSpawned) {
            stg.enemies.push(new Enemy('typeboss', sW / 2, -150, stg.player.charData, stg.advManager, stg.stgId)); 
            stg.bossSpawned = true;
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
