const VER_MAIN = "0.8.7"; // バージョン更新（サウンドトラックモードのインポートと画面遷移を追加）

import { VER_CONFIG, imagesToPreload, imagesToPreload3D } from './config.js';
import { VER_AUDIO, soundManager } from './audio.js';
import * as ui from './ui.js';
import * as st from './soundtrack.js'; // ★追加：サントラモジュールの読み込み

window.VER_MAIN = VER_MAIN;

// ★追加：モジュール内でインポートした音響システムを、外部のSTGシステムからも呼べるように窓口を開く
window.soundManager = soundManager; 

const getGlobal = (varName, fallback) => {
    try {
        const val = new Function(`return typeof ${varName} !== 'undefined' ? ${varName} : null;`)();
        return val !== null ? val : fallback;
    } catch(e) {
        return fallback;
    }
};

// --- グローバル変数 ---
let selectedCharId = 'igari';

let currentStage = 1;
// ★追加：3D背景システムがステージ番号を監視できるように窓口を開く
window.currentStage = currentStage; 

let gameState = 'UI'; 
let transitionTimer = 0; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const advManager = new ADVManager();
// ★追加：STGシステムが敵の画像を読み込めるように窓口を開く
window.advManager = advManager; 

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
    if (screenId === 'title-screen' || screenId === 'char-select-screen') {
        soundManager.stopBGM();
        // ★追加：タイトル・キャラ選択画面に戻った時はタイトルBGMを鳴らす
        soundManager.playBGM('title'); 
    }
};

// ★追加：サントラ画面を開くときの処理
window.openSoundtrack = function() {
    soundManager.stopBGM(); // 本編のタイトルBGMを止める
    window.changeScreen('soundtrack-screen');
};

// ★追加：サントラ画面から戻るときの処理
window.closeSoundtrack = function() {
    st.forceStop(); // サントラの再生を強制停止
    window.changeScreen('title-screen');
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
            const safeChars = getGlobal('characters', []);
            const safeScenarios = getGlobal('scenarios', {});
            const charScenario = safeScenarios[selectedCharId];
            const stgId = (charScenario && charScenario[currentStage] && charScenario[currentStage].stgId) ? charScenario[currentStage].stgId : 'kagami';
            stgManager = new STGManager(canvas, safeChars.find(c => c.id === selectedCharId), stgId);
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
    const safeChars = getGlobal('characters', []);
    
    ui.initCharSelect(safeChars, selectedCharId, (id) => {
        selectedCharId = id;
        ui.updatePreview(safeChars, selectedCharId);
    });
    ui.updatePreview(safeChars, selectedCharId);
    
    ui.createBombButton(() => {
        if (stgManager && gameState === 'STG_PLAY') stgManager.triggerBomb();
    });

    ui.createMuteButton(() => {
        return soundManager.toggleMute();
    });

    // ★追加：サントラの初期化を呼び出す
    st.initSoundtrack();
    
    ui.showVersions({
        main: VER_MAIN, config: VER_CONFIG, audio: VER_AUDIO, ui: ui.VER_UI, soundtrack: st.VER_SOUNDTRACK
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

    // ★追加：起動時にタイトルBGMを再生開始
    soundManager.playBGM('title');

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
    window.currentStage = currentStage; // ★追加：ステージ切り替え時に窓口の番号も更新

    stgManager = null;

    const safeChars = getGlobal('characters', []);
    const safeScenarios = getGlobal('scenarios', {});

    const charData = safeChars.find(c => c.id === selectedCharId);
    const charScenario = safeScenarios[selectedCharId];

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
        // ★修正：どのキャラのステージか（stgId）を判定して、自動で対応する道中BGMを流す
        const bgmKey = `stage_${stgManager.stgId}`;
        soundManager.playBGM(bgmKey);
    }
}

function handleStgPlay() {
    const status = stgManager.updateGameplay();
    stgManager.draw(ctx);
    
    if (status === 'GAMEOVER') {
        gameState = 'UI';
        stgManager = null; 
        soundManager.stopBGM(); 
        // ★追加：ゲームオーバーBGMを再生
        soundManager.playBGM('gameover');
        document.getElementById('result-title').innerText = "GAME OVER";
        window.changeScreen('result-screen');
    } else if (status === 'STAGE_CLEAR') {
        gameState = 'POST_STG_DIALOGUE';
        soundManager.stopBGM(); 
        // ★追加：ADV（会話）に入るので、一旦BGMを平穏な曲にする
        soundManager.playBGM('relax');
        
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) skipBtn.classList.remove('hidden');
        
        const safeScenarios = getGlobal('scenarios', {});
        const charScenario = safeScenarios[selectedCharId];
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
        window.currentStage = currentStage; // ★追加：ステージ進行時に窓口の番号も更新

        const safeChars = getGlobal('characters', []);
        const safeScenarios = getGlobal('scenarios', {});
        const charScenario = safeScenarios[selectedCharId];
        
        if (charScenario && charScenario[currentStage]) {
            const stageData = charScenario[currentStage];
            const stgId = stageData.stgId || 'kagami';
            stgManager = new STGManager(canvas, safeChars.find(c => c.id === selectedCharId), stgId);
            
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
            // ★追加：全クリア時は「clear」BGMを再生
            soundManager.playBGM('clear');
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
