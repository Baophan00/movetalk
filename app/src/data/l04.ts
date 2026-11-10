// L04 - Wh-Question
// Vocabulary data extracted from PPTX

import type { VocabItem, Exercise, DictationItem, PronunciationItem } from '../screens/LessonView'

export { type VocabItem, type Exercise, type DictationItem, type PronunciationItem }

export const L04_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'get to', ipa: '/ɡet tə/', vi: 'đến một nơi', pos: 'v.phr', youglish: 'https://youglish.com/pronounce/get%20to', examples: [
    { sentence: 'I ___ work by bus.', answer: 'get to', vi: 'Tôi đi làm bằng xe buýt.' },
    { sentence: 'She ___ the office early.', answer: 'gets to', vi: 'Cô ấy đến văn phòng sớm.' },
  ], usage: 'Cụm động từ, dùng để nói về cách đi đến một nơi.' },
  { word: 'take', ipa: '/teɪk/', vi: 'mất (thời gian)', pos: 'v', youglish: 'https://youglish.com/pronounce/take', examples: [
    { sentence: 'It ___ twenty minutes to get there.', answer: 'takes', vi: 'Đi đến đó mất hai mươi phút.' },
    { sentence: 'The trip ___ about an hour.', answer: 'takes', vi: 'Chuyến đi mất khoảng một giờ.' },
  ], usage: 'Động từ, thường dùng với thời gian (It takes + thời gian).' },
  { word: 'cost', ipa: '/kɔːst/', vi: 'có giá, tốn tiền', pos: 'v', youglish: 'https://youglish.com/pronounce/cost', examples: [
    { sentence: 'How much does it ___?', answer: 'cost', vi: 'Nó giá bao nhiêu?' },
    { sentence: 'The ticket ___ ten dollars.', answer: 'costs', vi: 'Vé giá mười đô la.' },
  ], usage: 'Động từ, dùng để hỏi/giá tiền.' },
  { word: 'spend', ipa: '/spend/', vi: 'dành thời gian, chi tiền', pos: 'v', youglish: 'https://youglish.com/pronounce/spend', examples: [
    { sentence: 'I ___ an hour studying English.', answer: 'spend', vi: 'Tôi dành một giờ học tiếng Anh.' },
    { sentence: 'She ___ a lot of money on books.', answer: 'spends', vi: 'Cô ấy chi nhiều tiền cho sách.' },
  ], usage: 'Động từ, spend time/money on + noun.' },
  { word: 'leave', ipa: '/liːv/', vi: 'rời đi', pos: 'v', youglish: 'https://youglish.com/pronounce/leave', examples: [
    { sentence: 'What time do you ___ home?', answer: 'leave', vi: 'Bạn rời nhà lúc mấy giờ?' },
    { sentence: 'He ___ the office at 5 PM.', answer: 'leaves', vi: 'Anh ấy rời văn phòng lúc 5 giờ chiều.' },
  ], usage: 'Động từ, dùng để nói về thời gian rời đi.' },
  { word: 'arrive', ipa: '/əˈraɪv/', vi: 'đến nơi', pos: 'v', youglish: 'https://youglish.com/pronounce/arrive', examples: [
    { sentence: 'When do you ___ at work?', answer: 'arrive', vi: 'Bạn đến nơi làm việc lúc nào?' },
    { sentence: 'We ___ at the station on time.', answer: 'arrive', vi: 'Chúng tôi đến nhà ga đúng giờ.' },
  ], usage: 'Động từ, arrive at/in + nơi.' },
  { word: 'start', ipa: '/stɑːrt/', vi: 'bắt đầu', pos: 'v', youglish: 'https://youglish.com/pronounce/start', examples: [
    { sentence: 'What time does your class ___?', answer: 'start', vi: 'Lớp bạn bắt đầu lúc mấy giờ?' },
    { sentence: 'The meeting ___ at nine.', answer: 'starts', vi: 'Cuộc họp bắt đầu lúc chín giờ.' },
  ], usage: 'Động từ, dùng để nói về thời gian bắt đầu.' },
  { word: 'finish', ipa: '/ˈfɪnɪʃ/', vi: 'kết thúc', pos: 'v', youglish: 'https://youglish.com/pronounce/finish', examples: [
    { sentence: 'When do you ___ work?', answer: 'finish', vi: 'Bạn tan làm lúc mấy giờ?' },
    { sentence: 'She ___ her homework at 8 PM.', answer: 'finishes', vi: 'Cô ấy hoàn thành bài tập lúc 8 giờ tối.' },
  ], usage: 'Động từ, trái nghĩa với start.' },
  { word: 'by bus', ipa: '/baɪ bʌs/', vi: 'bằng xe buýt', pos: 'prep.phr', youglish: 'https://youglish.com/pronounce/by%20bus', examples: [
    { sentence: 'I go to work ___.', answer: 'by bus', vi: 'Tôi đi làm bằng xe buýt.' },
    { sentence: 'She travels ___ every day.', answer: 'by bus', vi: 'Cô ấy đi lại bằng xe buýt mỗi ngày.' },
  ], usage: 'Cụm giới từ, chỉ phương tiện.' },
  { word: 'on foot', ipa: '/ɑːn fʊt/', vi: 'đi bộ', pos: 'prep.phr', youglish: 'https://youglish.com/pronounce/on%20foot', examples: [
    { sentence: 'I get there ___.', answer: 'on foot', vi: 'Tôi đến đó đi bộ.' },
    { sentence: 'He goes to the shop ___.', answer: 'on foot', vi: 'Anh ấy đi bộ đến cửa hàng.' },
  ], usage: 'Cụm giới từ, đi bộ.' },
  { word: 'nearby', ipa: '/ˌnɪrˈbaɪ/', vi: 'gần đây', pos: 'adv', youglish: 'https://youglish.com/pronounce/nearby', examples: [
    { sentence: 'Is there a café ___?', answer: 'nearby', vi: 'Có quán cà phê nào gần đây không?' },
    { sentence: 'There is a park ___.', answer: 'nearby', vi: 'Có một công viên gần đây.' },
  ], usage: 'Trạng từ/tính từ, dùng cho vị trí.' },
  { word: 'about', ipa: '/əˈbaʊt/', vi: 'khoảng', pos: 'adv', youglish: 'https://youglish.com/pronounce/about', examples: [
    { sentence: 'It takes ___ ten minutes.', answer: 'about', vi: 'Mất khoảng mười phút.' },
    { sentence: 'She is ___ twenty years old.', answer: 'about', vi: 'Cô ấy khoảng hai mươi tuổi.' },
  ], usage: 'Trạng từ, dùng để ước lượng.' },
]

export const L04_LEVEL2_VOCAB: VocabItem[] = [
  { word: 'once a week', ipa: '/wʌns ə wiːk/', vi: 'mỗi tuần một lần', pos: 'phrase', youglish: 'https://youglish.com/pronounce/once%20a%20week', examples: [
    { sentence: 'I eat out ___.', answer: 'once a week', vi: 'Tôi ăn ngoài mỗi tuần một lần.' },
    { sentence: 'We meet ___.', answer: 'once a week', vi: 'Chúng tôi gặp nhau mỗi tuần một lần.' },
  ], usage: 'Cụm từ chỉ tần suất.' },
  { word: 'twice a month', ipa: '/twaɪs ə mʌnθ/', vi: 'mỗi tháng hai lần', pos: 'phrase', youglish: 'https://youglish.com/pronounce/twice%20a%20month', examples: [
    { sentence: 'She visits her parents ___.', answer: 'twice a month', vi: 'Cô ấy thăm bố mẹ mỗi tháng hai lần.' },
    { sentence: 'We go shopping ___.', answer: 'twice a month', vi: 'Chúng tôi đi mua sắm mỗi tháng hai lần.' },
  ], usage: 'Cụm từ chỉ tần suất.' },
  { word: 'every day', ipa: '/ˈevri deɪ/', vi: 'mỗi ngày', pos: 'phrase', youglish: 'https://youglish.com/pronounce/every%20day', examples: [
    { sentence: 'I walk ___.', answer: 'every day', vi: 'Tôi đi bộ mỗi ngày.' },
    { sentence: 'He studies ___.', answer: 'every day', vi: 'Anh ấy học mỗi ngày.' },
  ], usage: 'Cụm từ chỉ tần suất.' },
  { word: 'on weekdays', ipa: '/ɑːn ˈwiːkdeɪz/', vi: 'vào các ngày trong tuần', pos: 'phrase', youglish: 'https://youglish.com/pronounce/on%20weekdays', examples: [
    { sentence: 'I work ___.', answer: 'on weekdays', vi: 'Tôi làm việc vào các ngày trong tuần.' },
    { sentence: 'She goes to the gym ___.', answer: 'on weekdays', vi: 'Cô ấy đi tập gym vào các ngày trong tuần.' },
  ], usage: 'Cụm từ chỉ thời gian.' },
  { word: 'kind of', ipa: '/kaɪnd əv/', vi: 'loại', pos: 'phrase', youglish: 'https://youglish.com/pronounce/kind%20of', examples: [
    { sentence: 'What ___ food do you like?', answer: 'kind of', vi: 'Bạn thích loại thức ăn nào?' },
    { sentence: 'What ___ music do you prefer?', answer: 'kind of', vi: 'Bạn thích loại nhạc nào?' },
  ], usage: 'Cụm từ, dùng trong What kind of + noun.' },
  { word: 'prefer', ipa: '/prɪˈfɜːr/', vi: 'thích hơn', pos: 'v', youglish: 'https://youglish.com/pronounce/prefer', examples: [
    { sentence: 'Which café do you ___?', answer: 'prefer', vi: 'Bạn thích quán cà phê nào hơn?' },
    { sentence: 'I ___ tea to coffee.', answer: 'prefer', vi: 'Tôi thích trà hơn cà phê.' },
  ], usage: 'Động từ, prefer A to B / prefer + V-ing.' },
  { word: 'choose', ipa: '/tʃuːz/', vi: 'chọn', pos: 'v', youglish: 'https://youglish.com/pronounce/choose', examples: [
    { sentence: 'Which one do you ___?', answer: 'choose', vi: 'Bạn chọn cái nào?' },
    { sentence: 'She ___ the blue shirt.', answer: 'chooses', vi: 'Cô ấy chọn áo sơ mi xanh.' },
  ], usage: 'Động từ, choose + noun.' },
  { word: 'favorite', ipa: '/ˈfeɪvərɪt/', vi: 'yêu thích nhất', pos: 'adj', youglish: 'https://youglish.com/pronounce/favorite', examples: [
    { sentence: "What's your ___ food?", answer: 'favorite', vi: 'Món ăn yêu thích của bạn là gì?' },
    { sentence: 'My ___ color is blue.', answer: 'favorite', vi: 'Màu yêu thích của tôi là xanh.' },
  ], usage: 'Tính từ, dùng trước danh từ.' },
  { word: 'book a table', ipa: '/bʊk ə ˈteɪbəl/', vi: 'đặt bàn', pos: 'v.phr', youglish: 'https://youglish.com/pronounce/book%20a%20table', examples: [
    { sentence: 'How do I ___?', answer: 'book a table', vi: 'Tôi đặt bàn như thế nào?' },
    { sentence: 'We need to ___ for tonight.', answer: 'book a table', vi: 'Chúng tôi cần đặt bàn cho tối nay.' },
  ], usage: 'Cụm động từ, dùng khi đi ăn nhà hàng.' },
  { word: 'pay by card', ipa: '/peɪ baɪ kɑːrd/', vi: 'thanh toán bằng thẻ', pos: 'v.phr', youglish: 'https://youglish.com/pronounce/pay%20by%20card', examples: [
    { sentence: 'Can you show me how to ___?', answer: 'pay by card', vi: 'Bạn có thể chỉ tôi cách thanh toán bằng thẻ không?' },
    { sentence: 'I prefer to ___.', answer: 'pay by card', vi: 'Tôi thích thanh toán bằng thẻ.' },
  ], usage: 'Cụm động từ, chỉ phương thức thanh toán.' },
  { word: 'a window seat', ipa: '/ə ˈwɪndoʊ siːt/', vi: 'chỗ ngồi cạnh cửa sổ', pos: 'n.phr', youglish: 'https://youglish.com/pronounce/a%20window%20seat', examples: [
    { sentence: "I'd like ___.", answer: 'a window seat', vi: 'Tôi muốn chỗ ngồi cạnh cửa sổ.' },
    { sentence: 'She asked for ___ on the plane.', answer: 'a window seat', vi: 'Cô ấy xin chỗ ngồi cạnh cửa sổ trên máy bay.' },
  ], usage: 'Cụm danh từ, dùng khi đặt chỗ.' },
  { word: 'per person', ipa: '/pɚ ˈpɜːrsən/', vi: 'mỗi người', pos: 'phrase', youglish: 'https://youglish.com/pronounce/per%20person', examples: [
    { sentence: 'It costs ten dollars ___.', answer: 'per person', vi: 'Mỗi người mười đô la.' },
    { sentence: 'The meal is five dollars ___.', answer: 'per person', vi: 'Bữa ăn năm đô la mỗi người.' },
  ], usage: 'Cụm từ, dùng để chia giá.' },
]

export const L04_LEVEL1_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "How do you ___ to work?"', options: ['get to', 'get', 'to get', 'got to'], answer: 'get to', explanation: 'get to = đi đến/di chuyển đến một nơi.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Cụm nào nghĩa là "mất bao lâu"?', options: ['take', 'cost', 'spend', 'leave'], answer: 'take', explanation: 'take = mất (thời gian).', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"cost" và "spend" đều liên quan đến tiền.', answer: 'true', explanation: 'cost = có giá; spend = chi tiền.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Hoàn thành: "It ___ twenty minutes."', options: ['takes', 'take', 'taking', 'took'], answer: 'takes', explanation: 'It (số ít) + takes.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ từ tiếng Anh cho "rời đi":', answer: 'leave', explanation: 'leave = rời đi.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "When do you ___ at work?"', options: ['arrive', 'arrives', 'arriving', 'arrived'], answer: 'arrive', explanation: 'Do you + V1.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'get to', right: 'đến một nơi' }, { left: 'take', right: 'mất bao lâu' }, { left: 'cost', right: 'có giá' }, { left: 'spend', right: 'dành thời gian/chi tiền' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Từ nào nghĩa là "gần đây"?', options: ['nearby', 'about', 'by bus', 'on foot'], answer: 'nearby', explanation: 'nearby = gần đây.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"by bus" và "on foot" đều chỉ phương tiện di chuyển.', answer: 'true', explanation: 'by bus = bằng xe buýt; on foot = đi bộ.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "khoảng":', answer: 'about', explanation: 'about = khoảng.', instruction: 'Gõ từ đúng.' },
]

export const L04_LEVEL2_EXERCISES = [
  { type: 'mc', question: 'Chọn cụm từ đúng: "I eat out ___."', options: ['once a week', 'twice a month', 'every day', 'on weekdays'], answer: 'once a week', explanation: 'once a week = mỗi tuần một lần.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Cụm nào nghĩa là "mỗi người"?', options: ['per person', 'a window seat', 'kind of', 'favorite'], answer: 'per person', explanation: 'per person = mỗi người.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"prefer" nghĩa là thích hơn.', answer: 'true', explanation: 'prefer = thích hơn.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Hoàn thành: "What ___ food do you like?"', options: ['kind of', 'favorite', 'choose', 'per person'], answer: 'kind of', explanation: 'kind of = loại.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "đặt bàn":', answer: 'book a table', explanation: 'book a table = đặt bàn.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['I prefer tea to coffee.', 'I prefers tea to coffee.', 'I preferring tea to coffee.', 'I preferred tea to coffee.'], answer: 'I prefer tea to coffee.', explanation: 'Chủ ngữ I dùng động từ nguyên mẫu (prefer).', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'prefer', right: 'thích hơn' }, { left: 'choose', right: 'chọn' }, { left: 'favorite', right: 'yêu thích nhất' }, { left: 'book a table', right: 'đặt bàn' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Từ nào nghĩa là "thanh toán bằng thẻ"?', options: ['pay by card', 'a window seat', 'per person', 'kind of'], answer: 'pay by card', explanation: 'pay by card = thanh toán bằng thẻ.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"favorite" là tính từ, đứng trước danh từ.', answer: 'true', explanation: 'favorite = yêu thích nhất, dùng trước danh từ.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "chỗ ngồi cạnh cửa sổ":', answer: 'a window seat', explanation: 'a window seat = chỗ ngồi cạnh cửa sổ.', instruction: 'Gõ từ đúng.' },
]

export const L04_LEVEL1_DICTATION = [
  { audio: 'get to', answer: 'get to', vi: 'đến một nơi' },
  { audio: 'take', answer: 'take', vi: 'mất (thời gian)' },
  { audio: 'cost', answer: 'cost', vi: 'có giá, tốn tiền' },
  { audio: 'spend', answer: 'spend', vi: 'dành thời gian, chi tiền' },
  { audio: 'leave', answer: 'leave', vi: 'rời đi' },
  { audio: 'arrive', answer: 'arrive', vi: 'đến nơi' },
  { audio: 'start', answer: 'start', vi: 'bắt đầu' },
  { audio: 'finish', answer: 'finish', vi: 'kết thúc' },
  { audio: 'by bus', answer: 'by bus', vi: 'bằng xe buýt' },
  { audio: 'on foot', answer: 'on foot', vi: 'đi bộ' },
  { audio: 'nearby', answer: 'nearby', vi: 'gần đây' },
  { audio: 'about', answer: 'about', vi: 'khoảng' },
]

export const L04_LEVEL2_DICTATION = [
  { audio: 'once a week', answer: 'once a week', vi: 'mỗi tuần một lần' },
  { audio: 'twice a month', answer: 'twice a month', vi: 'mỗi tháng hai lần' },
  { audio: 'every day', answer: 'every day', vi: 'mỗi ngày' },
  { audio: 'on weekdays', answer: 'on weekdays', vi: 'vào các ngày trong tuần' },
  { audio: 'kind of', answer: 'kind of', vi: 'loại' },
  { audio: 'prefer', answer: 'prefer', vi: 'thích hơn' },
  { audio: 'choose', answer: 'choose', vi: 'chọn' },
  { audio: 'favorite', answer: 'favorite', vi: 'yêu thích nhất' },
  { audio: 'book a table', answer: 'book a table', vi: 'đặt bàn' },
  { audio: 'pay by card', answer: 'pay by card', vi: 'thanh toán bằng thẻ' },
  { audio: 'a window seat', answer: 'a window seat', vi: 'chỗ ngồi cạnh cửa sổ' },
  { audio: 'per person', answer: 'per person', vi: 'mỗi người' },
]

export const L04_LEVEL1_PRONUNCIATION = [
  { word: 'get to', ipa: '/ɡet tə/', vi: 'đến một nơi' },
  { word: 'take', ipa: '/teɪk/', vi: 'mất (thời gian)' },
  { word: 'cost', ipa: '/kɔːst/', vi: 'có giá, tốn tiền' },
  { word: 'spend', ipa: '/spend/', vi: 'dành thời gian, chi tiền' },
  { word: 'leave', ipa: '/liːv/', vi: 'rời đi' },
  { word: 'arrive', ipa: '/əˈraɪv/', vi: 'đến nơi' },
  { word: 'start', ipa: '/stɑːrt/', vi: 'bắt đầu' },
  { word: 'finish', ipa: '/ˈfɪnɪʃ/', vi: 'kết thúc' },
  { word: 'by bus', ipa: '/baɪ bʌs/', vi: 'bằng xe buýt' },
  { word: 'on foot', ipa: '/ɑːn fʊt/', vi: 'đi bộ' },
  { word: 'nearby', ipa: '/ˌnɪrˈbaɪ/', vi: 'gần đây' },
  { word: 'about', ipa: '/əˈbaʊt/', vi: 'khoảng' },
]

export const L04_LEVEL2_PRONUNCIATION = [
  { word: 'once a week', ipa: '/wʌns ə wiːk/', vi: 'mỗi tuần một lần' },
  { word: 'twice a month', ipa: '/twaɪs ə mʌnθ/', vi: 'mỗi tháng hai lần' },
  { word: 'every day', ipa: '/ˈevri deɪ/', vi: 'mỗi ngày' },
  { word: 'on weekdays', ipa: '/ɑːn ˈwiːkdeɪz/', vi: 'vào các ngày trong tuần' },
  { word: 'kind of', ipa: '/kaɪnd əv/', vi: 'loại' },
  { word: 'prefer', ipa: '/prɪˈfɜːr/', vi: 'thích hơn' },
  { word: 'choose', ipa: '/tʃuːz/', vi: 'chọn' },
  { word: 'favorite', ipa: '/ˈfeɪvərɪt/', vi: 'yêu thích nhất' },
  { word: 'book a table', ipa: '/bʊk ə ˈteɪbəl/', vi: 'đặt bàn' },
  { word: 'pay by card', ipa: '/peɪ baɪ kɑːrd/', vi: 'thanh toán bằng thẻ' },
  { word: 'a window seat', ipa: '/ə ˈwɪndoʊ siːt/', vi: 'chỗ ngồi cạnh cửa sổ' },
  { word: 'per person', ipa: '/pɚ ˈpɜːrsən/', vi: 'mỗi người' },
]

export const L04_META = {
  title: 'L04 · Wh-Question',
  subtitle: 'Who/What/Where/When/Why/How…?',
  description: 'Hỏi đúng thông tin. Nghe và trả lời đúng ý.',
}
