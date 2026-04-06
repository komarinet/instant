const characters = [
    { id: 'igari', name: '猪狩 俊基', color: '#ff3366', desc: '物質再構築。敵弾に近づくほど連射速度が加速する。', weapon: 'Weapon: リボルバー' },
    { id: 'shiina', name: '椎名 護', color: '#33ccff', desc: '時間操作。周囲の時間をスローにする（未実装）。', weapon: 'Weapon: クロノス・レーザー' },
    { id: 'chika', name: '柊 千華', color: '#cc33ff', desc: '因果の残響。低速移動で弾を透過する（未実装）。', weapon: 'Weapon: 執着の怨炎' },
    { id: 'kagami', name: '各務 栞', color: '#33ff33', desc: '規約執行。画面内の弾を資源に変換する（未実装）。', weapon: 'Weapon: 監査ビーム' },
    { id: 'godai', name: 'G・O・D・A・I', color: '#aaaaaa', desc: '全兵装展開。理不尽な命令で暴走する（未実装）。', weapon: 'Weapon: アセット・ミサイル' },
    { id: 'jinguji', name: '神宮寺 恒成', color: '#ffcc00', desc: 'ナノマシン。アイテムを強欲に吸い寄せる（未実装）。', weapon: 'Weapon: 札束弾幕' }
];

const scenarios = {
    1: {
        adv: [
            { speaker: 'システム', text: 'タイムリープ・シークエンス起動……' },
            { speaker: 'システム', text: '西暦2025年、目標座標への転送を完了しました。' },
            { speaker: '猪狩', text: '……ここは。一年前の……俺たちがいた街か。' }
        ],
        pre_stg: [
            { speaker: '各務', text: '優里様を助けるための実力、査定させていただきます。' },
            { speaker: '猪狩', text: 'お前は……！勝手に飛ばしといて、査定だと！？ふざけるな！' },
            { speaker: '各務', text: 'はい。不合格なら即座に因果から消去（デリート）ですので。' }
        ],
        post_stg: [
            { speaker: '各務', text: '……めんどくさいですが、最低ラインはクリアですね。' },
            { speaker: '猪狩', text: '千華は……千華はどこだ！' }
        ]
    },
    2: { 
        adv: [], 
        pre_stg: [
            { speaker: '千華', text: 'としき君……みつけた……。どうして他の女の人といるの……？' },
            { speaker: '猪狩', text: '千華！？お前、その体は一体……！' }
        ], 
        post_stg: [
            { speaker: '千華', text: '痛い……としき君……' }
        ] 
    }
};
