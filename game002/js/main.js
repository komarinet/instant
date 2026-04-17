const VER_MAIN = "0.4.2"; // バージョン更新（バージョンチェック表示を3列の横並びデバッグ風UIに改修し、新規ファイルを追加）

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

const imagesToPreload = [
    'airport.png', 'igari02.png', 'hiragi01.png', 'kagami.png', 'room.png', 'igni.png', 'breakufo.png',
    'breakplane.png', 
    'typea.png', 'typeb.png', 'typec.png', 'typeboss.png',
    '2typea.png', '2typeb.png', '2typec.png', '2typeboss.png', 
    'darkcandle.png',
    'hospital.png', 'mountain.png','sanrin.png', 'yakerin.png', 
    'shiina.png', 'urashiina.png',
    'baku01.png',
    'igari_jiki.png',
    'igaribomb.png'
];

const imagesToPreload3D = [
    { key: 'sideatlas', src: 'build_side.png' }, 
    { key: 'topatlas', src: 'build_top.png' },
    { key: 'ground', src: 'ground01.png' },
    { key: 'ground2', src: 'ground02.png' }, 
    { key: 'candle', src: 'candle.png' } 
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
    
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
        if (gameState.includes('ADV') || gameState.includes('DIALOGUE')) {
            skipBtn.classList.remove('hidden');
        } else {
            skipBtn.classList.add('hidden');
        }
    }

    const bombBtn = document.getElementById('bomb-btn');
    if (bombBtn) {
        if (screenId === '' && gameState === 'STG_PLAY' && selectedCharId === 'igari') {
            bombBtn.classList.remove('hidden');
        } else {
            bombBtn.classList.add('hidden');
        }
    }
}

function goToStageSelect() { 
    changeScreen('stage-select-screen'); 
}

initCharSelect();

// --- ボムボタンの作成 ---
function createBombButton() {
    const oldBtn = document.getElementById('bomb-btn');
    if (oldBtn) oldBtn.remove();

    const btn = document.createElement('div');
    btn.id = 'bomb-btn';
    btn.classList.add('hidden'); 
    btn.style.position = 'absolute';
    btn.style.right = '20px';
    btn.style.bottom = '100px';
    btn.style.width = '70px';
    btn.style.height = '70px';
    btn.style.background = 'radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(100,0,0,0.8) 100%)';
    btn.style.border = '3px solid #fff';
    btn.style.borderRadius = '50%';
    btn.style.color = '#fff';
    btn.style.fontWeight = 'bold';
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column'; 
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.zIndex = '1000';
    btn.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.5)';
    btn.style.userSelect = 'none';
    
    btn.innerHTML = `<span style="font-size:16px;">奥義</span><span id="bomb-count-val" style="font-size:18px; margin-top:2px;">3</span>`;
    
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (stgManager && gameState === 'STG_PLAY') {
            stgManager.triggerBomb();
        }
    });

    document.getElementById('game-container').appendChild(btn);
}
createBombButton();

// --- バージョン情報の表示ロジック（横並び3列のデバッグUI風に進化） ---
function showVersions() {
    const titleScreen = document.getElementById('title-screen');
    if (!titleScreen) return; 
    
    const oldVerText = document.querySelector('.version-info-panel');
    if (oldVerText) oldVerText.remove();

    const verDiv = document.createElement('div');
    verDiv.className = 'version-info-panel'; 
    verDiv.style.position = 'absolute';
    verDiv.style.bottom = '10px';
    verDiv.style.width = '100%';
    verDiv.style.display = 'flex';
    verDiv.style.justifyContent = 'center';
    verDiv.style.gap = '20px';
    verDiv.style.fontSize = '0.65rem';
    verDiv.style.color = 'rgba(255, 255, 255, 0.5)'; 
    verDiv.style.pointerEvents = 'none';
    verDiv.style.lineHeight = '1.3';
    verDiv.style.fontFamily = 'monospace'; 
    verDiv.style.zIndex = '100'; 

    // SYS系
    const dVer = typeof VER_DATA !== 'undefined' ? VER_DATA : '---';
    const aVer = typeof VER_ADV !== 'undefined' ? VER_ADV : '---';
    const b3Ver = typeof VER_3DBG !== 'undefined' ? VER_3DBG : '---';
    const mVer = typeof VER_MAIN !== 'undefined' ? VER_MAIN : '---';

    // STG系（新規追加分を含む）
    const stgCore = typeof VER_STG_CORE !== 'undefined' ? VER_STG_CORE : '---';
    const stgCom = typeof VER_STG_COMMON !== 'undefined' ? VER_STG_COMMON : '---';
    const plIgari = typeof VER_PLAYER_IGARI !== 'undefined' ? VER_PLAYER_IGARI : '---';
    const stgKagami = typeof VER_STG_KAGAMI !== 'undefined' ? VER_STG_KAGAMI : '---';
    const stgHiragi = typeof VER_STG_HIRAGI !== 'undefined' ? VER_STG_HIRAGI : '---';
    const stgShiina = typeof VER_STG_SHIINA !== 'undefined' ? VER_STG_SHIINA : '---';

    // SCENARIO系
    const scIgari = typeof VER_SCENARIO_IGARI !== 'undefined' ? VER_SCENARIO_IGARI : '---';
    const scMamoru = typeof VER_SCENARIO_MAMORU !== 'undefined' ? VER_SCENARIO_MAMORU : '---';
    const scHiragi = typeof VER_SCENARIO_HIRAGI !== 'undefined' ? VER_SCENARIO_HIRAGI : '---';
    const scKagami = typeof VER_SCENARIO_KAGAMI !== 'undefined' ? VER_SCENARIO_KAGAMI : '---';
    const scGodai = typeof VER_SCENARIO_GODAI !== 'undefined' ? VER_SCENARIO_GODAI : '---';
    const scJingu = typeof VER_SCENARIO_JINGU !== 'undefined' ? VER_SCENARIO_JINGU : '---';

    verDiv.innerHTML = `
        <div style="text-align: left;">
            <span style="color:#00ffff">[SYS]</span><br>
            data : v${dVer}<br>
            adv  : v${aVer}<br>
            3dbg : v${b3Ver}<br>
            main : v${mVer}
        </div>
        <div style="text-align: left;">
            <span style="color:#ffaa00">[STG]</span><br>
            core  : v${stgCore}<br>
            common: v${stgCom}<br>
            p_iga : v${plIgari}<br>
            s_kaga: v${stgKagami}<br>
            s_hira: v${stgHiragi}<br>
            s_shii: v${stgShiina}
        </div>
        <div style="text-align: left;">
            <span style="color:#ff3366">[SCENARIO]</span><br>
            igari : v${scIgari}<br>
            mamoru: v${scMamoru}<br>
            hiragi: v${scHiragi}<br>
            kagami: v${scKagami}<br>
            godai : v${scGodai}<br>
            jingu : v${scJingu}
        </div>
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


// --- スキップ機能 ---
function skipADV() {
    advManager.isActive = false;
    
    if (gameState === 'ADV' || gameState === 'PRE_STG_DIALOGUE') {
        gameState = 'STAGE_START_TEXT';
        transitionTimer = 90;
        const charData = characters.find(c => c.id === selectedCharId);
        if (!stgManager) {
            const charScenario = scenarios[selectedCharId];
            const stgId = (charScenario && charScenario[currentStage] && charScenario[currentStage].stgId) ? charScenario[currentStage].stgId : 'kagami';
            stgManager = new STGManager(canvas, charData, stgId);
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
}


// --- Promise.allによる並行バックグラウンド・プリロード処理 ---
let isPreloadCompleted = false;
let pendingStageStart = null;

const loadADV = new Promise((resolve) => {
    advManager.preload(imagesToPreload, resolve);
});

const load3D = new Promise((resolve) => {
    bgManager3D = new BGManager3D('bgCanvas');
    bgManager3D.preload(imagesToPreload3D, resolve);
});

Promise.all([loadADV, load3D]).then(() => {
    bgManager3D.init(); 
    isPreloadCompleted = true;
    
    const stageList = document.getElementById('stage-list');
    if (stageList) {
        const stageTexts = [
            "Stage 1: Reboot", "Stage 2: Jealous Witch", "Stage 3: Chronos Mask", 
            "Stage 4: Nano Monarch", "Stage 5: Asset-Ash", "Final Stage: The Commander"
        ];
        stageList.querySelectorAll('button').forEach((btn, index) => {
            if (index < stageTexts.length) {
                btn.innerText = stageTexts[index];
                btn.style.color = "#fff";
                btn.style.borderColor = index === 5 ? "#ff3366" : "#ffaa00";
            }
        });
    }

    if (pendingStageStart !== null) {
        executeStart(pendingStageStart);
    }
});


// --- ゲーム進行フロー ---
function executeStart(stageNum) {
    changeScreen(''); 
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.remove('hidden');

    currentStage = stageNum;
    stgManager = null;

    const charData = characters.find(c => c.id === selectedCharId);
    const charScenario = scenarios[selectedCharId];

    if (!charScenario || Object.keys(charScenario).length === 0) {
        alert(`【エラー】\nシナリオデータが読み込まれていません！\nscenario_${selectedCharId}.js の記述（カンマ抜け等の構文エラー）を確認してください。`);
        changeScreen('title-screen');
        return;
    }

    if (stageNum === 1) {
        if (!charScenario['opening'] || !charScenario[1]) {
            alert(`【エラー】第1話のデータがありません。\nscenario_${selectedCharId}.js を確認してください。`);
            changeScreen('title-screen');
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
            alert(`【エラー】ステージ ${currentStage} のデータがありません。\nscenario_${selectedCharId}.js を確認してください。`);
            changeScreen('title-screen');
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

function startGame(stageNum) {
    if (!isPreloadCompleted) {
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
    
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
        if (!gameState.includes('ADV') && !gameState.includes('DIALOGUE')) {
            skipBtn.classList.add('hidden');
        }
    }

    const bombBtn = document.getElementById('bomb-btn');
    if (bombBtn) {
        if (gameState === 'STG_PLAY' && selectedCharId === 'igari') {
            bombBtn.classList.remove('hidden');
            const bVal = document.getElementById('bomb-count-val');
            if (bVal && stgManager) {
                bVal.innerText = stgManager.player.bombs;
                if (stgManager.player.bombs <= 0) {
                    bombBtn.style.background = 'rgba(100, 100, 100, 0.8)';
                    bombBtn.style.boxShadow = 'none';
                }
            }
        } else {
            bombBtn.classList.add('hidden');
        }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr); 

    if (gameState === 'ADV') {
        advManager.draw(ctx, canvas, false); 
    } 
    else if (gameState === 'PRE_STG_DIALOGUE') {
        stgManager.draw(ctx);
        advManager.draw(ctx, canvas, true); 
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
            stgManager = null; 
            document.getElementById('result-title').innerText = "GAME OVER";
            changeScreen('result-screen');
            return;
        } else if (status === 'STAGE_CLEAR') {
            gameState = 'POST_STG_DIALOGUE';
            if (skipBtn) skipBtn.classList.remove('hidden');
            const charScenario = scenarios[selectedCharId];
            const postData = (charScenario && charScenario[currentStage]) ? (charScenario[currentStage].post_stg || []) : [];
            advManager.start(postData, () => {
                gameState = 'STAGE_CLEAR_TEXT';
                transitionTimer = 90; 
                if (skipBtn) skipBtn.classList.add('hidden');
            });
        }
    }
    else if (gameState === 'POST_STG_DIALOGUE') {
        stgManager.draw(ctx); 
        advManager.draw(ctx, canvas, true); 
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
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        transitionTimer--;
        if(transitionTimer <= 0) {
            currentStage++;
            const charScenario = scenarios[selectedCharId];
            if (charScenario && charScenario[currentStage]) {
                const stageData = charScenario[currentStage];
                const stgId = stageData.stgId || 'kagami';
                stgManager = new STGManager(canvas, characters.find(c => c.id === selectedCharId), stgId);
                
                gameState = 'ADV';
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
                changeScreen('result-screen');
                return;
            }
        }
    }

    gameLoopId = requestAnimationFrame(loop);
}
