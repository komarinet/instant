const VER_MAIN = "0.8.0"; // 各モジュールのバージョン情報表示対応

// 分割した各ファイルから変数や関数を読み込む
import { VER_CONFIG, imagesToPreload, imagesToPreload3D } from './config.js';
import { VER_AUDIO, soundManager } from './audio.js';
import * as ui from './ui.js';

// --- グローバル変数 ---
let selectedCharId = 'igari';
let currentStage = 1;
let gameState = 'UI'; 
let transitionTimer = 0; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const advManager = new ADVManager();
let stgManager = null;
let bgManager3D = null;
let dpr = window.devicePixelRatio || 1;
let gameLoopId;

// --- 画面遷移の外部公開 (HTMLのonclickから呼ばれるため) ---
window.changeScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    if(screenId) document.getElementById(screenId).classList.remove('hidden');
    
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
        if (gameState.includes('ADV') || gameState.includes('DIALOGUE')) {
            skipBtn.classList.remove('hidden');
        } else {
            skipBtn.classList.add('hidden');
        }
    }
    ui.updateGameUI(gameState, selectedCharId, stgManager);
    if (screenId === 'title-screen' || screenId === 'char-select-screen') soundManager.stopBGM();
};

window.goToStageSelect = function() { window.changeScreen('stage-select-screen'); };

window.skipADV = function() {
    if (gameState === 'MID_STG_ADV') {
        advManager.isActive = false;
        gameState = 'STG_PLAY';
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) skipBtn.classList.add('hidden');
        if (advManager.onComplete) advManager.onComplete();
        return;
    }
    advManager.isActive = false;
    if (gameState === 'ADV' || gameState === 'PRE_STG_DIALOGUE') {
        gameState = 'STAGE_START_TEXT'; transitionTimer = 90;
        if (!stgManager) {
            const charScenario = window.scenarios[selectedCharId];
            const stgId = charScenario[currentStage]?.stgId || 'kagami';
            stgManager = new STGManager(canvas, window.characters.find(c => c.id === selectedCharId), stgId);
        }
    } else if (gameState === 'POST_STG_DIALOGUE') {
        gameState = 'STAGE_CLEAR_TEXT'; transitionTimer = 90;
    } else {
        gameState = 'STAGE_START_TEXT'; transitionTimer = 90;
    }
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.add('hidden');
};

window.startGame = function(stageNum) {
    if (!isPreloadCompleted) { pendingStageStart = stageNum; return; }
    executeStart(stageNum);
};

// --- 初期化 ---
let isPreloadCompleted = false;
let pendingStageStart = null;

async function init() {
    ui.initCharSelect(window.characters, selectedCharId, (id) => {
        selectedCharId = id;
        ui.updatePreview(window.characters, selectedCharId);
    });
    ui.updatePreview(window.characters, selectedCharId);
    ui.createBombButton(() => {
        if (stgManager && gameState === 'STG_PLAY') stgManager.triggerBomb();
    });
    
    // ui.jsの表示関数に、モジュール化された各ファイルのバージョンを渡す
    ui.showVersions({
        main: VER_MAIN,
        config: VER_CONFIG,
        audio: VER_AUDIO,
        ui: ui.VER_UI
    });
    
    resizeCanvas();

    // プリロード
    await Promise.all([
        new Promise(res => advManager.preload(imagesToPreload, res)),
        new Promise(res => {
            bgManager3D = new BGManager3D('bgCanvas');
            window.bgManager3D = bgManager3D; 
            bgManager3D.preload(imagesToPreload3D, res);
        })
    ]);

    bgManager3D.init();
    soundManager.init();
    isPreloadCompleted = true;
    if (pendingStageStart !== null) executeStart(pendingStageStart);
}

function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bgCanvas = document.getElementById('bgCanvas');
    if (bgCanvas) {
        bgCanvas.style.width = width + 'px'; bgCanvas.style.height = height + 'px';
        bgCanvas.width = width * dpr; bgCanvas.height = height * dpr;
        if (bgManager3D?.renderer) {
            bgManager3D.renderer.setSize(width, height, false);
            bgManager3D.camera.aspect = width / height;
            bgManager3D.camera.updateProjectionMatrix();
        }
    }
}

function executeStart(stageNum) {
    window.changeScreen('');
    currentStage = stageNum; stgManager = null;
    const charScenario = window.scenarios[selectedCharId];
    if (!charScenario) return alert("シナリオなし");

    const startFlow = (scenarioKey) => {
        gameState = 'ADV';
        advManager.start(charScenario[scenarioKey], () => {
            const stgId = charScenario[currentStage].stgId || 'kagami';
            stgManager = new STGManager(canvas, window.characters.find(c => c.id === selectedCharId), stgId);
            if (scenarioKey === 'opening') {
                advManager.start(charScenario['kagami_arrival'], () => startPreStg());
            } else { startPreStg(); }
        });
    };

    const startPreStg = () => {
        gameState = 'PRE_STG_DIALOGUE';
        advManager.start(charScenario[currentStage].pre_stg || [], () => {
            gameState = 'STAGE_START_TEXT'; transitionTimer = 90;
        });
    };

    stageNum === 1 ? startFlow('opening') : startFlow(currentStage);
    cancelAnimationFrame(gameLoopId);
    loop();
}

// --- 入力制御 ---
let touchX = 0, touchY = 0, isTouching = false;
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (['ADV', 'PRE_STG_DIALOGUE', 'POST_STG_DIALOGUE', 'MID_STG_ADV'].includes(gameState)) {
        advManager.next();
    } else if (gameState === 'STG_PLAY') {
        isTouching = true; touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
    }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    if (gameState === 'STG_PLAY' && isTouching) {
        const currentX = e.touches[0].clientX, currentY = e.touches[0].clientY;
        stgManager.player.x += (currentX - touchX) * 1.2;
        stgManager.player.y += (currentY - touchY) * 1.2;
        touchX = currentX; touchY = currentY;
    }
}, { passive: false });
canvas.addEventListener('touchend', () => isTouching = false);

// --- メインループ ---
function loop() {
    if (gameState === 'UI') return;
    ui.updateGameUI(gameState, selectedCharId, stgManager);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    switch (gameState) {
        case 'ADV': advManager.draw(ctx, canvas, false); break;
        case 'PRE_STG_DIALOGUE':
        case 'MID_STG_ADV': stgManager.draw(ctx); advManager.draw(ctx, canvas, true); break;
        case 'STAGE_START_TEXT':
            stgManager.draw(ctx); ui.drawCenterText(ctx, canvas, dpr, `STAGE ${currentStage} START`, '#fff');
            if (--transitionTimer <= 0) gameState = 'STG_ENTER';
            break;
        case 'STG_ENTER':
            stgManager.draw(ctx);
            if (stgManager.updateEntrance()) {
                gameState = 'STG_PLAY';
                if (currentStage === 1) soundManager.playBGM('kagami');
            }
            break;
        case 'STG_PLAY':
            const status = stgManager.updateGameplay();
            stgManager.draw(ctx);
            if (status === 'GAMEOVER') {
                gameState = 'UI'; soundManager.stopBGM(); window.changeScreen('result-screen');
            } else if (status === 'STAGE_CLEAR') {
                gameState = 'POST_STG_DIALOGUE'; soundManager.stopBGM();
                advManager.start(window.scenarios[selectedCharId][currentStage]?.post_stg || [], () => {
                    gameState = 'STAGE_CLEAR_TEXT'; transitionTimer = 90;
                });
            }
            break;
        case 'POST_STG_DIALOGUE': stgManager.draw(ctx); advManager.draw(ctx, canvas, true); break;
        case 'STAGE_CLEAR_TEXT':
            stgManager.draw(ctx); ui.drawCenterText(ctx, canvas, dpr, `STAGE ${currentStage} CLEAR`, '#00ffff');
            if (--transitionTimer <= 0) { gameState = 'TRANSITION_FADE'; transitionTimer = 60; }
            break;
        case 'TRANSITION_FADE':
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            if (--transitionTimer <= 0) {
                currentStage++;
                window.scenarios[selectedCharId][currentStage] ? executeStart(currentStage) : (() => {
                    gameState = 'UI'; document.getElementById('result-title').innerText = "ALL CLEAR!";
                    window.changeScreen('result-screen');
                })();
            }
            break;
    }
    gameLoopId = requestAnimationFrame(loop);
}

// 戦闘中ADV呼び出しをwindowに公開
window.startMidStgADV = (scenarioData, onComplete) => {
    gameState = 'MID_STG_ADV';
    advManager.start(scenarioData, () => {
        gameState = 'STG_PLAY';
        if (onComplete) onComplete();
    });
};

window.addEventListener('resize', resizeCanvas);
init();
