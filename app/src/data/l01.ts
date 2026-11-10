// L01 - Build a Yes-No Question
// Vocabulary data extracted from PPTX

import type { VocabItem } from '../screens/LessonView'

export { type VocabItem }

export const L01_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'work', ipa: '/wɜːrk/', vi: 'làm việc', pos: 'v', youglish: 'https://youglish.com/pronounce/work', examples: [
    { sentence: 'I usually ___ from 9 to 5.', answer: 'work', vi: 'Tôi thường làm việc từ 9 đến 5.' },
    { sentence: 'She ___ at a hospital near my house.', answer: 'works', vi: 'Cô ấy làm việc ở bệnh viện gần nhà tôi.' },
  ], usage: 'Động từ thường, dùng với chủ ngữ I/you/we/they. Với he/she/it thêm -s.' },
  { word: 'live', ipa: '/lɪv/', vi: 'sống', pos: 'v', youglish: 'https://youglish.com/pronounce/live', examples: [
    { sentence: 'My parents ___ in a small town.', answer: 'live', vi: 'Bố mẹ tôi sống ở thị trấn nhỏ.' },
    { sentence: 'He ___ alone in an apartment downtown.', answer: 'lives', vi: 'Anh ấy sống một mình ở căn hộ trung tâm.' },
  ], usage: 'Động từ thường. Dùng để nói về nơi ở.' },
  { word: 'like', ipa: '/laɪk/', vi: 'thích', pos: 'v', youglish: 'https://youglish.com/pronounce/like', examples: [
    { sentence: 'I really ___ this coffee shop.', answer: 'like', vi: 'Tôi thực sự thích quán cà phê này.' },
    { sentence: 'She ___ reading books before bed.', answer: 'likes', vi: 'Cô ấy thích đọc sách trước khi ngủ.' },
  ], usage: 'Động từ thường. Theo sau bởi danh từ hoặc V-ing.' },
  { word: 'cook', ipa: '/kʊk/', vi: 'nấu ăn', pos: 'v', youglish: 'https://youglish.com/pronounce/cook', examples: [
    { sentence: 'My dad ___ dinner every Sunday.', answer: 'cooks', vi: 'Bố tôi nấu bữa tối mỗi Chủ nhật.' },
    { sentence: 'We usually ___ together on weekends.', answer: 'cook', vi: 'Chúng tôi thường nấu ăn cùng nhau cuối tuần.' },
  ], usage: 'Động từ thường. Có thể dùng làm danh từ (a cook = đầu bếp).' },
  { word: 'busy', ipa: '/ˈbɪzi/', vi: 'bận', pos: 'adj', youglish: 'https://youglish.com/pronounce/busy', examples: [
    { sentence: 'I am ___ until 5 PM today.', answer: 'busy', vi: 'Tôi bận đến 5 giờ chiều hôm nay.' },
    { sentence: 'She looks ___ this week with many meetings.', answer: 'busy', vi: 'Cô ấy có vẻ bận tuần này với nhiều cuộc họp.' },
  ], usage: 'Tính từ, đi với be verb (am/is/are busy).' },
  { word: 'tired', ipa: '/ˈtaɪərd/', vi: 'mệt', pos: 'adj', youglish: 'https://youglish.com/pronounce/tired', examples: [
    { sentence: 'I feel ___ after a long day at work.', answer: 'tired', vi: 'Tôi cảm thấy mệt sau một ngày dài làm việc.' },
    { sentence: 'He was ___ but still finished the project.', answer: 'tired', vi: 'Anh ấy mệt nhưng vẫn hoàn thành dự án.' },
  ], usage: 'Tính từ, thường đi với be verb hoặc feel.' },
  { word: 'free', ipa: '/friː/', vi: 'rảnh', pos: 'adj', youglish: 'https://youglish.com/pronounce/free', examples: [
    { sentence: 'Are you ___ this weekend?', answer: 'free', vi: 'Bạn rảnh cuối tuần này không?' },
    { sentence: 'I am ___ after 6 PM every day.', answer: 'free', vi: 'Tôi rảnh sau 6 giờ chiều mỗi ngày.' },
  ], usage: 'Tính từ, đi với be verb. Cũng có nghĩa "miễn phí".' },
  { word: 'ready', ipa: '/ˈredi/', vi: 'sẵn sàng', pos: 'adj', youglish: 'https://youglish.com/pronounce/ready', examples: [
    { sentence: 'Are you ___ for the meeting?', answer: 'ready', vi: 'Bạn sẵn sàng cho cuộc họp chưa?' },
    { sentence: 'I am ___ to start whenever you are.', answer: 'ready', vi: 'Tôi sẵn sàng bắt đầu bất cứ khi nào bạn sẵn sàng.' },
  ], usage: 'Tính từ, thường đi với be verb + for/to.' },
  { word: 'eat', ipa: '/iːt/', vi: 'ăn', pos: 'v', youglish: 'https://youglish.com/pronounce/eat', examples: [
    { sentence: 'I usually ___ breakfast at 7 AM.', answer: 'eat', vi: 'Tôi thường ăn sáng lúc 7 giờ.' },
    { sentence: 'She ___ out with friends on Fridays.', answer: 'eats', vi: 'Cô ấy ăn ngoài với bạn vào thứ Sáu.' },
  ], usage: 'Động từ thường. eat out = ăn ngoài.' },
  { word: 'drink', ipa: '/drɪŋk/', vi: 'uống', pos: 'v', youglish: 'https://youglish.com/pronounce/drink', examples: [
    { sentence: 'I ___ coffee every morning.', answer: 'drink', vi: 'Tôi uống cà phê mỗi sáng.' },
    { sentence: 'She ___ a lot of water after running.', answer: 'drinks', vi: 'Cô ấy uống nhiều nước sau khi chạy.' },
  ], usage: 'Động từ thường. drink water = uống nước.' },
  { word: 'sleep', ipa: '/sliːp/', vi: 'ngủ', pos: 'v', youglish: 'https://youglish.com/pronounce/sleep', examples: [
    { sentence: 'I usually ___ 8 hours a night.', answer: 'sleep', vi: 'Tôi thường ngủ 8 tiếng mỗi đêm.' },
    { sentence: 'He ___ late on weekends.', answer: 'sleeps', vi: 'Anh ấy ngủ muộn vào cuối tuần.' },
  ], usage: 'Động từ thường. go to sleep = đi ngủ.' },
  { word: 'study', ipa: '/ˈstʌdi/', vi: 'học', pos: 'v', youglish: 'https://youglish.com/pronounce/study', examples: [
    { sentence: 'I ___ English every day.', answer: 'study', vi: 'Tôi học tiếng Anh mỗi ngày.' },
    { sentence: 'She ___ at the library after class.', answer: 'studies', vi: 'Cô ấy học ở thư viện sau giờ học.' },
  ], usage: 'Động từ thường. study hard = học chăm.' },
]

export const L01_LEVEL2_VOCAB: VocabItem[] = [
  // Chunks from PPTX useful chunks
  { word: 'wake up early', ipa: '/weɪk ʌp ˈɜːrli/', vi: 'thức dậy sớm', pos: 'chunk', youglish: 'https://youglish.com/pronounce/wake%20up%20early', examples: [
    { sentence: 'I always ___ to catch the morning bus.', answer: 'wake up early', vi: 'Tôi luôn thức dậy sớm để bắt xe buýt sáng.' },
    { sentence: 'She ___ because she has a morning class.', answer: 'wakes up early', vi: 'Cô ấy thức dậy sớm vì có lớp sáng.' },
  ], usage: 'Cụm động từ, dùng để nói về thói quen buổi sáng.' },
  { word: 'go to bed late', ipa: '/ɡoʊ tə bed leɪt/', vi: 'đi ngủ muộn', pos: 'chunk', youglish: 'https://youglish.com/pronounce/go%20to%20bed%20late', examples: [
    { sentence: 'I often ___ when I watch movies.', answer: 'go to bed late', vi: 'Tôi thường đi ngủ muộn khi xem phim.' },
    { sentence: 'He ___ because he works night shifts.', answer: 'goes to bed late', vi: 'Anh ấy đi ngủ muộn vì làm ca đêm.' },
  ], usage: 'Cụm động từ, trái nghĩa với wake up early.' },
  { word: 'eat out', ipa: '/iːt aʊt/', vi: 'ăn ngoài', pos: 'chunk', youglish: 'https://youglish.com/pronounce/eat%20out', examples: [
    { sentence: 'We usually ___ on Friday nights.', answer: 'eat out', vi: 'Chúng tôi thường ăn ngoài vào tối thứ Sáu.' },
    { sentence: 'She prefers to ___ rather than cook at home.', answer: 'eat out', vi: 'Cô ấy thích ăn ngoài hơn là nấu ăn ở nhà.' },
  ], usage: 'Cụm động từ, trái nghĩa với cook at home.' },
  { word: 'cook at home', ipa: '/kʊk æt hoʊm/', vi: 'nấu ăn ở nhà', pos: 'chunk', youglish: 'https://youglish.com/pronounce/cook%20at%20home', examples: [
    { sentence: 'I prefer to ___ because it is healthier.', answer: 'cook at home', vi: 'Tôi thích nấu ăn ở nhà vì lành mạnh hơn.' },
    { sentence: 'They ___ every day to save money.', answer: 'cook at home', vi: 'Họ nấu ăn ở nhà mỗi ngày để tiết kiệm.' },
  ], usage: 'Cụm động từ, trái nghĩa với eat out.' },
  { word: 'after work', ipa: '/ˈæftər wɜːrk/', vi: 'sau giờ làm', pos: 'chunk', youglish: 'https://youglish.com/pronounce/after%20work', examples: [
    { sentence: 'I am usually tired ___.', answer: 'after work', vi: 'Tôi thường mệt sau giờ làm.' },
    { sentence: 'We often go for a walk ___.', answer: 'after work', vi: 'Chúng tôi thường đi dạo sau giờ làm.' },
  ], usage: 'Cụm giới từ, chỉ thời gian.' },
  { word: 'a little tired', ipa: '/ə ˈlɪtl ˈtaɪərd/', vi: 'hơi mệt', pos: 'chunk', youglish: 'https://youglish.com/pronounce/a%20little%20tired', examples: [
    { sentence: 'I am ___ but I can still finish the task.', answer: 'a little tired', vi: 'Tôi hơi mệt nhưng vẫn có thể hoàn thành nhiệm vụ.' },
    { sentence: 'She felt ___ after the long meeting.', answer: 'a little tired', vi: 'Cô ấy cảm thấy hơi mệt sau cuộc họp dài.' },
  ], usage: 'Cụm tính từ, dùng để diễn đạt mức độ.' },
  { word: 'free tonight', ipa: '/friː təˈnaɪt/', vi: 'rảnh tối nay', pos: 'chunk', youglish: 'https://youglish.com/pronounce/free%20tonight', examples: [
    { sentence: 'Are you ___? Let us get dinner.', answer: 'free tonight', vi: 'Bạn rảnh tối nay không? Đi ăn tối nhé.' },
    { sentence: 'I am ___ so we can watch a movie.', answer: 'free tonight', vi: 'Tôi rảnh tối nay nên chúng ta có thể xem phim.' },
  ], usage: 'Cụm tính từ, dùng để hỏi/ trả lời về thời gian rảnh.' },
  { word: 'What about you?', ipa: '/wʌt əˈbaʊt juː/', vi: 'Còn bạn thì sao?', pos: 'chunk', youglish: 'https://youglish.com/pronounce/what%20about%20you', examples: [
    { sentence: 'I like coffee. ___', answer: 'What about you?', vi: 'Tôi thích cà phê. Còn bạn thì sao?' },
    { sentence: 'I am busy today. ___', answer: 'What about you?', vi: 'Tôi bận hôm nay. Còn bạn thì sao?' },
  ], usage: 'Cụm hỏi lại, dùng để tiếp tục hội thoại.' },
  { word: 'come home late', ipa: '/kʌm hoʊm leɪt/', vi: 'về nhà muộn', pos: 'chunk', youglish: 'https://youglish.com/pronounce/come%20home%20late', examples: [
    { sentence: 'I often ___ when I work overtime.', answer: 'come home late', vi: 'Tôi thường về nhà muộn khi làm thêm giờ.' },
    { sentence: 'She ___ because of traffic.', answer: 'comes home late', vi: 'Cô ấy về nhà muộn vì tắc đường.' },
  ], usage: 'Cụm động từ, dùng để nói về giờ về nhà.' },
  { word: 'study hard', ipa: '/ˈstʌdi hɑːrd/', vi: 'học chăm', pos: 'chunk', youglish: 'https://youglish.com/pronounce/study%20hard', examples: [
    { sentence: 'I need to ___ for the exam.', answer: 'study hard', vi: 'Tôi cần học chăm cho kỳ thi.' },
    { sentence: 'He ___ every night before bed.', answer: 'studies hard', vi: 'Anh ấy học chăm mỗi tối trước khi ngủ.' },
  ], usage: 'Cụm động từ, dùng để nói về nỗ lực học tập.' },
  { word: 'play sports', ipa: '/pleɪ spɔːrts/', vi: 'chơi thể thao', pos: 'chunk', youglish: 'https://youglish.com/pronounce/play%20sports', examples: [
    { sentence: 'I like to ___ on weekends.', answer: 'play sports', vi: 'Tôi thích chơi thể thao vào cuối tuần.' },
    { sentence: 'She ___ every morning before work.', answer: 'plays sports', vi: 'Cô ấy chơi thể thao mỗi sáng trước khi đi làm.' },
  ], usage: 'Cụm động từ, dùng để nói về hoạt động thể thao.' },
  { word: 'go shopping', ipa: '/ɡoʊ ˈʃɑːpɪŋ/', vi: 'đi mua sắm', pos: 'chunk', youglish: 'https://youglish.com/pronounce/go%20shopping', examples: [
    { sentence: 'I usually ___ on Saturday.', answer: 'go shopping', vi: 'Tôi thường đi mua sắm vào thứ Bảy.' },
    { sentence: 'She ___ with her friends today.', answer: 'goes shopping', vi: 'Cô ấy đi mua sắm với bạn hôm nay.' },
  ], usage: 'Cụm động từ, dùng để nói về đi mua sắm.' },
]

export const L01_LEVEL1_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "I ___ near here."', options: ['work', 'works', 'working', 'worked'], answer: 'work', explanation: 'Chủ ngữ I dùng động từ nguyên mẫu (work).', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "She ___ in Da Nang."', options: ['live', 'lives', 'living', 'lived'], answer: 'lives', explanation: 'Chủ ngữ she (he/she/it) thêm -s vào động từ.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"I like coffee" nghĩa là "Tôi thích trà."', answer: 'false', explanation: 'coffee = cà phê, không phải trà (tea).', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Từ nào nghĩa là "mệt"?', options: ['busy', 'tired', 'free', 'ready'], answer: 'tired', explanation: 'tired = mệt, busy = bận, free = rảnh, ready = sẵn sàng.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ từ tiếng Anh cho "nấu ăn":', answer: 'cook', explanation: 'cook = nấu ăn.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: '"Are you free tonight?" dùng để hỏi gì?', options: ['Bạn có bận không?', 'Bạn rảnh tối nay không?', 'Bạn có mệt không?', 'Bạn có sẵn sàng không?'], answer: 'Bạn rảnh tối nay không?', explanation: 'free = rảnh, tonight = tối nay.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'work', right: 'làm việc' }, { left: 'live', right: 'sống' }, { left: 'like', right: 'thích' }, { left: 'cook', right: 'nấu ăn' }], answer: 'matched', explanation: 'work=làm việc, live=sống, like=thích, cook=nấu ăn.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng ngữ pháp:', options: ['Do you like coffee?', 'Does you like coffee?', 'Are you like coffee?', 'Is you like coffee?'], answer: 'Do you like coffee?', explanation: 'Chủ ngữ you dùng Do you + V1.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"Are you busy?" là câu hỏi Yes-No.', answer: 'true', explanation: 'Are you...? là câu hỏi Yes-No với be verb.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "sau giờ làm":', answer: 'after work', explanation: 'after work = sau giờ làm.', instruction: 'Gõ từ đúng.' },
]

export const L01_LEVEL2_EXERCISES = [
  { type: 'mc', question: 'Chọn cụm từ đúng: "I usually ___ to catch the bus."', options: ['wake up early', 'go to bed late', 'eat out', 'cook at home'], answer: 'wake up early', explanation: 'wake up early = thức dậy sớm, dùng khi bắt xe buýt sáng.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Cụm nào nghĩa là "ăn ngoài"?', options: ['cook at home', 'eat out', 'go to bed late', 'after work'], answer: 'eat out', explanation: 'eat out = ăn ngoài, cook at home = nấu ăn ở nhà.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"go to bed late" và "wake up early" là trái nghĩa.', answer: 'false', explanation: 'Chúng không phải trái nghĩa trực tiếp, nhưng thường đi cùng nhau (đi ngủ muộn → thức dậy muộn).', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Hoàn thành: "I am ___ but I can still work."', options: ['a little tired', 'free tonight', 'after work', 'wake up early'], answer: 'a little tired', explanation: 'a little tired = hơi mệt, phù hợp với "nhưng vẫn có thể làm việc".', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "Còn bạn thì sao?":', answer: 'What about you?', explanation: 'What about you? = Còn bạn thì sao?', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: '"free tonight" dùng để làm gì?', options: ['Hỏi về công việc', 'Hỏi về thời gian rảnh buổi tối', 'Hỏi về đồ ăn', 'Hỏi về nơi ở'], answer: 'Hỏi về thời gian rảnh buổi tối', explanation: 'free = rảnh, tonight = tối nay.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép cụm với nghĩa:', pairs: [{ left: 'eat out', right: 'ăn ngoài' }, { left: 'cook at home', right: 'nấu ăn ở nhà' }, { left: 'after work', right: 'sau giờ làm' }, { left: 'free tonight', right: 'rảnh tối nay' }], answer: 'matched', explanation: 'Ghép đúng các cụm từ.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['I usually go to bed late.', 'I usually goes to bed late.', 'I usually going to bed late.', 'I usually went to bed late.'], answer: 'I usually go to bed late.', explanation: 'Chủ ngữ I dùng động từ nguyên mẫu (go).', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"What about you?" dùng để hỏi lại người đối diện.', answer: 'true', explanation: 'What about you? = Còn bạn thì sao?, dùng để hỏi lại.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "hơi mệt":', answer: 'a little tired', explanation: 'a little tired = hơi mệt.', instruction: 'Gõ từ đúng.' },
]

export const L01_LEVEL1_DICTATION = [
  { audio: 'work', answer: 'work', vi: 'làm việc' },
  { audio: 'live', answer: 'live', vi: 'sống' },
  { audio: 'busy', answer: 'busy', vi: 'bận' },
  { audio: 'tired', answer: 'tired', vi: 'mệt' },
  { audio: 'free', answer: 'free', vi: 'rảnh' },
  { audio: 'ready', answer: 'ready', vi: 'sẵn sàng' },
  { audio: 'like', answer: 'like', vi: 'thích' },
  { audio: 'cook', answer: 'cook', vi: 'nấu ăn' },
  { audio: 'eat', answer: 'eat', vi: 'ăn' },
  { audio: 'drink', answer: 'drink', vi: 'uống' },
  { audio: 'sleep', answer: 'sleep', vi: 'ngủ' },
  { audio: 'study', answer: 'study', vi: 'học' },
]

export const L01_LEVEL2_DICTATION = [
  { audio: 'wake up early', answer: 'wake up early', vi: 'thức dậy sớm' },
  { audio: 'go to bed late', answer: 'go to bed late', vi: 'đi ngủ muộn' },
  { audio: 'eat out', answer: 'eat out', vi: 'ăn ngoài' },
  { audio: 'cook at home', answer: 'cook at home', vi: 'nấu ăn ở nhà' },
  { audio: 'after work', answer: 'after work', vi: 'sau giờ làm' },
  { audio: 'a little tired', answer: 'a little tired', vi: 'hơi mệt' },
  { audio: 'free tonight', answer: 'free tonight', vi: 'rảnh tối nay' },
  { audio: 'What about you?', answer: 'What about you?', vi: 'Còn bạn thì sao?' },
  { audio: 'come home late', answer: 'come home late', vi: 'về nhà muộn' },
  { audio: 'study hard', answer: 'study hard', vi: 'học chăm' },
  { audio: 'play sports', answer: 'play sports', vi: 'chơi thể thao' },
  { audio: 'go shopping', answer: 'go shopping', vi: 'đi mua sắm' },
]

export const L01_LEVEL1_PRONUNCIATION = [
  { word: 'work', ipa: '/wɜːrk/', vi: 'làm việc' },
  { word: 'live', ipa: '/lɪv/', vi: 'sống' },
  { word: 'like', ipa: '/laɪk/', vi: 'thích' },
  { word: 'cook', ipa: '/kʊk/', vi: 'nấu ăn' },
  { word: 'busy', ipa: '/ˈbɪzi/', vi: 'bận' },
  { word: 'tired', ipa: '/ˈtaɪərd/', vi: 'mệt' },
  { word: 'free', ipa: '/friː/', vi: 'rảnh' },
  { word: 'ready', ipa: '/ˈredi/', vi: 'sẵn sàng' },
  { word: 'eat', ipa: '/iːt/', vi: 'ăn' },
  { word: 'drink', ipa: '/drɪŋk/', vi: 'uống' },
  { word: 'sleep', ipa: '/sliːp/', vi: 'ngủ' },
  { word: 'study', ipa: '/ˈstʌdi/', vi: 'học' },
]

export const L01_LEVEL2_PRONUNCIATION = [
  { word: 'wake up early', ipa: '/weɪk ʌp ˈɜːrli/', vi: 'thức dậy sớm' },
  { word: 'go to bed late', ipa: '/ɡoʊ tə bed leɪt/', vi: 'đi ngủ muộn' },
  { word: 'eat out', ipa: '/iːt aʊt/', vi: 'ăn ngoài' },
  { word: 'cook at home', ipa: '/kʊk æt hoʊm/', vi: 'nấu ăn ở nhà' },
  { word: 'after work', ipa: '/ˈæftər wɜːrk/', vi: 'sau giờ làm' },
  { word: 'a little tired', ipa: '/ə ˈlɪtl ˈtaɪərd/', vi: 'hơi mệt' },
  { word: 'free tonight', ipa: '/friː təˈnaɪt/', vi: 'rảnh tối nay' },
  { word: 'What about you?', ipa: '/wʌt əˈbaʊt juː/', vi: 'Còn bạn thì sao?' },
  { word: 'come home late', ipa: '/kʌm hoʊm leɪt/', vi: 'về nhà muộn' },
  { word: 'study hard', ipa: '/ˈstʌdi hɑːrd/', vi: 'học chăm' },
  { word: 'play sports', ipa: '/pleɪ spɔːrts/', vi: 'chơi thể thao' },
  { word: 'go shopping', ipa: '/ɡoʊ ˈʃɑːpɪŋ/', vi: 'đi mua sắm' },
]

export const L01_META = {
  title: 'L01 · Build a Yes-No Question',
  subtitle: 'Do you…? Are you…?',
  description: 'Hỏi đúng khung. Trả lời về bạn. Hỏi tiếp một chi tiết.',
}
