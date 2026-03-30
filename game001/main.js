// CYBER-SWEEP v7.0 | main.js | GAME FLOW MANAGER
const MainController = {
    // ステージごとのカラーテーマ (SELECT SECTORやゲーム開始時に適用)
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#ff00ff', pink: '#ffffff', name: "GHOST NETWORK" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    init() {
        // 初期イベントリスナー
        document.getElementById('start-btn').onclick = () => this.handleStart();
        document.getElementById('audio-toggle-btn').onclick = () => this.toggleAudio();
        // ABORT時はセレクト画面へ
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        
        // StoryEngineの初期化
        StoryEngine.init();

        this.setupScrollSync();
    },

    // ゲーム開始処理：アセット読み込み -> プロローグ
    async handleStart() {
        const btn = document.getElementById('start-btn');
        btn.disabled = true; 
        btn.innerText = "LOADING CORE PROTOCOLS...";

        try {
            // アセット事前読み込み (新規追加：door.png)
            await this.preload(['img/ship.png','img/space02.png','img/bomb.png','img/bit.png','img/girl.png','img/inship.png','img/door.png']);
            this.startExteriorPrologue();
        } catch(e) { 
            // 読み込みエラー時はセレクト画面へ
            this.showScene('scene-select'); 
        } finally { 
            btn.disabled = false; 
            btn.innerText = "INITIALIZE CONNECTION"; 
        }
    },

    // アセット読み込み待機ロジック
    async preload(urls) {
        const ps = urls.map(u => new Promise(res => {
            const i = new Image();
            i.src = u;
            i.onload = () => i.decode ? i.decode().then(res) : res();
            i.onerror = res;
        }));
        return Promise.all(ps);
    },

    // シーン切り替えロジック
    showScene(id) {
        document.querySelectorAll('.scene').forEach(s => s.classList.replace('scene-show', 'scene-hidden'));
        document.getElementById(id).classList.replace('scene-hidden', 'scene-show');
    },

    // ◯ 演出1: 船外カメラ (小惑星衝突)
    startExteriorPrologue() {
        SoundEngine.init();
        this.showScene('scene-prologue');
        
        let count = 0;
        const interval = setInterval(() => {
            this.playExteriorExplosion();
            count++;
            if(count >= 3) {
                clearInterval(interval);
                // 演出終了後、アドベンチャーシーン（船内会話）へ
                setTimeout(() => this.startAdventureScene(), 1500);
            }
        }, 800);
    },

    // 船外爆発演出
    playExteriorExplosion() {
        const container = document.getElementById('exp-container');
        const exp = document.createElement('div');
        exp.className = 'explosion';
        // 船体に重なるランダム位置
        const rx = 170 + (Math.random() * 80 - 40);
        const ry = 100 + (Math.random() * 30 - 15);
        exp.style.left = `${rx - 40}px`; exp.style.top = `${ry - 40}px`;
        container.appendChild(exp);
        exp.classList.add('bomb-play');
        SoundEngine.playSFX('damage');
        setTimeout(() => exp.remove(), 1000);
    },

    // ◯ 演出2: アドベンチャーシーン (会話パート)
    startAdventureScene() {
        this.showScene('scene-adventure');
        // StoryEngineを起動し、完了後のコールバックにステージ1開始を登録
        StoryEngine.startConversation(() => {
            // 会話がすべて完了したらステージ1へ遷移
            this.startStageOne();
        });
    },

    // ◯ ゲームパート: ステージ1開始
    startStageOne() {
        const lvl = 1;
        // 1. レベル1のテーマを適用 (水色/ピンク)
        const theme = this.themes[lvl];
        document.documentElement.style.setProperty('--neon-blue', theme.blue);
        document.documentElement.style.setProperty('--neon-pink', theme.pink);
        
        // 2. ゲームUIをセットアップ
        document.getElementById('game-title-text').innerText = theme.name;
        document.getElementById('level-display').innerText = `LVL.0${lvl} / 05`;
        
        // 3. ゲームシーンへ切り替え
        this.showScene('scene-game');
        
        // 4. ゲームロジックを初期化 (game.js)
        GameLogic.init(lvl);
    },

    // レベル選択画面の生成 (ステージ1クリア後に使用)
    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-4 rounded-lg font-bold text-left hover:bg-gray-800 transition-all active:scale-95';
            btn.innerHTML = `<span class="text-[9px] font-orbitron" style="color:${data.blue}">SECTOR ${String(lvl).padStart(2,'0')}</span><br><span class="text-sm tracking-wide">${data.name}</span>`;
            btn.onclick = () => {
                // テーマ適用してゲーム開始
                document.documentElement.style.setProperty('--neon-blue', data.blue);
                document.documentElement.style.setProperty('--neon-pink', data.pink);
                document.getElementById('game-title-text').innerText = data.name;
                document.getElementById('level-display').innerText = `LVL.0${lvl} / 05`;
                this.showScene('scene-game');
                GameLogic.init(parseInt(lvl));
            };
            container.appendChild(btn);
        });
    },

    // 音声トグル
    toggleAudio() {
        const m = SoundEngine.toggleMute();
        document.getElementById('audio-toggle-btn').innerText = `Sound: ${m ? 'OFF' : 'ON'}`;
    },

    // スクロールエッジ演出
    setupScrollSync() {
        const cont = document.getElementById('game-container');
        cont.onscroll = () => {
            const th = 5;
            document.getElementById('edge-top').classList.toggle('edge-active', cont.scrollTop > th);
            document.getElementById('edge-bottom').classList.toggle('edge-active', cont.scrollTop + cont.clientHeight < cont.scrollHeight - th);
            document.getElementById('edge-left').classList.toggle('edge-active', cont.scrollLeft > th);
            document.getElementById('edge-right').classList.toggle('edge-active', cont.scrollLeft + cont.clientWidth < cont.scrollWidth - th);
        };
    },

    // ゲーム結果モーダル (game.jsから呼び出し)
    showModal(isWin) {
        const modal = document.getElementById('modal');
        const modalBtn = document.getElementById('modal-btn-main');
        
        if (isWin) {
            // クリア時：ステージ2アンロックまたはステージ選択へ
            document.getElementById('modal-title').innerText = "CLEARED";
            document.getElementById('modal-desc').innerText = "Sector successfully decrypted. New decryption matrix unlocked.";
            modalBtn.innerText = "SELECT NEXT SECTOR";
            // ステージ選択画面を生成して遷移
            this.createStageSelect();
            modalBtn.onclick = () => { modal.classList.add('hidden'); this.showScene('scene-select'); };
        } else {
            // 失敗時：ステージ1からやり直し
            document.getElementById('modal-title').innerText = "FAILED";
            document.getElementById('modal-desc').innerText = "System Integrity Lost. Reboot and retry protocol.";
            modalBtn.innerText = "REBOOT / RETRY";
            modalBtn.onclick = () => { modal.classList.add('hidden'); this.startStageOne(); };
        }
        modal.classList.remove('hidden');
    }
};

window.onload = () => MainController.init();
