let selectedCharId = 'igari';
let currentStage = 1;

// 状態管理: 'UI', 'ADV', 'PRE_STG_DIALOGUE', 'STG_ENTER', 'STG_PLAY', 'POST_STG_DIALOGUE'
let gameState = 'UI'; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId;

const advManager = new ADVManager();
let stgManager = null;

// --- UI操作系 ---
function initCharSelect() {
    const list = document.getElementById('char-list');
    list.innerHTML = '';
    characters.forEach(char => {
        const btn = document.createElement('button');
        btn.className = `char-btn ${char.id === selectedCharId ? 'selected' : ''}`;
        btn.innerText = char.name;
        btn.onclick = (e) => {
            selectedCharId = char.id;
            document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            updatePreview();
        };
        list.appendChild(btn);
    });
    updatePreview();
}

function updatePreview() {
    const char = characters.find(c => c.id === selectedCharId);
    document.getElementById('preview-name').innerText = char.name;
    document.getElementById('preview-name').style.color = char.color;
    document.getElementById('preview-desc').innerText = char.desc;
    document.getElementById('preview-weapon').innerText = char.weapon;
}

function changeScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    if(screenId) document.getElementById(screenId).classList.remove('hidden');
}

function goToStageSelect() { changeScreen('stage-select-screen'); }

initCharSelect();

// キャンバスリサイズ
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- ゲーム進行フロー ---
function startGame(stageNum) {
    currentStage = stageNum;
    changeScreen(''); // 全UIを隠す
    
    const charData = characters.find(c => c.id === selectedCharId);
    stgManager = new STGManager(canvas, charData);
    
    // ステージ1のみ、STG背景無しのADVからスタート
    if (stageNum === 1) {
        gameState = 'ADV';
        advManager.start(scenarios[currentStage].adv, () => {
            // ADVが終わったらSTG背景での会話へ
            gameState = 'PRE_STG_DIALOGUE';
            advManager.start(scenarios[currentStage].pre_stg, () => {
                gameState = 'STG_ENTER'; // 会話が終わったら自機入場
            });
        });
    } else {
        // ステージ2以降は最初からSTG背景で会話
        gameState = 'PRE_STG_DIALOGUE';
        advManager.start(scenarios[currentStage].pre_stg, () => {
            gameState = 'STG_ENTER';
        });
    }

    cancelAnimationFrame(gameLoopId);
    loop();
}

// --- 入力制御（スマホタッチ） ---
let touchX = 0, touchY = 0, isTouching = false;

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    // ADVや会話中ならテキストを進める
    if (gameState === 'ADV' || gameState === 'PRE_STG_DIALOGUE' || gameState === 'POST_STG_DIALOGUE') {
        advManager.next();
        return;
    }
    // STG中なら自機移動の起点セット
    if (gameState === 'STG_PLAY') {
        isTouching = true;
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
    }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (gameState === 'STG_PLAY' && isTouching) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        stgManager.player.x += (currentX - touchX) * 1.2;
        stgManager.player.y += (currentY - touchY) * 1.2;
        stgManager.player.x = Math.max(10, Math.min(canvas.width - 10, stgManager.player.x));
        stgManager.player.y = Math.max(10, Math.min(canvas.height - 10, stgManager.player.y));
        touchX = currentX; touchY = currentY;
    }
}, { passive: false });

canvas.addEventListener('touchend', e => { isTouching = false; });

// --- メインループ ---
function loop() {
    if (gameState === 'UI') return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'ADV') {
        // 真っ暗な背景でアドベンチャーパート
        advManager.draw(ctx, canvas);
    } 
    else if (gameState === 'PRE_STG_DIALOGUE') {
        // STG背景を描画した上で会話
        stgManager.draw(ctx);
        advManager.draw(ctx, canvas);
    }
    else if (gameState === 'STG_ENTER') {
        stgManager.draw(ctx);
        const isEntered = stgManager.updateEntrance();
        if (isEntered) {
            gameState = 'STG_PLAY';
            // テスト用：敵を生成開始
            setInterval(() => {
                if(gameState === 'STG_PLAY') stgManager.enemies.push({x: Math.random()*(canvas.width-40)+20, y:-20, hp:50, fireTimer:0});
            }, 2000);
        }
    }
    else if (gameState === 'STG_PLAY') {
        const status = stgManager.updateGameplay();
        stgManager.draw(ctx);
        
        if (status === 'GAMEOVER') {
            gameState = 'UI';
            document.getElementById('result-title').innerText = "GAME OVER";
            changeScreen('result-screen');
            return;
        }
    }

    gameLoopId = requestAnimationFrame(loop);
}
