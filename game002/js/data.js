const VER_DATA = "0.1.15"; // バージョン更新

const characters = [
    { id: 'igari', name: '猪狩 俊基', color: '#ff3366', desc: '物質再構築。敵弾に近づくほど連射速度が加速する。', weapon: 'Weapon: リボルバー' },
    { id: 'shiina', name: '椎名 護', color: '#33ccff', desc: '時間操作。周囲の時間をスローにする（未実装）。', weapon: 'Weapon: クロノス・レーザー' },
    { id: 'chika', name: '柊 千華', color: '#cc33ff', desc: '因果の残響。低速移動で弾を透過する（未実装）。', weapon: 'Weapon: 執着の怨炎' },
    { id: 'kagami', name: '各務 栞', color: '#33ff33', desc: '規約執行。画面内の弾を資源に変換する（未実装）。', weapon: 'Weapon: 監査ビーム' }, // 新しいキャラクター「各務」
    { id: 'godai', name: 'G・O・D・A・I', color: '#aaaaaa', desc: '全兵装展開。理不尽な命令で暴走する（未実装）。', weapon: 'Weapon: アセット・ミサイル' },
    { id: 'jinguji', name: '神宮寺 恒成', color: '#ffcc00', desc: 'ナノマシン。アイテムを強欲に吸い寄せる（未実装）。', weapon: 'Weapon: 札束弾幕' }
];

const scenarios = {
    'opening': [
        // placeとtimeを追加。
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 0, speaker: '猪狩', text: '魔女の里かー。俺も仕事じゃなきゃ行きたかったな' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 0, speaker: '柊', text: 'まあまあ、今回は修行で行くんだし' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 1, speaker: '柊', text: '一緒に行ってもどこへも行けないよ？' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 1, speaker: '猪狩', text: '知的好奇心ってやつさ' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 2, speaker: '猪狩', text: 'この科学の時代に魔女の里だろ？' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 2, speaker: '猪狩', text: '磁場とか放射線量とか測定してぇー' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 5, speaker: '柊', text: 'でたよ、科学バカ・・・' },
        // 柊: 照れる(6)
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 6, speaker: '柊', text: '（小声）まあ、そんなとこも好きだけど・・・' },
        // 猪狩: 驚愕(4)
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 4, speaker: '猪狩', text: 'なんか言ったか？' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 9, speaker: '柊', text: 'ううん。じゃあ、行ってくる' },
        // 猪狩: 微笑(1)
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 1, speaker: '猪狩', text: 'ああ, 気をつけて' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 0, speaker: '柊', text: '・・・あのさ、俊基' },
        // 柊: キレる(7)
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 7, speaker: '柊', text: '一ヶ月で浮気とかしたら魂ごと滅ぼすから' },
        // 猪狩: 焦る(11 - igari.pngには焦るがないので驚愕にする)
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 4, speaker: '猪狩', text: 'だ、大丈夫だって' }, 
        // 柊: 投げキッス(10)
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 10, speaker: '柊', text: '冗談よ。じゃねー' },
        // 猪狩: 怒り(7)
        { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 7, speaker: '猪狩', text: '全く。あの嫉妬深いのは何とかならんのか' },
        { bg: 'airport.png', place: 'Airport', time: '2026.04', effect: 'shake', text: 'ズガーン（画面揺れる）' } 
    ],
    'kagami_arrival': [
        // 新しいシナリオ「kagami_arrival」
        { bg: 'room.png', place: 'Room', time: '2025.04', text: '……意識が、戻っていく。タイムリープは……成功したのか？' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari01.png', spriteIndex: 0, speaker: '猪狩', text: '……ここは、俺の部屋？　一年前の……' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: 'お目覚めですか、猪狩俊基（おすまし）' },
        // 各務: 照れる(8)
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari01.png', spriteIndex: 4, speaker: '猪狩', text: 'お, お前は……各務栞！？　どうしてここに……！（驚愕）' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'kagami.png', spriteIndex: 1, speaker: '各務', text: 'ええ。予定通り因果を遡（さかのぼ）りました（微笑）' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari01.png', spriteIndex: 0, speaker: '猪狩', text: 'タイムリープ……成功したのか？' },
        // 各務: 爽やか笑い(10)
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'kagami.png', spriteIndex: 10, speaker: '各務', text: 'それでは、査定を開始します。不合格なら因果から消去（デリート）します（爽やか笑い）' },
        // 各務の表情リスト (emo.html用ラベル想定)
        // おすまし、微笑、面倒くさい、閉眼怒り
        // 爆笑、泣き、ジト目、絶望
        // 照れ、閉眼、爽やか笑い、吐き捨てる
        // 0: normal, 1: smile, 2: tedious, 3: close_anger, 4: lol, 5: cry, 6: tedious2, 7: despair, 8: blush, 9: close, 10: smile2, 11: anger
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari01.png', spriteIndex: 4, speaker: '猪狩', text: 'ちょ、ちょっと待て！　査定って……？（驚愕）' }
    ],
    1: {
        adv: [
            { bg: 'airport.png', place: 'Airport', time: '2026.04', text: 'タイムリープ・シークエンス起動……西暦2025年、目標座標への転送を完了しました。' },
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 4, speaker: '猪狩', text: '……ここは。一年前の……俺たちがいた街か。' }, 
        ],
        pre_stg: [
            { bg: 'airport.png', place: 'Airport', time: '2026.04', speaker: '各務', text: '優里様を助けるための実力、査定させていただきます。' }, 
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 7, speaker: '猪狩', text: 'お前は……！勝手に飛ばしといて、査定だと！？ふざけるな！' }, 
            { bg: 'airport.png', place: 'Airport', time: '2026.04', speaker: '各務', text: 'はい。不合格なら即座に因果から消去（デリート）ですので。' } 
        ],
        post_stg: [
            { bg: 'airport.png', place: 'Airport', time: '2026.04', speaker: '各務', text: '……めんどくさいですが、最低ラインはクリアですね。' }, 
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 7, speaker: '猪狩', text: '千華は……千華はどこだ！' } 
        ]
    },
    2: { 
        adv: [], 
        pre_stg: [
            // ステージ2の場所と時間はまだないので、Airport/2026.04のままにする。
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 11, speaker: '柊', text: 'としき君……みつけた……。どうして他の女の人といるの……？' }, 
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari01.png', spriteIndex: 4, speaker: '猪狩', text: '千華！？お前、その体は一体……！' } 
        ], 
        post_stg: [
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 3, speaker: '柊', text: '痛い……としき君……' } 
        ] 
    }
};
