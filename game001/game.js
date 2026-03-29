const GameLogic = {
    config: { rows: 15, cols: 15, maxLevels: 5, minesInit: 25, minesInc: 8, maxHp: 100, damage: 35, energyPerTile: 5, scanCost: 100 },
    state: { grid: [], gameOver: false, hp: 100, energy: 0, revealedCount: 0, level: 1, isScanning: false, flagMode: false },
    
    init(level) {
        this.state.level = level;
        this.state.gameOver = false; this.state.hp = this.config.maxHp; this.state.energy = 0;
        this.state.revealedCount = 0; this.state.isScanning = false; this.state.flagMode = false;
        
        const mines = this.config.minesInit + (level - 1) * this.config.minesInc;
        this.createGrid(mines);
        SoundEngine.generateStageMusic(level);
        this.updateUI();
    },

    createGrid(minesCount) {
        const gridEl = document.getElementById('grid');
        gridEl.style.gridTemplateColumns = `repeat(${this.config.cols}, 1fr)`;
        gridEl.innerHTML = '';
        this.state.grid = [];
        for (let r = 0; r < this.config.rows; r++) {
            this.state.grid[r] = [];
            for (let c = 0; c < this.config.cols; c++) {
                const tileObj = { r, c, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0, element: null };
                const el = document.createElement('div');
                el.className = 'tile tile-hidden flex items-center justify-center font-bold text-sm rounded';
                el.onclick = () => { if(this.state.flagMode) this.handleRightClick(r,c); else this.handleTileClick(r,c); };
                el.oncontextmenu = (e) => { e.preventDefault(); this.handleRightClick(r,c); };
                tileObj.element = el; gridEl.appendChild(el); this.state.grid[r][c] = tileObj;
            }
        }
        let placed = 0;
        while (placed < minesCount) {
            const r = Math.floor(Math.random() * this.config.rows), c = Math.floor(Math.random() * this.config.cols);
            if (!this.state.grid[r][c].isMine) { this.state.grid[r][c].isMine = true; placed++; }
        }
        for (let r = 0; r < this.config.rows; r++) {
            for (let c = 0; c < this.config.cols; c++) {
                if (this.state.grid[r][c].isMine) continue;
                this.state.grid[r][c].neighborMines = this.getNeighbors(r, c).filter(n => n.isMine).length;
            }
        }
    },

    getNeighbors(r, c) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < this.config.rows && nc >= 0 && nc < this.config.cols) neighbors.push(this.state.grid[nr][nc]);
            }
        }
        return neighbors;
    },

    handleTileClick(r, c) {
        if (this.state.gameOver) return;
        const tile = this.state.grid[r][c];
        if (tile.isRevealed || tile.isFlagged) return;
        if (this.state.isScanning) { this.useScan(r, c); return; }
        this.revealTile(r, c);
    },

    handleRightClick(r, c) {
        if (this.state.gameOver) return;
        const tile = this.state.grid[r][c];
        if (tile.isRevealed) return;
        tile.isFlagged = !tile.isFlagged;
        tile.element.innerHTML = tile.isFlagged ? '<span style="color:var(--neon-pink)">▲</span>' : '';
        tile.element.style.borderColor = tile.isFlagged ? 'var(--neon-pink)' : '';
        SoundEngine.playSFX('flag');
    },

    revealTile(r, c) {
        const tile = this.state.grid[r][c];
        if (tile.isRevealed) return;
        tile.isRevealed = true;
        tile.element.classList.replace('tile-hidden', 'tile-revealed');
        this.state.revealedCount++;
        if (tile.isMine) {
            tile.element.classList.add('tile-mine'); tile.element.innerHTML = '⚡';
            this.state.hp -= this.config.damage;
            document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 300);
            SoundEngine.playSFX('damage');
            if (this.state.hp <= 0) { this.state.hp = 0; this.endGame(false); }
        } else {
            this.state.energy = Math.min(this.config.scanCost, this.state.energy + this.config.energyPerTile);
            if (tile.neighborMines > 0) {
                tile.element.innerText = tile.neighborMines;
                tile.element.classList.add(`count-${tile.neighborMines}`);
            } else { this.getNeighbors(r, c).forEach(n => this.revealTile(n.r, n.c)); }
        }
        this.updateUI(); this.checkWin();
    },

    useScan(r, c) {
        this.state.energy = 0; this.state.isScanning = false;
        document.getElementById('scan-btn').classList.remove('active-mode');
        SoundEngine.playSFX('scan');
        const area = [...this.getNeighbors(r, c), this.state.grid[r][c]];
        area.forEach(t => {
            if (!t.isRevealed) {
                t.element.style.boxShadow = `inset 0 0 10px ${t.isMine ? 'var(--neon-pink)' : 'var(--neon-blue)'}`;
                setTimeout(() => t.element.style.boxShadow = '', 2000);
            }
        });
        this.updateUI();
    },

    updateUI() {
        document.getElementById('hp-bar').style.width = `${this.state.hp}%`;
        document.getElementById('hp-text').innerText = `${Math.ceil(this.state.hp)}%`;
        document.getElementById('energy-bar').style.width = `${(this.state.energy / this.config.scanCost) * 100}%`;
        const sBtn = document.getElementById('scan-btn');
        sBtn.disabled = this.state.energy < this.config.scanCost;
        sBtn.classList.toggle('opacity-50', sBtn.disabled);
        document.getElementById('level-display').innerText = `LEVEL: ${String(this.state.level).padStart(2, '0')} / 05`;
    },

    checkWin() {
        const mCount = this.config.minesInit + (this.state.level - 1) * this.config.minesInc;
        if (this.state.revealedCount + mCount === this.config.rows * this.config.cols) this.endGame(true);
    },

    endGame(isWin) {
        this.state.gameOver = true;
        MainController.showModal(isWin);
    }
};
