const VER_PLAYER_SHIINA = "0.1.0"; // 椎名護の自機コントロール

window.PlayerControllers = window.PlayerControllers || {};

const ShiinaController = {
    draw: function(player, ctx, advManager) {
        // タイマーの初期化と加算
        player.animTimer = (player.animTimer || 0) + 1;
        player.ringAngle = (player.ringAngle || 0) + 0.05; // sans.pngの回転速度

        ctx.save();
        ctx.translate(player.x, player.y);

        // ==========================================
        // 1. 周囲を舞うエフェクト (sans.png) の描画
        // ==========================================
        const sansImg = (advManager && advManager.assets) ? advManager.assets['sans.png'] : null;
        if (sansImg && sansImg.naturalWidth > 0) {
            const sw = sansImg.width / 5;  // 5列
            const sh = sansImg.height / 2; // 2行
            const radius = 45; // 自機からの回転半径

            for (let i = 0; i < 10; i++) {
                // 10個のパーツを均等な角度で配置し、全体を回転させる
                const ang = player.ringAngle + (i * Math.PI * 2 / 10);
                const col = i % 5;
                const row = Math.floor(i / 5);
                
                ctx.save();
                ctx.translate(Math.cos(ang) * radius, Math.sin(ang) * radius);
                // 各エフェクトパーツの描画（サイズは 24x24 に調整）
                ctx.drawImage(sansImg, col * sw, row * sh, sw, sh, -12, -12, 24, 24);
                ctx.restore();
            }
        }

        // ==========================================
        // 2. 自機の往復アニメーション (1000037784.png)
        // ==========================================
        // アップロードされた画像名を指定します（config.jsでの登録名と合わせます）
        const jikiImg = (advManager && advManager.assets) ? advManager.assets['1000037784.png'] : null;
        if (jikiImg && jikiImg.naturalWidth > 0) {
            const animSpeed = 4; // アニメーションの速度（小さいほど速い）
            // 10コマの往復は 0〜9(行き) + 8〜1(帰り) の合計18周期
            const cycle = 18; 
            const t = Math.floor(player.animTimer / animSpeed) % cycle;
            
            // tが10未満ならそのまま(0〜9)、10以上なら折り返し(8〜1)
            const frame = t < 10 ? t : cycle - t; 

            const col = frame % 5;
            const row = Math.floor(frame / 5);
            const sw = jikiImg.width / 5;
            const sh = jikiImg.height / 2;
            
            const drawWidth = 55; // 自機の描画サイズ
            const drawHeight = drawWidth * (sh / sw);

            // 自機画像の描画
            ctx.shadowColor = 'rgba(51, 204, 255, 0.8)';
            ctx.shadowBlur = 10;
            ctx.drawImage(jikiImg, col * sw, row * sh, sw, sh, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
            
            // 当たり判定のコアを描画
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
        } else {
            // 画像読み込み失敗時のフォールバック
            ctx.fillStyle = player.color; ctx.beginPath();
            ctx.arc(0, 0, player.size, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.restore();
    },

    shoot: function(player) {
        // 椎名独自のショットロジック（例：青色の高速レーザー弾）
        const bS = 22; // 弾速（猪狩より少し速め）
        const bColor = '#33ccff'; 
        const pL = player.powerLevel;
        
        // パワーアップに応じた弾幕パターンの分岐
        if (pL === 0) { 
            player.bullets.push(this.createShot(player.x, player.y - player.size, 0, -bS, bColor)); 
        }
        else if (pL === 1) { 
            player.bullets.push(this.createShot(player.x - 8, player.y - player.size, 0, -bS, bColor)); 
            player.bullets.push(this.createShot(player.x + 8, player.y - player.size, 0, -bS, bColor)); 
        }
        else if (pL >= 2 && pL <= 4) {
            player.bullets.push(this.createShot(player.x - 12, player.y - player.size, 0, -bS, bColor));
            player.bullets.push(this.createShot(player.x, player.y - player.size - 10, 0, -bS, '#ffffff'));
            player.bullets.push(this.createShot(player.x + 12, player.y - player.size, 0, -bS, bColor));
        }
        else {
            // パワー最大級：V字の広範囲ショット
            for (let i = -2; i <= 2; i++) {
                player.bullets.push(this.createShot(player.x + i * 10, player.y - player.size - Math.abs(i)*5, i * 1.5, -bS, bColor));
            }
        }
    },
    
    createShot: function(x, y, vx, vy, color) {
        let b = new Bullet(x, y, vx, vy, color, null, 'shiina');
        b.draw = function(ctx) {
            ctx.save(); ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI/2);
            
            ctx.shadowColor = this.color; ctx.shadowBlur = 10; 
            ctx.fillStyle = '#ffffff'; 
            
            // 鋭い楔形のレーザー
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 2);
            ctx.lineTo(this.size, this.size * 2);
            ctx.lineTo(-this.size, this.size * 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        };
        return b;
    },

    triggerBomb: function(player, stg) {
        // クロノス・レーザー / 時間操作ボムのスタブ実装
        if (player.bombs <= 0 || stg.bombState !== 'READY') return;
        player.bombs--; 
        stg.bombState = 'ANIM_IN';
        stg.bombTimer = 0;
        stg.isTimeStopped = true; // 時間停止発動
        
        // 画面上の敵弾をすべて消去してスコアアイテム化などの処理を追加可能
        stg.enemyBullets = [];
        if (typeof soundManager !== 'undefined') soundManager.playSE('smallb');
    },

    updateBomb: function(player, stg, sW, sH) {
        stg.bombTimer++;
        if (stg.bombState === 'ANIM_IN') {
            if (stg.bombTimer >= 60) {
                // ダメージ処理
                stg.enemies.forEach(e => {
                    if (!e.isDying && !(e.isBoss || e.type.includes('boss'))) {
                        e.alive = false; 
                        stg.explosions.push(new Explosion(e.x, e.y, e.size * 2, stg.advManager));
                    } else if (e.isBoss || e.type.includes('boss')) {
                        e.hp -= 150; 
                        if (e.hp <= 0 && !e.isDying) { e.isDying = true; e.deathTimer = 0; }
                    }
                });
                stg.flashTimer = 20; stg.shakeTimer = 30; stg.bombState = 'BEAM'; 
            }
        }
        else if (stg.bombState === 'BEAM') {
            if (stg.bombTimer > 100) {
                stg.isTimeStopped = false; 
                stg.bombState = 'READY'; 
            }
        }
    },

    drawBomb: function(player, stg, ctx, sW, sH, shakeX, shakeY) {
        if (stg.bombState === 'ANIM_IN') {
            ctx.save();
            ctx.fillStyle = `rgba(0, 50, 100, ${Math.min(0.7, stg.bombTimer / 15)})`;
            ctx.fillRect(-shakeX, -shakeY, sW + Math.abs(shakeX)*2, sH + Math.abs(shakeY)*2);
            
            ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('CHRONOS FIELD', sW/2, sH/2);
            ctx.restore();
        }
    }
};

// data.js / data_core.js のID設定ブレを吸収するため、両方の名前で登録
window.PlayerControllers['shiina'] = ShiinaController;
window.PlayerControllers['mamoru'] = ShiinaController;
