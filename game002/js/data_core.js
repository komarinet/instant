const VER_DATA = "0.2.1"; // キャラクターIDを新しい指定名（mamoru, hiragi, jingu）に統一

const characters = [
    { id: 'igari', name: '猪狩 俊基', color: '#ff3366', desc: '物質再構築。敵弾に近づくほど連射速度が加速する。', weapon: 'Weapon: リボルバー' },
    { id: 'mamoru', name: '椎名 護', color: '#33ccff', desc: '時間操作。周囲の時間をスローにする（未実装）。', weapon: 'Weapon: クロノス・レーザー' },
    { id: 'hiragi', name: '柊 千華', color: '#cc33ff', desc: '因果の残響. 低速移動で弾を透過する（未実装）。', weapon: 'Weapon: 執着の怨炎' },
    { id: 'kagami', name: '各務 栞', color: '#33ff33', desc: '規約執行. 画面内の弾を資源に変換する（未実装）。', weapon: 'Weapon: 監査ビーム' },
    { id: 'godai', name: 'G・O・D・A・I', color: '#aaaaaa', desc: '全兵装展開. 理不尽な命令で暴走する（未実装）。', weapon: 'Weapon: アセット・ミサイル' },
    { id: 'jingu', name: '神宮寺 恒成', color: '#ffcc00', desc: 'ナノマシン. アイテムを強欲に吸い寄せる（未実装）。', weapon: 'Weapon: 札束弾幕' }
];

// 大元のシナリオ箱
const scenarios = {
    igari: {},
    mamoru: {},
    hiragi: {},
    kagami: {},
    godai: {},
    jingu: {}
};
