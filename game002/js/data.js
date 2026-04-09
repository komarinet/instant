// js/data.js

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
        { bg: 'airport.png', character: 'igari.png', spriteIndex: 0, speaker: '猪狩', text: '魔女の里かー。俺も仕事じゃなきゃ行きたかったな' },
        { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 0, speaker: '柊', text: 'まあまあ、今回は修行で行くんだし' },
        { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 1, speaker: '柊', text: '一緒に行ってもどこへも行けないよ？' },
        { bg: 'airport.png', character: 'igari.png', spriteIndex: 1, speaker: '猪狩', text: '知的好奇心ってやつさ' },
        { bg: 'airport.png', character: 'igari.png', spriteIndex: 2, speaker: '猪狩', text: 'この科学の時代に魔女の里だろ？' },
        { bg: 'airport.png', character: 'igari.png', spriteIndex: 2, speaker: '猪狩', text: '磁場とか放射線量とか測定してぇー' },
        { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 5, speaker: '柊', text: 'でたよ、科学バカ・・・' },
        { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 6, speaker: '柊', text: '（小声）まあ、そんなとこも好きだけど・・・' },
        { bg: 'airport.png', character: 'igari.png', spriteIndex: 3, speaker: '猪狩', text: 'なんか言ったか？' },
        { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 9, speaker: '柊', text: 'ううん。じゃあ、行ってくる' },
        { bg: 'airport.png', character: 'igari.png', spriteIndex: 0, speaker: '猪狩', text: 'ああ、気をつけて' },
        { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 0, speaker: '柊', text: '・・・あのさ、俊基' },
        { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 7, speaker: '柊', text: '一ヶ月で浮気とかしたら魂ごと滅ぼすから' },
        { bg: 'airport.png', character: 'igari.png', spriteIndex: 4, speaker: '猪狩', text: 'だ、大丈夫だって' }, 
        { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 10, speaker: '柊', text: '冗談よ。じゃねー' },
        { bg: 'airport.png', character: 'igari.png', spriteIndex: 7, speaker: '猪狩', text: '全く。あの嫉妬深いのは何とかならんのか' },
        { bg: 'airport.png', effect: 'shake', text: 'ズガーン（画面揺れる）' } 
    ],
    1: {
        adv: [
            { bg: 'airport.png', text: 'タイムリープ・シークエンス起動……西暦2025年、目標座標への転送を完了しました。' },
            // シルエットではなく、通常の立ち絵を指定
            { bg: 'airport.png', character: 'igari.png', spriteIndex: 4, speaker: '猪狩', text: '……ここは。一年前の……俺たちがいた街か。' }, 
        ],
        pre_stg: [
            // 各務は立ち絵（character）指定を消して、声だけにする
            { bg: 'airport.png', speaker: '各務', text: '優里様を助けるための実力、査定させていただきます。' }, 
            { bg: 'airport.png', character: 'igari.png', spriteIndex: 7, speaker: '猪狩', text: 'お前は……！勝手に飛ばしといて、査定だと！？ふざけるな！' }, 
            { bg: 'airport.png', speaker: '各務', text: 'はい。不合格なら即座に因果から消去（デリート）ですので。' } 
        ],
        post_stg: [
            { bg: 'airport.png', speaker: '各務', text: '……めんどくさいですが、最低ラインはクリアですね。' }, 
            { bg: 'airport.png', character: 'igari.png', spriteIndex: 7, speaker: '猪狩', text: '千華は……千華はどこだ！' } 
        ]
    },
    2: { 
        adv: [], 
        pre_stg: [
            // ここも通常の立ち絵を使用
            { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 11, speaker: '柊', text: 'としき君……みつけた……。どうして他の女の人といるの……？' }, 
            { bg: 'airport.png', character: 'igari.png', spriteIndex: 4, speaker: '猪狩', text: '千華！？お前、その体は一体……！' } 
        ], 
        post_stg: [
            { bg: 'airport.png', character: 'hiragi.png', spriteIndex: 3, speaker: '柊', text: '痛い……としき君……' } 
        ] 
    }
};
