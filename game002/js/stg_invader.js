const VER_STG_INVADER = "0.5.0"; // 更新：見切れ対応（動的スケール）、ボムボタン強制非表示、スコア位置修正、3面バグ修正

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['invader'] = {
    init: function(stg, canvas) {
        stg.bgmChanged = true;
        stg.invaderPhase = 1;      // 1面, 2面, 3面
        stg.invaderDir = 1;        // 進行方向
        stg.isRealShiina = false;  // 演出終了後に本来の姿に戻ったか
        
        // 元のステータスを退避し、1発アウトの残機1(HP1)に設定
        stg.origPlayerHp = 5;
        stg.origPlayerMaxHp = 5;
        stg.origBombs = window.globalPlayerState ? window.globalPlayerState.bombs : 3;
        
        stg.player.hp = 1;
        stg.player.maxHp = 1;
        
        // プレイヤーの更新・描画・射撃処理を一時的に差し替え
        stg.origPlayerUpdate = stg.player.update;
        stg.origPlayerDraw = stg.player.draw;
        stg.origPlayerShoot = stg.player.shoot;
        
        // 自機の移動制限（Y軸を固定して左右移動のみ）
        stg.player.update = function(canvas) {
            stg.origPlayerUpdate.call(this, canvas);
            if (!stg.isRealShiina && !this.isEntering) {
                const dpr = window.devicePixelRatio || 1;
                this.y = canvas.height / dpr - 60; // 画面下部に固定
            }
        };

        // 自機の描画（レトロな砲台）
        stg.player.draw = function(ctx, advManager) {
            if (stg.isRealShiina) {
                stg.origPlayerDraw.call(stg.player, ctx, advManager);
            } else {
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(this.x - 15, this.y - 10, 30, 20);
                ctx.fillRect(this.x - 5, this.y - 20, 10, 10);
            }
        };
        
        // 自機の射撃（単発制限）
        stg.player.shoot = function() {
            if (stg.isRealShiina) {
                stg.origPlayerShoot.call(stg.player);
            } else {
                let myBullets = this.bullets.filter(b => b.shooterId === this.id && b.alive);
                if (myBullets.length === 0) {
                    this.bullets.push(new Bullet(this.x, this.y - 20, 0, -10, '#00ffff', null, this.id));
                }
            }
        };
        
        // アイテム無効化とボムボタン隠蔽
        stg.origUpdateGameplay = stg.updateGameplay.bind(stg);
        stg.updateGameplay = function() {
            let result = this.origUpdateGameplay();
            
            let bombBtn = document.getElementById('bomb-btn');
            
            if (!stg.isRealShiina) {
                this.items = []; // アイテムを強制的に消去
                this.player.powerLevel = 0; 
                this.player.bombs = 0; 
                if (bombBtn) bombBtn.style.display = 'none'; // UI.jsを無視して強制非表示
            } else {
                if (bombBtn && bombBtn.style.display === 'none') {
                    bombBtn.style.display = ''; // 本来の姿に戻ったら再表示
                }
            }
            return result;
        };

        // 通常UI（HPやPWパラメーター）を隠すための描画オーバーライド
        stg.origDraw = stg.draw.bind(stg);
        stg.draw = function(ctx) {
            this.origDraw(ctx); // まずすべてを描画
            
            if (!stg.isRealShiina) {
                const c = document.getElementById('gameCanvas');
                const dpr = window.devicePixelRatio || 1;
                const sW = c.width / dpr;
                const sH = c.height / dpr;
                
                // 下部のHP/PW UI、右上のSCOREを黒で塗りつぶす
                ctx.fillStyle = '#050510';
                ctx.fillRect(0, sH - 70, sW, 70);
                ctx.fillRect(sW - 220, 0, 220, 50);
                
                // カモフラージュ用のレトロなスコア表示（ミュートボタンを避けて右上に配置）
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText(`SCORE: ${String(stg.player.score).padStart(4, '0')}`, sW - 20, 35);
                ctx.textAlign = 'left';
            }
        };
        
        if (typeof window.soundManager !== 'undefined') {
            window.soundManager.playBGM('stage_jingu');
        }
    },
    
    updateBackground: function(stg, sW, sH) {},
    
    drawBackground: function(stg, ctx, sW, sH) {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, sW, sH);
        
        if (!stg.isRealShiina) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(5, 5, sW - 10, sH - 10);
        }
    },
    
    getEnemyData: function(type) {
        if (type === 'invader_a') return { imgSrc: null, size: 14, hp: 1, maxHp: 1 };
        if (type === 'invader_b') return { imgSrc: null, size: 14, hp: 1, maxHp: 1 };
        if (type === 'invader_c') return { imgSrc: null, size: 12, hp: 3, maxHp: 3 }; 
    },
    
    transformEnemy: function(e, ctx) {},
    
    updateWaves: function(stg, timer, sW, sH) {
        // 【1面】
        if (timer === 60) {
            this.spawnInvaders(stg, 4, 6, sW, 'invader_a');
        }
        
        // 【2面】
        if (stg.invaderPhase === 1 && timer > 100 && stg.enemies.length === 0) {
            stg.invaderPhase = 2;
            this.spawnInvaders(stg, 4, 7, sW, 'invader_b');
        }
        
        // 【3面への移行とイベント】
        if (stg.invaderPhase === 2 && timer > 100 && stg.enemies.length === 0) {
            stg.invaderPhase = 3;
            
            // 30行×8列の敵を敷き詰める
            this.spawnInvaders(stg, 30, 8, sW, 'invader_c');

            let midAdvData = [];
            try {
                if (window.scenarios && window.scenarios['mamoru']) {
                    let stgData = window.scenarios['mamoru'][3]; 
                    if (stgData && stgData.event_adv) {
                        midAdvData = stgData.event_adv;
                    }
                }
            } catch (e) { console.error("ADV読み込みエラー", e); }
            
            const onAdvEnd = () => {
                // 本来の姿を解禁・ステータス復帰
                stg.isRealShiina = true; 
                stg.player.hp = stg.origPlayerHp;
                stg.player.maxHp = stg.origPlayerMaxHp;
                stg.player.bombs = stg.origBombs;
                
                if (typeof window.soundManager !== 'undefined') {
                    window.soundManager.playBGM('boss_shiina');
                }
            };
            
            // 敵を描画してからADVを開始
            setTimeout(() => {
                if (midAdvData.length > 0 && typeof window.startMidStgADV !== 'undefined') {
                    window.startMidStgADV(midAdvData, onAdvEnd);
                } else {
                    onAdvEnd();
                }
            }, 1000);
        }
        
        // 【インベーダー全体の移動＆接触判定】
        if (stg.enemies.length > 0 && !stg.isTimeStopped) {
            let hitEdge = false;
            let currentSpeed = 0;
            
            // フェーズごとの速度計算（バグ修正：3面開始前のマイナス速度を防ぐ）
            if (stg.invaderPhase < 3) {
                currentSpeed = 0.3 + Math.max(0, (1 - (stg.enemies.length / 24)) * 1.5);
            } else if (stg.isRealShiina) {
                currentSpeed = 0.8; // 3面の戦闘中は一定速度
            } else {
                currentSpeed = 0; // 3面出現直後（ADV中）は動かさない
            }
            
            if (currentSpeed > 0) {
                stg.enemies.forEach(e => {
                    e.x += stg.invaderDir * currentSpeed;
                    if (e.x < e.size + 15) { hitEdge = true; stg.invaderDir = 1; }
                    if (e.x > sW - e.size - 15) { hitEdge = true; stg.invaderDir = -1; }
                    
                    // 侵略判定（インベーダーが自機にタッチしたら即ゲームオーバー）
                    if (!stg.isRealShiina && e.y + e.size > stg.player.y - 15) {
                        stg.player.hp = 0; 
                    }
                });
                
                // 画面端到達で全体が一段下がる
                if (hitEdge) {
                    stg.enemies.forEach(e => {
                        e.x += stg.invaderDir * currentSpeed * 2;
                        e.y += 20;
                    });
                }
            }
        }
        
        // 3面クリア判定
        if (stg.invaderPhase === 3 && timer > 100 && stg.enemies.length === 0 && stg.isRealShiina) {
            stg.isStageClear = true; 
        }
    },
    
    spawnInvaders: function(stg, rows, cols, sW, type) {
        stg.invaderDir = 1;
        
        // スマホ画面幅に合わせてサイズと間隔を動的にスケール
        let screenRatio = Math.min(1.0, sW / 400); // 400pxを基準に縮小
        let spacingX = (type === 'invader_c' ? 32 : 38) * screenRatio;
        let spacingY = (type === 'invader_c' ? 28 : 35) * screenRatio;
        let startX = (sW - ((cols - 1) * spacingX)) / 2;
        let enemySize = (type === 'invader_c' ? 12 : 14) * screenRatio;
        
        // 行ごとの色分け設定
        const rowColors = ['#ff3366', '#ffcc00', '#00ffff', '#33ff33', '#cc33ff', '#ff6600', '#ffffff', '#00aaff'];
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // 3面（30行）の場合は画面外の上部から敷き詰める
                let spawnY = type === 'invader_c' ? -650 + r * spacingY : 60 + r * spacingY;
                
                let e = new Enemy(type, startX + c * spacingX, spawnY, stg.player.charData, stg.advManager, stg.stgId);
                e.color = rowColors[r % rowColors.length]; 
                e.size = enemySize;
                
                // ドット絵インベーダーの描画上書き
                e.draw = function(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    if (this.isDying && this.deathTimer >= 60) {
                        ctx.globalAlpha = Math.max(0, 1.0 - (this.deathTimer - 60) / 120);
                    }
                    
                    // パラパラアニメーション用のドット配列（1:塗る、0:塗らない）
                    const frame1 = [
                        [0,0,1,0,0,0,0,0,1,0,0],
                        [0,0,0,1,0,0,0,1,0,0,0],
                        [0,0,1,1,1,1,1,1,1,0,0],
                        [0,1,1,0,1,1,1,0,1,1,0],
                        [1,1,1,1,1,1,1,1,1,1,1],
                        [1,0,1,1,1,1,1,1,1,0,1],
                        [1,0,1,0,0,0,0,0,1,0,1],
                        [0,0,0,1,1,0,1,1,0,0,0]
                    ];
                    const frame2 = [
                        [0,0,1,0,0,0,0,0,1,0,0],
                        [1,0,0,1,0,0,0,1,0,0,1],
                        [1,0,1,1,1,1,1,1,1,0,1],
                        [1,1,1,0,1,1,1,0,1,1,1],
                        [1,1,1,1,1,1,1,1,1,1,1],
                        [0,1,1,1,1,1,1,1,1,1,0],
                        [0,0,1,0,0,0,0,0,1,0,0],
                        [0,1,0,0,0,0,0,0,0,1,0]
                    ];
                    
                    const pixels = (stg.frame % 60 < 30) ? frame1 : frame2;
                    const pSize = (this.size * 2) / 11;
                    
                    ctx.fillStyle = this.color;
                    
                    // ドットを描画
                    for (let r2 = 0; r2 < 8; r2++) {
                        for (let c2 = 0; c2 < 11; c2++) {
                            if (pixels[r2][c2]) {
                                ctx.fillRect(-this.size + c2 * pSize, -this.size * 0.8 + r2 * pSize, pSize, pSize);
                            }
                        }
                    }
                    
                    // HPゲージ（3面でHPが減った時のみ表示）
                    if (this.hp < this.maxHp && this.hp > 0 && !this.isDying) {
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(-this.size, this.size + 4, this.size * 2 * (this.hp / this.maxHp), 2);
                    }
                    ctx.restore();
                };
                stg.enemies.push(e);
            }
        }
    },
    
    updateEnemy: function(e, canvas, player) {},
    
    shootEnemy: function(e, stg) {
        // 通常モードでの攻撃（確率は非常に低く、弾の速度も遅い）
        if (!stg.isRealShiina && Math.random() < 0.0005) { 
            stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 2.5, '#ffffff'));
        }
        
        // 椎名の本気モード（3面）では自機狙いの弾幕を撃ってくる
        if (stg.isRealShiina && e.y > 0 && Math.random() < 0.003) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*2.5, Math.sin(ang)*2.5, e.color));
        }
    }
};
