const VER_DATA = "0.3.0"; // バージョン更新（椎名護のステージ3を 'invader' に変更）

const characters = [
    {
        id: 'igari',
        name: '猪狩 俊基',
        color: '#00ffff',
        desc: "異世界転生した天才科学者の息子\nWeapon: 周囲の物質を再構築して銃弾として飛ばす。\nPower Up: 射線の増加\nTarget Close: 弾速が上昇する\nBomb: 極大レーザービーム生成",
        // 猪狩ルートの1〜6ステージの枠
        stages: ['kagami', 'hiragi', 'shiina', 'jingu', 'godai', 'final']
    },
    {
        id: 'mamoru',
        name: '椎名 護',
        color: '#33ccff',
        desc: "裏社会の治安維持を生業とする椎名家長男\nWeapon: 真言を具現化して敵に向かって放つ(ホーミング)\nPower Up: 射線、速度の増加\nTarget Close: 真言サイズの増加\nBomb: 真言展開",
        // ★修正：4番目のステージ（元jinguの部分）を 'mind' に変更
        stages: ['eiji', 'kagami', 'invader', 'mind', 'godai', 'final']
    },
    {
        id: 'hiragi',
        name: '柊 千華',
        color: '#ff33ff',
        desc: "時間を操る魔女\nWeapon: 貫通する魔法弾\nPower Up: 弾の巨大化\nTarget Close: 時間の遅延\nBomb: タイムストップ",
        // 柊ルートの1〜6ステージの枠
        stages: ['kagami', 'hiragi', 'shiina', 'jingu', 'godai', 'final']
    },
    {
        id: 'kagami',
        name: '各務 栞',
        color: '#33ff33',
        desc: "異世界保険組合の凄腕エージェント\nWeapon: 追尾式エネルギーダガー\nPower Up: 発射数の増加\nTarget Close: ダガーの巨大化\nBomb: 全方位ダガー展開",
        // 各務ルートの1〜6ステージの枠
        stages: ['kagami', 'hiragi', 'shiina', 'jingu', 'godai', 'final']
    },
    {
        id: 'godai',
        name: 'G・O・D・A・I',
        color: '#aaaaaa',
        desc: "超高性能AI搭載の防衛ロボット\nWeapon: ガトリングガン\nPower Up: オプション兵装追加\nTarget Close: 一斉掃射モード\nBomb: サテライトカノン",
        // G・O・D・A・I ルートの1〜6ステージの枠
        stages: ['godai', 'jingu', 'shiina', 'hiragi', 'kagami', 'final']
    },
    {
        id: 'jingu',
        name: '神宮寺 恒成',
        color: '#ffcc00',
        desc: "謎多き大富豪\nWeapon: 黄金の札束\nPower Up: 札束のばらまき増加\nTarget Close: 敵弾の買収(スコア化)\nBomb: ゴールデンシャワー",
        // 神宮寺ルートの1〜6ステージの枠
        stages: ['jingu', 'godai', 'hiragi', 'shiina', 'kagami', 'final']
    }
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

// システム側から読み込めるようにグローバルに登録
if (typeof window !== 'undefined') {
    window.VER_DATA = VER_DATA;
    window.characters = characters;
    window.scenarios = scenarios;
}
