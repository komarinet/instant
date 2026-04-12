const VER_DATA = "0.1.23"; // バージョン更新

const characters = [
    { id: 'igari', name: '猪狩 俊基', color: '#ff3366', desc: '物質再構築。敵弾に近づくほど連射速度が加速する。', weapon: 'Weapon: リボルバー' },
    { id: 'shiina', name: '椎名 護', color: '#33ccff', desc: '時間操作。周囲の時間をスローにする（未実装）。', weapon: 'Weapon: クロノス・レーザー' },
    { id: 'chika', name: '柊 千華', color: '#cc33ff', desc: '因果の残響。低速移動で弾を透過する（未実装）。', weapon: 'Weapon: 執着の怨炎' },
    { id: 'kagami', name: '各務 栞', color: '#33ff33', desc: '規約執行。画面内の弾を資源に変換する（未実装）。', weapon: 'Weapon: 監査ビーム' },
    { id: 'godai', name: 'G・O・D・A・I', color: '#aaaaaa', desc: '全兵装展開。理不尽な命令で暴走する（未実装）。', weapon: 'Weapon: アセット・ミサイル' },
    { id: 'jinguji', name: '神宮寺 恒成', color: '#ffcc00', desc: 'ナノマシン。アイテムを強欲に吸い寄せる（未実装）。', weapon: 'Weapon: 札束弾幕' }
];

const scenarios = {
    'opening': [
        // ★修正：fadeInを削除し、delay（待機）のみを残しました
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 10, speaker: '猪狩', text: '魔女の里かー。俺も仕事じゃなきゃ行きたかったな', delay: 120 },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 0, speaker: '柊', text: 'まあまあ、今回は修行で行くんだし' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 1, speaker: '柊', text: '一緒に行ってもどこへも行けないよ？' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 3, speaker: '猪狩', text: '知的好奇心ってやつさ' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 2, speaker: '猪狩', text: 'この科学の時代に魔女の里だろ？' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 10, speaker: '猪狩', text: '磁場とか放射線量とか測定してぇー' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 5, speaker: '柊', text: 'でたよ、科学バカ・・・' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 6, speaker: '柊', text: '（小声）まあ、そんなとこも好きだけど・・・' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 11, speaker: '猪狩', text: 'なんか言ったか？' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 9, speaker: '柊', text: 'ううん。じゃあ、行ってくる' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 1, speaker: '猪狩', text: 'ああ, 気をつけて' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 0, speaker: '柊', text: '・・・あのさ、俊基' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 7, speaker: '柊', text: '一ヶ月で浮気とかしたら魂ごと滅ぼすから' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 9, speaker: '猪狩', text: 'だ、大丈夫だって' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 10, speaker: '柊', text: '冗談よ。じゃねー' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 10, effect: 'slideOutLeft', text: '' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 12, speaker: '猪狩', text: '全く。魔女ってやつはみんなあんなに嫉妬深いのかな' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', effect: 'shake', text: '' },
        { bg: 'airport.png', character: 'igari02.png', spriteIndex: 4, speaker: '猪狩', text: 'うわーーーー！', effect: 'whiteout' }
    ],
    'kagami_arrival': [
        { bg: 'room.png', place: 'Room', time: '2025.04', se: 'alarm.mp3', text: '' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 9, speaker: '猪狩', text: 'はっ・・・夢？' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 8, speaker: '猪狩', text: 'てか、昼じゃねぇか！　いま何時だ、仕事が・・・' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 11, speaker: '猪狩', text: '・・・2025年4月2日？' },
        { bg: 'room.png', place: 'Room', time: '2025.04', se: 'vibration.mp3', text: '' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 0, speaker: '猪狩', text: 'はい、猪狩ですが' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '猪狩俊基さんですね。我々は異世界保険組合です' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 12, speaker: '猪狩', text: 'いせかい・・・保険組合？' },
        { bg: 'room.png', place: 'Room', time: '202
