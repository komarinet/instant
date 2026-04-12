Const VER_DATA = "0.1.28"; // バージョン更新

const characters = [
    { id: 'igari', name: '猪狩 俊基', color: '#ff3366', desc: '物質再構築。敵弾に近づくほど連射速度が加速する。', weapon: 'Weapon: リボルバー' },
    { id: 'shiina', name: '椎名 護', color: '#33ccff', desc: '時間操作。周囲の時間をスローにする（未実装）。', weapon: 'Weapon: クロノス・レーザー' },
    { id: 'chika', name: '柊 千華', color: '#cc33ff', desc: '因果の残響. 低速移動で弾を透過する（未実装）。', weapon: 'Weapon: 執着の怨炎' },
    { id: 'kagami', name: '各務 栞', color: '#33ff33', desc: '規約執行. 画面内の弾を資源に変換する（未実装）。', weapon: 'Weapon: 監査ビーム' },
    { id: 'godai', name: 'G・O・D・A・I', color: '#aaaaaa', desc: '全兵装展開. 理不尽な命令で暴走する（未実装）。', weapon: 'Weapon: アセット・ミサイル' },
    { id: 'jinguji', name: '神宮寺 恒成', color: '#ffcc00', desc: 'ナノマシン. アイテムを強欲に吸い寄せる（未実装）。', weapon: 'Weapon: 札束弾幕' }
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
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '科学文明軍という異世界人が空港を爆破しました' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'これは、異世界条項47条に反しています' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 12, speaker: '猪狩', text: '特殊詐欺ならお断りなんだが' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'また爆発で恋人を失う気ですか？' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: '！' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'あれは夢などではありません' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '我々はあの未来を防ぐため、１年間を巻き戻しました' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'もしあなたが未来を変えたければ' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '科学文明軍と戦い、彼らを撃破して下さい' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 9, speaker: '猪狩', text: 'いや、でもどうやって' },
        { bg: 'room.png', place: 'Room', time: '2025.04', effect: 'shake', text: '' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'とぼけるのはやめましょう、猪狩俊基' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'あなたは異世界から転移した天才科学者、猪狩隆盛の息子' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '彼の技術力を受け継いでるはずです' },
        { bg: 'room.png', place: 'Room', time: '2025.04', effect: 'shake', text: '' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: 'ちっ・・・後で説明してもらうからな' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '生き残って頂ければ' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: 'ふざけやがって・・・' },
        { bg: 'igni.png', place: 'Room', time: '2025.04', speaker: '猪狩', text: 'イグニッション' } 
    ],
    1: {
        adv: [], 
        pre_stg: [], 
        post_stg: [
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: 'いいでしょう。第１関門は合格ということで' },
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'igari02.png', spriteIndex: 4, speaker: '猪狩', text: '合格・・・？　てか, その声！' },
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: 'ええ、私があなたをタイムリープさせました' },
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '異世界保険組合の各務（かがみ）と申します' },
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: '詳しい話、聞かせてもらうぞ' }
        ]
    },
    2: { 
        adv: [
            // 柊の最初の台詞：二人表示を維持
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 10, character2: 'kagami.png', spriteIndex2: 0, speaker: '柊', text: '俊基くん、その女の人だれ？', delay: 60 },
            
            // その後の猪狩の台詞：猪狩単体表示（右側）
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 13, speaker: '猪狩', text: '千華!?　お前どうしてここに！' },
            
            // その後の柊の台詞：柊単体表示（左側）
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 0, speaker: '柊', text: '俊基の生命エネルギーが少し減ったのを感じたの' }, // 表情(0)
            
            // その後の柊の台詞：柊単体表示（左側）
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 0, speaker: '柊', text: '心配になって来てみたら、女の人といて' }, // 表情(0)
            
            // その後の猪狩の台詞：猪狩単体表示（右側）
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 4, speaker: '猪狩', text: '俺の生命エネルギーなんてモニタリングしてんのか!?' },
            
            // その後の柊の台詞：柊単体表示（左側）
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 6, speaker: '柊', text: '女の人といて、身体は無事で、エネルギー消費・・・' }, // 呆れ(6)
            
            // その後の猪狩の台詞：猪狩単体表示（右側）
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 9, speaker: '猪狩', text: '待て、壮大な誤解をしてるぞお前' },
            
            // その後の柊の台詞：柊単体表示（左側）
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 11, speaker: '柊', text: '・・・浮気だ' }, // 怒り(11)
            
            // その後の猪狩の台詞：猪狩単体表示（右側）
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 12, speaker: '猪狩', text: 'お、おい千華！' },
            
            // ★修正：柊の浮気だー！の台詞で背景指定をdarkcandle.pngに★
            { bg: 'darkcandle.png', place: "Cika's territory", character: 'hiragi01.png', spriteIndex: 11, speaker: '柊', text: '浮気だーーーー！', effect: 'shake' } // 怒り(11)
        ], 
        pre_stg: [
            // ★修正：なんだこの、で始まる各務の台詞の表情を11に★
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 11, speaker: '柊', text: 'としき君……みつけた……。どうして他の女の人といるの……？' }, 
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'igari02.png', spriteIndex: 13, speaker: '猪狩', text: '千華！？お前、その体は一体……！' } 
        ], 
        post_stg: [
            { bg: 'airport.png', place: 'Airport', time: '2026.04', character: 'hiragi01.png', spriteIndex: 3, speaker: '柊', text: '痛い……としき君……' } 
        ] 
    }
};
