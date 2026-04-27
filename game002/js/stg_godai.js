const VER_STG_GODAI = "0.1.0"; // ステージ5：新規実装（暫定的にステージ1の敵を使用）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['godai'] = {
    init: function(stg, canvas) { 
        stg.bossSpawned = false; 
        // 3D背景のステージ番号を明示的にセット
        if (window._bgManagerInstance) {
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
        // ステージ1（kagami）のデータを代用
        if (type === 'typea') return { imgSrc: 'typea.png', size: 16, hp: 2, maxHp: 2 };
        if (type === 'typeb') return { imgSrc: 'typeb.png', size: 20, hp: 4, maxHp: 4 };
        if (type === 'typec') return { imgSrc: 'typec.png', size: 18, hp: 3, maxHp: 3 };
        if (type === 'typeboss') return { imgSrc: 'typeboss.png', size: 112, hp: 150, maxHp: 150, isBoss: true };
    },

    updateWaves: function(stg, timer, sW, sH) {
        // 波状攻撃（暫定的にステージ1の構成をコピー）
        if (timer > 100 && timer < 1000 && timer % 60 === 0) {
            stg.enemies.push(new Enemy('typea', Math.random() * sW, -20, stg.player.charData, stg.advManager, stg.stgId));
        }
        if (timer === 1100) {
            for(let i=0; i<5; i++) {
                stg.enemies.push(new Enemy('typeb', (sW/6)*(i+1), -50, stg.player.charData, stg.advManager, stg.stgId));
            }
        }
        if (timer > 1500 && timer < 2500 && timer % 80 === 0) {
            stg.enemies.push(new Enemy('typec', Math.random() * sW, -20, stg.player.charData, stg.advManager, stg.stgId));
        }
        if (timer === 3000 && !stg.bossSpawned) {
            stg.enemies.push(new Enemy('typeboss', sW/2, -100, stg.player.charData, stg.advManager, stg.stgId));
            stg.bossSpawned = true;
        }
    },

    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        e.angle += 0.05;
        if (e.type === 'typea') { 
            e.y += 4; 
            if (e.y < canvas.height/dpr * 0.5) e.x += (player.x - e.x) * 0.01; 
        } 
        else if (e.type === 'typeb') { 
            if (e.y < canvas.height/dpr * 0.3) e.y += 2; else e.moveTimer++; 
        }
        else if (e.type === 'typec') { 
            e.y += 3; e.x += Math.sin(e.angle) * 5; 
        }
        else if (e.type === 'typeboss') {
            const tY = canvas.height/dpr * 0.2; 
            if (e.y < tY) e.y += (tY - e.y) * 0.02;
            e.x = canvas.width/dpr/2 + Math.sin(e.angle * 0.5) * (canvas.width/dpr * 0.3);
        }
    },

    shootEnemy: function(e, stg) {
        if (e.type === 'typeb' && e.moveTimer > 0 && e.moveTimer % 100 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*5, Math.sin(ang)*5, '#ff3366'));
        }
        if (e.type === 'typeboss' && stg.frame % 60 === 0) {
            for(let i=0; i<8; i++) {
                const ang = i * Math.PI * 2 / 8 + stg.frame * 0.02;
                stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#00ffff'));
            }
        }
    }
};
