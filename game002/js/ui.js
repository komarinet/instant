export const VER_UI = "0.3.10"; // バージョン更新（スマホ対応：デモキャンバスの全画面化バグ修正とレイアウト調整）

let demoAnimId = null;
let demoFrame = 0;
let demoBullets = [];

function startDemoLoop(char) {
    if (demoAnimId) cancelAnimationFrame(demoAnimId);
    demoBullets = [];
    demoFrame = 0;
    const canvas = document.getElementById('char-demo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function loop() {
        demoAnimId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // サイバーな背景グリッド
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<canvas.width; i+=20) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
        for(let j=0; j<canvas.height; j+=20) { ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); }
        ctx.stroke();

        demoFrame++;
        let fireRate = 8;
        let isClose = false;
        
        if (char.id === 'igari') {
            // デモ用に3秒周期で「敵接近状態」をシミュレート (180フレーム中後半が接近状態)
            isClose = (demoFrame % 180) > 90;
            fireRate = isClose ? 3 : 8;
        }
        
        if (demoFrame % fireRate === 0) {
            let color = char.color;
            let speed = 8; // 画面が小さいので弾速を少し調整
            if (char.id === 'igari' && isClose) {
                color = '#00ffff'; // 水色
                speed = 16; 
            }
            
            demoBullets.push({ x: canvas.width/2, y: canvas.height - 40, vx: 0, vy: -speed, color: color, size: 4 });
            if (char.id === 'igari') {
                demoBullets.push({ x: canvas.width/2 - 6, y: canvas.height - 40, vx: -0.5, vy: -speed, color: color, size: 4 });
                demoBullets.push({ x: canvas.width/2 + 6, y: canvas.height - 40, vx: 0.5, vy: -speed, color: color, size: 4 });
            }
        }
        
        // 弾の更新と描画
        for (let i = demoBullets.length - 1; i >= 0; i--) {
            let b = demoBullets[i];
            b.x += b.vx || 0;
            b.y += b.vy;
            
            if (char.id === 'igari') {
                ctx.save(); ctx.translate(b.x, b.y);
                ctx.rotate(Math.atan2(b.vy, b.vx || 0));
                const length = b.size * 2.5; 
                ctx.shadowColor = b.color; ctx.shadowBlur = b.size * 2.5; 
                ctx.strokeStyle = b.color; ctx.lineWidth = b.size; ctx.lineCap = 'round'; 
                ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length, 0); ctx.stroke();
                ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = b.size * 0.4;
                ctx.beginPath(); ctx.moveTo(-length * 0.8, 0); ctx.lineTo(length * 0.8, 0); ctx.stroke();
                ctx.restore();
            } else {
                ctx.fillStyle = b.color;
                ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI*2); ctx.fill();
            }
            
            if (b.y < -10) demoBullets.splice(i, 1);
        }
        
        // 自機の描画
        let imgName = char.id === 'igari' ? 'igari_jiki.png' : null;
        let img = null;
        if (window.advManager && window.advManager.assets) img = window.advManager.assets[imgName];
        
        if (img && img.naturalHeight > 0) {
            const drawWidth = 36;
            const drawHeight = drawWidth * (img.naturalHeight / img.naturalWidth);
            ctx.drawImage(img, canvas.width/2 - drawWidth/2, canvas.height - 30 - drawHeight/2, drawWidth, drawHeight);
        } else {
            ctx.fillStyle = char.color || '#fff';
            ctx.beginPath();
            ctx.moveTo(canvas.width/2, canvas.height - 45);
            ctx.lineTo(canvas.width/2 - 12, canvas.height - 15);
            ctx.lineTo(canvas.width/2 + 12, canvas.height - 15);
            ctx.fill();
        }
        
        // 接近シミュレートUIの描画
        if (char.id === 'igari') {
            if (isClose) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.beginPath(); ctx.arc(canvas.width/2, 40, 25 + Math.sin(demoFrame*0.3)*5, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#00ffff'; ctx.font = 'bold 9px "Courier New"'; ctx.textAlign='center';
                ctx.fillText("TARGET CLOSE", canvas.width/2, 80);
            } else {
                ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
                ctx.beginPath(); ctx.arc(canvas.width/2, 30, 10, 0, Math.PI*2); ctx.fill();
            }
        }
    }
    loop();
}

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
    if (!char) return; 
    document.getElementById('preview-name').innerText = char.name;
    document.getElementById('preview-name').style.color = char.color;
    document.getElementById('preview-desc').innerText = char.desc;
    document.getElementById('preview-weapon').innerText = char.weapon;

    let list = document.getElementById('char-list');
    let parent = list.parentElement;
    
    if (parent.id !== 'char-select-flex') {
        let flexWrap = document.createElement('div');
        flexWrap.id = 'char-select-flex';
        // スマホでも確実に入るようにFlex設定を調整
        flexWrap.style.display = 'flex';
        flexWrap.style.flexDirection = 'row';
        flexWrap.style.justifyContent = 'space-between';
        flexWrap.style.alignItems = 'stretch';
        flexWrap.style.gap = '10px';
        flexWrap.style.width = '100%';
        flexWrap.style.maxWidth = '600px';
        flexWrap.style.margin = '0 auto 15px auto';
        flexWrap.style.padding = '0 5px';
        flexWrap.style.boxSizing = 'border-box';

        parent.insertBefore(flexWrap, list);
        
        // 左側：リストコンテナ
        let listWrap = document.createElement('div');
        listWrap.id = 'char-list-wrap';
        listWrap.style.flex = '1';
        listWrap.style.display = 'flex';
        listWrap.style.flexDirection = 'column';
        listWrap.style.justifyContent = 'center';
        listWrap.appendChild(list);
        
        flexWrap.appendChild(listWrap);
        
        // 右側：デモキャンバスコンテナ
        let demoWrap = document.createElement('div');
        demoWrap.id = 'demo-wrap';
        demoWrap.style.width = '120px';
        demoWrap.style.minWidth = '120px'; // 縮まないように固定
        demoWrap.style.display = 'flex';
        demoWrap.style.justifyContent = 'center';
        demoWrap.style.alignItems = 'center';
        
        let demoCanvas = document.createElement('canvas');
        demoCanvas.id = 'char-demo-canvas';
        demoCanvas.width = 120;
        demoCanvas.height = 240;
        
        // ★最重要修正：グローバルの canvas CSS（100vw/100vh等）を強制上書きする
        demoCanvas.style.cssText = 'position: static !important; width: 120px !important; height: 240px !important; max-width: 120px !important; max-height: 240px !important; background: #0a0a14 !important; border: 1px solid rgba(0, 243, 255, 0.5) !important; border-radius: 5px !important; box-shadow: 0 0 10px rgba(0,255,255,0.2) !important; display: block !important; flex-shrink: 0 !important; z-index: 10 !important; margin: 0 !important; padding: 0 !important;';
        
        demoWrap.appendChild(demoCanvas);
        flexWrap.appendChild(demoWrap);
    }

    startDemoLoop(char); 
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
    
    const getV = (name) => {
        try { return new Function(`return typeof ${name} !== 'undefined' ? ${name} : '---';`)(); }
        catch(e) { return '---'; }
    };

    const dVer = getV('VER_DATA');
    const aVer = getV('VER_ADV');
    const b3Ver = getV('VER_3DBG');
    const b3ObjVer = getV('VER_3DBG_OBJ'); 
    const stgCore = getV('VER_STG_CORE');
    const stgCom = getV('VER_STG_COMMON');
    const plIgari = getV('VER_PLAYER_IGARI');
    const stgKagami = getV('VER_STG_KAGAMI');
    const stgHiragi = getV('VER_STG_HIRAGI');
    const stgShiina = getV('VER_STG_SHIINA');
    const stgJingu = getV('VER_STG_JINGU');
    const stgGodai = getV('VER_STG_GODAI');
    const stgCap = getV('VER_STG_CAP'); 
    const scIgari = getV('VER_SCENARIO_IGARI');
    const scMamoru = getV('VER_SCENARIO_MAMORU');
    const scHiragi = getV('VER_SCENARIO_HIRAGI');
    const scKagami = getV('VER_SCENARIO_KAGAMI');
    const scGodai = getV('VER_SCENARIO_GODAI');
    const scJingu = getV('VER_SCENARIO_JINGU');

    verDiv.innerHTML = `
        <div style="text-align: left;">
            <span style="color:#00ffff">[SYS]</span><br>
            data:v${dVer}<br>
            adv:v${aVer}<br>
            3dbg:v${b3Ver}<br>
            3dbo:v${b3ObjVer}<br> main:v${moduleVersions.main}<br>
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
            s_shii:v${stgShiina}<br>
            s_jin:v${stgJingu}<br>
            s_god:v${stgGodai}<br>
            s_cap:v${stgCap}    </div>
        <div style="text-align: left;">
            <span style="color:#ff3366">[SCENARIO]</span><br>
            iga:v${scIgari}<br>
            mam:v${scMamoru}<br>
            hir:v${scHiragi}<br>
            kag:v${scKagami}<br>
            god:v${scGodai}<br>   
            jin:v${scJingu}       </div>
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

export function createMuteButton(onToggleCallback) {
    const oldBtn = document.getElementById('mute-btn');
    if (oldBtn) oldBtn.remove();
    
    const btn = document.createElement('button');
    btn.id = 'mute-btn';
    btn.style.cssText = 'position:absolute; top:20px; left:20px; z-index:1000; padding:8px 12px; background:rgba(0,0,0,0.5); border:1px solid #fff; color:#fff; font-size:1rem; cursor:pointer; width:auto; border-radius:5px; transition: all 0.2s;';
    btn.innerText = '🔊 ON'; 
    
    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isMuted = onToggleCallback();
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

export function initStageListTexts() {
    const stageList = document.getElementById('stage-list');
    if (stageList) {
        const stageTexts = [
            "Stage 1: リブート", "Stage 2: 魔女の嫉妬", "Stage 3: マスクの男", 
            "Stage 4: AIと資産家", "Stage 5: 暗殺ロボ", "Final Stage: 科学文明軍"
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
