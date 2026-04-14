const VER_SCENARIO_IGARI = "0.2.5"; // バージョン更新（ステージ2マスク演出とテキスト順序の微調整）

// 猪狩 俊基ルートのシナリオデータ

scenarios.igari = {
    'opening': [
        // fadeInを削除し、delay（待機）のみを残しました
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
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '猪狩俊基だな。私は異世界保険組合の者だ' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 12, speaker: '猪狩', text: 'いせかい・・・保険組合？' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '科学文明軍という異世界人が空港を爆破した' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'これは、異世界条項47条に違反になるんだ' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 12, speaker: '猪狩', text: '特殊詐欺でもまだマシな嘘をつくぞ？' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'また爆発で恋人を失いたいのか？' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: '！' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'あれは夢などではない' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'あの未来を防ぐため、我々は１年間を巻き戻したのだ' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'もし君が未来を変えたければ' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '科学文明軍と戦い、彼らを撃破しなくてはならない' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 9, speaker: '猪狩', text: 'いや、でもどうやって' },
        { bg: 'room.png', place: 'Room', time: '2025.04', effect: 'shake', text: '' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '我々を舐めるなよ、猪狩俊基' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '君は異世界から転移した天才科学者、猪狩隆盛の息子だろう？' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: '彼の技術力を受け継いでるはずだ' },
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: '何故それを・・・' },
        { bg: 'room.png', place: 'Room', time: '2025.04', speaker: 'オペレーター', text: 'そうだな。/n生き残ったら説明してやってもいい'},
        { bg: 'room.png', place: 'Room', time: '2025.04', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: 'ふざけやがって・・・' },
        { bg: 'igni.png', place: 'Room', time: '2025.04', speaker: '猪狩', text: 'イグニッション' } 
    ],
    1: {
        adv: [], 
        pre_stg: [], 
        post_stg: [
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: 'いいだろう。第１関門は合格だ' },
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'igari02.png', spriteIndex: 4, speaker: '猪狩', text: '合格・・・？　てか, その声！' },
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: '私が君をタイムリープさせた' },
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '異世界保険組合の各務（かがみ）だ' },
            { bg: 'breakufo.png', place: 'Airport', time: '2025.04', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: '詳しい話、聞かせてもらうぞ' }
        ]
    },
    2: { 
        adv: [
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 2, speaker: '柊', text: '俊基。その女、誰？', delay: 60 },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 13, speaker: '猪狩',character2: 'kagami.png', spriteIndex2: 0, text: '千華!?　お前どうしてここに！' },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 0, speaker: '柊', text: '俊基の生命エネルギーが少し減ったのを感じたの' },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 9, speaker: '柊', text: '心配になって来てみたら、なんか女といるし' },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 4, character2: 'kagami.png', spriteIndex2: 0, speaker: '猪狩', text: '俺の生命エネルギーなんてモニタリングしてんのか!?' },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 9, speaker: '柊', text: '女と二人きり、身体は無事で、エネルギー消費・・・' },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 12, character2: 'kagami.png', spriteIndex2: 9, speaker: '猪狩', text: '待て、なんか壮大な誤解をしてるぞお前' },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 12, speaker: '柊', text: '・・・浮気だ' },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 3, character2: 'kagami.png', spriteIndex2: 0, speaker: '猪狩', text: 'お、おい千華！' },
            
            // ★修正：まずUFO背景のままブチギレる
            { bg: 'breakufo.png', place: "Cika's territory", character: 'hiragi01.png', spriteIndex: 13, speaker: '柊', text: '浮気だーーーー！', effect: 'shake' },
            
            // ★修正：テキストウィンドウを消し、柊の立ち絵（13）を維持したまま、マスクでキャンドル部屋へ侵食
            { bg: 'breakufo.png', maskBg: 'darkcandle.png', maskDelay: 90, character: 'hiragi01.png', spriteIndex: 13, effect: 'shake', text: '' }
        ], 
        pre_stg: [
            { bg: 'darkcandle.png', character: 'kagami.png', spriteIndex: 14, speaker: '各務', text: 'なんだこの世界は', isRight: true },
            { bg: 'darkcandle.png', character: 'igari02.png', spriteIndex: 4, speaker: '猪狩', text: '魔女の結界だ！　千華のやつブチ切れやがった！', isRight: true },
            { bg: 'darkcandle.png', character: 'hiragi01.png', spriteIndex: 11, speaker: '柊', text: 'もう殺す。その女も、俊基も', isRight: false },
            { bg: 'darkcandle.png', character: 'hiragi01.png', spriteIndex: 3, speaker: '柊', text: '両方殺して私も死ぬ！', isRight: false, effect: 'shake' },
            { bg: 'darkcandle.png', character: 'igari02.png', spriteIndex: 5, character2: 'kagami.png', spriteIndex2: 2, speaker: '各務', text: 'おい、どうするんだ？', isRight: true },
            { bg: 'darkcandle.png', character: 'igari02.png', spriteIndex: 4, character2: 'kagami.png', spriteIndex2: 6, speaker: '猪狩', text: '死なん程度に攻撃して落ち着かせるしかない', isRight: true }, 
            { bg: 'darkcandle.png', character: 'igari02.png', spriteIndex: 0, character2: 'kagami.png', spriteIndex2: 2, speaker: '各務', text: '世界を書き換えるようなバケモン相手にそんな芸当、できんのか？', isRight: true },
            { bg: 'darkcandle.png', character: 'igari02.png', spriteIndex: 7, character2: 'kagami.png', spriteIndex2: 6, speaker: '猪狩', text: 'やらなきゃならんだろ。じゃなきゃ、助ける予定の女に殺されちまう！', isRight: true },
            { bg: 'darkcandle.png', character: 'igari02.png', spriteIndex: 5, character2: 'kagami.png', spriteIndex2: 2, speaker: '各務', text: '面倒なことになったな・・・', isRight: true },
            { bg: 'darkcandle.png', character: 'igari02.png', spriteIndex: 11, character2: 'kagami.png', spriteIndex2: 9, speaker: '各務', text: '仕方ない。私も手伝おう', isRight: true },
            { bg: 'darkcandle.png', character: 'igari02.png', spriteIndex: 0, character2: 'kagami.png', spriteIndex2: 0, speaker: '猪狩', text: '助かる！', isRight: true }
        ], 
        post_stg: [
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 1, speaker: '柊', text: 'あれ？　俊基？', isRight: false },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 12, speaker: '猪狩', text: 'やっと目ぇ覚めやがったか', isRight: true },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 6, speaker: '柊', text: 'えと、私・・・やっちゃった？', isRight: false },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 3, speaker: '猪狩', text: '魔界が発生してた。で、使い魔をぶん殴ったとこだ', isRight: true },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 6, speaker: '柊', text: 'ごめんねぇ、俊基', isRight: false },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 0, speaker: '猪狩', text: 'また暴走しないように言っとくぞ', isRight: true },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: '俺が大切なのはお前だけだ。忘れんな', isRight: true },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 6, speaker: '柊', text: '俊基ー！', isRight: false },
            { bg: 'breakufo.png', character: 'kagami.png', spriteIndex: 9, speaker: '各務', text: 'ごほん、話は済んだか？', isRight: true },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 8, speaker: '柊', text: 'あっ、間女！', isRight: false },
            { bg: 'breakufo.png', character: 'kagami.png', spriteIndex: 6, speaker: '各務', text: '違う！　私は異世界保険組合の営業だ！', isRight: true },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 3, speaker: '柊', text: '厨二病を拗らせてるのね', isRight: false },
            { bg: 'breakufo.png', character: 'kagami.png', spriteIndex: 3, speaker: '各務', text: '貴様、歴史から消滅させてやろうか', isRight: true },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 12, speaker: '猪狩', text: 'まあまあ、二人とも落ち着いて', isRight: true },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 0, speaker: '猪狩', text: '千華、お前俺に黙ってること。あるだろ', isRight: true },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 1, speaker: '柊', text: 'んんー？　ないけどぉ？', isRight: false },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 7, speaker: '猪狩', text: '１年後にお前が死ぬ運命だということもか', isRight: true },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 11, speaker: '柊', text: '・・・っ！　どうしてそれを', isRight: false },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 5, speaker: '猪狩', text: '俺は１年後、お前が乗った飛行機が爆破されるのを見てきたからだ', isRight: true },
            { bg: 'breakufo.png', character: 'igari02.png', spriteIndex: 0, speaker: '猪狩', text: 'だが、どうやら世界にとってそれは不都合らしくてな', isRight: true },
            { bg: 'breakufo.png', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '私がこの世界を１年間巻き戻したというわけだ', isRight: true },
            { bg: 'breakufo.png', character: 'hiragi01.png', spriteIndex: 2, speaker: '柊', text: 'んんー？？　でも、まだ運命は変わってないわよ', isRight: false },
            { bg: 'breakufo.png', character: 'kagami.png', spriteIndex: 0, speaker: '各務', text: '協力者が必要だ。ついてこい', isRight: true }
        ] 
    }
};
