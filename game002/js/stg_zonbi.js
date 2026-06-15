const VER_STG_ZONBI = "0.1.0"; // ゾンビ最終決戦：5種2コマゾンビ群、1/8連動破壊ヤマタノオロチを完全実装

window.StageConfigs = window.StageConfigs || {};
window.StageConfigs['zonbi'] = {
    init: function(stg, canvas) {
        stg.bossSpawned = false;
        stg.totalBossMaxHp = 1000; // オロチのトータル最大HP（1本あたり125HP * 8本分）
        stg.totalBossHp = stg.totalBossMaxHp;
        stg.lastActiveHeadsCount = 8; // 前回チェック時の生きてる首の数

        // 3D背景側にこのステージが『お仕事な日常（zonbi）』であることを通知してアタッチ
        if (window._bgManagerInstance) {
            window._bgManagerInstance.buildings.forEach(b => b.visible = false);
            window._bgManagerInstance.clouds.forEach(c => c.visible = false);
            if (window._bgManagerInstance.ground) window._bgManagerInstance.ground.visible = false;
            
            if (window.BGZonbiManager) {
                window.BGZonbiManager.init(window._bgManagerInstance);
            }
        }
    },

    updateBackground: function(stg, sW, sH) {
        // 背景の駆動は 3dbg_zonbi.js の update 側でフレーム連動同期して回すため、ここでは空
    },

    drawBackground: function(stg, ctx, sW, sH) {
        // 3Dレンダラーの背景透過レイヤーとしてCanvas自体をクリアに保つため、デフォルト黒塗りは行わない
    },

    getEnemyData: function(type) {
        // ★修正：スプライトシート（2列5行）から5種類のゾンビを動的切り出し定義
        // zombie_0 ～ zombie_4 でタイプ別の特性（耐久度、速度）をわずかに持たせる
        if (type === 'zombie_0') return { size: 24, hp: 2, maxHp: 2, speed: 2.2 }; // 標準服
        if (type === 'zombie_1') return { size: 28, hp: 5, maxHp: 5, speed: 1.2 }; // タンクトップ（硬め）
        if (type === 'zombie_2') return { size: 24, hp: 2, maxHp: 2, speed: 2.6 }; // スーツ（早め）
        if (type === 'zombie_3') return { size: 26, hp: 3, maxHp: 3, speed: 1.8 }; // エプロン（中堅）
        if (type === 'zombie_4') return { size: 24, hp: 4, maxHp: 4, speed: 1.5 }; // 黒スーツ（タフ）

        // ヤマタノオロチの頭部。1本の共有HP管理オブジェクトとして定義
        if (type === 'orochi_head') return { imgSrc: 'yamahead.webp', size: 45, hp: 125, maxHp: 125, isBoss: true };
    },

    updateWaves: function(stg, timer, sW, sH) {
        // 前半～中盤にかけて、樹木の合間からゾンビが2倍増量のワラワラと大群で押し寄せる
        if (timer > 60 && timer < 3500) {
            let spawnInterval = stg.player.powerLevel >= 4 ? 25 : 40;
            if (timer % spawnInterval === 0) {
                const zType = 'zombie_' + Math.floor(Math.random() * 5);
                // 画面上部から木々に紛れてバラパラと出現
                stg.enemies.push(new Enemy(zType, Math.random() * (sW - 60) + 30, -40, stg.player.charData, stg.advManager, stg.stgId));
                // 2倍のワラワラ感を出すため、時間差で同時スポーン
                stg.enemies.push(new Enemy(zType, Math.random() * (sW - 60) + 30, -80, stg.player.charData, stg.advManager, stg.stgId));
            }
        }

        // ボス（ヤマタノオロチ 8本）降臨
        if (timer === 3700 && !stg.bossSpawned) {
            stg.bossSpawned = true;
            // 画面横幅いっぱいに等間隔で8本の頭部を一斉配置
            for (let i = 0; i < 8; i++) {
                let hX = sW * 0.12 + i * (sW * 0.11);
                let head = new Enemy('orochi_head', hX, -100, stg.player.charData, stg.advManager, stg.stgId);
                head.headIndex = i; // 左から何番目の首かのインデックス
                head.targetY = sH * 0.2 + (i % 2) * 30; // 少し交互に高さをズラして威圧感を出す
                
                // ★修正：オロチの個別描画メソッドを上書き。HPが1/8減るごとの爆発による首消滅ギミック
                head.draw = function(ctx) {
                    if (this.isHidden || !this.alive) return;
                    ctx.save();
                    ctx.translate(this.x, this.y);

                    const img = stg.advManager.assets['yamahead.webp'];
                    if (img && img.naturalWidth > 0) {
                        ctx.shadowColor = 'rgba(255,0,0,0.5)';
                        ctx.shadowBlur = 15;
                        const drawW = this.size * 2;
                        const drawH = drawW * (img.height / img.width);
                        ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
                    } else {
                        // 画像が万が一ない場合のフォールバック（禍々しい赤紫の円）
                        ctx.fillStyle = '#aa0055';
                        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
                    }
                    ctx.restore();
                };

                stg.enemies.push(head);
            }
        }

        // ボス戦中、トータルHPバーの同期と、1/8（125ダメージごと）の減少を常時監視
        if (stg.bossSpawned) {
            const heads = stg.enemies.filter(e => e.type === 'orochi_head' && !e.isDying);
            let currentHpSum = 0;
            heads.forEach(h => currentHpSum += Math.max(0, h.hp));
            stg.totalBossHp = currentHpSum;

            // 残りの首の想定数を計算（トータルHPが125減るごとに1本消える仕様）
            let expectedHeadsCount = Math.ceil(stg.totalBossHp / 125);
            if (stg.totalBossHp <= 0) expectedHeadsCount = 0;

            // トータルHPの減り具合から、首の切り離し消滅処理をトリガー
            if (expectedHeadsCount < stg.lastActiveHeadsCount && heads.length > 0) {
                // 右端、またはランダムな生きている首を1本選んで即座に爆発四散させる
                let targetHead = heads[heads.length - 1];
                if (targetHead) {
                    targetHead.isDying = true;
                    targetHead.deathTimer = 0;
                    // 顔面に特大の爆発モーションを発生させる
                    stg.explosions.push(new Explosion(targetHead.x, targetHead.y, targetHead.size * 3, stg.advManager));
                    if (typeof soundManager !== 'undefined') soundManager.playSE('smallb');
                }
                stg.lastActiveHeadsCount = expectedHeadsCount;
            }

            // 全ての首が消滅したらステージクリアへ移行
            if (stg.totalBossHp <= 0 && !stg.isStageClear) {
                // 念のためザコも一掃
                stg.enemies.forEach(e => { e.alive = false; });
                stg.isStageClear = true;
            }
        }
    },

    updateEnemy: function(e, canvas, player) {
        e.moveTimer = (e.moveTimer || 0) + 1;
        const dpr = window.devicePixelRatio || 1;
        const sH = canvas.height / dpr;

        // --- ゾンビ群の動き制御 ---
        if (e.type.includes('zombie')) {
            // 基本ステータスからスピードを抽出して木々の合間をゆっくり直進南下
            let zSpeed = e.config.getEnemyData ? e.config.getEnemyData(e.type).speed : 1.5;
            e.y += zSpeed;

            // わずかにフラフラとうねる不気味なノイズ歩行
            e.x += Math.sin(e.moveTimer * 0.03 + e.startX) * 0.6;
            return;
        }

        // --- ヤマタノオロチの首（頭部）の動き制御 ---
        if (e.type === 'orochi_head') {
            // 降臨時はゆっくり画面内にフェードイン
            if (e.y < e.targetY) {
                e.y += (e.targetY - e.y) * 0.03;
            } else {
                // 3Dの蛇のように、8本それぞれが不規則・非同期にウネウネと円運動・うねりを行う
                e.x = e.startX + Math.sin(e.moveTimer * 0.02 + e.headIndex * 1.5) * 40;
                e.y = e.targetY + Math.cos(e.moveTimer * 0.035 + e.headIndex * 2.0) * 20;
            }
        }
    },

    transformEnemy: function(e, ctx) {
        // ★修正：ゾンビの2コマアニメーションをFPS:1.5程度（約40フレームに1コマ進む遅さ）で表現
        if (e.type.includes('zombie')) {
            const img = stg.advManager.assets['zonbi.webp'];
            if (img && img.naturalWidth > 0) {
                // 文字列からインデックス(0～4)を抽出して行にする
                const typeIdx = parseInt(e.type.split('_')[1], 10);
                
                // 40フレーム周期で0と1の2コマをループ（FPS 1.5のパラパラ漫画感を完全再現）
                const animeFrame = Math.floor(e.moveTimer / 40) % 2;

                const sw = img.width / 2;    // 2列
                const sh = img.height / 5;   // 5行
                const sx = animeFrame * sw;
                const sy = typeIdx * sh;

                const drawW = e.size * 2;
                const drawH = drawW * (sh / sw);

                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 5;
                // スプライトシートから指定コマを切り出し、Enemyクラスのデフォルト丸描画を打ち消して上書き
                ctx.drawImage(img, sx, sy, sw, sh, -drawW/2, -drawH/2, drawW, drawH);
                
                // コア側のデフォルト円描画が走らないように、偽のコンテキスト状態を作って退避
                ctx.globalAlpha = 0.0;
            }
        }
    },

    shootEnemy: function(e, stg) {
        // ゾンビは弾を撃たず、体当たりでのみ襲ってくる
        if (e.type.includes('zombie')) return;

        // ヤマタノオロチはそれぞれの頭部がウネウネ動きながら不規則に弾を吐き出す
        if (e.type === 'orochi_head' && !e.isDying) {
            // 各頭部が時間差で弾幕を展開
            if ((stg.frame + e.headIndex * 30) % 140 === 0) {
                const ang = Math.atan2(stg.player.y - e.y, stg.player.x - e.x);
                // 怨念がこもった紫色の怨霊丸弾を3WAYで発射
                for (let i = -1; i <= 1; i++) {
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang + i * 0.25) * 4, Math.sin(ang + i * 0.25) * 4, '#ff00ff'));
                }
            }

            // 難易度が高い（パワーレベル4以上）場合、さらに全方位へ低速の鱗弾をばら撒く
            if (stg.player.powerLevel >= 4 && (stg.frame + e.headIndex * 45) % 200 === 0) {
                for (let i = 0; i < 6; i++) {
                    const ang = (i * Math.PI * 2 / 6) + stg.frame * 0.02;
                    stg.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, '#ff5500'));
                }
            }
        }
    },

    // 画面上部へのトータル共有HPバーのカスタム描画メソッド
    drawCenterTextExtension: function(stg, ctx, sW, sH) {
        if (stg.bossSpawned && stg.totalBossHp > 0) {
            const barW = sW * 0.8;
            const barH = 16;
            const barX = sW * 0.1;
            const barY = 25;

            // 黒背景枠
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX, barY, barW, barH);
            
            // 赤いHPゲージ
            ctx.fillStyle = 'linear-gradient(to right, #ff0000, #ff5500)';
            ctx.fillStyle = '#cc0033'; // 古いブラウザ用ソリッドカラー
            ctx.fillRect(barX, barY, barW * (stg.totalBossHp / stg.totalBossMaxHp), barH);
            
            // 白い外枠
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barW, barH);

            // ボス名テキスト
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`BOSS: ヤマタノオロチ (${stg.totalBossHp}/${stg.totalBossMaxHp})`, barX + 5, barY - 6);
        }
    }
};

// メインループやSTGManager側のゲージ描画にフックをかけるための割り込み
if (window.StageConfigs && window.StageConfigs['zonbi']) {
    // STGManager.prototype.draw の末尾でバーが自動描画されるように、STGManagerのアップデート側にフックを追記
    const origUpdate = STGManager.prototype.updateGameplay;
    STGManager.prototype.updateGameplay = function() {
        const res = origUpdate.call(this);
        if (this.stgId === 'zonbi' && window.StageConfigs['zonbi'].drawCenterTextExtension) {
            // draw時に呼び出せるよう、マネージャーインスタンスのカスタムプロパティに退避、またはdrawを一部ラップ
            this.customBarDraw = window.StageConfigs['zonbi'].drawCenterTextExtension;
        }
        return res;
    };

    // 元の描画メソッドをラップして画面上部ゲージを重ねる
    const origDraw = STGManager.prototype.draw;
    STGManager.prototype.draw = function(ctx) {
        origDraw.call(this, ctx);
        if (this.stgId === 'zonbi' && this.customBarDraw) {
            const c = document.getElementById('gameCanvas');
            const dpr = window.devicePixelRatio || 1;
            this.customBarDraw(this, ctx, c.width/dpr, c.height/dpr);
        }
    };
}
