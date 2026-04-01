// CYBER-SWEEP v12.6 | game.js | DIFFICULTY LADDER FIX
const GameLogic = {
    config: { scanCost: 30 },
    state: { grid: [], revealed: [], flags: [], level: 1, size: 5, mines: 4, energy: 0, hp: 100, flagMode: false, isScanning: false, gameOver: false },

    init(lvl) {
        this.state.level = lvl;
        
        // 難易度ラダーの設定 (Lv1〜Lv5)
        const sizes = [5, 6, 7, 8, 8];
        const minesCount = [4, 6, 10, 14, 18];
        
        this.state.size = sizes[lvl - 1] || 8;
        this.state.mines = minesCount[lvl - 1] || 18;
        
        this.state.hp = 100; this.state.energy = 0;
        this.state.gameOver = false; this.state.flagMode = false; this.state.isScanning = false;
        this.state.grid = Array(this.state.size * this.state.size).fill(0);
        this.state.revealed = Array(this.state.size * this.state.size).fill(false);
        this.state.flags = Array(this.state.size * this.state.size).fill(false);
        
        const gridEl = document.getElementById('grid');
        gridEl.style.gridTemplateColumns = `repeat(${this.state.size}, 1fr)`;
        
        this.placeMines();
        this.calculateNumbers();
        this.render();
        this.updateUI();
        SoundEngine.generateStageMusic(lvl); // ゲーム用BGMを生成・再生
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
        for(let dy=-1; dy<=1; dy++) {
            for(let dx=-1; dx<=1; dx++) {
                if(dx===0 && dy===0) continue;
                const nx = x + dx; const ny = y + dy;
                if(nx>=0 && nx<s && ny>=0 && ny<s) res.push(ny * s + nx);
            }
        }
        return res;
    },

    handleTileClick(idx) {
        if(this.state.gameOver || this.state.revealed[idx]) return;
        if(this.state.flagMode) return this.toggleFlag(idx);
        if(this.state.isScanning) return this.performScan(idx);

        if(this.state.grid[idx] === -1) {
            this.state.hp -= 25;
            this.state.revealed[idx] = true;
            SoundEngine.playSFX('damage');
            if(this.state.hp <= 0) this.endGame(false);
        } else {
            this.revealTile(idx);
            this.state.energy = Math.min(100, this.state.energy + 8); // ゲージを溜まりやすく
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

    performScan(idx) {
        this.state.energy -= this.config.scanCost;
        this.state.isScanning = false;
        MainController.toggleScan(); // UI側のボタントグル解除
        this.getNeighbors(idx).concat(idx).forEach(n => {
            if(this.state.grid[n] === -1) this.state.flags[n] = true;
            else this.revealTile(n);
        });
        SoundEngine.playSFX('scan');
        this.render(); this.updateUI();
    },

    checkWin() {
        const win = this.state.grid.every((val, i) => val === -1 || this.state.revealed[i]);
        if(win) this.endGame(true);
    },

    endGame(win) {
        this.state.gameOver = true;
        MainController.showModal(win);
    },

    render() {
        const gridEl = document.getElementById('grid');
        gridEl.innerHTML = '';
        this.state.grid.forEach((val, i) => {
            const tile = document.createElement('div');
            tile.className = `tile flex items-center justify-center text-xs font-bold ${this.state.revealed[i] ? 'tile-revealed' : 'tile-hidden'}`;
            if(this.state.revealed[i]) {
                if(val === -1) { tile.innerHTML = '×'; tile.classList.add('tile-mine'); }
                else if(val > 0) {
                    tile.innerText = val;
                    tile.style.color = ['#00f3ff','#00ff41','#ffff00','#ff3300'][val-1] || '#ff00ff';
                }
            } else if(this.state.flags[i]) {
                tile.innerHTML = '!'; tile.style.color = 'var(--neon-pink)';
            }
            tile.onclick = () => this.handleTileClick(i);
            gridEl.appendChild(tile);
        });
    },

    updateUI() {
        document.getElementById('hp-bar').style.width = `${Math.max(0, this.state.hp)}%`;
        document.getElementById('hp-text').innerText = `${Math.max(0, this.state.hp)}%`;
        document.getElementById('energy-bar').style.width = `${this.state.energy}%`;
        document.getElementById('energy-text').innerText = `${this.state.energy}%`;
        const sBtn = document.getElementById('scan-btn');
        sBtn.disabled = this.state.energy < this.config.scanCost;
        sBtn.style.opacity = sBtn.disabled ? '0.3' : '1';
    }
};
