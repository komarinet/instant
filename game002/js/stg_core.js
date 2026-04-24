const VER_STG_CORE = "0.7.8"; // バージョン更新（ボスタグによる自動ADV挿入と待機システムを実装。他処理の削除一切なし）

window.StageConfigs = window.StageConfigs || {};

class Enemy {
    constructor(type, x, y, charData, advManager, stgId) {
        this.type = type; this.x = x; this.y = y; this.startX = x; this.startY = y;
        this.charData = charData; this.alive = true; this.angle = 0; this.moveTimer = 0; 
        this.advManager = advManager; 
        
        this.isDying = false; 
        this.deathTimer = 0;
        
        if (!stgId) {
            if (typeof currentStage !== 'undefined') {
                if (currentStage === 1) stgId = 'kagami';
                else if (currentStage === 2) stgId = 'hiragi';
                else if (currentStage === 3) stgId = 'shiina';
                else stgId = 'kagami';
            } else {
                stgId = 'kagami';
            }
        }
        this.config = window.StageConfigs[stgId] || {};

        let data = null;
        if (this.config.getEnemyData) { data = this.config.getEnemyData(type); }
        if (!data) { data = { imgSrc: null, size: 20, hp: 1, maxHp: 1 }; }

        this.imgSrc = data.imgSrc; 
        this.size = data.size || 20; 
        this.hp = data.hp || 1; 
        this.maxHp = data.maxHp || data.hp || 1;

        // ★追加・修正：ご提案いただいた動的なボス判定！「data.isBoss」指定があるか、「タイプ名」「画像名」に'boss'が含まれるか、または「HPが100以上」ならボスと認識する
        this.isBoss = data.isBoss === true || type.includes('boss') || (this.imgSrc && this.imgSrc.includes('boss')) || this.maxHp >= 100;

        // ★追加：ADV制御用のステータス
        this.advTriggered = false;
        this.isHidden = false;

        if(data.init) data.init(this);
    }
    
    update(canvas, player) {
        if(this.config.updateEnemy) this.config.updateEnemy(this, canvas, player);
        const dpr = window.devicePixelRatio || 1;
        if (this.y > canvas.height/dpr + this.size * 2 || (this.state === 'leave' && this.y < -this.size * 2)) this.alive = false;
    }
    
    draw(ctx) {
        const img = (this.advManager && this.advManager.assets) ? this.advManager.assets[this.imgSrc] : null;
        ctx.save(); ctx.translate(this.x, this.y);
        
        if (this.config.transformEnemy) this.config.transformEnemy(this, ctx);

        if (img && img.naturalWidth > 0) {
            const ar = img.width / img.height; let dW, dH;
            if (ar > 1) { dW = this.size * 2; dH = dW / ar; } else { dH = this.size * 2; dW = dH * ar; }
            
            if (this.isDying && this.deathTimer >= 60) {
                const progress = (this.deathTimer - 60) / 120; 
                const block = Math.max(1, Math.floor(progress * 15)); 
                
                if (block > 1) {
                    if (!this.mosaicCanvas) {
                        this.mosaicCanvas = document.createElement('canvas');
                        this.mosaicCtx = this.mosaicCanvas.getContext('2d');
                    }
                    this.mosaicCanvas.width = Math.max(1, Math.floor(dW / block));
                    this.mosaicCanvas.height = Math.max(1, Math.floor(dH / block));
                    this.mosaicCtx.clearRect(0, 0, this.mosaicCanvas.width, this.mosaicCanvas.height);
                    this.mosaicCtx.drawImage(img, 0, 0, this.mosaicCanvas.width, this.mosaicCanvas.height);
                    
                    ctx.imageSmoothingEnabled = false; 
                    ctx.globalAlpha = Math.max(0, 1.0 - progress); 
                    ctx.drawImage(this.mosaicCanvas, -dW/2, -dH/2, dW, dH);
                    ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 1.0;
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.drawImage(img, -dW/2, -dH/2, dW, dH);
                }
            } else {
                ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.drawImage(img, -dW/2, -dH/2, dW, dH);
            }
        } else { 
            // ★修正：ボス描画のフォールバック色判定を拡張
            ctx.fillStyle = this.isBoss ? '#ff00ff' : '#00ffff'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); 
        }

        // ★修正：ボスのHPゲージ描画条件を拡張＆ゲージのマイナス描画防止
        if (this.isBoss && this.hp > 0 && !this.isDying) {
            const bW = this.size * 1.5, bH = 10;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bW/2, -this.size-20, bW, bH);
            ctx.fillStyle = '#ff3366'; ctx.fillRect(-bW/2, -this.size-20, bW*(Math.max(0, this.hp)/this.maxHp), bH);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(-bW/2, -this.size-20, bW, bH);
        }
        ctx.restore();
    }
}

class STGManager {
    constructor(canvas, charData, stgId) {
        this.player = new Player(charData); this.player.initPosition(canvas);
        this.enemies = []; this.enemyBullets = []; this.items = []; this.explosions = []; this.frame = 0; this.bossSpawned = false;
        this.stageTimer = 0; this.isStageClear = false; 
        this.advManager = (typeof advManager !== 'undefined') ? advManager : null; 
        
        this.flashTimer = 0; this.shakeTimer = 0;

        this.bombState = 'READY'; 
        this.bombTimer = 0;
        this.bombData = null; 
        this.isTimeStopped = false; 
        
        this.stgId = stgId;
        if (!this.stgId) {
            if (typeof currentStage !== 'undefined') {
                if (currentStage === 1) this.stgId = 'kagami';
                else if (currentStage === 2) this.stgId = 'hiragi';
                else if (currentStage === 3) this.stgId = 'shiina';
                else this.stgId = 'kagami';
            } else { this.stgId = 'kagami'; }
        }
        
        // ★追加：BGM切り替え管理フラグ
        this.bgmChanged = false;
        // ★追加：全体で1回だけADVを呼ぶためのフラグ
        this.bossAdvTriggered = false;

        this.config = window.StageConfigs[this.stgId] || {};
        if (this.config && this.config.init) this.config.init(this, canvas);
    }

    triggerBomb() {
        this.player.triggerBomb(this);
    }
    
    updateEntrance() { const c = document.getElementById('gameCanvas'); this.player.update(c); return !this.player.isEntering; }

    updateGameplay() {
        const canvas = document.getElementById('gameCanvas'), dpr = window.devicePixelRatio || 1, sW = canvas.width/dpr, sH = canvas.height/dpr;

        if (this.isTimeStopped) {
            this.player.updateBomb(this, sW, sH);
            this.explosions.forEach(ex => ex.update());
            this.explosions = this.explosions.filter(ex => !ex.isDead);
            return 'PLAYING'; 
        }

        this.frame++; this.stageTimer++;
        
        this.player.update(canvas); if (!this.player.isEntering && this.frame % 8 === 0) this.player.shoot(); 
        
        if(this.config.updateBackground) this.config.updateBackground(this, sW, sH);
        if(this.config.updateWaves) this.config.updateWaves(this, this.stageTimer, sW, sH);

        // ★追加：敵リストの中にボスがいるなら、自動でフラグを立てる（各ステージで書き忘れても安心の設計）
        if (!this.bossSpawned && this.enemies.some(e => e.isBoss)) {
            this.bossSpawned = true;
        }

        // ★追加・修正：ボスタグを持つ敵が追加された瞬間にADVを差し込む
        let hasNewBoss = false;
        for (let e of this.enemies) {
            if (e.isBoss && !e.advTriggered) {
                hasNewBoss = true;
                e.advTriggered = true;
                e.isHidden = true; // ADVが終わるまで完全に姿を隠し、当たり判定も消す
            }
        }

        if (hasNewBoss && !this.bossAdvTriggered) {
            this.bossAdvTriggered = true;
            let midAdvData = [];
            try {
                const charId = (this.player && this.player.charData) ? this.player.charData.id : 'igari';
                const stageNum = window.currentStage || 1;
                if (window.scenarios && window.scenarios[charId] && window.scenarios[charId][stageNum] && window.scenarios[charId][stageNum].mid_stg) {
                    midAdvData = window.scenarios[charId][stageNum].mid_stg;
                }
            } catch(e) { console.warn("ADV取得エラー", e); }

            // ADV終了時の共通処理：ボスを表示させてBGMを鳴らす
            const onAdvEnd = () => {
                this.enemies.forEach(e => { if (e.isBoss) e.isHidden = false; });
                if (!this.bgmChanged) {
                    this.bgmChanged = true;
                    if (typeof window.soundManager !== 'undefined') window.soundManager.playBGM('boss_' + this.stgId);
                }
            };

            if (midAdvData.length > 0 && typeof window.startMidStgADV === 'function') {
                window.startMidStgADV(midAdvData, onAdvEnd);
            } else {
                onAdvEnd();
            }
        }

        this.player.bullets.forEach(b => b.update(canvas)); this.enemyBullets.forEach(b => b.update(canvas));
        this.player.bullets = this.player.bullets.filter(b => b.alive); this.enemyBullets = this.enemyBullets.filter(b => b.alive);
        this.items.forEach(it => it.update(canvas)); this.items = this.items.filter(it => it.alive);
        
        this.explosions.forEach(ex => ex.update()); this.explosions = this.explosions.filter(ex => !ex.isDead);

        for (let e of this.enemies) {
            // ★追加：隠れているボス（ADV再生中など）はすべての処理をスキップ！
            if (e.isHidden) continue;

            if (e.isDying) {
                e.deathTimer++;
                if (e.deathTimer === 1) this.flashTimer = 15;
                if (e.deathTimer === 30) this.flashTimer = 15;
                if (e.deathTimer === 60) { this.flashTimer = 20; this.shakeTimer = 120; }
                if (e.deathTimer >= 60 && e.deathTimer < 180) {
                    if (this.frame % 4 === 0) {
                        const exX = e.x + (Math.random() - 0.5) * e.size * 2.5; const exY = e.y + (Math.random() - 0.5) * e.size * 2.5;
                        this.explosions.push(new Explosion(exX, exY, (e.size * 2) * (Math.random() * 0.5 + 0.5), this.advManager));
                        if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                    }
                }
                if (e.deathTimer >= 180) {
                    e.alive = false; this.isStageClear = true;
                    this.explosions.push(new Explosion(e.x, e.y, e.size * 4, this.advManager));
                    if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                }
                continue; 
            }

            e.update(canvas, this.player);
            if (e.alive && !this.player.isEntering && this.config.shootEnemy) this.config.shootEnemy(e, this);

            this.player.bullets.forEach(b => {
                if (b.alive && e.alive && !e.isDying && Math.sqrt((b.x-e.x)**2 + (b.y-e.y)**2) < e.size + b.size) {
                    b.alive = false; e.hp--;
                    if (e.hp <= 0) {
                        // ★修正：'typeboss'だけでなく、動的判定したisBossでクリア演出に移行する
                        if (e.isBoss) {
                            e.isDying = true; e.deathTimer = 0; this.enemyBullets = []; 
                        } else {
                            e.alive = false; this.explosions.push(new Explosion(e.x, e.y, e.size * 2, this.advManager));
                            if (typeof soundManager !== 'undefined') soundManager.playSE('smallb'); 
                            if(Math.random()<0.1) this.items.push(new Item('power', e.x, e.y)); else if(Math.random()<0.15) this.items.push(new Item('recover', e.x, e.y));
                        }
                    }
                }
            });
            
            if (e.alive && !this.player.isEntering && this.player.invincibleTimer === 0 && Math.sqrt((e.x-this.player.x)**2 + (e.y-this.player.y)**2) < (e.size+this.player.size)/2) {
                this.player.hp--; this.player.invincibleTimer = 90; 
                if (this.player.hp <= 0) return 'GAMEOVER';
            }
        }
        this.enemies = this.enemies.filter(e => e.alive);
        
        for (let eb of this.enemyBullets) {
            if (eb.alive &&
