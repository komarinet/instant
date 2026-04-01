// CYBER-SWEEP v14.3 | game.js | STRUCTURE RESTORED & LADDER FIX
const GameLogic = {
    config: { maxHp: 100, damage: 35, energyPerTile: 6, scanCost: 35 },
    state: { grid: [], revealed: [], flags: [], level: 1, size: 7, mines: 7, energy: 0, hp: 100, flagMode: false, isScanning: false, gameOver: false },

    init(lvl) {
        this.state.level = lvl;
        
        // 7, 7, 8, 8, 9 の難易度ラダー
        const sizes = [7, 7, 8, 8, 9];
        const minesCount = [7, 9, 13, 16, 22];
        
        this.state.size = sizes[lvl - 1] || 9;
        this.state.mines = minesCount[lvl - 1] || 22;
        
        this.state.hp = 100; this.state.energy = 0;
        this.state.gameOver = false; this.state.flagMode = false; this.state.isScanning = false;
        
        // 状態管理配列の初期化 (ここを削除してしまっていました)
        this.state.grid = Array(this.state.size * this.state.size).fill(0);
        this.state.revealed = Array(this.state.size * this.state.size).fill(false);
        this.state.flags = Array(this.state.size * this.state.size).fill(false);
        
        const gridEl = document.getElementById('grid');
        gridEl.style.gridTemplateColumns = `repeat(${this.state.size}, 44px)`; // 44px固定でスクロール確保
        
        this.placeMines();
        this.calculateNumbers();
        this.render();
        this.updateUI();
        SoundEngine.generateStageMusic(lvl);
    },

    placeMines() {
        let placed = 0;
        while(placed < this.state.mines) {
            const idx = Math.floor(Math.random() * this.state.grid.length);
            if(this.state.grid[idx] !== -1) { this.state.grid[idx] = -1; placed++; }
        }
    },

    calculateNumbers() {
        for(let i=0; i<this.state.grid.length; i++) {
            if(this.state.grid[i] === -1) continue;
            let count = 0;
            this.getNeighbors(i).forEach(n => { if(this.state.grid[n] === -1) count++; });
            this.state.grid[i] = count;
        }
    },

    getNeighbors(idx) {
        const res = []; const s = this.state.size;
        const x = idx % s; const y = Math.floor(idx / s);
        for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) {
            if(dx===0 && dy===0) continue;
            const nx = x + dx; const ny = y + dy;
            if(nx>=0 && nx<s && ny>=0 && ny<s) res.push(ny * s + nx);
        }
        return res;
    },

    handleTileClick(idx) {
        if(this.state.gameOver || this.state.revealed[idx]) return;
        if(this.state.flagMode) return this.toggleFlag(idx);
        if(this.state.isScanning) return this.performScan(idx);

        if(this.state.grid[idx] === -1) {
            this.state.hp -= this.config.damage;
            this.state.revealed[idx] = true;
            SoundEngine.playSFX('damage');
            if(this.state.hp <= 0) { this.state.hp = 0; this.endGame(false); }
        } else {
            this.revealTile(idx);
            this.state.energy = Math.min(100, this.state.energy + this.config.energyPerTile);
            SoundEngine.playSFX('flag');
        }
        this.checkWin(); this.render(); this.updateUI();
    },

    revealTile(idx) {
        if(this.state.revealed[idx]) return;
        this.state.revealed[idx] = true;
        if(this.state.grid[idx] === 0) {
            this.getNeighbors(idx).forEach(n => this.revealTile(n));
        }
    },

    toggleFlag(idx) {
        this.state.flags[idx] = !this.state.flags[idx];
        SoundEngine.playSFX('flag');
        this.render();
    },

    // スキャン機能：のぞき見だけを行う（タイルは開かない）
    performScan(idx) {
        this.state.energy -= this.config.scanCost;
        this.state.isScanning = false;
        MainController.toggleScan(); 
        SoundEngine.playSFX('scan');
        const area = [...this.getNeighbors(idx), idx];
        area.forEach(n => {
            if(!this.state.revealed[n]) {
                const isMine = this.state.grid[n] === -1;
                const el = document.getElementById('grid').children[n];
                el.style.boxShadow = `inset 0 0 15px ${isMine ? 'var(--neon-pink)' : 'var(--neon-blue)'}`;
                setTimeout(() => el.style.boxShadow = '', 2000);
            }
        });
        this.updateUI();
    },

    checkWin() {
        // ステージ5クリアバグ対策：地雷以外の全てのタイルが「開いている」かチェック
        const isWin = this.state.grid.every((val, i) => val === -1 || this.state.revealed[i]);
        if(isWin) this.endGame(true);
    },

    endGame(win) {
        this.state.gameOver = true;
        MainController.showModal(win);
    },

    // 復活させた関数：UIの再描画
    render() {
        const gridEl = document.getElementById('grid');
        gridEl.innerHTML = '';
        this.state.grid.forEach((val, i) => {
            const tile = document.createElement('div');
            tile.className = `tile flex items-center justify-center font-bold ${this.state.revealed[i] ? 'tile-revealed' : 'tile-hidden'}`;
            if(this.state.revealed[i]) {
                if(val === -1) { tile.innerHTML = '×'; tile.classList.add('tile-mine'); }
                else if(val > 0) {
                    tile.innerText = val;
                    tile.style.color = ['#00f3ff','#00ff41','#ffff00','#ff3300','#ff00ff'][val-1] || '#fff';
                }
            } else if(this.state.flags[i]) {
                tile.innerHTML = '!'; tile.style.color = 'var(--neon-pink)';
            }
            tile.onclick = () => this.handleTileClick(i);
            gridEl.appendChild(tile);
        });
    },

    updateUI() {
        document.getElementById('hp-bar').style.width = `${this.state.hp}%`;
        document.getElementById('hp-text').innerText = `${Math.ceil(this.state.hp)}%`;
        document.getElementById('energy-bar').style.width = `${this.state.energy}%`;
        document.getElementById('energy-text').innerText = `${this.state.energy}%`;
        const sBtn = document.getElementById('scan-btn');
        sBtn.disabled = this.state.energy < this.config.scanCost;
        sBtn.style.opacity = sBtn.disabled ? '0.3' : '1';
    }
};
