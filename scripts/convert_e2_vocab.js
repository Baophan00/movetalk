const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Extract E2_LESSONS
const e2Start = html.indexOf('const E2_LESSONS=');
const e2End = html.indexOf('};', e2Start) + 2;
let e2Js = html.slice(e2Start, e2End);

// Fix unescaped quotes
e2Js = e2Js.replace(/\\'/g, '__ESCAPED_QUOTE__');
const contractions = [
  "can't", "don't", "doesn't", "didn't", "isn't", "aren't",
  "won't", "wouldn't", "couldn't", "shouldn't", "it's", "that's",
  "there's", "what's", "let's", "we're", "they're", "you're",
  "I'm", "I've", "I'll", "I'd", "we've", "we'll", "we'd",
  "they've", "they'll", "they'd", "you've", "you'll", "you'd",
  "he's", "she's", "he'll", "she'll", "he'd", "she'd"
];
for (const c of contractions) {
  const escaped = c.replace(/'/g, "\\'");
  e2Js = e2Js.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), escaped);
}
e2Js = e2Js.replace(/__ESCAPED_QUOTE__/g, "\\'");

const e2ObjStr = e2Js.replace('const E2_LESSONS=', '').replace(/;\s*$/, '');
const E2_LESSONS = eval('(' + e2ObjStr + ')');

// Vocab data with phonetic and examples
const vocabData = {
  '1': [
    {word:'acquaintance', phonetic:'/əˈkweɪntəns/', vi:'người quen, chưa phải bạn thân', def:'someone you know, but not well', examples:[{text:"He's just an acquaintance, not a close friend.",context:'daily'},{text:'I met an acquaintance at the conference.',context:'work'}]},
    {word:'reliable', phonetic:'/rɪˈlaɪəbl/', vi:'đáng tin cậy', def:'you can depend on this person', examples:[{text:"She's very reliable — always on time.",context:'work'},{text:'My brother is reliable. I can count on him.',context:'daily'}]},
    {word:'considerate', phonetic:'/kənˈsɪdərət/', vi:'biết nghĩ cho người khác', def:"thinks about other people's feelings", examples:[{text:"He's very considerate — he always asks how I feel.",context:'daily'},{text:"Please be considerate of other people's time.",context:'work'}]},
    {word:'easy-going', phonetic:'/ˈiːzi ˈɡəʊɪŋ/', vi:'dễ tính, thoải mái', def:'relaxed, rarely gets upset', examples:[{text:'My manager is easy-going. She never shouts.',context:'work'},{text:"He's easy-going — nothing stresses him out.",context:'daily'}]},
    {word:"can't stand", phonetic:'/kɑːnt stænd/', vi:'không thể chịu được', def:'really dislike', examples:[{text:"I can't stand rude people.",context:'daily'},{text:"She can't stand long meetings.",context:'work'}]},
    {word:'put up with', phonetic:'/pʊt ʌp wɪð/', vi:'chịu đựng một điều khó chịu', def:'tolerate something unpleasant', examples:[{text:'I can put up with it once or twice.',context:'daily'},{text:"I can't put up with this noise anymore.",context:'work'}]},
    {word:'get along with', phonetic:'/ɡet əˈlɒŋ wɪð/', vi:'hợp với ai đó', def:'have a good relationship with', examples:[{text:'I get along with my coworkers.',context:'work'},{text:'She gets along with everyone in the family.',context:'daily'}]},
    {word:'lose touch with', phonetic:'/luːz tʌtʃ wɪð/', vi:'mất liên lạc với ai', def:'no longer contact someone', examples:[{text:'I lost touch with my old classmates.',context:'daily'},{text:'We lost touch after he changed jobs.',context:'work'}]},
    {word:'have a lot in common', phonetic:'/həv ə lɒt ɪn ˈkɒmən/', vi:'có nhiều điểm chung', def:'share similar interests', examples:[{text:'We have a lot in common.',context:'daily'},{text:'I have a lot in common with my colleague.',context:'work'}]},
    {word:'frustrating', phonetic:'/frʌˈstreɪtɪŋ/', vi:'gây bực bội', def:'making you feel annoyed', examples:[{text:'It becomes really frustrating.',context:'work'},{text:'This traffic is so frustrating.',context:'daily'}]}
  ],
  '2': [
    {word:'keep in touch', phonetic:'/kiːp ɪn tʌtʃ/', vi:'giữ liên lạc với ai', def:'maintain contact', examples:[{text:"We've kept in touch for years.",context:'daily'},{text:"Let's keep in touch after the project.",context:'work'}]},
    {word:'catch up', phonetic:'/kætʃ ʌp/', vi:'gặp để cập nhật chuyện gần đây', def:'meet to hear about recent events', examples:[{text:'I caught up with Minh yesterday.',context:'daily'},{text:"Let's catch up on the project.",context:'work'}]},
    {word:'reach out', phonetic:'/riːtʃ aʊt/', vi:'chủ động liên hệ với ai', def:'contact someone', examples:[{text:'I finally reached out to her.',context:'daily'},{text:'Please reach out if you need help.',context:'work'}]},
    {word:'make time for', phonetic:'/meɪk taɪm fɔː/', vi:'dành thời gian cho ai', def:'find time to spend with someone', examples:[{text:'I make time for close friends.',context:'daily'},{text:"Let's make time for a meeting.",context:'work'}]},
    {word:'drift apart', phonetic:'/drɪft əˈpɑːt/', vi:'dần xa cách', def:'gradually become less close', examples:[{text:'We gradually drifted apart.',context:'daily'},{text:'They drifted apart after college.',context:'daily'}]},
    {word:'get back in touch', phonetic:'/ɡet bæk ɪn tʌtʃ/', vi:'liên lạc lại với ai', def:'contact someone again', examples:[{text:"I'd like to get back in touch with him.",context:'daily'},{text:"Let's get back in touch next week.",context:'work'}]},
    {word:'stay connected', phonetic:'/steɪ kəˈnektɪd/', vi:'duy trì kết nối', def:'maintain a relationship', examples:[{text:'We still stay connected online.',context:'daily'},{text:"Let's stay connected on LinkedIn.",context:'work'}]},
    {word:'have a lot going on', phonetic:'/həv ə lɒt ˈɡəʊɪŋ ɒn/', vi:'đang có rất nhiều việc', def:'be very busy', examples:[{text:'We both have a lot going on.',context:'daily'},{text:'I have a lot going on at work.',context:'work'}]},
    {word:'pick up where we left off', phonetic:'/pɪk ʌp weə(r) wi left ɒf/', vi:'tiếp tục tự nhiên như trước', def:'continue naturally from where you stopped', examples:[{text:"We'll quickly pick up where we left off.",context:'daily'},{text:"Let's pick up where we left off.",context:'work'}]},
    {word:'used to + V', phonetic:'/juːst tuː/', vi:'đã từng (thói quen quá khứ)', def:'past habit that no longer exists', examples:[{text:'We used to spend every weekend together.',context:'daily'},{text:'I used to work in sales.',context:'work'}]}
  ],
  '3': [
    {word:'agree with', phonetic:'/əˈɡriː wɪð/', vi:'đồng ý với ai / ý kiến', def:'share the same opinion', examples:[{text:'I agree with you about the price.',context:'work'},{text:'I agree with that idea.',context:'daily'}]},
    {word:'disagree with', phonetic:'/ˌdɪsəˈɡriː wɪð/', vi:'không đồng ý với ai / ý kiến', def:'have a different opinion', examples:[{text:'I disagree with that idea.',context:'work'},{text:'I disagree with you on this.',context:'daily'}]},
    {word:'have a point', phonetic:'/həv ə pɔɪnt/', vi:'có lý', def:'have a valid reason', examples:[{text:'You have a point.',context:'daily'},{text:'She has a point about the budget.',context:'work'}]},
    {word:'see your point', phonetic:'/siː jɔː pɔɪnt/', vi:'hiểu ý của bạn', def:"understand someone's opinion", examples:[{text:'I see your point, but…',context:'work'},{text:'I see your point, though.',context:'daily'}]},
    {word:'not necessarily', phonetic:'/nɒt ˌnesəˈserəli/', vi:'không hẳn', def:'not always', examples:[{text:'Not necessarily. It depends…',context:'daily'},{text:"That's not necessarily true.",context:'work'}]},
    {word:'bring it up', phonetic:'/brɪŋ ɪt ʌp/', vi:'đề cập chuyện đó', def:'mention a topic', examples:[{text:'Can I bring something up?',context:'work'},{text:'I need to bring this up.',context:'work'}]},
    {word:'work it out', phonetic:'/wɜːk ɪt aʊt/', vi:'cùng giải quyết', def:'solve a problem together', examples:[{text:'We can work it out together.',context:'work'},{text:"Let's work it out.",context:'daily'}]},
    {word:'compromise', phonetic:'/ˈkɒmprəmaɪz/', vi:'thỏa hiệp', def:'find a middle ground', examples:[{text:'Could we compromise?',context:'work'},{text:'We need to compromise.',context:'daily'}]},
    {word:'change my mind', phonetic:'/tʃeɪndʒ maɪ maɪnd/', vi:'đổi ý', def:'change your opinion', examples:[{text:'It might change my mind.',context:'daily'},{text:"I won't change my mind.",context:'work'}]},
    {word:'be open to', phonetic:'/biː ˈəʊpən tuː/', vi:'sẵn sàng cân nhắc', def:'willing to consider', examples:[{text:"I'm open to trying it once.",context:'daily'},{text:"I'm open to new ideas.",context:'work'}]},
    {word:'accusatory', phonetic:'/əˈkjuːzətəri/', vi:'mang tính buộc tội', def:'suggesting someone is guilty', examples:[{text:'without sounding accusatory',context:'work'},{text:"Don't be accusatory.",context:'daily'}]},
    {word:'acknowledge', phonetic:'/əkˈnɒlɪdʒ/', vi:'ghi nhận, thừa nhận', def:'accept or admit', examples:[{text:"acknowledge B's good point",context:'work'},{text:'I acknowledge my mistake.',context:'daily'}]}
  ]
};

// Convert vocab to flashcard format
for (const [lessonNum, words] of Object.entries(vocabData)) {
  if (E2_LESSONS[lessonNum] && E2_LESSONS[lessonNum].parts && E2_LESSONS[lessonNum].parts.vocab) {
    E2_LESSONS[lessonNum].parts.vocab = [
      {t:'h', text:'Vocabulary'},
      {t:'flashcard', items: words}
    ];
  }
}

const newE2Js = 'const E2_LESSONS=' + JSON.stringify(E2_LESSONS) + ';';
html = html.slice(0, e2Start) + newE2Js + html.slice(e2End);

fs.writeFileSync('index.html', html);
console.log('Converted E2 vocab to flashcard format');
console.log('New E2_LESSONS length: ' + newE2Js.length + ' chars');
