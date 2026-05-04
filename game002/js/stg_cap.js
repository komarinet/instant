const VER_STG_CAP = "0.2.0"; // ADV終了後に床と壁が割れてコアが現れる演出へ変更

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['final'] = {
    init: function(stg, canvas) { 
        stg.bossSpawned = false; 
        stg.coreTransitioned = false; 
        stg.coreOpenTimer = 0; // 開き始めてからのタイマー
        
        if (window._bgManagerInstance && typeof window._bgManagerInstance.setStage === 'function') {
            window._bgManagerInstance.setStage(6);
        } else if (window._bgManagerInstance) {
            window._bgManagerInstance.currentStage = 6;
        }
    },
    updateBackground: function(stg, sW, sH) {
    },
    drawBackground: function(stg, ctx, sW, sH) {
    },
    getEnemyData: function(type) {
        if (type === 'gtypea') return { imgSrc: 'gtypea.png', size: 22, hp: 2, maxHp: 2 };
        if (type === 'gtypeb') return { imgSrc: 'gtypeb.png', size: 30, hp: 5, maxHp: 5 };
        if (type === 'gtypec') return { imgSrc: 'gtypec.png', size: 26, hp: 3, maxHp: 3 };
        
        if (type === 'gtyped') return { imgSrc: 'gtyped.png', size: 25, hp: 8, maxHp: 8 };
        if (type === 'gtypee') return { imgSrc: 'gtypee.png', size: 28, hp: 10, maxHp: 10 };
        
        // ボス（コア）は透明で当たり判定のみ
        if (type === 'capboss') return { imgSrc: null, size: 80, hp: 1500, maxHp: 1500, isBoss: true };
    },

    updateWaves: function(stg, timer, sW, sH) {
        // ザコ敵の出現（0〜1500フレームまで）
        if (timer > 100 && timer < 1500) {
            if (timer % 60 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer % 150 === 0) stg.enemies.push(new Enemy('gtypeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            if (timer > 500 && timer % 120 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            
            if (timer % 180 === 0) {
                const isLeft = Math.random() > 0.5;
                const xPos = isLeft ? sW * 0.1 : sW * 0.9;
                stg.enemies.push(new Enemy('gtyped', xPos, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
            if (timer > 800 && timer % 250 === 0) {
                const xPos = sW * 0.2 + Math.random() * sW * 0.6;
                stg.enemies.push(new Enemy('gtypee', xPos, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
        }

        // ザコがいなくなった後、ボススポーン (1800フレーム)
        if (timer === 1800 && !stg.bossSpawned) {
            let boss = new Enemy('capboss', sW/2, sH * 0.25, stg.player.charData, stg.advManager, stg.stgId);
            
            boss.draw = function(ctx) {
                ctx.save(); 
                ctx.translate(this.x, this.y);
                if (this.hp > 0 && !this.isDying) {
                    const bW = 100, bH = 10;
                    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bW/2, -this.size-20, bW, bH);
                    ctx.fillStyle = '#ff3366'; ctx.fillRect(-bW/2, -this.size-20, bW*(Math.max(0, this.hp)/this.maxHp), bH);
                    ctx.strokeStyle = '#fff'; ctx.strokeRect(-bW/2, -this.size-20, bW, bH);
                }
                ctx.restore();
            };
            stg.enemies.push(boss);
            stg.bossSpawned = true;
        }

        // ★ADVが終了した瞬間に、背景に「壁と床を割る」指示を出す
        if (stg.bossAdvTriggered && !stg.isTimeStopped && !stg.coreTransitioned) {
            if (window._bgManagerInstance && typeof window._bgManagerInstance.transitionToCore === 'function') {
                window._bgManagerInstance.transitionToCore(); 
            }
            stg.coreTransitioned = true;
        }

        // コアが開き始めてからのタイマー（弾幕開始を少し遅らせて見せるため）
        if (stg.coreTransitioned && !stg.isTimeStopped) {
            stg.coreOpenTimer++;
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
        else if (e.type === 'gtyped' || e.type === 'gtypee') {
            e.y += 2.5; 
        }
        else if (e.type === 'capboss') {
            e.x = canvas.width/dpr/2;
            e.y = canvas.height/dpr * 0.25;
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
        else if (e.type === 'capboss') {
            // ★壁が開き始めてから数秒後（120フレーム後）に激しい弾幕を開始する
            if (stg.coreOpenTimer > 120) {
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
    }
};
