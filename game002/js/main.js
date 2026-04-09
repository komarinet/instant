const VER_MAIN = "0.1.4"; // バージョン更新

let selectedCharId = 'igari';
let currentStage = 1;

let gameState = 'UI'; 
let transitionTimer = 0; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId;

const advManager = new ADVManager();
let stgManager = null;

const imagesToPreload = [
    'airport.png', 'igari.png', 'hiragi.png'
];

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

// --- バージョン情報の収集と表示ロジック ---
function showVersions() {
    const titleScreen = document.getElementById('title-screen');
    const oldVerText = document.querySelector('.version-info');
    if (oldVerText) oldVerText.innerHTML = '';

    const verDiv = document.createElement('div');
    verDiv.style.position = 'absolute';
    verDiv.style.bottom = '15px';
    verDiv.style.right = '20px';
    verDiv.style.fontSize = '0.75rem';
    verDiv.style.color = 'rgba(255, 255, 255, 0.4)'; 
    verDiv.style.textAlign = 'right';
    verDiv.style.pointerEvents = 'none';
    verDiv.style.lineHeight = '1.2';
    verDiv.style.fontFamily = 'monospace'; 

    const dVer = typeof VER_DATA !== 'undefined' ? VER_DATA : '---';
    const aVer = typeof VER_ADV !== 'undefined' ? VER_ADV : '---';
    const sVer = typeof VER_STG !== 'undefined' ? VER_STG : '---';

    verDiv.innerHTML = `
        data : v${dVer}<br>
        adv  : v${aVer}<br>
        stg  : v${sVer}<br>
        main : v${VER_MAIN}
    `;
    titleScreen.appendChild(verDiv);
}
showVersions();
// ------------------------------------------

// ★解像度対策と100vh対策の強化★
let dpr = 1;
function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    
    // html, bodyから物理ピクセル数を取得
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    
    // Canvasの論理サイズ（CSSピクセル）を設定
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Canvasの物理ピクセル数を設定
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // DPRに合わせて描画コンテキストをスケール
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
// イベントハンドラを整理
window.addEventListener('resize', () => { requestAnimationFrame(resizeCanvas); });
window.addEventListener('orientationchange', () => { setTimeout(resizeCanvas, 300); });
resizeCanvas(); // 初期実行

function goToGameStart() {
    changeScreen(''); 
    advManager.preload(imagesToPreload, () => {
        gameState = 'ADV';
        advManager.start(scenarios['opening'], () => {
            currentStage = 1;
            const charData = characters.find(c => c.id === selectedCharId);
            stgManager = new STGManager(canvas, charData);
            
            gameState = 'ADV';
            advManager.start(scenarios[currentStage].adv, () => {
                gameState = 'PRE_STG_DIALOGUE';
                advManager.start(scenarios[currentStage].pre_stg, () => {
                    gameState = 'STAGE_START_TEXT';
                    transitionTimer = 90;
                });
            });
        });
        cancelAnimationFrame(gameLoopId);
        loop();
    });
}

function startGame(stageNum) {
    if (stageNum === 1) {
        goToGameStart();
    } else {
        currentStage = stageNum;
        changeScreen(''); 
        const charData = characters.find(c => c.id === selectedCharId);
        stgManager = new STGManager(canvas, charData);
        
        gameState = 'PRE_STG_DIALOGUE';
        advManager.start(scenarios[currentStage].pre_stg, () => {
            gameState = 'STAGE_START_TEXT';
            transitionTimer = 90;
        });
        cancelAnimationFrame(gameLoopId);
        loop();
    }
}

// 相対座標コントローラー（そのまま）
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
        touchX = currentX; touchY = currentY;
    }
}, { passive: false });

canvas.addEventListener('touchend', e => { isTouching = false; });

function loop() {
    if (gameState === 'UI') return;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // スケールをリセットしてクリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr); 

    if (gameState === 'ADV') {
        advManager.draw(ctx, canvas);
    } 
    else if (gameState === 'PRE_STG_DIALOGUE') {
        stgManager.draw(ctx);
        advManager.draw(ctx, canvas);
    }
    else if (gameState === 'STAGE_START_TEXT') {
        stgManager.draw(ctx);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height / dpr / 2 - 40, canvas.width / dpr, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${currentStage} START`, canvas.width / dpr / 2, canvas.height / dpr / 2 + 10);
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
            gameState = 'POST_STG_DIALOGUE';
            advManager.start(scenarios[currentStage].post_stg, () => {
                gameState = 'STAGE_CLEAR_TEXT';
                transitionTimer = 90; 
            });
        }
    }
    else if (gameState === 'POST_STG_DIALOGUE') {
        stgManager.draw(ctx); 
        advManager.draw(ctx, canvas);
    }
    else if (gameState === 'STAGE_CLEAR_TEXT') {
        stgManager.draw(ctx);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height / dpr / 2 - 40, canvas.width / dpr, 80);
        
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 30px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${currentStage} CLEAR`, canvas.width / dpr / 2, canvas.height / dpr / 2 + 10);
        ctx.textAlign = 'left';

        transitionTimer--;
        if(transitionTimer <= 0) {
            gameState = 'TRANSITION_FADE';
            transitionTimer = 60; 
        }
    }
    else if (gameState === 'TRANSITION_FADE') {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        transitionTimer--;
        if(transitionTimer <= 0) {
            currentStage++;
            if (scenarios[currentStage]) {
                stgManager = new STGManager(canvas, characters.find(c => c.id === selectedCharId));
                gameState = 'PRE_STG_DIALOGUE';
                advManager.start(scenarios[currentStage].pre_stg, () => {
                    gameState = 'STAGE_START_TEXT';
                    transitionTimer = 90;
                });
            } else {
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
