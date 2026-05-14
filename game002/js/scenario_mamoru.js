const VER_SCENARIO_MAMORU = "0.3.0"; // 護ルート：サドンデスシナリオ実装

window.scenarios = window.scenarios || {};

// 椎名 護 ルートのシナリオデータ
scenarios.mamoru = {
    'opening': [
        { bg: 'ope.png', place: '解剖場', time: '1年前', character: 'shiina.png', spriteIndex: 8, speaker: '椎名', text: 'こ、ここは？', delay: 60, bgm: 'dark' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: 'なんだ、麻酔が切れちまったのか？' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: 'まあいい、やることは変わらない' },
        { bg: 'ope.png', character: 'shiina.png', spriteIndex: 9, speaker: '椎名', text: '何をする気だ？' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: 'お前の心臓をもらうのさ' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: '生きたままな' },
        { bg: 'ope.png', character: 'shiina.png', spriteIndex: 8, speaker: '椎名', text: '君は何を言ってるんだ!?' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: '礼を言うよ、椎名護' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: 'お前が仮面の力をうまく使えなくて助かった' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: '本物の椎名一族だったらこうはいかなかった' },
        { bg: 'ope.png', item: 'chain.png', se: 'vibration.mp3', text: '' },
        { bg: 'ope.png', character: 'shiina.png', spriteIndex: 9, speaker: '椎名', text: 'やめろ！' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: '悪いがやめるわけにはいかない' },
        { bg: 'ope.png', character: 'kagejingu.png', spriteIndex: 0, speaker: '？？？', text: '死んでくれ、娘のために' },
        { bg: 'ope.png', item: 'chain.png', se: 'vibration.mp3', effect: 'shake', text: '' },
        { bg: 'ope.png', character: 'shiina.png', spriteIndex: 9, speaker: '椎名', text: 'やめろーーーー！', effect: 'whiteout' },
        
        // 背景を赤一色に
        { bg: 'red', text: '', delay: 60, bgm: 'stop' },
        
        { bg: 'hospital.png', place: 'Hospital', time: '2025.04', character: 'nurse.png', spriteIndex: 4, speaker: '看護師', text: '先生、先生？', delay: 30, bgm: 'relax' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 8, speaker: '椎名', text: 'やめろ！', effect: 'shake' },
        { bg: 'hospital.png', character: 'nurse.png', spriteIndex: 3, speaker: '看護師', text: 'えっ？　ご面会、お止めしますか？' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 9, speaker: '椎名', text: '桧山さん・・・ここは' },
        { bg: 'hospital.png', character: 'nurse.png', spriteIndex: 8, speaker: '桧山', text: 'もう、先生ひょっとして居眠りしてました？' },
        { bg: 'hospital.png', character: 'nurse.png', spriteIndex: 1, speaker: '桧山', text: '働きすぎには注意しないと駄目ですよ' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 0, speaker: '椎名', text: 'はは・・・そのようだね' },
        { bg: 'hospital.png', character: 'nurse.png', spriteIndex: 0, speaker: '桧山', text: 'じゃあ面会の人、入れますね' },
        { bg: 'hospital.png', character: 'nurse.png', spriteIndex: 0, effect: 'slideOutLeft', text: '' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '失礼する。白昼夢はいかがだったかな？' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 9, speaker: '椎名', text: '・・・あなたは？' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: 'あれは白昼夢などではない。カレンダーを見るといい' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 10, speaker: '椎名', text: '2025年・・・4月2日' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '君は１年後、臓器目的の男に捉えられ、殺される' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: 'だが我々にとって、それは都合が悪くてね' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 8, speaker: '椎名', text: '我々？　あなたは一体' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '異世界保険組合という。散らばる世界の均衡を保つ仕事だ' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 1, speaker: '椎名', text: '異世界保険組合・・・なるほど' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 6, speaker: '各務', text: '驚かないのだな' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 0, speaker: '椎名', text: '実家が特殊ですから、非日常には慣れてるんです' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 2, speaker: '椎名', text: 'それで、僕はどうすればいいんでしょう？' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '単刀直入に言うと、まず初めに椎名家を継いでほしい' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 1, speaker: '椎名', text: 'つまり、あなたは椎名の回し者ということですか' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 10, speaker: '椎名', text: '僕に幻覚をみせ、家督を継がせようと' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: '勘違いするな。君の家督などどうでもいい' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '能力を使い始めなければ、死ぬというだけだ' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 8, speaker: '椎名', text: 'そうですか・・・しかし・・・うーむ' },
        { bg: 'hospital.png', character: 'kagami.png', spriteIndex: 2, speaker: '各務', text: 'どうした？' },
        { bg: 'hospital.png', character: 'shiina.png', spriteIndex: 10, speaker: '椎名', text: 'スムーズにはいかない気がします' },
        { bg: 'hospital.png', effect: 'whiteout', text: '' }
    ],
    'kagami_arrival': [
        { bg: 'shiinake.png', place: 'Shiina House', time: '2025.04', character: 'eiji.png', spriteIndex: 3, speaker: '衛二', text: '家督を譲れ？', delay: 60, bgm: 'dark' },
        { bg: 'shiinake.png', character: 'eiji.png', spriteIndex: 4, speaker: '衛二', text: '兄さん、椎名の家業には興味ないって言ったじゃないか' },
        { bg: 'shiinake.png', character: 'shiina.png', spriteIndex: 10, speaker: '護', text: '仕方ないんだよ、事情が事情で' },
        { bg: 'shiinake.png', character: 'eiji.png', spriteIndex: 2, speaker: '衛二', text: 'それでも納得できないよ！' },
        { bg: 'shiinake.png', character: 'eiji.png', spriteIndex: 8, speaker: '衛二', text: '父さんも何か言ってやってよ' },
        { bg: 'shiinake.png', character: 'tadashige.png', spriteIndex: 0, speaker: '忠重', text: '衛二は厳しい修行で仮面の力を手に入れた' },
        { bg: 'shiinake.png', character: 'tadashige.png', spriteIndex: 1, speaker: '忠重', text: '家督を継ぎたいのであれば、衛二に勝る力を証明しろ' },
        { bg: 'shiinake.png', character: 'shiina.png', spriteIndex: 0, speaker: '護', text: '・・・わかった' }
    ],
    1: {
        stgId: 'eiji', // 新設したサドンデスステージを指定
        adv: [
            { bg: 'nightmt.png', place: 'Night Mountain', time: '2025.04', character: 'eiji.png', spriteIndex: 0, speaker: '衛二', text: '仮面は持ってたよね？', delay: 60, bgm: 'relax' },
            { bg: 'nightmt.png', character: 'shiina.png', spriteIndex: 0, speaker: '護', text: '一応僕も椎名の人間だからね' },
            { bg: 'nightmt.png', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: 'すまないが、部外者にもわかるように説明してもらってもいいかな' },
            { bg: 'nightmt.png', character: 'shiina.png', spriteIndex: 10, speaker: '護', text: 'すみません、各務さん' },
            { bg: 'nightmt.png', character: 'shiina.png', spriteIndex: 1, speaker: '護', text: 'うちの秘匿事項なのでそれはちょっと' },
            { bg: 'nightmt.png', character: 'kagami.png', spriteIndex: 2, speaker: '各務', text: 'そうか・・・' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 0, speaker: '忠重', text: 'すまないな、異世界の客人よ' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 1, speaker: '忠重', text: 'まあ要は仮面の力をより示せた方の勝利、ということだ' },
            { bg: 'nightmt.png', character: 'eiji.png', spriteIndex: 3, speaker: '衛二', text: 'そもそも仮面の力、使えるの？　医者なんて仕事に逃げた兄さんが・・・' }
        ], 
        pre_stg: [
            { bg: 'nightmt.png', item: 'mask.png', se: 'vibration.mp3', text: '', bgm: 'stop' },
            { bg: 'nightmt.png', character: 'urashiina.png', spriteIndex: 2, speaker: '護(裏)', text: 'これでいいよな？　悪いが、手加減出来ねぇぞ？', bgm: 'dark' },
            { bg: 'nightmt.png', item: 'mask2.png', se: 'vibration.mp3', text: '' },
            { bg: 'nightmt.png', character: 'uraeiji.png', spriteIndex: 3, speaker: '衛二(裏)', text: '上等だよ、流れ弾に当たって死んでも知らねぇからな！', effect: 'shake' }
        ], 
        post_stg: [ // 勝ちパターン
            { bg: 'nightmt.png', character: 'uraeiji.png', spriteIndex: 4, speaker: '衛二(裏)', text: '何でだよ・・・何で勝てねぇんだよ！', bgm: 'stop', effect: 'shake' },
            { bg: 'nightmt.png', character: 'eiji.png', spriteIndex: 8, speaker: '衛二', text: '勉強だって運動だって、いつだって兄貴は一番だった', bgm: 'relax' },
            { bg: 'nightmt.png', character: 'eiji.png', spriteIndex: 8, speaker: '衛二', text: 'だから俺、必死で仮面の力を・・・' },
            { bg: 'nightmt.png', character: 'shiina.png', spriteIndex: 8, speaker: '護', text: '衛二・・・' },
            { bg: 'nightmt.png', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '衛二くん、椎名くんは１年後に殺される運命を覆すために' },
            { bg: 'nightmt.png', character: 'eiji.png', spriteIndex: 9, speaker: '衛二', text: 'わかってるよ。俺だって兄貴に死んでもらいたくはない' },
            { bg: 'nightmt.png', character: 'eiji.png', spriteIndex: 0, speaker: '衛二', text: 'ただ、納得したかったんだ' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 1, speaker: '忠重', text: '勝負はついた。両者とも見事だったぞ' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 0, speaker: '忠重', text: '家督は護に譲るものとする' },
            { bg: 'nightmt.png', effect: 'whiteout', text: '' },
            { bg: 'nightmt.png', character: 'shiina.png', spriteIndex: 2, speaker: '護', text: 'これは・・・力が溢れてくる' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 0, speaker: '忠重', text: '先祖の力がお前の仮面に注がれたのだ' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 0, speaker: '忠重', text: '今後、椎名家の依頼はお前が指揮をとれ' },
            { bg: 'nightmt.png', character: 'shiina.png', spriteIndex: 10, speaker: '護', text: '医者は続けていいの？' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 1, speaker: '忠重', text: '好きにしろ、お前が当主だ' },
            { bg: 'nightmt.png', character: 'eiji.png', spriteIndex: 6, speaker: '衛二', text: '兄貴、大変だ！　UFOが攻めてきた！', effect: 'shake', bgm: 'dark' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 2, speaker: '忠重', text: '衛二、お前全滅させてきたって言ってたよな' },
            { bg: 'nightmt.png', character: 'eiji.png', spriteIndex: 3, speaker: '衛二', text: '実は最後デカいやつがいたから逃げてきたんだよな' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 4, speaker: '忠重', text: '全く、そんなことでよく当主になろうと思ったな' },
            { bg: 'nightmt.png', character: 'tadashige.png', spriteIndex: 0, speaker: '忠重', text: '護、当主としての初仕事だ。UFOを全滅させろ' },
            { bg: 'nightmt.png', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: 'なんだか就任早々慌ただしいな' },
            { bg: 'nightmt.png', character: 'shiina.png', spriteIndex: 0, speaker: '護', text: '職業柄、忙しいのには慣れてるよ' }
        ],
        loss_adv: [ // 負けパターン（STG内で呼び出される）
            { bg: 'nightmt.png', character: 'uraeiji.png', spriteIndex: 2, speaker: '衛二(裏)', text: 'ははははっ！　勝った！　兄貴に勝った！', effect: 'shake', bgm: 'stop' },
            { bg: 'nightmt.png', character: 'kagami.png', spriteIndex: 6, speaker: '各務', text: '椎名くん、残念だが君の運命は確定してしまった', bgm: 'dark' },
            { bg: 'nightmt.png', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: 'もはや何度時間を巻き戻しても無駄だろう' },
            { bg: 'nightmt.png', character: 'shiina.png', spriteIndex: 8, speaker: '護', text: 'そんな・・・' }
        ]
    },
    2: { adv: [], pre_stg: [], post_stg: [] },
    3: { adv: [], pre_stg: [], post_stg: [] },
    4: { adv: [], pre_stg: [], post_stg: [] },
    5: { adv: [], pre_stg: [], post_stg: [] },
    6: { adv: [], pre_stg: [], post_stg: [] }
};
