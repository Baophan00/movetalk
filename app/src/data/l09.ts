import type { VocabItem, Exercise, DictationItem, PronunciationItem } from '../screens/LessonView'

export { type VocabItem, type Exercise, type DictationItem, type PronunciationItem }

export const L09_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'Are you sure?', ipa: '/ər jə ʃʊr/', vi: 'Bạn chắc chứ?', pos: 'phrase', youglish: 'https://youglish.com/pronounce/are%20you%20sure', examples: [
    { sentence: '___ this is the right entrance?', answer: 'Are you sure', vi: 'Bạn chắc đây là lối vào đúng chứ?' },
    { sentence: '___ about this answer?', answer: 'Are you sure', vi: 'Bạn chắc về câu trả lời này chứ?' },
  ], usage: 'Câu hỏi xác nhận.' },
  { word: 'Are you serious?', ipa: '/ər jə ˈsɪriəs/', vi: 'Bạn nói thật à?', pos: 'phrase', youglish: 'https://youglish.com/pronounce/are%20you%20serious', examples: [
    { sentence: '___ The tickets are only $5?', answer: 'Are you serious', vi: 'Bạn nói thật à? Vé chỉ $5 thôi?' },
    { sentence: '___ about this plan?', answer: 'Are you serious', vi: 'Bạn nói thật về kế hoạch này à?' },
  ], usage: 'Câu hỏi biểu thị ngạc nhiên.' },
  { word: 'Does it work?', ipa: '/dʌz ɪt wɜːrk/', vi: 'Có hoạt động không?', pos: 'phrase', youglish: 'https://youglish.com/pronounce/does%20it%20work', examples: [
    { sentence: '___ with my phone?', answer: 'Does it work', vi: 'Có hoạt động với điện thoại tôi không?' },
    { sentence: '___ after the update?', answer: 'Does it work', vi: 'Có hoạt động sau khi cập nhật không?' },
  ], usage: 'Câu hỏi về chức năng.' },
  { word: 'Does it make sense?', ipa: '/dʌz ɪt meɪk sens/', vi: 'Có hợp lý không?', pos: 'phrase', youglish: 'https://youglish.com/pronounce/does%20it%20make%20sense', examples: [
    { sentence: '___ to book the tickets now?', answer: 'Does it make sense', vi: 'Có hợp lý để đặt vé bây giờ không?' },
    { sentence: '___ to you?', answer: 'Does it make sense', vi: 'Có hợp lý với bạn không?' },
  ], usage: 'Câu hỏi về tính hợp lý.' },
  { word: 'excited about', ipa: '/ɪkˈsaɪtɪd əˈbaʊt/', vi: 'háo hức về', pos: 'phrase', youglish: 'https://youglish.com/pronounce/excited%20about', examples: [
    { sentence: 'I\'m ___ the concert this weekend.', answer: 'excited about', vi: 'Tôi háo hức về buổi hòa nhạc cuối tuần này.' },
    { sentence: 'She\'s ___ her new job.', answer: 'excited about', vi: 'Cô ấy háo hức về công việc mới.' },
  ], usage: 'excited about + noun/V-ing.' },
  { word: 'interested in', ipa: '/ˈɪntrəstɪd ɪn/', vi: 'hứng thú với', pos: 'phrase', youglish: 'https://youglish.com/pronounce/interested%20in', examples: [
    { sentence: 'Are you ___ photography?', answer: 'interested in', vi: 'Bạn có hứng thú với nhiếp ảnh không?' },
    { sentence: 'He\'s ___ learning guitar.', answer: 'interested in', vi: 'Anh ấy hứng thú với học guitar.' },
  ], usage: 'interested in + noun/V-ing.' },
  { word: 'good at', ipa: '/ɡʊd æt/', vi: 'giỏi về', pos: 'phrase', youglish: 'https://youglish.com/pronounce/good%20at', examples: [
    { sentence: 'My cousin is ___ taking photos.', answer: 'good at', vi: 'Anh họ tôi giỏi chụp ảnh.' },
    { sentence: 'She\'s ___ cooking.', answer: 'good at', vi: 'Cô ấy giỏi nấu ăn.' },
  ], usage: 'good at + noun/V-ing.' },
  { word: 'afraid of', ipa: '/əˈfreɪd əv/', vi: 'sợ', pos: 'phrase', youglish: 'https://youglish.com/pronounce/afraid%20of', examples: [
    { sentence: 'I\'m ___ heights.', answer: 'afraid of', vi: 'Tôi sợ độ cao.' },
    { sentence: 'He\'s ___ spiders.', answer: 'afraid of', vi: 'Anh ấy sợ nhện.' },
  ], usage: 'afraid of + noun/V-ing.' },
  { word: 'ready for', ipa: '/ˈredi fər/', vi: 'sẵn sàng cho', pos: 'phrase', youglish: 'https://youglish.com/pronounce/ready%20for', examples: [
    { sentence: 'Are you ___ the trip?', answer: 'ready for', vi: 'Bạn đã sẵn sàng cho chuyến đi chưa?' },
    { sentence: 'She\'s ___ the exam.', answer: 'ready for', vi: 'Cô ấy đã sẵn sàng cho kỳ thi.' },
  ], usage: 'ready for + noun/V-ing.' },
  { word: 'happy with', ipa: '/ˈhæpi wɪð/', vi: 'hài lòng với', pos: 'phrase', youglish: 'https://youglish.com/pronounce/happy%20with', examples: [
    { sentence: 'Are you ___ your new headphones?', answer: 'happy with', vi: 'Bạn hài lòng với tai nghe mới chứ?' },
    { sentence: 'He\'s ___ his job.', answer: 'happy with', vi: 'Anh ấy hài lòng với công việc.' },
  ], usage: 'happy with + noun.' },
  { word: 'worried about', ipa: '/ˈwɜːrid əˈbaʊt/', vi: 'lo lắng về', pos: 'phrase', youglish: 'https://youglish.com/pronounce/worried%20about', examples: [
    { sentence: 'I\'m ___ the weather tomorrow.', answer: 'worried about', vi: 'Tôi lo lắng về thời tiết ngày mai.' },
    { sentence: 'She\'s ___ her exam.', answer: 'worried about', vi: 'Cô ấy lo lắng về kỳ thi.' },
  ], usage: 'worried about + noun/V-ing.' },
  { word: 'different from', ipa: '/ˈdɪfrənt frəm/', vi: 'khác với', pos: 'phrase', youglish: 'https://youglish.com/pronounce/different%20from', examples: [
    { sentence: 'This map is ___ the one online.', answer: 'different from', vi: 'Bản đồ này khác với bản đồ online.' },
    { sentence: 'He\'s ___ his brother.', answer: 'different from', vi: 'Anh ấy khác với anh trai.' },
  ], usage: 'different from + noun.' },
]

export const L09_LEVEL2_VOCAB: VocabItem[] = [
  { word: 'wait for', ipa: '/weɪt fər/', vi: 'đợi', pos: 'phrase', youglish: 'https://youglish.com/pronounce/wait%20for', examples: [
    { sentence: 'I\'m ___ my friend at the entrance.', answer: 'waiting for', vi: 'Tôi đang đợi bạn ở lối vào.' },
    { sentence: 'She\'s ___ the bus.', answer: 'waiting for', vi: 'Cô ấy đang đợi xe buýt.' },
  ], usage: 'wait for + noun/person.' },
  { word: 'look for', ipa: '/lʊk fər/', vi: 'tìm kiếm', pos: 'phrase', youglish: 'https://youglish.com/pronounce/look%20for', examples: [
    { sentence: 'Are you ___ a gift?', answer: 'looking for', vi: 'Bạn đang tìm kiếm quà chứ?' },
    { sentence: 'He\'s ___ his keys.', answer: 'looking for', vi: 'Anh ấy đang tìm chìa khóa.' },
  ], usage: 'look for + noun.' },
  { word: 'listen to', ipa: '/ˈlɪsən tə/', vi: 'nghe', pos: 'phrase', youglish: 'https://youglish.com/pronounce/listen%20to', examples: [
    { sentence: 'I usually ___ music on the bus.', answer: 'listen to', vi: 'Tôi thường nghe nhạc trên xe buýt.' },
    { sentence: 'She ___ podcasts every night.', answer: 'listens to', vi: 'Cô ấy nghe podcast mỗi tối.' },
  ], usage: 'listen to + noun.' },
  { word: 'talk to', ipa: '/tɔːk tə/', vi: 'nói với', pos: 'phrase', youglish: 'https://youglish.com/pronounce/talk%20to', examples: [
    { sentence: 'I ___ the receptionist yesterday.', answer: 'talked to', vi: 'Tôi đã nói với lễ tân hôm qua.' },
    { sentence: 'She ___ her teacher.', answer: 'talks to', vi: 'Cô ấy nói với giáo viên.' },
  ], usage: 'talk to + person.' },
  { word: 'talk about', ipa: '/tɔːk əˈbaʊt/', vi: 'nói về', pos: 'phrase', youglish: 'https://youglish.com/pronounce/talk%20about', examples: [
    { sentence: 'We\'re ___ our weekend plans.', answer: 'talking about', vi: 'Chúng tôi đang nói về kế hoạch cuối tuần.' },
    { sentence: 'He ___ his new project.', answer: 'talks about', vi: 'Anh ấy nói về dự án mới.' },
  ], usage: 'talk about + topic.' },
  { word: 'ask for', ipa: '/æsk fər/', vi: 'yêu cầu, xin', pos: 'phrase', youglish: 'https://youglish.com/pronounce/ask%20for', examples: [
    { sentence: 'I\'m going to ___ a receipt.', answer: 'ask for', vi: 'Tôi sẽ xin hóa đơn.' },
    { sentence: 'She ___ help.', answer: 'asks for', vi: 'Cô ấy xin giúp đỡ.' },
  ], usage: 'ask for + noun.' },
  { word: 'pay for', ipa: '/peɪ fər/', vi: 'trả tiền cho', pos: 'phrase', youglish: 'https://youglish.com/pronounce/pay%20for', examples: [
    { sentence: 'Do we need to ___ parking?', answer: 'pay for', vi: 'Chúng ta có cần trả tiền đậu xe không?' },
    { sentence: 'He ___ the dinner.', answer: 'paid for', vi: 'Anh ấy trả tiền bữa tối.' },
  ], usage: 'pay for + noun/service.' },
  { word: 'depend on', ipa: '/dɪˈpend ɑːn/', vi: 'phụ thuộc vào', pos: 'phrase', youglish: 'https://youglish.com/pronounce/depend%20on', examples: [
    { sentence: 'The price ___ the ticket type.', answer: 'depends on', vi: 'Giá phụ thuộc vào loại vé.' },
    { sentence: 'It ___ the weather.', answer: 'depends on', vi: 'Nó phụ thuộc vào thời tiết.' },
  ], usage: 'depend on + noun.' },
  { word: 'explain to', ipa: '/ɪkˈspleɪn tə/', vi: 'giải thích cho ai', pos: 'phrase', youglish: 'https://youglish.com/pronounce/explain%20to', examples: [
    { sentence: 'Can you ___ this map ___ me?', answer: 'explain ... to', vi: 'Bạn có thể giải thích bản đồ này cho tôi không?' },
    { sentence: 'She ___ the rules ___ the students.', answer: 'explained ... to', vi: 'Cô ấy giải thích quy tắc cho học sinh.' },
  ], usage: 'explain + object + to + person.' },
  { word: 'agree with', ipa: '/əˈɡriː wɪð/', vi: 'đồng ý với', pos: 'phrase', youglish: 'https://youglish.com/pronounce/agree%20with', examples: [
    { sentence: 'I ___ you about the meeting time.', answer: 'agree with', vi: 'Tôi đồng ý với bạn về giờ họp.' },
    { sentence: 'She ___ her boss.', answer: 'agrees with', vi: 'Cô ấy đồng ý với sếp.' },
  ], usage: 'agree with + person.' },
  { word: 'belong to', ipa: '/bɪˈlɔːŋ tə/', vi: 'thuộc về', pos: 'phrase', youglish: 'https://youglish.com/pronounce/belong%20to', examples: [
    { sentence: 'Do these bags ___ the volunteers?', answer: 'belong to', vi: 'Những túi này thuộc về tình nguyện viên chứ?' },
    { sentence: 'This book ___ me.', answer: 'belongs to', vi: 'Quyển sách này thuộc về tôi.' },
  ], usage: 'belong to + person/group.' },
  { word: 'think about', ipa: '/θɪŋk əˈbaʊt/', vi: 'cân nhắc', pos: 'phrase', youglish: 'https://youglish.com/pronounce/think%20about', examples: [
    { sentence: 'I\'m ___ a weekend trip.', answer: 'thinking about', vi: 'Tôi đang cân nhắc chuyến đi cuối tuần.' },
    { sentence: 'She ___ changing jobs.', answer: 'thinks about', vi: 'Cô ấy cân nhắc đổi việc.' },
  ], usage: 'think about + noun/V-ing.' },
]

export const L09_LEVEL1_EXERCISES = [
  { type: 'mc', question: 'Chọn cụm từ đúng: "Are you ___ this is the right entrance?"', options: ['sure', 'serious', 'ready', 'happy'], answer: 'sure', explanation: 'Are you sure? = Bạn chắc chứ?', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Chọn cụm từ đúng: "I\'m ___ the concert this weekend."', options: ['excited about', 'interested in', 'afraid of', 'worried about'], answer: 'excited about', explanation: 'excited about = háo hức về.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"interested in" dùng với danh từ hoặc V-ing.', answer: 'true', explanation: 'interested in + noun/V-ing.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn cụm từ đúng: "My cousin is ___ taking photos."', options: ['good at', 'afraid of', 'ready for', 'happy with'], answer: 'good at', explanation: 'good at = giỏi về.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "sợ":', answer: 'afraid of', explanation: 'afraid of = sợ.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn cụm từ đúng: "Are you ___ photography?"', options: ['interested in', 'excited about', 'worried about', 'different from'], answer: 'interested in', explanation: 'interested in = hứng thú với.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép cụm với nghĩa:', pairs: [{ left: 'excited about', right: 'háo hức về' }, { left: 'interested in', right: 'hứng thú với' }, { left: 'good at', right: 'giỏi về' }, { left: 'afraid of', right: 'sợ' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['Are you ready for the trip?', 'Are you ready for the trip.', 'Are you ready for the trip!', 'Are you ready for trip?'], answer: 'Are you ready for the trip?', explanation: 'Câu hỏi cần dấu hỏi.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"worried about" và "afraid of" đều là cụm từ chỉ cảm xúc tiêu cực.', answer: 'true', explanation: 'Cả hai đều là cảm xúc tiêu cực.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "khác với":', answer: 'different from', explanation: 'different from = khác với.', instruction: 'Gõ từ đúng.' },
]

export const L09_LEVEL2_EXERCISES = [
  { type: 'mc', question: 'Chọn cụm từ đúng: "I\'m ___ my friend at the entrance."', options: ['waiting for', 'looking for', 'listening to', 'talking to'], answer: 'waiting for', explanation: 'wait for = đợi.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Chọn cụm từ đúng: "The price ___ the ticket type."', options: ['depends on', 'agrees with', 'belongs to', 'thinks about'], answer: 'depends on', explanation: 'depend on = phụ thuộc vào.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"listen to" dùng với danh từ chỉ âm thanh.', answer: 'true', explanation: 'listen to + noun (music, podcast).', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn cụm từ đúng: "Can you ___ this map ___ me?"', options: ['explain ... to', 'talk ... to', 'ask ... for', 'pay ... for'], answer: 'explain ... to', explanation: 'explain + object + to + person.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "nói về":', answer: 'talk about', explanation: 'talk about = nói về.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn cụm từ đúng: "I\'m ___ a weekend trip."', options: ['thinking about', 'talking about', 'looking for', 'waiting for'], answer: 'thinking about', explanation: 'think about = cân nhắc.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép cụm với nghĩa:', pairs: [{ left: 'wait for', right: 'đợi' }, { left: 'look for', right: 'tìm kiếm' }, { left: 'listen to', right: 'nghe' }, { left: 'talk to', right: 'nói với' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['I agree with you.', 'I agree you.', 'I agree to you.', 'I agree for you.'], answer: 'I agree with you.', explanation: 'agree with + person.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"belong to" nghĩa là "thuộc về".', answer: 'true', explanation: 'belong to = thuộc về.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "trả tiền cho":', answer: 'pay for', explanation: 'pay for = trả tiền cho.', instruction: 'Gõ từ đúng.' },
]

export const L09_LEVEL1_DICTATION = [
  { audio: 'Are you sure?', answer: 'Are you sure?', vi: 'Bạn chắc chứ?' },
  { audio: 'Are you serious?', answer: 'Are you serious?', vi: 'Bạn nói thật à?' },
  { audio: 'Does it work?', answer: 'Does it work?', vi: 'Có hoạt động không?' },
  { audio: 'Does it make sense?', answer: 'Does it make sense?', vi: 'Có hợp lý không?' },
  { audio: 'excited about', answer: 'excited about', vi: 'háo hức về' },
  { audio: 'interested in', answer: 'interested in', vi: 'hứng thú với' },
  { audio: 'good at', answer: 'good at', vi: 'giỏi về' },
  { audio: 'afraid of', answer: 'afraid of', vi: 'sợ' },
  { audio: 'ready for', answer: 'ready for', vi: 'sẵn sàng cho' },
  { audio: 'happy with', answer: 'happy with', vi: 'hài lòng với' },
  { audio: 'worried about', answer: 'worried about', vi: 'lo lắng về' },
  { audio: 'different from', answer: 'different from', vi: 'khác với' },
]

export const L09_LEVEL2_DICTATION = [
  { audio: 'wait for', answer: 'wait for', vi: 'đợi' },
  { audio: 'look for', answer: 'look for', vi: 'tìm kiếm' },
  { audio: 'listen to', answer: 'listen to', vi: 'nghe' },
  { audio: 'talk to', answer: 'talk to', vi: 'nói với' },
  { audio: 'talk about', answer: 'talk about', vi: 'nói về' },
  { audio: 'ask for', answer: 'ask for', vi: 'yêu cầu, xin' },
  { audio: 'pay for', answer: 'pay for', vi: 'trả tiền cho' },
  { audio: 'depend on', answer: 'depend on', vi: 'phụ thuộc vào' },
  { audio: 'explain to', answer: 'explain to', vi: 'giải thích cho ai' },
  { audio: 'agree with', answer: 'agree with', vi: 'đồng ý với' },
  { audio: 'belong to', answer: 'belong to', vi: 'thuộc về' },
  { audio: 'think about', answer: 'think about', vi: 'cân nhắc' },
]

export const L09_LEVEL1_PRONUNCIATION = [
  { word: 'Are you sure?', ipa: '/ər jə ʃʊr/', vi: 'Bạn chắc chứ?' },
  { word: 'Are you serious?', ipa: '/ər jə ˈsɪriəs/', vi: 'Bạn nói thật à?' },
  { word: 'Does it work?', ipa: '/dʌz ɪt wɜːrk/', vi: 'Có hoạt động không?' },
  { word: 'Does it make sense?', ipa: '/dʌz ɪt meɪk sens/', vi: 'Có hợp lý không?' },
  { word: 'excited about', ipa: '/ɪkˈsaɪtɪd əˈbaʊt/', vi: 'háo hức về' },
  { word: 'interested in', ipa: '/ˈɪntrəstɪd ɪn/', vi: 'hứng thú với' },
  { word: 'good at', ipa: '/ɡʊd æt/', vi: 'giỏi về' },
  { word: 'afraid of', ipa: '/əˈfreɪd əv/', vi: 'sợ' },
  { word: 'ready for', ipa: '/ˈredi fər/', vi: 'sẵn sàng cho' },
  { word: 'happy with', ipa: '/ˈhæpi wɪð/', vi: 'hài lòng với' },
  { word: 'worried about', ipa: '/ˈwɜːrid əˈbaʊt/', vi: 'lo lắng về' },
  { word: 'different from', ipa: '/ˈdɪfrənt frəm/', vi: 'khác với' },
]

export const L09_LEVEL2_PRONUNCIATION = [
  { word: 'wait for', ipa: '/weɪt fər/', vi: 'đợi' },
  { word: 'look for', ipa: '/lʊk fər/', vi: 'tìm kiếm' },
  { word: 'listen to', ipa: '/ˈlɪsən tə/', vi: 'nghe' },
  { word: 'talk to', ipa: '/tɔːk tə/', vi: 'nói với' },
  { word: 'talk about', ipa: '/tɔːk əˈbaʊt/', vi: 'nói về' },
  { word: 'ask for', ipa: '/æsk fər/', vi: 'yêu cầu, xin' },
  { word: 'pay for', ipa: '/peɪ fər/', vi: 'trả tiền cho' },
  { word: 'depend on', ipa: '/dɪˈpend ɑːn/', vi: 'phụ thuộc vào' },
  { word: 'explain to', ipa: '/ɪkˈspleɪn tə/', vi: 'giải thích cho ai' },
  { word: 'agree with', ipa: '/əˈɡriː wɪð/', vi: 'đồng ý với' },
  { word: 'belong to', ipa: '/bɪˈlɔːŋ tə/', vi: 'thuộc về' },
  { word: 'think about', ipa: '/θɪŋk əˈbaʊt/', vi: 'cân nhắc' },
]

export const L09_META = {
  title: 'L09 · Basic Tenses',
  subtitle: 'Hiện tại đơn, quá khứ đơn, tương lai đơn',
  description: 'Nhiều tình huống đời sống. Nói rõ ý, thêm lý do và chi tiết.',
}
