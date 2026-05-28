// FFmpeg.wasm v0.12のオブジェクトを展開
const { FFmpeg } = window.FFmpegWasm;
const { fetchFile } = window.FFmpegUtil;

let ffmpeg = null;
let filesArray = []; // アップロードされたファイルを管理する配列
const MAX_FILES = 20;
let currentProcessingId = null; // 現在変換中のファイルID

// DOM要素の取得
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCountSpan = document.getElementById('fileCount');
const listHeader = document.getElementById('listHeader');
const btnConvertAll = document.getElementById('btnConvertAll');
const btnDownloadZip = document.getElementById('btnDownloadZip');
const formatSelect = document.getElementById('formatSelect');
const bitrateSelect = document.getElementById('bitrateSelect');
const initOverlay = document.getElementById('init-overlay');

// 1. FFmpeg の初期化
async function initFFmpeg() {
    try {
        ffmpeg = new FFmpeg();
        
        // 変換進捗の監視
        ffmpeg.on('progress', ({ progress }) => {
            if (currentProcessingId !== null) {
                updateProgressBar(currentProcessingId, progress);
            }
        });

        // 必要なコアライブラリをCDNからロード
        await ffmpeg.load({
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
            wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm'
        });

        // 読み込み完了後に画面を表示
        initOverlay.style.display = 'none';
    } catch (error) {
        console.error('FFmpegの読み込みに失敗しました:', error);
        document.getElementById('init-text').innerHTML = '<span style="color:#dc2626;">エンジンの初期化に失敗しました。<br>ブラウザの設定やネットワーク環境をご確認ください。</span>';
    }
}

// 2. 音声メタデータ（再生時間・ビットレート）の解析（Web Audio APIを使用）
function analyzeAudio(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            try {
                // 音声データをデコードして再生時間を取得
                const buffer = await audioCtx.decodeAudioData(e.target.result);
                const duration = buffer.duration;
                // ファイルサイズと再生時間から正確なkbpsを逆算
                const bitrate = Math.round((file.size * 8) / duration / 1000);
                resolve({ duration, bitrate });
            } catch (err) {
                // 万が一デコードできない場合は初期値
                resolve({ duration: null, bitrate: null });
            } finally {
                audioCtx.close();
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// 3. アップロードイベント処理
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

// ドラッグ＆ドロップ対応
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

async function handleFiles(files) {
    if (filesArray.length >= MAX_FILES) {
        alert(`最大${MAX_FILES}個以上のファイルは同時にアップロードできません。`);
        return;
    }

    const remainingSlots = MAX_FILES - filesArray.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
        if (!file.type.includes('audio/mp3') && !file.name.endsWith('.mp3')) {
            alert(`${file.name} はMP3ファイルではないためスキップします。`);
            continue;
        }

        const id = Date.now() + Math.random().toString(36).substr(2, 5);
        
        // 暫定データで追加
        const fileObj = {
            id: id,
            file: file,
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            duration: '解析中...',
            bitrate: '解析中...',
            status: 'waiting', // waiting, processing, success, error
            checked: true,
            resultBlob: null,
            resultName: null
        };
        
        filesArray.push(fileObj);
        renderList();

        // バックグラウンドでメタデータを詳細判定
        const info = await analyzeAudio(file);
        const index = filesArray.findIndex(f => f.id === id);
        if (index !== -1) {
            if (info.duration) {
                const min = Math.floor(info.duration / 60);
                const sec = Math.floor(info.duration % 60).toString().padStart(2, '0');
                filesArray[index].duration = `${min}:${sec}`;
                filesArray[index].bitrate = `${info.bitrate} kbps`;
            } else {
                filesArray[index].duration = '不明';
                filesArray[index].bitrate = '不明';
            }
            renderList();
        }
    }
    fileInput.value = ''; // 連続選択を可能にするためにリセット
}

// 4. ファイルリストの描画
function renderList() {
    if (filesArray.length > 0) {
        listHeader.style.display = 'block';
    } else {
        listHeader.style.display = 'none';
    }
    
    fileCountSpan.textContent = filesArray.length;
    fileList.innerHTML = '';

    filesArray.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'file-item';
        itemDiv.id = `item-${item.id}`;

        let statusText = '待機中';
        let statusClass = 'status-waiting';
        if (item.status === 'processing') { statusText = '変換中...'; statusClass = 'status-processing'; }
        if (item.status === 'success') { statusText = '変換完了'; statusClass = 'status-success'; }
        if (item.status === 'error') { statusText = 'エラー'; statusClass = 'status-error'; }

        // 個別ダウンロードボタンの出し分け
        const downloadButtonHtml = item.status === 'success' 
            ? `<button class="btn-sm btn-sm-download" onclick="downloadSingle('${item.id}')">保存</button>` 
            : '';

        // 個別変換ボタン（処理中以外は表示）
        const convertButtonHtml = item.status !== 'processing' && item.status !== 'success'
            ? `<button class="btn-sm btn-sm-convert" onclick="convertSingle('${item.id}')">変換</button>`
            : '';

        itemDiv.innerHTML = `
            <div class="file-main">
                <div class="file-check-cell">
                    <input type="checkbox" class="file-checkbox" ${item.checked ? 'checked' : ''} onchange="toggleCheck('${item.id}', this.checked)" ${item.status === 'processing' ? 'disabled' : ''}>
                </div>
                <div class="file-info-cell">
                    <span class="file-name" title="${item.name}">${item.name}</span>
                    <div class="file-meta">サイズ: ${item.size} / 長さ: ${item.duration} / 元画質: ${item.bitrate}</div>
                    <span class="file-status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="progress-container" id="progress-container-${item.id}">
                <div class="progress-bar" id="progress-bar-${item.id}"></div>
            </div>
            <div class="file-actions">
                ${convertButtonHtml}
                ${downloadButtonHtml}
                <button class="btn-sm btn-sm-delete" onclick="deleteFile('${item.id}')" ${item.status === 'processing' ? 'disabled' : ''}>削除</button>
            </div>
        `;
        fileList.appendChild(itemDiv);
    });

    updateGlobalButtons();
}

// 5. 各種状態コントロール
function toggleCheck(id, isChecked) {
    const index = filesArray.findIndex(f => f.id === id);
    if (index !== -1) {
        filesArray[index].checked = isChecked;
    }
    updateGlobalButtons();
}

function deleteFile(id) {
    filesArray = filesArray.filter(f => f.id !== id);
    if (currentProcessingId === id) currentProcessingId = null;
    renderList();
}

function updateGlobalButtons() {
    const hasChecked = filesArray.some(f => f.checked && f.status !== 'success' && f.status !== 'processing');
    const isAnyProcessing = filesArray.some(f => f.status === 'processing');
    btnConvertAll.disabled = !hasChecked || isAnyProcessing;

    const hasResults = filesArray.some(f => f.resultBlob !== null);
    btnDownloadZip.disabled = !hasResults || isAnyProcessing;
}

function updateProgressBar(id, progress) {
    const container = document.getElementById(`progress-container-${id}`);
    const bar = document.getElementById(`progress-bar-${id}`);
    if (container && bar) {
        container.style.display = 'block';
        bar.style.width = Math.min(Math.round(progress * 100), 100) + '%';
    }
}

// 6. コアロジック：音声変換処理 (単一ファイル)
async function processCore(id) {
    const index = filesArray.findIndex(f => f.id === id);
    if (index === -1) return;

    const targetFormat = formatSelect.value;
    const targetKbps = bitrateSelect.value;
    const item = filesArray[index];

    item.status = 'processing';
    currentProcessingId = id;
    renderList();

    try {
        const inputName = 'input.mp3';
        // 変換元のファイル名と一致させ、拡張子だけ変更
        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const outputName = `${baseName}.${targetFormat}`;

        // FFmpeg上の仮想環境にファイルを配置
        await ffmpeg.writeFile(inputName, await fetchFile(item.file));

        // FFmpeg コマンド組み立て
        // 例: ffmpeg -i input.mp3 -b:a 192k output.m4a
        await ffmpeg.exec([
            '-i', inputName,
            '-b:a', `${targetKbps}k`,
            outputName
        ]);

        // 変換された成果物を読込
        const data = await ffmpeg.readFile(outputName);
        const outBlob = new Blob([data.buffer], { type: `audio/${targetFormat}` });

        // 結果を配列に保存
        filesArray[index].status = 'success';
        filesArray[index].resultBlob = outBlob;
        filesArray[index].resultName = outputName;

        // 仮想ファイルシステムをクリーンアップ
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

    } catch (err) {
        console.error(err);
        filesArray[index].status = 'error';
    } finally {
        if (currentProcessingId === id) currentProcessingId = null;
        renderList();
    }
}

// 個別変換呼び出し
async function convertSingle(id) {
    await processCore(id);
}

// 選択ファイルの一括変換
btnConvertAll.addEventListener('click', async () => {
    btnConvertAll.disabled = true;
    
    // 選択されていて、まだ成功していないファイルを順次処理
    for (let item of filesArray) {
        if (item.checked && item.status !== 'success' && item.status !== 'processing') {
            await processCore(item.id);
        }
    }
});

// 7. ダウンロード処理
function downloadSingle(id) {
    const item = filesArray.find(f => f.id === id);
    if (!item || !item.resultBlob) return;

    const url = URL.createObjectURL(item.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.resultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ZIP一括圧縮ダウンロード
btnDownloadZip.addEventListener('click', async () => {
    const zip = new JSZip();
    let count = 0;

    filesArray.forEach(item => {
        if (item.resultBlob && item.resultName) {
            zip.file(item.resultName, item.resultBlob);
            count++;
        }
    });

    if (count === 0) return;

    btnDownloadZip.textContent = '圧縮中...';
    btnDownloadZip.disabled = true;

    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_audio_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('ZIP生成に失敗しました:', err);
        alert('ZIPファイルの生成に失敗しました。');
    } finally {
        btnDownloadZip.textContent = 'ZIP形式で一括保存';
        updateGlobalButtons();
    }
});

// ページ読み込み時にFFmpegをロード
initFFmpeg();
