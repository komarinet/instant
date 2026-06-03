const VER_STG_INVADER = "0.1.0"; // 新設（インベーダーゲーム＆イカサマ演出用ロジック）

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['invader'] = {
    init: function(stg, canvas) {
        stg.bgmChanged = true;
        stg.invaderPhase = 1;      // 現在の面数（1面, 2面, 3面）
        stg.invaderDir = 1;        // インベーダーの進行方向（1:右, -1:左）
        stg.invaderSpeed = 1.0;    // インベーダーの基本速度
        stg.isRealShiina = false;  // 演出終了後に本来の姿に戻ったかどうか
        
        // プレイヤーの描画と射撃処理を一時的に差し替えるために元処理を保存
        stg.origPlayerDraw = stg.player.draw;
        stg.origPlayerShoot = stg.player.shoot;
        
        stg.player.draw = function(ctx, advManager) {
            if (stg.isRealShiina) {
                // 本来の椎名の姿で描画
                stg.origPlayerDraw.call(stg.player, ctx, advManager);
            } else {
                // レトロな砲台風の描画
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(this.x - 15, this.y - 10, 30, 20);
                ctx.fillRect(this.x - 5, this.y - 20, 10, 10);
            }
        };
        
        stg.player.shoot = function() {
            if (stg.isRealShiina) {
                // 本来の椎名の射撃（弾幕）
                stg.origPlayerShoot.call(stg.player);
            } else {
                // レトロな単発ビーム（一定間隔でのみ発射可能）
                if (stg.frame % 15 === 0) {
                    this.bullets.push(new Bullet(this.x, this.y - 20, 0, -10, '#00ffff', null, this.id));
                }
            }
        };
        
        // アイテムをイカサマ状態（3面前）では落とさないように更新処理をフック
        stg.origUpdateGameplay = stg.updateGameplay.bind(stg);
        stg.updateGameplay = function() {
            let result = this.origUpdateGameplay();
            if (!this.isRealShiina) {
                this.items = []; // アイテムを強制的に消去
                this.player.powerLevel = 0; // パワーアップも無効
            }
            return result;
        };
        
        // カジノっぽい雰囲気のBGMを再生
        if (typeof window.soundManager !== 'undefined') {
            window.soundManager.playBGM('stage_jingu');
        }
    },
    
    updateBackground: function(stg, sW, sH) {
        // 背景は動かさない
    },
    
    drawBackground: function(stg, ctx, sW, sH) {
        // アーケードゲーム風の黒背景
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, sW, sH);
        
        if (!stg.isRealShiina) {
            // ゲームの筐体画面を意識したネオン枠
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(5, 5, sW - 10, sH - 10);
        }
    },
    
    getEnemyData: function(type) {
        // 画像は使わずCanvasの矩形描画でレトロ感を出します
        if (type === 'invader_a') return { imgSrc: null, size: 15, hp: 1, maxHp: 1 };
        if (type === 'invader_b') return { imgSrc: null, size: 15, hp: 2, maxHp: 2 };
        if (type === 'invader_c') return { imgSrc: null, size: 15, hp: 6, maxHp: 6 }; // 3面の硬い敵
    },
    
    transformEnemy: function(e, ctx) {
        // 敵の描画はここではなく、spawnInvadersで個別に描画ロジックを上書きしています
    },
    
    updateWaves: function(stg, timer, sW, sH) {
        // 【1面】
        if (timer === 60) {
            this.spawnInvaders(stg, 3, 6, sW, 'invader_a');
        }
        
        // 【2面】
        if (stg.invaderPhase === 1 && timer > 100 && stg.enemies.length === 0) {
            stg.invaderPhase = 2;
            this.spawnInvaders(stg, 4, 7, sW, 'invader_b');
        }
        
        // 【3面への移行とイベント】
        if (stg.invaderPhase === 2 && timer > 100 && stg.enemies.length === 0) {
            stg.invaderPhase = 3;
            
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
                stg.isRealShiina = true; // 椎名本来の姿を解禁
                if (typeof window.soundManager !== 'undefined') {
                    window.soundManager.playBGM('boss_shiina'); // 本気モードのBGMに変更
                }
                // 3面はイカサマで倍量のインベーダーを敷き詰める
                this.spawnInvaders(stg, 8, 8, sW, 'invader_c');
            };
            
            if (midAdvData.length > 0 && typeof window.startMidStgADV !== 'undefined') {
                window.startMidStgADV(midAdvData, onAdvEnd);
            } else {
                onAdvEnd();
            }
        }
        
        // 【インベーダー全体の群れ移動ロジック】
        if (stg.enemies.length > 0 && !stg.isTimeStopped) {
            let hitEdge = false;
            
            // 敵の数が減るほど全体の移動速度が上がる（本家インベーダーリスペクト）
            let currentSpeed = stg.invaderSpeed + ((1 - (stg.enemies.length / 50)) * 2);
            // 椎名の本気モード（3面）では弾幕勝負になるため移動速度は遅めに固定
            if (stg.isRealShiina) currentSpeed = 1.0;
            
            stg.enemies.forEach(e => {
                e.x += stg.invaderDir * currentSpeed;
                if (e.x < e.size + 15) { hitEdge = true; stg.invaderDir = 1; }
                if (e.x > sW - e.size - 15) { hitEdge = true; stg.invaderDir = -1; }
            });
            
            // 画面端に到達したら全体が反転して一段（20px）下がる
            if (hitEdge) {
                stg.enemies.forEach(e => {
                    e.x += stg.invaderDir * currentSpeed * 2;
                    e.y += 20;
                });
            }
        }
        
        // 3面（イカサマ状態）の敵を全滅させたらステージクリア
        if (stg.invaderPhase === 3 && timer > 100 && stg.enemies.length === 0 && stg.isRealShiina) {
            stg.isStageClear = true; 
        }
    },
    
    spawnInvaders: function(stg, rows, cols, sW, type) {
        stg.invaderDir = 1;
        let startX = (sW - (cols * 40)) / 2 + 20;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let e = new Enemy(type, startX + c * 40, 50 + r * 40, stg.player.charData, stg.advManager, stg.stgId);
                
                // 敵の描画をアーケード風のドットもどきにオーバーライド
                e.draw = function(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    if (this.isDying && this.deathTimer >= 60) {
                        ctx.globalAlpha = Math.max(0, 1.0 - (this.deathTimer - 60) / 120);
                    }
                    
                    ctx.fillStyle = this.type === 'invader_a' ? '#00ffff' : (this.type === 'invader_b' ? '#ffaa00' : '#ff3366');
                    
                    // 単純な矩形の組み合わせでインベーダーっぽい形を描画
                    ctx.fillRect(-this.size, -this.size+5, this.size*2, this.size*2-10);
                    ctx.fillRect(-this.size+5, -this.size, this.size*2-10, this.size*2);
                    
                    // ダメージを受けている場合はHPゲージを小さく表示
                    if (this.hp < this.maxHp && this.hp > 0 && !this.isDying) {
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(-this.size, this.size + 2, this.size * 2 * (this.hp / this.maxHp), 2);
                    }
                    
                    ctx.restore();
                };
                stg.enemies.push(e);
            }
        }
    },
    
    updateEnemy: function(e, canvas, player) {
        // 個別の移動処理は無く、updateWavesで全体を一括で移動させているためここは空
    },
    
    shootEnemy: function(e, stg) {
        // 通常モードでの攻撃（確率で真下に弾を落とす）
        if (Math.random() < 0.005) { 
            stg.enemyBullets.push(new Bullet(e.x, e.y, 0, 4, '#ff0000'));
        }
        
        // 椎名の本気モード（3面イカサマ状態）では自機狙いの弾幕を撃ってくる
        if (stg.isRealShiina && Math.random() < 0.01) {
            const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
            stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang)*3, Math.sin(ang)*3, '#ff00ff'));
        }
    }
};
