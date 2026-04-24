const VER_STG_JINGU = "0.2.1"; // バージョン更新（0.1.8の動的取得ロジックを完全復元 ＋ 全滅トリガー ＋ TV詰み防止）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['jingu'] = {
    init: function(stg, canvas) { 
        stg.bossSpawned = false; 
        stg.bgScrollY = 0; 
    },
    updateBackground: function(stg, sW, sH) {
        stg.bgScrollY += 1.5; 
        // 通常→反転の2枚セットでループ
        if (stg.bgScrollY >= sH * 2) {
            stg.bgScrollY -= sH * 2; 
        }
    },
    drawBackground: function(stg, ctx, sW, sH) {
        const bgImg = stg.advManager?.assets['snow.png'];
        if (bgImg && bgImg.naturalWidth > 0) {
            const y = stg.bgScrollY;

            // 1枚目（通常）
            ctx.drawImage(bgImg, 0, y, sW, sH);

            // 2枚目（上下反転・鏡像）
            ctx.save();
            ctx.translate(0, (y - sH) + sH / 2);
            ctx.scale(1, -1);
            ctx.drawImage(bgImg, 0, -sH / 2, sW, sH);
            ctx.restore();

            // 3枚目（通常）
            ctx.drawImage(bgImg, 0, y - sH * 2, sW, sH);

        } else {
            ctx.fillStyle = '#112233'; 
            ctx.fillRect(0, 0, sW, sH);
        }
    },
    getEnemyData: function(type) {
        // ステージ毎に定義されたデータ。ここから画像名を取得する
        if (type === 'rei') return { imgSrc: 'rei.png', size: 45, hp: 12, maxHp: 12 };
        if (type === 'renji') return { imgSrc: 'renji.png', size: 38, hp: 8, maxHp: 8 };
        if (type === 'sui') return { imgSrc: 'sui.png', size: 23, hp: 3, maxHp: 3 };
        if (type === 'tv') return { imgSrc: 'tv.png', size: 38, hp: 6, maxHp: 6 };
        // このステージのボス
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
        
        // ★修正：4500フレーム以降でザコ敵が全滅（フレームアウト消滅含む）した時をトリガーに
        if (timer > 4500 && stg.enemies.length === 0 && !stg.bossSpawned) {
            // ★0.1.8の動的取得ロジックを完全復元
            const bossType = 'robotboss';
            const bossData = this.getEnemyData(bossType);
            
            if (bossData) {
                stg.bossSpawned = true; 

                let midAdvData = [];
                try {
                    const charId = (stg.player && stg.player.charData) ? stg.player.charData.id : 'igari';
                    const charScenario = window.scenarios[charId];
                    
                    if (charScenario) {
                        for (let stageKey in charScenario) {
                            if (charScenario[stageKey] && charScenario[stageKey].stgId === 'jingu' && charScenario[stageKey].mid_stg) {
                                midAdvData = charScenario[stageKey].mid_stg;
                                break;
                            }
                        }
                    }
                } catch(e) {
                    console.error("ボス前ADVデータの取得に失敗:", e);
                }

                // 挿入アドベンチャーが再生できれば再生後、できなければ即座にボスを出現
                if (midAdvData.length > 0 && typeof window.startMidStgADV === 'function') {
                    window.startMidStgADV(midAdvData, () => {
                        stg.enemies.push(new Enemy(bossType, sW / 2, -150, stg.player.charData, stg.advManager, stg.stgId));
                    });
                } else {
                    stg.enemies.push(new Enemy(bossType, sW / 2, -150, stg.player.charData, stg.advManager, stg.stgId));
                }
            }
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
                // ★修正：放置されたテレビが画面上に残り続けて全滅トリガーが引かれない（詰み）のを防ぐ処理
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
