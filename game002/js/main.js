let selectedCharId = 'igari';
let currentStage = 1;

// ステート管理にテロップとフェードを追加
let gameState = 'UI'; 
let transitionTimer = 0; // テロップや暗転の時間を計るタイマー

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId;

const advManager = new ADVManager();
let stgManager = null;

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

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startGame(stageNum) {
    currentStage = stageNum;
    changeScreen(''); 
    
    const charData = characters.find(c => c.id === selectedCharId);
    stgManager = new STGManager(canvas, charData);
    
    // フロー定義：ADV -> 会話 -> STARTテロップ -> 自機入場
    if (stageNum === 1) {
        gameState = 'ADV';
        advManager.start(scenarios[currentStage].adv, () => {
            gameState = 'PRE_STG_DIALOGUE';
            advManager.start(scenarios[currentStage].pre_stg, () => {
                gameState = 'STAGE_START_TEXT';
                transitionTimer = 90; // 1.5秒間表示
            });
        });
    } else {
        gameState = 'PRE_STG_DIALOGUE';
        advManager.start(scenarios[currentStage].pre_stg, () => {
            gameState = 'STAGE_START_TEXT';
            transitionTimer = 90;
        });
    }

    cancelAnimationFrame(gameLoopId);
    loop();
}

let touchX = 0, touchY = 0, isTouching = false;

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (gameState === 'ADV' || gameState === 'PRE_STG_DIALOGUE' || gameState === 'POST_STG_DIALOGUE') {
        advManager.next();
        return;
    }
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

function loop() {
    if (gameState === 'UI') return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'ADV') {
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#001133');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        advManager.draw(ctx, canvas);
    } 
    else if (gameState === 'PRE_STG_DIALOGUE') {
        stgManager.draw(ctx);
        advManager.draw(ctx, canvas);
    }
    else if (gameState === 'STAGE_START_TEXT') {
        // スタート時のテロップ
        stgManager.draw(ctx);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${currentStage} START`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.textAlign = 'left';

        transitionTimer--;
        if(transitionTimer <= 0) gameState = 'STG_ENTER';
    }
    else if (gameState === 'STG_ENTER') {
        stgManager.draw(ctx);
        if (stgManager.updateEntrance()) {
            gameState = 'STG_PLAY';
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
        } else if (status === 'STAGE_CLEAR') {
            // ボス撃破で事後会話へ
            gameState = 'POST_STG_DIALOGUE';
            advManager.start(scenarios[currentStage].post_stg, () => {
                gameState = 'STAGE_CLEAR_TEXT';
                transitionTimer = 90; // クリアテロップ表示時間
            });
        }
    }
    else if (gameState === 'POST_STG_DIALOGUE') {
        stgManager.draw(ctx); 
        advManager.draw(ctx, canvas);
    }
    else if (gameState === 'STAGE_CLEAR_TEXT') {
        // クリア時のテロップ
        stgManager.draw(ctx);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
        
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 30px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${currentStage} CLEAR`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.textAlign = 'left';

        transitionTimer--;
        if(transitionTimer <= 0) {
            gameState = 'TRANSITION_FADE';
            transitionTimer = 60; // 暗転時間（1秒）
        }
    }
    else if (gameState === 'TRANSITION_FADE') {
        // 暗転
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        transitionTimer--;
        if(transitionTimer <= 0) {
            currentStage++;
            if (scenarios[currentStage]) {
                // 次のステージへ
                stgManager = new STGManager(canvas, characters.find(c => c.id === selectedCharId));
                gameState = 'PRE_STG_DIALOGUE';
                advManager.start(scenarios[currentStage].pre_stg, () => {
                    gameState = 'STAGE_START_TEXT';
                    transitionTimer = 90;
                });
            } else {
                // 全クリア
                gameState = 'UI';
                document.getElementById('result-title').innerText = "ALL CLEAR!";
                document.getElementById('result-title').style.color = "#00ffff";
                changeScreen('result-screen');
                return;
            }
        }
    }

    gameLoopId = requestAnimationFrame(loop);
}
