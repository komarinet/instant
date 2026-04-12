const VER_MAIN = "0.1.27"; // バージョン更新

// --- グローバル変数 ---
let selectedCharId = 'igari';
let currentStage = 1;

let gameState = 'UI'; 
let transitionTimer = 0; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId;

const advManager = new ADVManager();
let stgManager = null;

// 3D背景マネージャーのグローバル変数
let bgManager3D = null;

// ★修正：新しい敵画像をプリロードに追加★
const imagesToPreload = [
    'airport.png', 'igari02.png', 'hiragi01.png', 'kagami.png', 'room.png', 'igni.png', 'breakufo.png',
    'typea.png', 'typeb.png', 'typec.png', 'typeboss.png'
];

// ★修正：大文字小文字の不一致によるフリーズを防ぐため、すべて小文字に統一★
const imagesToPreload3D = [
    { key: 'sideatlas', src: 'build_side.png' }, 
    { key: 'topatlas', src: 'build_top.png' },
    { key: 'ground', src: 'ground01.png' }
];

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
    
    // ADV状態ならスキップボタンを表示
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
        if (gameState.includes('ADV') || gameState.includes('DIALOGUE')) {
            skipBtn.classList.remove('hidden');
        } else {
            skipBtn.classList.add('hidden');
        }
    }
}

function goToStageSelect() { 
    changeScreen('stage-select-screen'); 
}

// 初期化実行
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
    const b3Ver = typeof VER_3DBG !== 'undefined' ? VER_3DBG : '---';

    verDiv.innerHTML = `
        data : v${dVer}<br>
        adv  : v${aVer}<br>
        stg  : v${sVer}<br>
        3dbg : v${b3Ver}<br>
        main : v${VER_MAIN}
    `;
    titleScreen.appendChild(verDiv);
}
showVersions();


// --- 解像度対策と100vh対策 ---
let dpr = 1;
function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bgCanvas = document.getElementById('bgCanvas');
    if (bgCanvas) {
        bgCanvas.style.width = width + 'px';
        bgCanvas.style.height = height + 'px';
        bgCanvas.width = width * dpr;
        bgCanvas.height = height * dpr;
        if (typeof bgManager3D !== 'undefined' && bgManager3D && bgManager3D.renderer) {
            bgManager3D.renderer.setSize(width, height, false);
            bgManager3D.camera.aspect = width / height;
            bgManager3D.camera.updateProjectionMatrix();
        }
    }
}
window.addEventListener('resize', () => { requestAnimationFrame(resizeCanvas); });
window.addEventListener('orientationchange', () => { setTimeout(resizeCanvas, 300); });
resizeCanvas(); 


// ★追加：スキップ機能★
function skipADV() {
    advManager.isActive = false;
    if (gameState === 'ADV') {
        // 最初のオープニング中の場合は、一気にステージ1開始暗転まで飛ばす
        gameState = 'STAGE_START_TEXT';
        transitionTimer = 90;
        const charData = characters.find(c => c.id === selectedCharId);
        if (!stgManager) {
            stgManager = new STGManager(canvas, charData);
        }
    } else {
        // それ以外（PRE_STG等）は、直後の遷移へ
        gameState = 'STAGE_START_TEXT';
        transitionTimer = 90;
    }
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.add('hidden');
}


// ★追加：バックグラウンド・プリロード処理★
let isPreloadCompleted = false;
let pendingStageStart = null;

// ページを読み込んだ瞬間から、ユーザーがメニューを操作している裏で読み込みを開始する
advManager.preload(imagesToPreload, () => {
    bgManager3D = new BGManager3D('bgCanvas');
    bgManager3D.preload(imagesToPreload3D, () => {
        bgManager3D.init(); // 3D空間の重い初期化も裏で済ませておく
        isPreloadCompleted = true;
        
        // もし読み込み完了前にユーザーがステージ開始ボタンを押していたら、直ちに開始する
        if (pendingStageStart !== null) {
            executeStart(pendingStageStart);
        }
    });
});


// --- ゲーム進行フロー ---

function executeStart(stageNum) {
    changeScreen(''); 
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.remove('hidden');

    if (stageNum === 1) {
        gameState = 'ADV';
        advManager.start(scenarios['opening'], () => { 
            currentStage = 1;
            const charData = characters.find(c => c.id === selectedCharId);
            stgManager = new STGManager(canvas, charData);
            
            gameState = 'ADV';
            advManager.start(scenarios['kagami_arrival'], () => {
                gameState = 'PRE_STG_DIALOGUE';
                advManager.start(scenarios[currentStage].pre_stg, () => {
                    gameState = 'STAGE_START_TEXT';
                    transitionTimer = 90;
                    if (skipBtn) skipBtn.classList.add('hidden');
                });
            });
        });
        cancelAnimationFrame(gameLoopId);
        loop();
    } else {
        currentStage = stageNum;
        const charData = characters.find(c => c.id === selectedCharId);
        stgManager = new STGManager(canvas, charData);
        
        gameState = 'PRE_STG_DIALOGUE';
        advManager.start(scenarios[currentStage].pre_stg, () => {
            gameState = 'STAGE_START_TEXT';
            transitionTimer = 90;
            if (skipBtn) skipBtn.classList.add('hidden');
        });
        cancelAnimationFrame(gameLoopId);
        loop();
    }
}

function startGame(stageNum) {
    if (!isPreloadCompleted) {
        // もしプレイヤーが爆速でクリックしてロードが間に合っていなかった場合、ボタン表示を変えて待機する
        const stageList = document.getElementById('stage-list');
        if (stageList) {
            stageList.querySelectorAll('button').forEach(btn => {
                btn.innerText = "NOW LOADING...";
                btn.style.color = "#00ffff";
                btn.style.borderColor = "#00ffff";
            });
        }
        pendingStageStart = stageNum;
        return;
    }
    executeStart(stageNum);
}


// --- 入力制御（スマホタッチ） ---
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


// --- メインループ ---
function loop() {
    if (gameState === 'UI') return;
    
    // スキップボタンの確実な非表示制御
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
        if (!gameState.includes('ADV') && !gameState.includes('DIALOGUE')) {
            skipBtn.classList.add('hidden');
        }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
    // 全体の黒塗りをコメントアウト（背景を透けさせるため）
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr); 
    // ctx.fillStyle = '#000';
    // ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr); 

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
            if (skipBtn) skipBtn.classList.remove('hidden');
            advManager.start(scenarios[currentStage].post_stg, () => {
                gameState = 'STAGE_CLEAR_TEXT';
                transitionTimer = 90; 
                if (skipBtn) skipBtn.classList.add('hidden');
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
        // フェード時の黒塗りをコメントアウト（背景を透けさせるため）
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        // ctx.fillStyle = '#000';
        // ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        transitionTimer--;
        if(transitionTimer <= 0) {
            currentStage++;
            if (scenarios[currentStage]) {
                stgManager = new STGManager(canvas, characters.find(c => c.id === selectedCharId));
                gameState = 'PRE_STG_DIALOGUE';
                if (skipBtn) skipBtn.classList.remove('hidden');
                advManager.start(scenarios[currentStage].pre_stg, () => {
                    gameState = 'STAGE_START_TEXT';
                    transitionTimer = 90;
                    if (skipBtn) skipBtn.classList.add('hidden');
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
