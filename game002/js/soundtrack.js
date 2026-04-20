export const VER_SOUNDTRACK = "0.1.0"; // サウンドトラックモード新規実装

// サントラに表示する曲のリスト
const trackList = [
    { id: 'title', name: '01. Title Theme', src: 'bgm/title.mp3' },
    { id: 'relax', name: '02. Daily Life (Relax)', src: 'bgm/relax.mp3' },
    { id: 'dark', name: '03. Tension (Dark)', src: 'bgm/dark.mp3' },
    { id: 'stage_kagami', name: '04. Stage 1 - Reboot', src: 'bgm/stage_kagami.mp3' },
    { id: 'boss_kagami', name: '05. Boss - Kagami', src: 'bgm/boss_kagami.mp3' },
    { id: 'stage_hiragi', name: '06. Stage 2 - Jealous Witch', src: 'bgm/stage_hiragi.mp3' },
    { id: 'boss_hiragi', name: '07. Boss - Hiragi', src: 'bgm/boss_hiragi.mp3' },
    { id: 'stage_shiina', name: '08. Stage 3 - Chronos Mask', src: 'bgm/stage_shiina.mp3' },
    { id: 'boss_shiina', name: '09. Boss - Shiina', src: 'bgm/boss_shiina.mp3' },
    { id: 'clear', name: '10. Stage Clear', src: 'bgm/clear.mp3' },
    { id: 'gameover', name: '11. Game Over', src: 'bgm/gameover.mp3' }
];

let currentAudio = null;
let currentIndex = 0;
let isPlaying = false;

// リピートモード: 'ALL_REPEAT'(全曲ループ), 'ONE_REPEAT'(1曲ループ), 'NO_REPEAT'(全曲再生して停止)
let playMode = 'ALL_REPEAT';

export function initSoundtrack() {
    const listDiv = document.getElementById('st-track-list');
    if (!listDiv) return;

    listDiv.innerHTML = '';
    trackList.forEach((track, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 8px; cursor: pointer; border-bottom: 1px solid #333; transition: background 0.2s;';
        item.innerText = track.name;
        item.onclick = () => playTrack(index);
        item.id = `st-track-${index}`;
        listDiv.appendChild(item);
    });

    // ボタンのイベント紐付け
    document.getElementById('st-play-btn').onclick = togglePlay;
    document.getElementById('st-stop-btn').onclick = stopTrack;
    document.getElementById('st-prev-btn').onclick = playPrev;
    document.getElementById('st-next-btn').onclick = playNext;
    document.getElementById('st-mode-btn').onclick = toggleMode;

    updateUI();
}

function playTrack(index) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.onended = null;
    }
    currentIndex = index;
    const track = trackList[currentIndex];
    
    // ゲーム本編とは独立したオーディオインスタンスを作成
    currentAudio = new Audio(track.src);
    
    currentAudio.play().then(() => {
        isPlaying = true;
        updateUI();
    }).catch(e => console.log(e));

    // 曲が終わった時の処理（モードに応じて分岐）
    currentAudio.onended = () => {
        if (playMode === 'ONE_REPEAT') {
            playTrack(currentIndex);
        } else if (playMode === 'ALL_REPEAT') {
            playNext();
        } else {
            if (currentIndex < trackList.length - 1) {
                playNext();
            } else {
                isPlaying = false;
                updateUI();
            }
        }
    };
}

function togglePlay() {
    if (!currentAudio && trackList.length > 0) {
        playTrack(currentIndex);
        return;
    }
    if (isPlaying) {
        currentAudio.pause();
        isPlaying = false;
    } else {
        currentAudio.play();
        isPlaying = true;
    }
    updateUI();
}

function stopTrack() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    isPlaying = false;
    updateUI();
}

function playPrev() {
    currentIndex = (currentIndex - 1 + trackList.length) % trackList.length;
    playTrack(currentIndex);
}

function playNext() {
    currentIndex = (currentIndex + 1) % trackList.length;
    playTrack(currentIndex);
}

function toggleMode() {
    if (playMode === 'ALL_REPEAT') playMode = 'ONE_REPEAT';
    else if (playMode === 'ONE_REPEAT') playMode = 'NO_REPEAT';
    else playMode = 'ALL_REPEAT';
    updateUI();
}

function updateUI() {
    const titleLabel = document.getElementById('st-now-playing');
    const playBtn = document.getElementById('st-play-btn');
    const modeBtn = document.getElementById('st-mode-btn');

    if (titleLabel) {
        titleLabel.innerText = isPlaying ? `♪ ${trackList[currentIndex].name}` : (currentAudio ? `■ Paused: ${trackList[currentIndex].name}` : '--- SELECT TRACK ---');
    }

    if (playBtn) {
        playBtn.innerText = isPlaying ? '|| PAUSE' : '▶ PLAY';
        playBtn.style.color = isPlaying ? '#ff3366' : '#00ffff';
        playBtn.style.borderColor = isPlaying ? '#ff3366' : '#00ffff';
    }

    if (modeBtn) {
        if (playMode === 'ALL_REPEAT') modeBtn.innerText = 'MODE: ALL REPEAT';
        else if (playMode === 'ONE_REPEAT') modeBtn.innerText = 'MODE: 1-TRK REPEAT';
        else modeBtn.innerText = 'MODE: NO REPEAT';
    }

    // リストの色付け
    trackList.forEach((_, i) => {
        const item = document.getElementById(`st-track-${i}`);
        if (item) {
            if (i === currentIndex && (isPlaying || currentAudio)) {
                item.style.color = '#00ffff';
                item.style.fontWeight = 'bold';
                item.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
            } else {
                item.style.color = '#fff';
                item.style.fontWeight = 'normal';
                item.style.backgroundColor = 'transparent';
            }
        }
    });
}

export function forceStop() {
    stopTrack();
}
