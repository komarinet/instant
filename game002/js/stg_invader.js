const VER_STG_INVADER = "0.8.0"; // 更新：ボムボタン再表示時にFlexboxレイアウトが崩れるバグを修正

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['invader'] = {
    init: function(stg, canvas) {
        stg.bgmChanged = true;
        stg.invaderPhase = 1;      // 1面, 2面, 3面
        stg.invaderDir = 1;        // 進行方向
        stg.isRealShiina = false;  // 演出終了後に本来の姿に戻ったか
        
        stg.phase3Timer = 0;
        stg.advTriggeredPhase3 = false;
        stg.forceTriggerAdv = false;
        stg.forceGameOverFlag = false;
        
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
        
        // アイテム無効化、ボムボタン隠蔽、死亡インターセプト
        stg.origUpdateGameplay = stg.updateGameplay.bind(stg);
        stg.updateGameplay = function() {
            let result = this.origUpdateGameplay();
            
            // 侵略判定による強制ゲームオーバーフラグの回収
            if (stg.forceGameOverFlag) {
                result = 'GAMEOVER';
                stg.forceGameOverFlag = false;
            }
            
            // 3面の絶望タイム中の死亡（弾被弾・侵略）をキャンセルしてADVへ強制移行
            if (result === 'GAMEOVER' && stg.invaderPhase === 3 && !stg.isRealShiina && !stg.advTriggeredPhase3) {
                stg.player.hp = 1; // 死亡をキャンセル
                stg.forceTriggerAdv = true; // 次のフレームでADV起動
                result = 'PLAYING';
            }
            
            let bombBtn = document.getElementById('bomb-btn');
            
            if (!stg.isRealShiina) {
                this.items = []; // アイテム消去
                this.player.powerLevel = 0; 
                this.player.bombs = 0; 
                if (bombBtn) bombBtn.style.display = 'none'; // ボム隠蔽
            } else {
                if (bombBtn && bombBtn.style.display === 'none') {
                    // ★修正：元に戻す際に 'flex' を明示的に指定してレイアウト崩れを防止
                    bombBtn.style.display = 'flex'; 
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
                
                // UI黒塗り
                ctx.fillStyle = '#050510';
                ctx.fillRect(0, sH - 50, sW, 50);
                ctx.fillRect(sW - 220, 0, 220, 45);
                
                // ネオン枠再描画
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.strokeRect(5, 5, sW - 10, sH - 10);
                
                // カモフラージュ用レトロスコア
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
        
        // 【3面への移行：敵の配置開始】
        if (stg.invaderPhase === 2 && timer > 100 && stg.enemies.length === 0) {
            stg.invaderPhase = 3;
            stg.phase3Timer = 0;
            stg.advTriggeredPhase3 = false;
            
            // 20行×8列の敵を画面半分まで敷き詰める（画面内に見える位置からスタート）
            this.spawnInvaders(stg, 20, 8, sW, 'invader_c');
        }

        // 【3面：絶望タイム（約15秒）＆ ADV起動判定】
        if (stg.invaderPhase === 3 && !stg.isRealShiina) {
            stg.phase3Timer++;
            
            // 15秒（900フレーム）経過、または自機が被弾して強制フックされたらADV起動
            if ((stg.phase3Timer > 900 || stg.forceTriggerAdv) && !stg.advTriggeredPhase3) {
                stg.advTriggeredPhase3 = true;
                
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
                    stg.isRealShiina = true; 
                    stg.player.hp = stg.origPlayerHp;
                    stg.player.maxHp = stg.origPlayerMaxHp;
                    stg.player.bombs = stg.origBombs;
                    
                    // 理不尽弾幕をクリアしてフェアな状態からリスタート
                    stg.enemyBullets = [];
                    
                    if (typeof window.soundManager !== 'undefined') {
                        window.soundManager.playBGM('boss_shiina');
                    }
                };
                
                if (midAdvData.length > 0 && typeof window.startMidStgADV !== 'undefined') {
                    window.startMidStgADV(midAdvData, onAdvEnd);
                } else {
                    onAdvEnd();
                }
            }
        }
        
        // 【インベーダー全体の移動＆接触判定】
        if (stg.enemies.length > 0 && !stg.isTimeStopped) {
            let hitEdge = false;
            let currentSpeed = 0;
            
            if (stg.invaderPhase < 3) {
                currentSpeed = 0.3 + Math.max(0, (1 - (stg.enemies.length / 24)) * 1.5);
            } else if (stg.isRealShiina) {
                currentSpeed = 0.8; 
            } else {
                currentSpeed = 0.4; // 絶望タイム中はじわじわと迫らせる
            }
            
            if (currentSpeed > 0) {
                stg.enemies.forEach(e => {
                    e.x += stg.invaderDir * currentSpeed;
                    if (e.x < e.size + 15) { hitEdge = true; stg.invaderDir = 1; }
                    if (e.x > sW - e.size - 15) { hitEdge = true; stg.invaderDir = -1; }
                    
                    // 侵略判定（インベーダーが自機にタッチしたら即ゲームオーバーフラグを立てる）
                    if (!stg.isRealShiina && e.y + e.size > stg.player.y - 15) {
                        stg.forceGameOverFlag = true; 
                    }
                });
                
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
        
        let screenRatio = Math.min(1.0, sW / 400); 
        let spacingX = (type === 'invader_c' ? 32 : 38) * screenRatio;
        let spacingY = (type === 'invader_c' ? 28 : 35) * screenRatio;
        let startX = (sW - ((cols - 1) * spacingX)) / 2;
        let enemySize = (type === 'invader_c' ? 12 : 14) * screenRatio;
        
        const rowColors = ['#ff3366', '#ffcc00', '#00ffff', '#33ff33', '#cc33ff', '#ff6600', '#ffffff', '#00aaff'];
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let spawnY = 60 + r * spacingY; // 常に画面上部から敷き詰める
                
                let e = new Enemy(type, startX + c * spacingX, spawnY, stg.player.charData, stg.advManager, stg.stgId);
                e.color = rowColors[r % rowColors.length]; 
                e.size = enemySize;
                
                e.draw = function(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    if (this.isDying && this.deathTimer >= 60) {
                        ctx.globalAlpha = Math.max(0, 1.0 - (this.deathTimer - 60) / 120);
                    }
                    
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
                    
                    for (let r2 = 0; r2 < 8; r2++) {
                        for (let c2 = 0; c2 < 11; c2++) {
                            if (pixels[r2][c2]) {
                                ctx.fillRect(-this.size + c2 * pSize, -this.size * 0.8 + r2 * pSize, pSize, pSize);
                            }
                        }
                    }
                    
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
        if (!stg.isRealShiina) {
            if (stg.invaderPhase === 3) {
                // 絶望タイム：そこそこの確率で弾を落としてくる
                if (Math.random() < 0.005) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 3.5, '#ffffff'));
                }
            } else {
                if (Math.random() < 0.0005) { 
                    stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 2.5, '#ffffff'));
                }
            }
        }
        
        if (stg.isRealShiina && e.y > 0 && Math.random() < 0.003) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*2.5, Math.sin(ang)*2.5, e.color));
        }
    }
};
