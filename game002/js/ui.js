export const VER_UI = "0.3.20"; // バージョン更新（猪狩の特異反応を連射・弾速アップに修正し、巨大化は椎名専用とする）

let demoAnimId = null;
let demoFrame = 0;
let demoBullets = [];
let demoEnemyBullets = []; 

function getRubyName(id, defaultName) {
    const rtStyle = 'font-size:0.65em; opacity:0.8; letter-spacing: 0px;';
    if (id === 'igari') return `<ruby>猪狩 俊基<rt style="${rtStyle}">いがり としき</rt></ruby>`;
    if (id === 'shiina' || id === 'mamoru') return `<ruby>椎名 護<rt style="${rtStyle}">しいな まもる</rt></ruby>`;
    if (id === 'chika' || id === 'hiragi') return `<ruby>柊 千華<rt style="${rtStyle}">ひいらぎ ちか</rt></ruby>`;
    if (id === 'kagami') return `<ruby>各務 栞<rt style="${rtStyle}">かがみ しおり</rt></ruby>`;
    if (id === 'jinguji' || id === 'jingu') return `<ruby>神宮寺 恒成<rt style="${rtStyle}">じんぐうじ つねなり</rt></ruby>`;
    return defaultName; 
}

function startDemoLoop(char) {
    if (demoAnimId) cancelAnimationFrame(demoAnimId);
    demoBullets = [];
    demoEnemyBullets = []; 
    demoFrame = 0;
    const canvas = document.getElementById('char-demo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function loop() {
        demoAnimId = requestAnimationFrame(loop);
        
        const listWrap = document.getElementById('char-list');
        if (listWrap && listWrap.clientHeight > 0) {
            const targetH = listWrap.clientHeight;
            if (canvas.height !== targetH) {
                canvas.height = targetH; 
                canvas.style.setProperty('height', targetH + 'px', 'important'); 
                canvas.style.setProperty('max-height', targetH + 'px', 'important');
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<canvas.width; i+=20) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
        for(let j=0; j<canvas.height; j+=20) { ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); }
        ctx.stroke();

        demoFrame++;
        
        const playerX = canvas.width / 2;
        const playerY = canvas.height - 35; 
        
        // 敵弾の生成ロジック（斜め軌道）
        if (char.id === 'igari' || char.id === 'shiina' || char.id === 'mamoru') {
            if (demoFrame % 90 === 0) {
                let startX = playerX - (Math.random() * 50 + 20); 
                demoEnemyBullets.push({ 
                    x: startX, y: -10, 
                    vx: 0.5 + Math.random(), vy: 3 + Math.random() * 0.5, 
                    color: '#ff0055', size: 4 
                });
            }
            if ((demoFrame + 45) % 90 === 0) {
                let startX = playerX + (Math.random() * 50 + 20); 
                demoEnemyBullets.push({ 
                    x: startX, y: -10, 
                    vx: -(0.5 + Math.random()), vy: 3 + Math.random() * 0.5, 
                    color: '#ffaa00', size: 4 
                });
            }
        }

        // 接近判定（isClose）を共通化
        let minDist = Infinity;
        for (let i = 0; i < demoEnemyBullets.length; i++) {
            let eb = demoEnemyBullets[i];
            let d = Math.hypot(eb.x - playerX, eb.y - playerY);
            if (d < minDist) minDist = d;
        }
        let isClose = minDist < 150; 

        // 接近時の自機の当たり判定枠の描画
        if (char.id === 'igari' || char.id === 'shiina' || char.id === 'mamoru') {
            if (isClose) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.beginPath(); ctx.arc(playerX, playerY, 35 + Math.sin(demoFrame*0.4)*5, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(playerX, playerY, 35 + Math.sin(demoFrame*0.4)*5, 0, Math.PI*2); ctx.stroke();
            } else {
                ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(playerX, playerY, 30, 0, Math.PI*2); ctx.stroke();
            }
        }
        
        for (let i = demoEnemyBullets.length - 1; i >= 0; i--) {
            let eb = demoEnemyBullets[i];
            eb.x += eb.vx; 
            eb.y += eb.vy;
            
            ctx.shadowColor = eb.color; ctx.shadowBlur = 10;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(eb.x, eb.y, eb.size, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = eb.color;
            ctx.beginPath(); ctx.arc(eb.x, eb.y, eb.size * 0.7, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;

            if (eb.y > canvas.height + 20 || eb.x < -20 || eb.x > canvas.width + 20) demoEnemyBullets.splice(i, 1);
        }

        // ★修正：連射レートの決定。猪狩は接近時に連射アップ（元の仕様）
        let fireRate = (char.id === 'shiina' || char.id === 'mamoru') ? 24 : 8;
        if (char.id === 'igari' && isClose) {
            fireRate = 3;
        }

        if (demoFrame % fireRate === 0) {
            let color = char.color;
            let speed = 8; 
            
            // ★修正：猪狩は接近時に弾速も上がり、色も変わる（元の仕様）
            if (char.id === 'igari' && isClose) {
                color = '#00ffff'; 
                speed = 16; 
            }
            
            let b = { x: playerX, y: playerY - 5, vx: 0, vy: -speed, color: color, size: 4, isClose: isClose, charId: char.id }; 
            
            if (char.id === 'shiina' || char.id === 'mamoru') {
                b.charIndex = Math.floor(Math.random() * 10);
                b.size = 8;
                b.timer = 0; 
            } else if (char.id === 'igari') {
                b.size = 4;
            }
            demoBullets.push(b);
            
            if (char.id === 'igari') {
                demoBullets.push({ x: playerX - 6, y: playerY - 5, vx: -0.5, vy: -speed, color: color, size: 4, isClose: isClose, charId: char.id });
                demoBullets.push({ x: playerX + 6, y: playerY - 5, vx: 0.5, vy: -speed, color: color, size: 4, isClose: isClose, charId: char.id });
            }
        }
        
        for (let i = demoBullets.length - 1; i >= 0; i--) {
            let b = demoBullets[i];
            
            let target = null;
            let mDist = Infinity;
            for (let j = 0; j < demoEnemyBullets.length; j++) {
                let eb = demoEnemyBullets[j];
                let d = Math.hypot(eb.x - b.x, eb.y - b.y);
                if (d < mDist) { mDist = d; target = eb; }
            }

            if (target && (char.id === 'shiina' || char.id === 'mamoru' || char.id === 'igari')) {
                if ((char.id === 'shiina' || char.id === 'mamoru') && b.timer !== undefined) b.timer++;
                let shouldHoming = (char.id === 'igari') || (b.timer !== undefined && b.timer > 10);

                if (shouldHoming) {
                    let angToTarget = Math.atan2(target.y - b.y, target.x - b.x);
                    let currentAng = Math.atan2(b.vy, b.vx);
                    let diff = angToTarget - currentAng;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    
                    let turnSpeed = (char.id === 'shiina' || char.id === 'mamoru') ? 0.08 : 0.04; 
                    currentAng += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
                    
                    let speed = Math.hypot(b.vx, b.vy);
                    if ((char.id === 'shiina' || char.id === 'mamoru') && speed < 12) speed += 0.2; 
                    
                    b.vx = Math.cos(currentAng) * speed;
                    b.vy = Math.sin(currentAng) * speed;
                }
            }
            
            b.x += b.vx || 0;
            b.y += b.vy;
            
            // ★修正：特異反応の巨大化は「椎名護（shiina/mamoru）」の時だけ適用する
            let ds = b.size; 
            if ((char.id === 'shiina' || char.id === 'mamoru') && b.isClose) {
                ds = b.size * 2;
            }
            
            if (char.id === 'igari') {
                ctx.save(); ctx.translate(b.x, b.y);
                ctx.rotate(Math.atan2(b.vy, b.vx || 0)); 
                const length = ds * 2.5; 
                ctx.shadowColor = b.color; ctx.shadowBlur = ds * 2.5; 
                ctx.strokeStyle = b.color; ctx.lineWidth = ds; ctx.lineCap = 'round'; 
                ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length, 0); ctx.stroke();
                ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = ds * 0.4; 
                ctx.beginPath(); ctx.moveTo(-length * 0.8, 0); ctx.lineTo(length * 0.8, 0); ctx.stroke();
                ctx.restore();
            } else if (char.id === 'shiina' || char.id === 'mamoru') {
                let sansImg = window.advManager && window.advManager.assets['sans.png'];
                if (sansImg && sansImg.naturalWidth > 0 && b.charIndex !== undefined) {
                    const col = b.charIndex % 5;
                    const row = Math.floor(b.charIndex / 5);
                    const sw = sansImg.width / 5;
                    const sh = sansImg.height / 2;
                    ctx.save(); ctx.translate(b.x, b.y);
                    ctx.shadowColor = b.color; ctx.shadowBlur = 10;
                    ctx.drawImage(sansImg, col * sw, row * sh, sw, sh, -ds, -ds, ds*2, ds*2);
                    ctx.restore();
                } else {
                    ctx.fillStyle = b.color;
                    ctx.beginPath(); ctx.arc(b.x, b.y, ds, 0, Math.PI*2); ctx.fill(); 
                }
            } else {
                ctx.fillStyle = b.color;
                ctx.beginPath(); ctx.arc(b.x, b.y, ds, 0, Math.PI*2); ctx.fill(); 
            }
            
            if (b.y < -30 || b.y > canvas.height + 30 || b.x < -30 || b.x > canvas.width + 30) demoBullets.splice(i, 1);
        }
        
        let imgName = null;
        if (char.id === 'igari') imgName = 'igari_jiki.png';
        else if (char.id === 'shiina' || char.id === 'mamoru') imgName = 'jikishi.png';
        
        let img = null;
        if (window.advManager && window.advManager.assets) img = window.advManager.assets[imgName];
        
        if (img && img.naturalHeight > 0) {
            if (char.id === 'shiina' || char.id === 'mamoru') {
                const animSpeed = 4;
                const cycle = 18;
                const t = Math.floor(demoFrame / animSpeed) % cycle;
                const frame = t < 10 ? t : cycle - t;
                const col = frame % 5;
                const row = Math.floor(frame / 5);
                const sw = img.width / 5;
                const sh = img.height / 2;
                const drawWidth = 36;
                const drawHeight = drawWidth * (sh / sw);
                
                ctx.shadowColor = 'rgba(51, 204, 255, 0.8)';
                ctx.shadowBlur = 10;
                ctx.drawImage(img, col * sw, row * sh, sw, sh, playerX - drawWidth/2, playerY - drawHeight/2 + 5, drawWidth, drawHeight);
                ctx.shadowBlur = 0;
            } else {
                const drawWidth = 36;
                const drawHeight = drawWidth * (img.naturalHeight / img.naturalWidth);
                ctx.drawImage(img, playerX - drawWidth/2, playerY - drawHeight/2 + 5, drawWidth, drawHeight);
            }
        } else {
            ctx.fillStyle = char.color || '#fff';
            ctx.beginPath();
            ctx.moveTo(playerX, playerY - 10);
            ctx.lineTo(playerX - 12, playerY + 20);
            ctx.lineTo(playerX + 12, playerY + 20);
            ctx.fill();
        }
        
        // 猪狩の接近表示を復帰
        if (char.id === 'igari' && isClose) {
            ctx.fillStyle = '#00ffff'; ctx.font = 'bold 9px "Courier New"'; ctx.textAlign='center';
            ctx.fillText("TARGET CLOSE", playerX, playerY - 35); 
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
        
        btn.innerHTML = getRubyName(char.id, char.name);
        
        btn.style.whiteSpace = 'nowrap';
        btn.style.overflow = 'hidden';
        btn.style.textOverflow = 'ellipsis';
        btn.style.width = '100%';
        btn.style.boxSizing = 'border-box';
        btn.style.fontSize = 'clamp(14px, 4vw, 18px)'; 
        btn.style.padding = '8px 5px';
        btn.style.lineHeight = '1.4';
        
        btn.onclick = (e) => {
            onSelect(char.id);
            document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
        };
        list.appendChild(btn);
    });
}

export function updatePreview(characters, selectedCharId) {
    const char = characters.find(c => c.id === selectedCharId);
    if (!char) return; 
    
    document.getElementById('preview-name').innerHTML = getRubyName(char.id, char.name);
    document.getElementById('preview-name').style.color = char.color;
    document.getElementById('preview-desc').innerText = char.desc;
    document.getElementById('preview-weapon').innerText = char.weapon;

    let flexWrap = document.getElementById('char-select-flex');
    
    if (!flexWrap) {
        let list = document.getElementById('char-list');
        let parent = list.parentElement;
        
        flexWrap = document.createElement('div');
        flexWrap.id = 'char-select-flex';
        flexWrap.style.display = 'flex';
        flexWrap.style.flexDirection = 'row';
        flexWrap.style.justifyContent = 'space-between';
        flexWrap.style.alignItems = 'stretch'; 
        flexWrap.style.gap = '10px';
        flexWrap.style.width = '100%';
        flexWrap.style.maxWidth = '600px';
        flexWrap.style.margin = '55px auto 15px auto'; 
        flexWrap.style.padding = '0 10px';
        flexWrap.style.boxSizing = 'border-box';

        parent.insertBefore(flexWrap, list);
        
        let listWrap = document.createElement('div');
        listWrap.id = 'char-list-wrap';
        listWrap.style.flex = '1';
        listWrap.style.display = 'flex';
        listWrap.style.flexDirection = 'column';
        listWrap.style.justifyContent = 'flex-start';
        listWrap.style.gap = '8px'; 
        listWrap.style.minWidth = '0'; 
        listWrap.appendChild(list);
        
        flexWrap.appendChild(listWrap);
        
        let demoWrap = document.createElement('div');
        demoWrap.id = 'demo-wrap';
        demoWrap.style.width = '120px';
        demoWrap.style.minWidth = '120px'; 
        demoWrap.style.display = 'flex';
        demoWrap.style.justifyContent = 'center';
        demoWrap.style.alignItems = 'flex-start'; 
        
        let demoCanvas = document.createElement('canvas');
        demoCanvas.id = 'char-demo-canvas';
        demoCanvas.width = 120;
        demoCanvas.style.cssText = 'position: static !important; width: 120px !important; background: #0a0a14 !important; border: 1px solid rgba(0, 243, 255, 0.5) !important; border-radius: 5px !important; box-shadow: 0 0 10px rgba(0,255,255,0.2) !important; display: block !important; flex-shrink: 0 !important; z-index: 10 !important; margin: 0 !important; padding: 0 !important;';
        
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
        if (gameState === 'STG_PLAY' && (selectedCharId === 'igari' || selectedCharId === 'shiina' || selectedCharId === 'mamoru')) {
            bombBtn.classList.remove('hidden');
            const bVal = document.getElementById('bomb-count-val');
            if (bVal && stgManager) {
                bVal.innerText = stgManager.player.bombs;
                if (stgManager.player.bombs <= 0) {
                    bombBtn.style.background = 'rgba(100, 100, 100, 0.8)';
                    bombBtn.style.boxShadow = 'none';
                } else {
                    if (selectedCharId === 'igari') {
                        bombBtn.style.background = 'radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(100,0,0,0.8) 100%)';
                        bombBtn.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.5)';
                    } else {
                        bombBtn.style.background = 'radial-gradient(circle, rgba(0,204,255,0.8) 0%, rgba(0,100,150,0.8) 100%)';
                        bombBtn.style.boxShadow = '0 0 15px rgba(0, 204, 255, 0.5)';
                    }
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
    const plShiina = getV('VER_PLAYER_SHIINA');
    const stgKagami = getV('VER_STG_KAGAMI');
    const stgHiragi = getV('VER_STG_HIRAGI');
    const stgShiina = getV('VER_STG_SHIINA');
    const stgJingu = getV('VER_STG_JINGU');
    const stgGodai = getV('VER_STG_GODAI');
    const stgCap = getV('VER_STG_CAP'); 
    const stgEiji = getV('VER_STG_EIJI'); 
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
            p_iga:v${plIgari}<br>
            p_shi:v${plShiina}<br>
            s_kaga:v${stgKagami}<br>
            s_hira:v${stgHiragi}<br>
            s_shii:v${stgShiina}<br>
            s_jin:v${stgJingu}<br>
            s_god:v${stgGodai}<br>
            s_cap:v${stgCap}<br>
            s_eiji:v${stgEiji}
        </div>
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
    btn.style.cssText = 'position:absolute; top:10px; left:10px; z-index:1000; padding:6px 10px; background:rgba(0,0,0,0.6); border:1px solid #fff; color:#fff; font-size:0.8rem; cursor:pointer; width:auto; border-radius:5px; transition: all 0.2s;';
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

export function initStageListTexts(selectedCharId) {
    const stageList = document.getElementById('stage-list');
    if (stageList) {
        let stageTexts = [];
        if (selectedCharId === 'shiina' || selectedCharId === 'mamoru') {
            stageTexts = [
                "Stage 1: 兄弟のサドンデス", "Stage 2: ？？？", "Stage 3: ？？？", 
                "Stage 4: ？？？", "Stage 5: ？？？", "Final Stage: ？？？"
            ];
        } else {
            stageTexts = [
                "Stage 1: リブート", "Stage 2: 魔女の嫉妬", "Stage 3: マスクの男", 
                "Stage 4: AIと資産家", "Stage 5: 暗殺ロボ", "Final Stage: 科学文明軍"
            ];
        }

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

export function setupGameOverButtons(onRetryWithData, onRetryWithoutData, onGoTitle) {
    const resultScreen = document.getElementById('result-screen');
    if (!resultScreen) return;

    resetResultButtons();

    const existingButtons = resultScreen.querySelectorAll('button');
    existingButtons.forEach(btn => btn.style.display = 'none');

    const container = document.createElement('div');
    container.id = 'gameover-btn-container';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 15px; margin-top: 30px; align-items: center; width: 100%;';

    const btnStyle = 'padding: 15px 20px; font-size: clamp(14px, 4vw, 18px); font-weight: bold; color: #fff; background: rgba(0, 243, 255, 0.1); border: 2px solid #00ffff; border-radius: 5px; cursor: pointer; width: 80%; max-width: 300px; text-align: center; white-space: nowrap;';

    const btn1 = document.createElement('button');
    btn1.innerText = '引き継いでリトライ';
    btn1.style.cssText = btnStyle;
    btn1.onclick = () => { resetResultButtons(); onRetryWithData(); };

    const btn2 = document.createElement('button');
    btn2.innerText = '引き継がずにリトライ';
    btn2.style.cssText = btnStyle;
    btn2.onclick = () => { resetResultButtons(); onRetryWithoutData(); };

    const btn3 = document.createElement('button');
    btn3.innerText = 'タイトルへ戻る';
    btn3.style.cssText = btnStyle.replace('#00ffff', '#ffaa00').replace('rgba(0, 243, 255, 0.1)', 'rgba(255, 170, 0, 0.1)');
    btn3.onclick = () => { resetResultButtons(); onGoTitle(); };

    container.appendChild(btn1);
    container.appendChild(btn2);
    container.appendChild(btn3);

    resultScreen.appendChild(container);
}

export function resetResultButtons() {
    const oldContainer = document.getElementById('gameover-btn-container');
    if (oldContainer) oldContainer.remove();
    
    const resultScreen = document.getElementById('result-screen');
    if(resultScreen) {
        const existingButtons = resultScreen.querySelectorAll('button');
        existingButtons.forEach(btn => btn.style.display = ''); 
    }
}
