const VER_DATA = "0.1.32"; // バージョン更新（キャラクター説明文の更新、不要なシナリオ記述を完全削除）

const characters = [
    { 
        id: 'igari', 
        name: '猪狩 俊基', 
        color: '#00ffff', 
        desc: "異世界転生した天才科学者の息子\nWeapon: 周囲の物質を再構築して銃弾として飛ばす。\nPower Up: 射線の増加\nTarget Close: 弾速が上昇する\nBomb: 極大レーザービーム生成", 
        weapon: 'Weapon: リボルバー'
    },
    { 
        id: 'shiina', 
        name: '椎名 護', 
        color: '#33ccff', 
        desc: "裏社会の治安維持を生業とする椎名家長男\nWeapon: 真言を具現化して敵に向かって放つ(ホーミング)\nPower Up: 射線、速度の増加\nTarget Close: 真言サイズの増加\nBomb: 真言シールド", 
        weapon: 'Weapon: クロノス・レーザー'
    },
    { 
        id: 'chika', 
        name: '柊 千華', 
        color: '#ff33ff', 
        desc: "時間を操る魔女\nWeapon: 貫通する魔法弾\nPower Up: 弾の巨大化\nTarget Close: 時間の遅延\nBomb: タイムストップ", 
        weapon: 'Weapon: 執着の怨炎'
    },
    { 
        id: 'kagami', 
        name: '各務 栞', 
        color: '#33ff33', 
        desc: "異世界保険組合の凄腕エージェント\nWeapon: 追尾式エネルギーダガー\nPower Up: 発射数の増加\nTarget Close: ダガーの巨大化\nBomb: 全方位ダガー展開", 
        weapon: 'Weapon: 監査ビーム'
    },
    { 
        id: 'godai', 
        name: 'G・O・D・A・I', 
        color: '#aaaaaa', 
        desc: "超高性能AI搭載の防衛ロボット\nWeapon: ガトリングガン\nPower Up: オプション兵装追加\nTarget Close: 一斉掃射モード\nBomb: サテライトカノン", 
        weapon: 'Weapon: アセット・ミサイル'
    },
    { 
        id: 'jinguji', 
        name: '神宮寺 恒成', 
        color: '#ffcc00', 
        desc: "謎多き大富豪\nWeapon: 黄金の札束\nPower Up: 札束のばらまき増加\nTarget Close: 敵弾の買収(スコア化)\nBomb: ゴールデンシャワー", 
        weapon: 'Weapon: 札束弾幕'
    }
];

// システム側から読み込めるようにグローバルに登録
window.VER_DATA = VER_DATA;
window.characters = characters;
