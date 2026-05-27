const VER_STG_CAP = "0.9.1"; // バージョン更新（BGM制御とADV後のBGM切り替えを追加）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['final'] = {
    init: function(stg, canvas) { 
        stg.phase = 1; // 1:トレンチ, 2:中ボス待ち, 3:コア展開＆ザコ, 4:最終ボス
        stg.phaseTimer = 0;
        stg.coreTransitioned = false; 
       
        stg.bgmChanged = true; // ★追加：コアロジックによるBGMの自動切り替えをブロック
       
        if (window._bgManagerInstance && typeof window._bgManagerInstance.setStage === 'function') {
            window._bgManagerInstance.setStage(6);
        } else if (window._bgManagerInstance) {
            window._bgManagerInstance.currentStage = 6;
        }
    },
    updateBackground: function(stg, sW, sH) {},
    drawBackground: function(stg, ctx, sW, sH) {},
    getEnemyData: function(type) {
        if (type === 'gtypea') return { imgSrc: 'gtypea.webp’, size: 22, hp: 2, maxHp: 2 };
        if (type === 'gtypeb') return { imgSrc: 'gtypeb.webp’, size: 30, hp: 5, maxHp: 5 };
        if (type === 'gtypec') return { imgSrc: 'gtypec.webp’, size: 26, hp: 3, maxHp: 3 };
        if (type === 'gtyped') return { imgSrc: 'gtyped.webp’, size: 25, hp: 8, maxHp: 8 };
        if (type === 'gtypee') return { imgSrc: 'gtypee.webp’, size: 28, hp: 10, maxHp: 10 };
       
        if (type === 'gtypeboss') return { imgSrc: 'gtypeboss.webp’, size: 45, hp: 150, maxHp: 150, isBoss: true };
        if (type === 'capboss') return { imgSrc: null, size: 80, hp: 1500, maxHp: 1500, isBoss: true };
    },

    updateWaves: function(stg, timer, sW, sH) {
        if (stg.phase === 1) {
            if (timer > 100 && timer < 2500) {
                if (timer % 60 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (timer % 150 === 0) stg.enemies.push(new Enemy('gtypeb', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (timer > 500 && timer % 120 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
               
                if (timer % 180 === 0) {
                    const isLeft = Math.random() > 0.5;
                    const xPos = isLeft ? sW * 0.15 : sW * 0.85; 
                    stg.enemies.push(new Enemy('gtyped', xPos, -50, stg.player.charData, stg.advManager, stg.stgId));
                }
                if (timer > 800 && timer % 250 === 0) {
                    const xPos = sW * 0.2 + Math.random() * sW * 0.6;
                    stg.enemies.push(new Enemy('gtypee', xPos, -50, stg.player.charData, stg.advManager, stg.stgId));
                }
            }
            if (timer === 2600) {
                let b1 = new Enemy('gtypeboss', sW * 0.25, -100, stg.player.charData, stg.advManager, stg.stgId);
                let b2 = new Enemy('gtypeboss', sW * 0.75, -100, stg.player.charData, stg.advManager, stg.stgId);
                b1.startX = sW * 0.25; b2.startX = sW * 0.75;
                stg.enemies.push(b1, b2);
                stg.phase = 2;
                stg.phaseTimer = 0;
            }
        }
       
        else if (stg.phase === 2) {
            let bossAlive = stg.enemies.some(e => e.type === 'gtypeboss');
            if (!bossAlive && !stg.isTimeStopped) {
                stg.phaseTimer++;
                if (stg.phaseTimer === 60 && !stg.coreTransitioned) {
                    if (window._bgManagerInstance && typeof window._bgManagerInstance.transitionToCore === 'function') {
                        window._bgManagerInstance.transitionToCore(); 
                    }
                    stg.coreTransitioned = true;
                }
                if (stg.phaseTimer === 180) {
                    stg.phase = 3;
                    stg.phaseTimer = 0;
                }
            }
        }
       
        else if (stg.phase === 3) {
            stg.phaseTimer++;
           
            if (stg.phaseTimer > 0 && stg.phaseTimer < 1100) {
                if (stg.phaseTimer % 50 === 0) stg.enemies.push(new Enemy('gtypec', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (stg.phaseTimer % 120 === 0) stg.enemies.push(new Enemy('gtypee', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
                if (stg.phaseTimer % 80 === 0) stg.enemies.push(new Enemy('gtypea', Math.random() * sW, -50, stg.player.charData, stg.advManager, stg.stgId));
            }
           
            if (stg.phaseTimer === 1300) {
                // 初期位置を Y = -100 に
                let boss = new Enemy('capboss', sW/2, -100, stg.player.charData, stg.advManager, stg.stgId);
               
                if (window._bgManagerInstance && window._bgManagerInstance.coreReactor) {
                    window._bgManagerInstance.coreReactor.material.opacity = 1.0; 
                    window._bgManagerInstance.coreReactor.material.transparent = true;
                }

                boss.draw = function(ctx) {
                    ctx.save(); ctx.translate(this.x, this.y);
                    if (this.hp > 0 && !this.isDying) {
                        const bW = 100, bH = 10;
                        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bW/2, -this.size-20, bW, bH);
                        ctx.fillStyle = '#ff3366'; ctx.fillRect(-bW/2, -this.size-20, bW*(Math.max(0, this.hp)/this.maxHp), bH);
                        ctx.strokeStyle = '#fff'; ctx.strokeRect(-bW/2, -this.size-20, bW, bH);
                    }
                   
                    // 撃破時の3Dコアのフェードアウト処理
                    if (this.isDying && window._bgManagerInstance && window._bgManagerInstance.coreReactor) {
                        let opacity = 1.0;
                        if (this.deathTimer > 60) {
                            opacity = Math.max(0, 1.0 - (this.deathTimer - 60) / 120);
                        }
                        window._bgManagerInstance.coreReactor.material.opacity = opacity;
                        window._bgManagerInstance.coreReactor.material.transparent = true;
                    }
                   
                    ctx.restore();
                };
                stg.enemies.push(boss);
                stg.phase = 4; 
                stg.capBossAdvPlayed = false; // ★追加：ADVが流れたかどうかを判定するフラグ
            }
        }
       
        else if (stg.phase === 4) {
            // ★追加：コアのmid_stg2（ADVパート）終了を検知して、ボスBGMを流す
            if (stg.isTimeStopped) {
                stg.capBossAdvPlayed = true; 
            } else if (stg.capBossAdvPlayed) {
                // ADVが終わった瞬間
                if (!stg.bossBgmPlayed) {
                    stg.bossBgmPlayed = true;
                    if (typeof window.soundManager !== 'undefined') window.soundManager.playBGM('boss_final');
                }
            }
        }
    },

    updateEnemy: function(e, canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        e.moveTimer = (e.moveTimer || 0) + 1;
       
        if (e.type === 'gtypea') { 
            e.y += 3.5; e.x += Math.sin(e.moveTimer * 0.05) * 3; 
        } 
        else if (e.type === 'gtypeb') { 
            if (e.y < canvas.height/dpr * 0.2) e.y += 3;
            else { e.x += Math.cos(e.moveTimer * 0.03) * 2.5; if (e.moveTimer > 250) e.y -= 2; }
        }
        else if (e.type === 'gtypec') { 
            e.y += 2.5; if (e.y < canvas.height/dpr * 0.8) e.x += (player.x - e.x) * 0.025; 
        }
        else if (e.type === 'gtyped' || e.type === 'gtypee') {
            e.y += 2.5; 
        }
        else if (e.type === 'gtypeboss') {
            const tY = canvas.height/dpr * 0.2;
            if (e.y < tY) {
                e.y += (tY - e.y) * 0.02;
            } else {
                e.x = e.startX + Math.sin(e.moveTimer * 0.02) * 50;
            }
        }
        else if (e.type === 'capboss') {
            const tY = canvas.height/dpr * 0.25;
           
            if (e.y < tY) {
                e.y += (tY - e.y) * 0.02; 
            } else {
                e.x = canvas.width/dpr/2 + Math.sin(e.moveTimer * 0.015) * 80;
            }

            if (window._bgManagerInstance && window._bgManagerInstance.coreReactor && window._bgManagerInstance.camera) {
                const camera = window._bgManagerInstance.camera;
                const cw = canvas.width / dpr;
                const ch = canvas.height / dpr;

                const ndcX = (e.x / cw) * 2 - 1;
                const ndcY = -(e.y / ch) * 2 + 1;

                let vec = new THREE.Vector3(ndcX, ndcY, 0.5);
                vec.unproject(camera);
                let dir = vec.sub(camera.position).normalize();
               
                let targetY = -80; 
                let distance = (targetY - camera.position.y) / dir.y;
                let pos = camera.position.clone().add(dir.multiplyScalar(distance));

                window._bgManagerInstance.coreReactor.position.copy(pos);
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
        else if (e.type === 'gtypeboss' && e.moveTimer % 60 === 0) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*5, Math.sin(ang)*5, '#ff5500'));
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang+0.2)*5, Math.sin(ang+0.2)*5, '#ff5500'));
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang-0.2)*5, Math.sin(ang-0.2)*5, '#ff5500'));
        }
        else if (e.type === 'capboss') {
            if (stg.frame % 30 === 0) {
                const ang = stg.frame * 0.05;
                for(let i=0; i<4; i++) {
                    const offset = i * Math.PI / 2;
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + offset)*3, Math.sin(ang + offset)*3, '#ff0000')); 
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(-ang + offset)*3, Math.sin(-ang + offset)*3, '#ff8800')); 
                }
            }
            if (stg.frame % 120 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                for(let i=-2; i<=2; i++) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i*0.15)*4.5, Math.sin(ang + i*0.15)*4.5, '#ffffff'));
                }
            }
        }
    }
};
