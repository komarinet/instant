const VER_MAIN = "0.9.11"; // バージョン更新（プログレスバーとファイル名表示に対応したリッチローディングを実装）

import { VER_CONFIG, imagesToPreload, imagesToPreload3D } from './config.js';
import { VER_AUDIO, soundManager } from './audio.js';
import * as ui from './ui.js';
import * as st from './soundtrack.js'; 

window.VER_MAIN = VER_MAIN;

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
window.selectedCharId = selectedCharId; 

let currentStage = 1;
window.currentStage = currentStage; 

let gameState = 'UI'; 
let transitionTimer = 0; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const advManager = new ADVManager();
window.advManager = advManager; 

let stgManager = null;
let bgManager3D = null;
let dpr = window.devicePixelRatio || 1;
let gameLoopId;

let lastFrameTime = performance.now();
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

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
        soundManager.playBGM('title'); 
    }
};

window.openSoundtrack = function() {
    soundManager.stopBGM(); 
    window.changeScreen('soundtrack-screen');
    st.initSoundtrack(); 
};

window.closeSoundtrack = function() {
    st.forceStop(); 
    window.changeScreen('title-screen');
};

window.goToStageSelect = function() { 
    ui.initStageListTexts(selectedCharId);
    window.changeScreen('stage-select-screen'); 
};

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
    } else if (gameState === 'POST_STG_DIALOGUE' || gameState === 'ENDING_DIALOGUE') {
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
        window.selectedCharId = id; 
        if (isPreloadCompleted) {
            ui.updatePreview(safeChars, selectedCharId);
        }
    });
    
    ui.createBombButton(() => {
        if (stgManager && gameState === 'STG_PLAY') stgManager.triggerBomb();
    });

    ui.createMuteButton(() => {
        return soundManager.toggleMute();
    });

    st.initSoundtrack();
    
    ui.showVersions({
        main: VER_MAIN, config: VER_CONFIG, audio: VER_AUDIO, ui: ui.VER_UI, soundtrack: st.VER_SOUNDTRACK
    });
    
    resizeCanvas();

    const titleScreen = document.getElementById('title-screen');
    let startButton = null;
    let originalBtnHTML = "";
    let originalBtnColor = "";
    let originalBtnBorder = "";

    if (titleScreen) {
        titleScreen.style.pointerEvents = 'none'; 
        
        const elements = titleScreen.querySelectorAll('button, div, span');
        for (let el of elements) {
            if (el.innerText && el.innerText.trim() === 'START GAME') {
                startButton = el;
                break;
            }
        }

        if (startButton) {
            originalBtnHTML = startButton.innerHTML;
            originalBtnColor = startButton.style.color;
            originalBtnBorder = startButton.style.borderColor;

            // ★追加：ui.js に切り出したリッチなローディングUIを表示
            ui.showLoadingUI(startButton);
        }
    }

    // ★追加：画像の読み込み進捗を監視し、プログレスバーを更新するための事前キャッシュ処理
    const totalItems = (imagesToPreload ? imagesToPreload.length : 0) + (imagesToPreload3D ? imagesToPreload3D.length : 0);
    let loadedItems = 0;

    const updateProgress = (src) => {
        loadedItems++;
        let percent = Math.floor((loadedItems / totalItems) * 100);
        if (percent > 100) percent = 100;
        ui.updateLoadingUI(percent, src);
    };

    const cachePromises = [];

    if (imagesToPreload) {
        imagesToPreload.forEach(src => {
            cachePromises.push(new Promise(resolve => {
                const img = new Image();
                img.onload = img.onerror = () => {
                    updateProgress(src);
                    resolve();
                };
                img.src = `img/${src}`;
            }));
        });
    }

    if (imagesToPreload3D && typeof THREE !== 'undefined') {
        const textureLoader = new THREE.TextureLoader();
        imagesToPreload3D.forEach(cfg => {
            const src = typeof cfg === 'string' ? cfg : cfg.src;
            cachePromises.push(new Promise(resolve => {
                textureLoader.load(`img/${src}`, () => {
                    updateProgress(src);
                    resolve();
                }, undefined, () => {
                    updateProgress(src);
                    resolve();
                });
            }));
        });
    }

    // すべてのファイルの読み込み進捗が 100% になるまで待機
    if (cachePromises.length > 0) {
        await Promise.all(cachePromises);
    }
    
    ui.updateLoadingUI(100, "Complete!");

    // 本来の各マネージャーへの登録（裏ですでに読み込み終わっているため一瞬で完了します）
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
    
    if (titleScreen) {
        titleScreen.style.pointerEvents = 'auto';
        if (startButton) {
            // ローディングが終了したら元の START GAME ボタンに戻す
            startButton.innerHTML = originalBtnHTML;
            startButton.style.color = originalBtnColor;
            startButton.style.borderColor = originalBtnBorder;
            startButton.style.pointerEvents = 'auto';
            startButton.style.cursor = 'pointer';
        }
    }

    ui.updatePreview(safeChars, selectedCharId);
    ui.initStageListTexts(selectedCharId);
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
    window.currentStage = currentStage; 

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
        lastFrameTime = performance.now();
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
        lastFrameTime = performance.now();
        loop();
    }
}

// --- 入力制御 ---
let activeTouchId = null; 
let touchX = 0, touchY = 0, isTouching = false;

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (gameState === 'ADV' || gameState === 'PRE_STG_DIALOGUE' || gameState === 'POST_STG_DIALOGUE' || gameState === 'ENDING_DIALOGUE' || gameState === 'MID_STG_ADV') {
        advManager.next();
        return;
    }
    if (gameState === 'STG_PLAY' && !isTouching) {
        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        isTouching = true;
        touchX = touch.clientX;
        touchY = touch.clientY;
    }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (gameState === 'STG_PLAY' && isTouching) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === activeTouchId) {
                let dx = touch.clientX - touchX;
                let dy = touch.clientY - touchY;
                
                if (dx > 40) dx = 40; if (dx < -40) dx = -40;
                if (dy > 40) dy = 40; if (dy < -40) dy = -40;

                stgManager.player.x += dx * 1.2;
                stgManager.player.y += dy * 1.2;
                touchX = touch.clientX;
                touchY = touch.clientY;
                break;
            }
        }
    }
}, { passive: false });

canvas.addEventListener('touchend', e => {
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
            isTouching = false;
            activeTouchId = null;
            break;
        }
    }
});
canvas.addEventListener('touchcancel', e => {
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
            isTouching = false;
            activeTouchId = null;
            break;
        }
    }
});

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
        const bgmKey = `stage_${stgManager.stgId}`;
        soundManager.playBGM(bgmKey);
    }
}

function handleStgPlay() {
    const status = stgManager.updateGameplay();
    stgManager.draw(ctx);
    
    if (status === 'GAMEOVER') {
        gameState = 'UI';
        
        const savedPower = stgManager.player.powerLevel;
        const savedBombs = stgManager.player.bombs;
        const savedScore = stgManager.player.score;

        stgManager = null; 
        soundManager.stopBGM(); 
        soundManager.playBGM('gameover');
        
        const resTitle = document.getElementById('result-title');
        if(resTitle) {
            resTitle.innerText = "GAME OVER";
            resTitle.style.color = "#ff3366";
        }
        
        ui.setupGameOverButtons(
            () => { 
                window.globalPlayerState = { powerLevel: savedPower, bombs: savedBombs, score: savedScore };
                window.startGame(currentStage);
            },
            () => { 
                window.globalPlayerState = { powerLevel: 0, bombs: 3, score: 0 };
                window.startGame(currentStage);
            },
            () => { 
                window.globalPlayerState = { powerLevel: 0, bombs: 3, score: 0 };
                window.changeScreen('title-screen');
            }
        );

        window.changeScreen('result-screen');
    } else if (status === 'STAGE_CLEAR') {
        gameState = 'POST_STG_DIALOGUE';
        soundManager.stopBGM(); 
        soundManager.playBGM('relax');
        
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) skipBtn.classList.remove('hidden');
        
        const safeScenarios = getGlobal('scenarios', {});
        const charScenario = safeScenarios[selectedCharId];
        const postData = (charScenario && charScenario[currentStage]) ? (charScenario[currentStage].post_stg || []) : [];
        
        advManager.start(postData, () => {
            const endingData = (charScenario && charScenario[currentStage]) ? (charScenario[currentStage].ending || []) : [];
            if (endingData.length > 0) {
                gameState = 'ENDING_DIALOGUE';
                advManager.start(endingData, () => {
                    gameState = 'STAGE_CLEAR_TEXT';
                    transitionTimer = 90; 
                    if (skipBtn) skipBtn.classList.add('hidden');
                });
            } else {
                gameState = 'STAGE_CLEAR_TEXT';
                transitionTimer = 90; 
                if (skipBtn) skipBtn.classList.add('hidden');
            }
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
        
        const currentScore = stgManager && stgManager.player ? stgManager.player.score : 0;
        window.globalPlayerState = { powerLevel: 0, bombs: 3, score: currentScore };

        currentStage++;
        window.currentStage = currentStage; 

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
            soundManager.playBGM('ending');
            
            const resTitle = document.getElementById('result-title');
            if (resTitle) {
                resTitle.innerHTML = "ALL CLEAR!<br><br><span style='font-size:0.5em;color:#fff;'>制作 komarinet<br>thank you for playing</span>";
                resTitle.style.color = "#00ffff";
            }
            if (ui.resetResultButtons) ui.resetResultButtons(); 
            
            window.changeScreen('result-screen');
        }
    }
}

// --- メインループ ---
function loop(timestamp) {
    gameLoopId = requestAnimationFrame(loop);

    if (!timestamp) timestamp = performance.now();
    const elapsed = timestamp - lastFrameTime;

    if (elapsed < FRAME_INTERVAL) {
        return;
    }

    lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL);

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

        case 'ENDING_DIALOGUE': 
            advManager.draw(ctx, canvas, false); 
            break;
            
        case 'STAGE_CLEAR_TEXT':
            handleStageClearText();
            break;
            
        case 'TRANSITION_FADE':
            handleTransitionFade();
            break;
    }
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
