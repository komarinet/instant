const VER_MAIN = "0.8.2"; // バージョン更新（モジュール化の弊害でキャラデータが読み込めず進行不能になるバグを修正）

import { VER_CONFIG, imagesToPreload, imagesToPreload3D } from './config.js';
import { VER_AUDIO, soundManager } from './audio.js';
import * as ui from './ui.js';

window.VER_MAIN = VER_MAIN;

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

// --- 画面遷移の外部公開 ---
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
        gameState = 'STAGE_START_TEXT';
        transitionTimer = 90;
        if (!stgManager) {
            // ★修正：window.scenarios ではなく直接 scenarios を参照
            const charScenario = scenarios[selectedCharId];
            const stgId = (charScenario && charScenario[currentStage] && charScenario[currentStage].stgId) ? charScenario[currentStage].stgId : 'kagami';
            // ★修正：window.characters ではなく直接 characters を参照
            stgManager = new STGManager(canvas, characters.find(c => c.id === selectedCharId), stgId);
        }
    } else if (gameState === 'POST_STG_DIALOGUE') {
        gameState = 'STAGE_CLEAR_TEXT';
        transitionTimer = 90;
    } else {
        gameState = 'STAGE_START_TEXT';
        transitionTimer = 90;
    }
    
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.add('hidden');
};

window.startGame = function(stageNum) {
    if (!isPreloadCompleted) {
        ui.setStageListLoading();
        pendingStageStart = stageNum;
        return;
    }
    executeStart(stageNum);
};

// --- 初期化 ---
let isPreloadCompleted = false;
let pendingStageStart = null;

async function init() {
    // ★修正：window.characters ではなく直接 characters を参照
    ui.initCharSelect(characters, selectedCharId, (id) => {
        selectedCharId = id;
        ui.updatePreview(characters, selectedCharId);
    });
    ui.updatePreview(characters, selectedCharId);
    
    ui.createBombButton(() => {
        if (stgManager && gameState === 'STG_PLAY') stgManager.triggerBomb();
    });
    ui.showVersions({
        main: VER_MAIN, config: VER_CONFIG, audio: VER_AUDIO, ui: ui.VER_UI
    });
    resizeCanvas();

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
    
    ui.initStageListTexts();

    if (pendingStageStart !== null) {
        executeStart(pendingStageStart);
    }
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
        if (bgManager3D && bgManager3D.renderer) {
            bgManager3D.renderer.setSize(width, height, false);
            bgManager3D.camera.aspect = width / height;
            bgManager3D.camera.updateProjectionMatrix();
        }
    }
}

function executeStart(stageNum) {
    window.changeScreen(''); 
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.remove('hidden');

    currentStage = stageNum;
    stgManager = null;

    // ★修正：直接キャラクターデータを参照
    const charData = characters.find(c => c.id === selectedCharId);
    const charScenario = scenarios[selectedCharId];

    if (!charScenario || Object.keys(charScenario).length === 0) {
        alert(`【エラー】\nシナリオデータが読み込まれていません！`);
        window.changeScreen('title-screen');
        return;
    }

    if (stageNum === 1) {
        if (!charScenario['opening'] || !charScenario[1]) {
            alert(`【エラー】第1話のデータがありません。`);
            window.changeScreen('title-screen');
            return;
        }

        gameState = 'ADV';
        advManager.start(charScenario['opening'], () => { 
            const stgId = charScenario[currentStage].stgId || 'kagami';
            stgManager = new STGManager(canvas, charData, stgId);
            
            gameState = 'ADV';
            advManager.start(charScenario['kagami_arrival'], () => {
                gameState = 'PRE_STG_DIALOGUE';
                advManager.start(charScenario[currentStage].pre_stg || [], () => {
                    gameState = 'STAGE_START_TEXT';
                    transitionTimer = 90;
                    if (skipBtn) skipBtn.classList.add('hidden');
                });
            });
        });
        cancelAnimationFrame(gameLoopId);
        loop();

    } else {
        const stageData = charScenario[currentStage];
        if (!stageData) {
            alert(`【エラー】ステージ ${currentStage} のデータがありません。`);
            window.changeScreen('title-screen');
            return;
        }

        const stgId = stageData.stgId || 'kagami';
        stgManager = new STGManager(canvas, charData, stgId);
        
        gameState = 'ADV';
        advManager.start(stageData.adv || [], () => {
            gameState = 'PRE_STG_DIALOGUE';
            if (skipBtn) skipBtn.classList.remove('hidden');
            advManager.start(stageData.pre_stg || [], () => {
                gameState = 'STAGE_START_TEXT';
                transitionTimer = 90;
                if (skipBtn) skipBtn.classList.add('hidden');
            });
        });
        cancelAnimationFrame(gameLoopId);
        loop();
    }
}

// --- 入力制御 ---
let touchX = 0, touchY = 0, isTouching = false;
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (gameState === 'ADV' || gameState === 'PRE_STG_DIALOGUE' || gameState === 'POST_STG_DIALOGUE' || gameState === 'MID_STG_ADV') {
        advManager.next();
        return;
    }
    if (gameState === 'STG_PLAY') {
        isTouching = true; touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
    }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (gameState === 'STG_PLAY' && isTouching) {
        const currentX = e.touches[0].clientX, currentY = e.touches[0].clientY;
        stgManager.player.x += (currentX - touchX) * 1.2;
        stgManager.player.y += (currentY - touchY) * 1.2;
        touchX = currentX; touchY = currentY;
    }
}, { passive: false });
canvas.addEventListener('touchend', () => isTouching = false);

// ==========================================
// メインループから呼び出す各状態の関数群
// ==========================================

function handleStageStartText() {
    stgManager.draw(ctx);
    ui.drawCenterText(ctx, canvas, dpr, `STAGE ${currentStage} START`, '#fff');
    transitionTimer--;
    if (transitionTimer <= 0) gameState = 'STG_ENTER';
}

function handleStgEnter() {
    stgManager.draw(ctx);
    if (stgManager.updateEntrance()) {
        gameState = 'STG_PLAY';
        if (currentStage === 1) soundManager.playBGM('kagami');
    }
}

function handleStgPlay() {
    const status = stgManager.updateGameplay();
    stgManager.draw(ctx);
    
    if (status === 'GAMEOVER') {
        gameState = 'UI';
        stgManager = null; 
        soundManager.stopBGM(); 
        document.getElementById('result-title').innerText = "GAME OVER";
        window.changeScreen('result-screen');
    } else if (status === 'STAGE_CLEAR') {
        gameState = 'POST_STG_DIALOGUE';
        soundManager.stopBGM(); 
        
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) skipBtn.classList.remove('hidden');
        
        // ★修正：直接キャラクターデータを参照
        const charScenario = scenarios[selectedCharId];
        const postData = (charScenario && charScenario[currentStage]) ? (charScenario[currentStage].post_stg || []) : [];
        
        advManager.start(postData, () => {
            gameState = 'STAGE_CLEAR_TEXT';
            transitionTimer = 90; 
            if (skipBtn) skipBtn.classList.add('hidden');
        });
    }
}

function handleStageClearText() {
    stgManager.draw(ctx);
    ui.drawCenterText(ctx, canvas, dpr, `STAGE ${currentStage} CLEAR`, '#00ffff');
    transitionTimer--;
    if (transitionTimer <= 0) {
        gameState = 'TRANSITION_FADE';
        transitionTimer = 60; 
    }
}

function handleTransitionFade() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    transitionTimer--;
    if (transitionTimer <= 0) {
        currentStage++;
        // ★修正：直接キャラクターデータを参照
        const charScenario = scenarios[selectedCharId];
        
        if (charScenario && charScenario[currentStage]) {
            const stageData = charScenario[currentStage];
            const stgId = stageData.stgId || 'kagami';
            stgManager = new STGManager(canvas, characters.find(c => c.id === selectedCharId), stgId);
            
            gameState = 'ADV';
            const skipBtn = document.getElementById('skip-btn');
            if (skipBtn) skipBtn.classList.remove('hidden');
            
            advManager.start(stageData.adv || [], () => {
                gameState = 'PRE_STG_DIALOGUE';
                if (skipBtn) skipBtn.classList.remove('hidden');
                advManager.start(stageData.pre_stg || [], () => {
                    gameState = 'STAGE_START_TEXT';
                    transitionTimer = 90;
                    if (skipBtn) skipBtn.classList.add('hidden');
                });
            });
        } else {
            gameState = 'UI';
            stgManager = null; 
            document.getElementById('result-title').innerText = "ALL CLEAR!";
            document.getElementById('result-title').style.color = "#00ffff";
            window.changeScreen('result-screen');
        }
    }
}

// --- メインループ ---
function loop() {
    if (gameState === 'UI') return;
    
    ui.updateGameUI(gameState, selectedCharId, stgManager);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr); 

    switch (gameState) {
        case 'ADV':
            advManager.draw(ctx, canvas, false); 
            break;
            
        case 'PRE_STG_DIALOGUE':
        case 'MID_STG_ADV':
            stgManager.draw(ctx);
            advManager.draw(ctx, canvas, true); 
            break;
            
        case 'STAGE_START_TEXT':
            handleStageStartText();
            break;
            
        case 'STG_ENTER':
            handleStgEnter();
            break;
            
        case 'STG_PLAY':
            handleStgPlay();
            break;
            
        case 'POST_STG_DIALOGUE':
            stgManager.draw(ctx); 
            advManager.draw(ctx, canvas, true); 
            break;
            
        case 'STAGE_CLEAR_TEXT':
            handleStageClearText();
            break;
            
        case 'TRANSITION_FADE':
            handleTransitionFade();
            break;
    }

    gameLoopId = requestAnimationFrame(loop);
}

window.startMidStgADV = (scenarioData, onComplete) => {
    gameState = 'MID_STG_ADV';
    advManager.start(scenarioData, () => {
        gameState = 'STG_PLAY';
        if (onComplete) onComplete();
    });
};

window.addEventListener('resize', resizeCanvas);
init();
