const VER_STG = "0.2.5"; // バージョン更新（視認性向上・パワーアップ修正）

// --- クラス定義 ---

class Player {
    constructor(charData) {
        this.id = charData.id;
        this.name = charData.name;
        this.color = charData.color;
        this.x = 0; 
        this.y = 0; 
        this.size = 20; 
        this.speed = 5;
        this.bullets = [];
        this.isEntering = true; 
        
        // ★修正：一撃死からHP制へ移行★
        this.maxHp = 5; // 最大HP（仮）
        this.hp = this.maxHp; // 現在HP
        this.invincibleTimer = 0; // 被弾後の無敵時間タイマー
        this.powerLevel = 0; // ★追加：パワーアップ段階（0〜8）
    }

    initPosition(canvas) {
        const dpr = window.devicePixelRatio || 1;
        this.x = canvas.width / dpr / 2;
        this.y = canvas.height / dpr + this.size * 2; 
    }

    update(canvas) {
        const dpr = window.devicePixelRatio || 1;
        
        // ★追加：無敵タイマーの更新★
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        if (this.isEntering) {
            const targetY = canvas.height / dpr * 0.8;
            this.y -= (this.y - targetY) * 0.05;
            if (Math.abs(this.y - targetY) < 1) {
                this.y = targetY;
                this.isEntering = false;
            }
            return; 
        }

        const limitX = canvas.width / dpr;
        const limitY = canvas.height / dpr;
        if (this.x < this.size) this.x = this.size;
        if (this.x > limitX - this.size) this.x = limitX - this.size;
        if (this.y < this.size) this.y = this.size;
        if (this.y > limitY - this.size) this.y = limitY - this.size;
    }

    draw(ctx) {
        // ★追加：無敵時間は点滅させる演出★
        if (this.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            return; // 描画スキップ（点滅）
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x - this.size, this.y + this.size);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();
        
        // 当たり判定の可視化（テスト用）
        // ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size/2, 0, Math.PI*2); ctx.stroke();
    }

    shoot() {
        if (this.isEntering) return;
        
        // ★修正：パワーレベル（0〜8）に応じて細かく弾幕を強化★
        const bulletSpeed = 10;
        
        if (this.powerLevel === 0) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 1) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, 0, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 2) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 3) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -0.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1.5, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 4) {
            this.bullets.push(new Bullet(this.x, this.y - this.size, 0, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -2, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 2, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 5) {
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -0.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 0.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -1.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 1.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x - 5, this.y - this.size, -2.5, -bulletSpeed, this.color));
            this.bullets.push(new Bullet(this.x + 5, this.y - this.size, 2.5, -bulletSpeed, this.color));
        }
        else if (this.powerLevel === 6) {
            for (let i = -3; i <= 3; i++) {
                this.bullets.push(new Bullet(this.x, this.y - this.size, i * 1.0, -bulletSpeed, this.color));
            }
        }
        else if (this.powerLevel === 7) {
            for (let i = -3; i <= 4; i++) {
                this.bullets.push(new Bullet(this.x - 2.5, this.y - this.size, (i - 0.5) * 1.0, -bulletSpeed, this.color));
            }
        }
        else if (this.powerLevel >= 8) {
            for (let i = -4; i <= 4; i++) {
                this.bullets.push(new Bullet(this.x, this.y - this.size, i * 1.0, -bulletSpeed, this.color));
            }
        }
    }
}

class Bullet {
    constructor(x, y, vx, vy, color) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.size = 4; this.color = color;
        this.alive = true;
    }
    update(canvas) {
        this.x += this.vx; this.y += this.vy;
        const dpr = window.devicePixelRatio || 1;
        if (this.y < -this.size || this.y > canvas.height / dpr + this.size ||
            this.x < -this.size || this.x > canvas.width / dpr + this.size) {
            this.alive = false;
        }
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
}

class Enemy {
    // ★修正：Type（a,b,c,boss）、サイズ、独自の動きを実装★
    constructor(type, x, y, charData, advManager) {
        this.type = type;
        this.x = x; this.y = y;
        this.charData = charData;
        this.alive = true;
        this.angle = 0; // Type Cの波型用
        this.moveTimer = 0; // Type Bの停止用
        
        // ADVManagerから画像を読み込む（main.jsでプリロード済み）
        this.advManager = advManager; 

        // ★修正：スマホ画面に合わせてサイズを半減★
        if (type === 'typea') {
            this.imgSrc = 'typea.png'; this.size = 16; this.hp = 2; // 赤い戦闘機：ザコ
        } else if (type === 'typeb') {
            this.imgSrc = 'typeb.png'; this.size = 20; this.hp = 4; // 青い砲台：少し硬い
        } else if (type === 'typec') {
            this.imgSrc = 'typec.png'; this.size = 18; this.hp = 3; // 黄色い円盤：波型
        } else if (type === 'typeboss') {
            this.imgSrc = 'typeboss.png'; this.size = 75; this.hp = 150; // ボス：デカい
        } else {
            // 旧バージョンの互換性維持用（もしあれば）
            this.size = 15; this.hp = 1; this.imgSrc = null;
        }
    }

    update(canvas, player) {
        const dpr = window.devicePixelRatio || 1;
        this.angle += 0.05; // 波型計算用

        // ★修正：Typeごとの独自の動きアルゴリズム★
        if (this.type === 'typea') {
            // 赤戦闘機：プレイヤー目掛けて一直線に突撃（y軸はそのまま落ちる）
            this.y += 4;
            // 画面上部にいる時だけ、少しプレイヤーに寄る
            if (this.y < canvas.height / dpr * 0.5) {
                this.x += (player.x - this.x) * 0.01;
            }
        } 
        else if (this.type === 'typeb') {
            // 青砲台：画面の指定位置まで来たら停止して、弾を撃つ
            if (this.y < canvas.height / dpr * 0.3) {
                this.y += 2; // 出現中はゆっくり
            } else {
                // 停止位置に到達。moveTimerを使って周期的に弾を撃たせる（stgManager側で処理）
                this.moveTimer++; 
            }
        }
        else if (this.type === 'typec') {
            // 黄円盤：サインカーブ（波型）を描いて飛行
            this.y += 3;
            this.x += Math.sin(this.angle) * 5; // 横に揺れる
        }
        else if (this.type === 'typeboss') {
            // ボス：画面上部中央に鎮座し、左右にゆらゆら動く
            const targetY = canvas.height / dpr * 0.2;
            if (this.y < targetY) {
                this.y += (targetY - this.y) * 0.02; // ゆっくり定位置へ
            }
            this.x = canvas.width / dpr / 2 + Math.sin(this.angle * 0.5) * (canvas.width / dpr * 0.3);
        }

        // 画面外（下）に出たら消滅
        if (this.y > canvas.height / dpr + this.size * 2) this.alive = false;
    }

    draw(ctx) {
        // ★修正：advManagerが見つからない場合のエラー落ちを完全に防ぐ安全対策を追加★
        const img = (this.advManager && this.advManager.assets) ? this.advManager.assets[this.imgSrc] : null;
        
        if (img && img.naturalWidth > 0) {
            // 画像のサイズ（縦横比揃える）を考慮して描画
            const aspectRatio = img.width / img.height;
            let drawW, drawH;
            if (aspectRatio > 1) {
                drawW = this.size * 2; drawH = drawW / aspectRatio;
            } else {
                drawH = this.size * 2; drawW = drawH * aspectRatio;
            }
            
            // ★追加：敵にドロップシャドウ（影）をつけて背景から浮き上がらせる★
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;

            ctx.drawImage(img, this.x - drawW / 2, this.y - drawH / 2, drawW, drawH);
            
            ctx.restore(); // 影をリセット
        } else {
            // 画像がない場合のフォールバック（既存の図形描画）
            ctx.fillStyle = (this.type === 'typeboss') ? '#ff00ff' : '#00ffff'; ctx.beginPath();
            if (this.type === 'typeboss') ctx.rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
            else ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText('UFO', this.x - 10, this.y + 5);
        }

        // ボスの場合のみHPゲージを頭上に表示
        if (this.type === 'typeboss' && this.hp > 0) {
            const barW = this.size * 2; const barH = 10;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(this.x - barW / 2, this.y - this.size - 20, barW, barH);
            ctx.fillStyle = '#ff3366'; ctx.fillRect(this.x - barW / 2, this.y - this.size - 20, barW * (this.hp / 150), barH);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(this.x - barW / 2, this.y - this.size - 20, barW, barH);
        }
    }
}

// ★追加：アイテムクラス（パワーアップ、回復）★
class Item {
    constructor(type, x, y) {
        this.type = type; // 'power' か 'recover'
        this.x = x; this.y = y;
        this.size = 15;
        this.alive = true;
        this.vy = 2; // ゆっくり落ちる
        this.angle = 0; // ゆらゆら用
    }
    update(canvas) {
        this.y += this.vy; this.angle += 0.1; this.x += Math.sin(this.angle) * 1; // ゆらゆら
        const dpr = window.devicePixelRatio || 1;
        if (this.y > canvas.height / dpr + this.size) this.alive = false;
    }
    draw(ctx) {
        ctx.fillStyle = (this.type === 'power') ? '#ffaa00' : '#33ff33';
        ctx.beginPath();
        if (this.type === 'power') {
            // Pアイテム：五角形
            for (let i = 0; i < 5; i++) {
                const ang = i * Math.PI * 2 / 5 - Math.PI / 2;
                ctx.lineTo(this.x + Math.cos(ang) * this.size, this.y + Math.sin(ang) * this.size);
            }
        } else {
            // Hアイテム：十字
            ctx.rect(this.x - this.size, this.y - this.size / 3, this.size * 2, this.size / 1.5); ctx.fill(); ctx.beginPath();
            ctx.rect(this.x - this.size / 3, this.y - this.size, this.size / 1.5, this.size * 2);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText((this.type === 'power') ? 'P' : 'H', this.x, this.y + 6);
        ctx.textAlign = 'left'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }
}


// --- マネージャークラス ---

class STGManager {
    constructor(canvas, charData) {
        this.player = new Player(charData);
        this.player.initPosition(canvas);
        this.enemies = [];
        this.enemyBullets = [];
        this.items = []; // ★追加：アイテムリスト
        this.frame = 0;
        this.bossSpawned = false;
        
        // ★修正：普通の長さのステージにするためのタイマーと構成★
        this.stageTimer = 0;
        this.isStageClear = false;

        // ★修正：グローバルスコープから正しくadvManagerを取得する★
        this.advManager = (typeof advManager !== 'undefined') ? advManager : null; 
    }

    // ★追加：抜け落ちていた登場演出の処理を復旧★
    updateEntrance() {
        const canvas = document.getElementById('gameCanvas');
        this.player.update(canvas);
        return !this.player.isEntering; // 登場完了したらtrueを返す
    }

    // ★修正：ゲームループ内の更新ロジック全体★
    updateGameplay() {
        this.frame++;
        this.stageTimer++;
        const canvas = document.getElementById('gameCanvas');
        const dpr = window.devicePixelRatio || 1;
        const screenW = canvas.width / dpr;

        this.player.update(canvas);
        if (!this.player.isEntering) {
            if (this.frame % 8 === 0) this.player.shoot(); // 自動連射
        }

        // --- ★修正：ロングステージの敵出現パターン (ウェーブ)★ ---
        const timer = this.stageTimer;
        
        // 序盤：Type A（赤戦闘機）の波
        if (timer > 120 && timer < 600 && timer % 60 === 0) {
            this.enemies.push(new Enemy('typea', Math.random() * screenW, -50, this.player.charData, this.advManager));
        }
        // 序盤：Type C（黄円盤）の編隊
        if (timer === 400 || timer === 430 || timer === 460) {
            for (let i = 0; i < 3; i++) {
                this.enemies.push(new Enemy('typec', screenW * 0.25 + i * screenW * 0.25, -50, this.player.charData, this.advManager));
            }
        }
        // 中盤：Type B（青砲台）の配置
        if (timer > 700 && timer < 1200 && timer % 150 === 0) {
            this.enemies.push(new Enemy('typeb', screenW * 0.2 + Math.random() * screenW * 0.6, -50, this.player.charData, this.advManager));
        }
        // 中盤：Type A & C の混合ウェーブ
        if (timer > 1000 && timer < 1800 && timer % 80 === 0) {
            this.enemies.push(new Enemy('typea', Math.random() * screenW, -50, this.player.charData, this.advManager));
            if (timer % 160 === 0) this.enemies.push(new Enemy('typec', (timer % 160 === 0) ? 50 : screenW - 50, -50, this.player.charData, this.advManager));
        }
        // 後半：ラッシュ
        if (timer > 2000 && timer < 3000) {
            if (timer % 40 === 0) this.enemies.push(new Enemy('typea', Math.random() * screenW, -50, this.player.charData, this.advManager));
            if (timer % 100 === 0) this.enemies.push(new Enemy('typeb', Math.random() * screenW, -50, this.player.charData, this.advManager));
            if (timer % 120 === 0) this.enemies.push(new Enemy('typec', screenW / 2 + Math.sin(timer) * screenW / 2, -50, this.player.charData, this.advManager));
        }

        // ★修正：ボス出現タイミング（約1分半後：5400フレーム）★
        // ※テストしやすさのため一旦早めの 3200フレーム（約50秒）に設定しています
        if (timer === 3200 && !this.bossSpawned) {
            const boss = new Enemy('typeboss', screenW / 2, -150, this.player.charData, this.advManager);
            this.enemies.push(boss);
            this.bossSpawned = true;
        }

        // 弾の更新
        this.player.bullets.forEach(b => b.update(canvas));
        this.enemyBullets.forEach(b => b.update(canvas));
        this.player.bullets = this.player.bullets.filter(b => b.alive);
        this.enemyBullets = this.enemyBullets.filter(b => b.alive);

        // ★追加：アイテムの更新★
        this.items.forEach(it => it.update(canvas));
        this.items = this.items.filter(it => it.alive);

        // 敵の更新と衝突判定
        this.enemies.forEach(e => {
            e.update(canvas, this.player);

            // Type B（青砲台）とボスの射撃処理
            if (e.alive && !this.player.isEntering) {
                if (e.type === 'typeb' && e.moveTimer > 0 && e.moveTimer % 100 === 0) {
                    // プレイヤーを狙い撃ち
                    const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                    this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(angle) * 5, Math.sin(angle) * 5, '#ffcc00'));
                }
                else if (e.type === 'typeboss') {
                    // ボスの弾幕（扇状全方位など）
                    if (this.frame % 20 === 0) {
                        for (let i = 0; i < 16; i++) {
                            const ang = i * Math.PI * 2 / 16 + this.frame * 0.01;
                            this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(ang) * 4, Math.sin(ang) * 4, '#ff3366'));
                        }
                    }
                    if (this.frame % 60 === 0) {
                        // プレイヤー狙い撃ち3WAY
                        const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                        for(let i=-1; i<=1; i++) {
                            this.enemyBullets.push(new Bullet(e.x, e.y, Math.cos(angle + i*0.2) * 6, Math.sin(angle + i*0.2) * 6, '#00ffff'));
                        }
                    }
                }
            }

            // 自機弾 vs 敵
            this.player.bullets.forEach(b => {
                if (b.alive && e.alive) {
                    const dx = b.x - e.x, dy = b.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < e.size + b.size) {
                        b.alive = false; e.hp--;
                        if (e.hp <= 0) {
                            e.alive = false;
                            
                            // ★追加：敵撃破時のアイテムドロップ判定（ Math.random()で確率）★
                            const roll = Math.random();
                            if (roll < 0.1) { // 10%でパワーアップ
                                this.items.push(new Item('power', e.x, e.y));
                            } else if (roll < 0.15) { // +5%で回復
                                this.items.push(new Item('recover', e.x, e.y));
                            }

                            if (e.type === 'typeboss') this.isStageClear = true; // ボス撃破でクリア
                        }
                    }
                }
            });

            // ★修正：敵体当たり vs 自機（HP制対応）★
            if (e.alive && !this.player.isEntering && this.player.invincibleTimer === 0) {
                const dx = e.x - this.player.x, dy = e.y - this.player.y;
                // ヒット判定を少し厳しく（円の半径の和の半分くらい）
                if (Math.sqrt(dx * dx + dy * dy) < (e.size + this.player.size) / 2) {
                    this.player.hp--; // HP減少
                    this.player.invincibleTimer = 90; // 約1.5秒の無敵時間
                    if (this.player.hp <= 0) return 'GAMEOVER'; // HP 0でゲームオーバー
                }
            }
        });
        this.enemies = this.enemies.filter(e => e.alive);

        // ★修正：敵弾 vs 自機（HP制対応）★
        this.enemyBullets.forEach(eb => {
            if (eb.alive && !this.player.isEntering && this.player.invincibleTimer === 0) {
                const dx = eb.x - this.player.x, dy = eb.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < (eb.size + this.player.size) / 2) {
                    eb.alive = false;
                    this.player.hp--; // HP減少
                    this.player.invincibleTimer = 90; // 無敵時間
                    if (this.player.hp <= 0) return 'GAMEOVER';
                }
            }
        });

        // ★追加：アイテム vs 自機 の取得判定★
        this.items.forEach(it => {
            if (it.alive && !this.player.isEntering) {
                const dx = it.x - this.player.x, dy = it.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < (it.size + this.player.size)) {
                    it.alive = false;
                    // アイテム効果
                    if (it.type === 'power') {
                        // パワーアップ（最大8段階）
                        this.player.powerLevel = Math.min(8, this.player.powerLevel + 1);
                    } else if (it.type === 'recover') {
                        // 回復（最大HPまで）
                        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
                    }
                }
            }
        });

        if (this.isStageClear) return 'STAGE_CLEAR';
        return 'PLAYING';
    }

    draw(ctx) {
        // ★追加：3D背景の上に薄い黒を敷いて、視認性を上げる★
        const canvas = document.getElementById('gameCanvas');
        const dpr = window.devicePixelRatio || 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        this.player.bullets.forEach(b => b.draw(ctx));
        this.enemies.forEach(e => e.draw(ctx));
        this.enemyBullets.forEach(eb => eb.draw(ctx));
        this.items.forEach(it => it.draw(ctx)); // ★追加：アイテム描画★
        this.player.draw(ctx);
        
        // ★追加：HPゲージとパワーレベルのUI描画★
        const cssHeight = canvas.height / dpr;
        
        ctx.fillStyle = 'rgba(10, 10, 25, 0.7)'; // UI背景
        ctx.fillRect(10, cssHeight - 50, 290, 40); 
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, cssHeight - 50, 290, 40);

        // HPゲージ
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('HP:', 20, cssHeight - 25);
        const barW = 100, barH = 15;
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(55, cssHeight - 37, barW, barH);
        ctx.fillStyle = '#33ff33'; // HP緑
        ctx.fillRect(55, cssHeight - 37, barW * (this.player.hp / this.player.maxHp), barH);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(55, cssHeight - 37, barW, barH);
        
        // パワーレベル
        ctx.fillStyle = '#fff'; ctx.fillText(`POWER: ${this.player.powerLevel}/8`, 170, cssHeight - 25);
    }
}
