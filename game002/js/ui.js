export const VER_UI = "0.3.1"; // バージョン更新（サウンドトラック画面のバージョン表記対応）

export function initCharSelect(characters, selectedCharId, onSelect) {
    const list = document.getElementById('char-list');
    list.innerHTML = '';
    characters.forEach(char => {
        const btn = document.createElement('button');
        btn.className = `char-btn ${char.id === selectedCharId ? 'selected' : ''}`;
        btn.innerText = char.name;
        btn.onclick = (e) => {
            onSelect(char.id);
            document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
        };
        list.appendChild(btn);
    });
}

export function updatePreview(characters, selectedCharId) {
    const char = characters.find(c => c.id === selectedCharId);
    if (!char) return; // 安全対策
    document.getElementById('preview-name').innerText = char.name;
    document.getElementById('preview-name').style.color = char.color;
    document.getElementById('preview-desc').innerText = char.desc;
    document.getElementById('preview-weapon').innerText = char.weapon;
}

export function updateGameUI(gameState, selectedCharId, stgManager) {
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
                } else {
                    bombBtn.style.background = 'radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(100,0,0,0.8) 100%)';
                    bombBtn.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.5)';
                }
            }
        } else {
            bombBtn.classList.add('hidden');
        }
    }
}

export function drawCenterText(ctx, canvas, dpr, text, textColor) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, canvas.height / dpr / 2 - 40, canvas.width / dpr, 80);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / dpr / 2, canvas.height / dpr / 2 + 10);
    ctx.textAlign = 'left';
}

export function showVersions(moduleVersions) {
    const titleScreen = document.getElementById('title-screen');
    if (!titleScreen) return; 
    const oldVerText = document.querySelector('.version-info-panel');
    if (oldVerText) oldVerText.remove();
    const verDiv = document.createElement('div');
    verDiv.className = 'version-info-panel'; 
    verDiv.style.cssText = 'position:absolute;bottom:10px;width:100%;display:flex;justify-content:center;gap:20px;font-size:0.65rem;color:rgba(255,255,255,0.5);pointer-events:none;line-height:1.3;font-family:monospace;z-index:100;';
    
    // 直接 typeof で安全に判定する方式へ復元
    const dVer = typeof VER_DATA !== 'undefined' ? VER_DATA : '---';
    const aVer = typeof VER_ADV !== 'undefined' ? VER_ADV : '---';
    const b3Ver = typeof VER_3DBG !== 'undefined' ? VER_3DBG : '---';
    const stgCore = typeof VER_STG_CORE !== 'undefined' ? VER_STG_CORE : '---';
    const stgCom = typeof VER_STG_COMMON !== 'undefined' ? VER_STG_COMMON : '---';
    const plIgari = typeof VER_PLAYER_IGARI !== 'undefined' ? VER_PLAYER_IGARI : '---';
    const stgKagami = typeof VER_STG_KAGAMI !== 'undefined' ? VER_STG_KAGAMI : '---';
    const stgHiragi = typeof VER_STG_HIRAGI !== 'undefined' ? VER_STG_HIRAGI : '---';
    const stgShiina = typeof VER_STG_SHIINA !== 'undefined' ? VER_STG_SHIINA : '---';
    const scIgari = typeof VER_SCENARIO_IGARI !== 'undefined' ? VER_SCENARIO_IGARI : '---';
    const scMamoru = typeof VER_SCENARIO_MAMORU !== 'undefined' ? VER_SCENARIO_MAMORU : '---';
    const scHiragi = typeof VER_SCENARIO_HIRAGI !== 'undefined' ? VER_SCENARIO_HIRAGI : '---';
    const scKagami = typeof VER_SCENARIO_KAGAMI !== 'undefined' ? VER_SCENARIO_KAGAMI : '---';
    const scGodai = typeof VER_SCENARIO_GODAI !== 'undefined' ? VER_SCENARIO_GODAI : '---';
    const scJingu = typeof VER_SCENARIO_JINGU !== 'undefined' ? VER_SCENARIO_JINGU : '---';

    verDiv.innerHTML = `
        <div style="text-align: left;">
            <span style="color:#00ffff">[SYS]</span><br>
            data:v${dVer}<br>
            adv:v${aVer}<br>
            3dbg:v${b3Ver}<br>
            main:v${moduleVersions.main}<br>
            conf:v${moduleVersions.config}<br>
            aud:v${moduleVersions.audio}<br>
            ui:v${moduleVersions.ui}<br>
            trk:v${moduleVersions.soundtrack}
        </div>
        <div style="text-align: left;">
            <span style="color:#ffaa00">[STG]</span><br>
            core:v${stgCore}<br>
            com:v${stgCom}<br>
            s_kaga:v${stgKagami}<br>
            s_hira:v${stgHiragi}<br>
            s_shii:v${stgShiina}
        </div>
        <div style="text-align: left;">
            <span style="color:#ff3366">[SCENARIO]</span><br>
            iga:v${scIgari}<br>
            mam:v${scMamoru}<br>
            hir:v${scHiragi}<br>
            kag:v${scKagami}
        </div>
    `;
    titleScreen.appendChild(verDiv);
}

export function createBombButton(onBombTrigger) {
    const oldBtn = document.getElementById('bomb-btn');
    if (oldBtn) oldBtn.remove();
    const btn = document.createElement('div');
    btn.id = 'bomb-btn';
    btn.classList.add('hidden'); 
    btn.style.cssText = 'position:absolute;right:20px;bottom:100px;width:70px;height:70px;background:radial-gradient(circle,rgba(255,0,0,0.8) 0%,rgba(100,0,0,0.8) 100%);border:3px solid #fff;border-radius:50%;color:#fff;font-weight:bold;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:1000;box-shadow:0 0 15px rgba(255,0,0,0.5);user-select:none;';
    btn.innerHTML = `<span style="font-size:16px;">奥義</span><span id="bomb-count-val" style="font-size:18px; margin-top:2px;">3</span>`;
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        onBombTrigger();
    });
    document.getElementById('game-container').appendChild(btn);
}

// ★追加：画面左上に表示されるサウンドON/OFFボタンの作成
export function createMuteButton(onToggleCallback) {
    const oldBtn = document.getElementById('mute-btn');
    if (oldBtn) oldBtn.remove();
    
    const btn = document.createElement('button');
    btn.id = 'mute-btn';
    // SKIPボタン（右上）と被らないように左上に配置します
    btn.style.cssText = 'position:absolute; top:20px; left:20px; z-index:1000; padding:8px 12px; background:rgba(0,0,0,0.5); border:1px solid #fff; color:#fff; font-size:1rem; cursor:pointer; width:auto; border-radius:5px; transition: all 0.2s;';
    btn.innerText = '🔊 ON'; 
    
    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // audio.js の toggleMute() を呼び出して、結果（ミュート状態）を受け取る
        const isMuted = onToggleCallback();
        
        // ミュート状態に応じて見た目を変更
        if (isMuted) {
            btn.innerText = '🔇 OFF';
            btn.style.color = '#888';
            btn.style.borderColor = '#888';
        } else {
            btn.innerText = '🔊 ON';
            btn.style.color = '#fff';
            btn.style.borderColor = '#fff';
        }
    };
    
    document.getElementById('game-container').appendChild(btn);
}

// ★復元：ステージリストの名前と色を更新する処理
export function initStageListTexts() {
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
}

// ★復元：プリロード完了前のNOW LOADING表示処理
export function setStageListLoading() {
    const stageList = document.getElementById('stage-list');
    if (stageList) {
        stageList.querySelectorAll('button').forEach(btn => {
            btn.innerText = "NOW LOADING...";
            btn.style.color = "#00ffff";
            btn.style.borderColor = "#00ffff";
        });
    }
}
