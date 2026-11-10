import type { VocabItem, Exercise, DictationItem, PronunciationItem } from '../screens/LessonView'

export { type VocabItem, type Exercise, type DictationItem, type PronunciationItem }

export const L10_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'ever', ipa: '/ˈevər/', vi: 'đã từng, bao giờ', pos: 'adv', youglish: 'https://youglish.com/pronounce/ever', examples: [
    { sentence: 'Have you ___ lost your keys?', answer: 'ever', vi: 'Bạn đã từng làm mất chìa khóa chưa?' },
    { sentence: 'She has ___ been to Japan.', answer: 'ever', vi: 'Cô ấy đã từng đến Nhật Bản chưa?' },
  ], usage: 'ever = đã từng, bao giờ, dùng trong câu hỏi.' },
  { word: 'never', ipa: '/ˈnevər/', vi: 'chưa từng, không bao giờ', pos: 'adv', youglish: 'https://youglish.com/pronounce/never', examples: [
    { sentence: 'I\'ve ___ missed a flight.', answer: 'never', vi: 'Tôi chưa từng lỡ chuyến bay.' },
    { sentence: 'She has ___ been late.', answer: 'never', vi: 'Cô ấy không bao giờ đi muộn.' },
  ], usage: 'never = chưa từng, không bao giờ.' },
  { word: 'already', ipa: '/ɔːlˈredi/', vi: 'đã rồi', pos: 'adv', youglish: 'https://youglish.com/pronounce/already', examples: [
    { sentence: 'I\'ve ___ booked the room.', answer: 'already', vi: 'Tôi đã đặt phòng rồi.' },
    { sentence: 'She has ___ finished.', answer: 'already', vi: 'Cô ấy đã xong rồi.' },
  ], usage: 'already = đã rồi, dùng trong câu khẳng định.' },
  { word: 'yet', ipa: '/jet/', vi: 'chưa; cho đến lúc này', pos: 'adv', youglish: 'https://youglish.com/pronounce/yet', examples: [
    { sentence: 'Have you checked the address ___ ?', answer: 'yet', vi: 'Bạn đã kiểm tra địa chỉ chưa?' },
    { sentence: 'She hasn\'t called ___ .', answer: 'yet', vi: 'Cô ấy chưa gọi.' },
  ], usage: 'yet = chưa, dùng trong câu hỏi/phủ định (cuối câu).' },
  { word: 'just', ipa: '/dʒʌst/', vi: 'vừa mới', pos: 'adv', youglish: 'https://youglish.com/pronounce/just', examples: [
    { sentence: 'She\'s ___ sent the message.', answer: 'just', vi: 'Cô ấy vừa mới gửi tin nhắn.' },
    { sentence: 'I\'ve ___ finished my homework.', answer: 'just', vi: 'Tôi vừa mới xong bài tập.' },
  ], usage: 'just = vừa mới, dùng với present perfect.' },
  { word: 'recently', ipa: '/ˈriːsəntli/', vi: 'gần đây', pos: 'adv', youglish: 'https://youglish.com/pronounce/recently', examples: [
    { sentence: 'Have you bought anything useful ___ ?', answer: 'recently', vi: 'Bạn đã mua gì hữu ích gần đây không?' },
    { sentence: 'She has traveled ___ .', answer: 'recently', vi: 'Cô ấy đã đi du lịch gần đây.' },
  ], usage: 'recently = gần đây, dùng với present perfect.' },
  { word: 'lately', ipa: '/ˈleɪtli/', vi: 'dạo gần đây', pos: 'adv', youglish: 'https://youglish.com/pronounce/lately', examples: [
    { sentence: 'I haven\'t seen my neighbors ___ .', answer: 'lately', vi: 'Tôi không gặp hàng xóm dạo gần đây.' },
    { sentence: 'Have you been busy ___ ?', answer: 'lately', vi: 'Bạn có bận dạo gần đây không?' },
  ], usage: 'lately = dạo gần đây, thường dùng trong câu phủ định/hỏi.' },
  { word: 'so far', ipa: '/soʊ fɑːr/', vi: 'tính đến giờ', pos: 'phrase', youglish: 'https://youglish.com/pronounce/so%20far', examples: [
    { sentence: 'We\'ve visited two places ___ .', answer: 'so far', vi: 'Chúng tôi đã thăm hai nơi tính đến giờ.' },
    { sentence: 'So far, everything is fine.', answer: 'so far', vi: 'Tính đến giờ, mọi thứ đều ổn.' },
  ], usage: 'so far = tính đến giờ, dùng với present perfect.' },
  { word: 'up to now', ipa: '/ʌp tə naʊ/', vi: 'cho đến hiện tại', pos: 'phrase', youglish: 'https://youglish.com/pronounce/up%20to%20now', examples: [
    { sentence: '___ , I\'ve had no problems.', answer: 'Up to now', vi: 'Cho đến hiện tại, tôi chưa có vấn đề gì.' },
    { sentence: 'Up to now, we have finished 5 lessons.', answer: 'Up to now', vi: 'Cho đến hiện tại, chúng tôi đã xong 5 bài.' },
  ], usage: 'up to now = cho đến hiện tại.' },
  { word: 'since', ipa: '/sɪns/', vi: 'từ một mốc thời gian', pos: 'prep', youglish: 'https://youglish.com/pronounce/since', examples: [
    { sentence: 'I\'ve lived here ___ 2020.', answer: 'since', vi: 'Tôi sống ở đây từ 2020.' },
    { sentence: 'She has worked here ___ Monday.', answer: 'since', vi: 'Cô ấy làm việc ở đây từ thứ Hai.' },
  ], usage: 'since + mốc thời gian (năm, ngày, ...).' },
  { word: 'for', ipa: '/fər/', vi: 'trong một khoảng thời gian', pos: 'prep', youglish: 'https://youglish.com/pronounce/for', examples: [
    { sentence: 'I\'ve known her ___ five years.', answer: 'for', vi: 'Tôi biết cô ấy 5 năm rồi.' },
    { sentence: 'He has lived here ___ two years.', answer: 'for', vi: 'Anh ấy sống ở đây 2 năm rồi.' },
  ], usage: 'for + khoảng thời gian (5 years, 2 months, ...).' },
  { word: 'twice', ipa: '/twaɪs/', vi: 'hai lần', pos: 'adv', youglish: 'https://youglish.com/pronounce/twice', examples: [
    { sentence: 'I\'ve been there ___ .', answer: 'twice', vi: 'Tôi đã đi đó hai lần.' },
    { sentence: 'She has called ___ .', answer: 'twice', vi: 'Cô ấy đã gọi hai lần.' },
  ], usage: 'twice = hai lần.' },
]

export const L10_LEVEL2_VOCAB: VocabItem[] = [
  { word: 'several times', ipa: '/ˈsevrəl taɪmz/', vi: 'vài lần', pos: 'phrase', youglish: 'https://youglish.com/pronounce/several%20times', examples: [
    { sentence: 'We\'ve used this service ___ .', answer: 'several times', vi: 'Chúng tôi đã dùng dịch vụ này vài lần.' },
    { sentence: 'I\'ve been there ___ .', answer: 'several times', vi: 'Tôi đã đi đó vài lần.' },
  ], usage: 'several times = vài lần.' },
  { word: 'the last time', ipa: '/ðə læst taɪm/', vi: 'lần gần nhất', pos: 'phrase', youglish: 'https://youglish.com/pronounce/the%20last%20time', examples: [
    { sentence: 'When was ___ you went there?', answer: 'the last time', vi: 'Lần gần nhất bạn đi đó là khi nào?' },
    { sentence: 'The ___ I saw him was yesterday.', answer: 'last time', vi: 'Lần gần nhất tôi gặp anh ấy là hôm qua.' },
  ], usage: 'the last time = lần gần nhất.' },
  { word: 'try something new', ipa: '/traɪ ˌsʌmθɪŋ ˈnuː/', vi: 'thử điều mới', pos: 'phrase', youglish: 'https://youglish.com/pronounce/try%20something%20new', examples: [
    { sentence: 'Have you ___ lately?', answer: 'tried something new', vi: 'Bạn đã thử điều mới dạo gần đây không?' },
    { sentence: 'She likes to ___ every month.', answer: 'try something new', vi: 'Cô ấy thích thử điều mới mỗi tháng.' },
  ], usage: 'try something new = thử điều mới.' },
  { word: 'book online', ipa: '/bʊk ˌɑːnˈlaɪn/', vi: 'đặt qua mạng', pos: 'phrase', youglish: 'https://youglish.com/pronounce/book%20online', examples: [
    { sentence: 'I ___ last night.', answer: 'booked online', vi: 'Tôi đã đặt qua mạng tối qua.' },
    { sentence: 'She always ___ to get discounts.', answer: 'books online', vi: 'Cô ấy luôn đặt qua mạng để được giảm giá.' },
  ], usage: 'book online = đặt qua mạng.' },
  { word: 'change a booking', ipa: '/tʃeɪndʒ ə ˈbʊkɪŋ/', vi: 'đổi lịch đặt', pos: 'phrase', youglish: 'https://youglish.com/pronounce/change%20a%20booking', examples: [
    { sentence: 'I\'ve ___ once.', answer: 'changed a booking', vi: 'Tôi đã đổi lịch đặt một lần.' },
    { sentence: 'She ___ to a later date.', answer: 'changed a booking', vi: 'Cô ấy đã đổi lịch đặt sang ngày sau.' },
  ], usage: 'change a booking = đổi lịch đặt.' },
  { word: 'get a refund', ipa: '/ɡet ə ˈriːfʌnd/', vi: 'được hoàn tiền', pos: 'phrase', youglish: 'https://youglish.com/pronounce/get%20a%20refund', examples: [
    { sentence: 'Have you ___ yet?', answer: 'got a refund', vi: 'Bạn đã được hoàn tiền chưa?' },
    { sentence: 'She ___ after cancelling.', answer: 'got a refund', vi: 'Cô ấy đã được hoàn tiền sau khi hủy.' },
  ], usage: 'get a refund = được hoàn tiền.' },
  { word: 'lose my keys', ipa: '/luːz maɪ kiːz/', vi: 'làm mất chìa khóa', pos: 'phrase', youglish: 'https://youglish.com/pronounce/lose%20my%20keys', examples: [
    { sentence: 'I ___ yesterday.', answer: 'lost my keys', vi: 'Tôi đã làm mất chìa khóa hôm qua.' },
    { sentence: 'She ___ again last week.', answer: 'lost her keys', vi: 'Cô ấy lại làm mất chìa khóa tuần trước.' },
  ], usage: 'lose my keys = làm mất chìa khóa.' },
  { word: 'miss a flight', ipa: '/mɪs ə flaɪt/', vi: 'lỡ chuyến bay', pos: 'phrase', youglish: 'https://youglish.com/pronounce/miss%20a%20flight', examples: [
    { sentence: 'I\'ve never ___ .', answer: 'missed a flight', vi: 'Tôi chưa từng lỡ chuyến bay.' },
    { sentence: 'He ___ because of traffic.', answer: 'missed a flight', vi: 'Anh ấy lỡ chuyến bay vì kẹt xe.' },
  ], usage: 'miss a flight = lỡ chuyến bay.' },
  { word: 'keep in touch', ipa: '/kiːp ɪn tʌtʃ/', vi: 'giữ liên lạc', pos: 'phrase', youglish: 'https://youglish.com/pronounce/keep%20in%20touch', examples: [
    { sentence: 'We\'ve ___ since school.', answer: 'kept in touch', vi: 'Chúng tôi giữ liên lạc từ hồi đi học.' },
    { sentence: 'She always ___ with old friends.', answer: 'keeps in touch', vi: 'Cô ấy luôn giữ liên lạc với bạn cũ.' },
  ], usage: 'keep in touch = giữ liên lạc.' },
  { word: 'hear from someone', ipa: '/hɪr frəm ˈsʌmwʌn/', vi: 'nhận tin từ ai', pos: 'phrase', youglish: 'https://youglish.com/pronounce/hear%20from%20someone', examples: [
    { sentence: 'Have you ___ yet?', answer: 'heard from the hotel', vi: 'Bạn đã nhận tin từ khách sạn chưa?' },
    { sentence: 'I haven\'t ___ in weeks.', answer: 'heard from him', vi: 'Tôi không nhận tin từ anh ấy mấy tuần rồi.' },
  ], usage: 'hear from someone = nhận tin từ ai.' },
  { word: 'make a decision', ipa: '/meɪk ə dɪˈsɪʒən/', vi: 'đưa ra quyết định', pos: 'phrase', youglish: 'https://youglish.com/pronounce/make%20a%20decision', examples: [
    { sentence: 'We haven\'t ___ yet.', answer: 'made a decision', vi: 'Chúng tôi chưa đưa ra quyết định.' },
    { sentence: 'She ___ quickly.', answer: 'made a decision', vi: 'Cô ấy đưa ra quyết định nhanh.' },
  ], usage: 'make a decision = đưa ra quyết định.' },
  { word: 'solve a problem', ipa: '/sɑːlv ə ˈprɑːbləm/', vi: 'giải quyết vấn đề', pos: 'phrase', youglish: 'https://youglish.com/pronounce/solve%20a%20problem', examples: [
    { sentence: 'She ___ yesterday.', answer: 'solved a problem', vi: 'Cô ấy giải quyết vấn đề hôm qua.' },
    { sentence: 'He can ___ quickly.', answer: 'solve a problem', vi: 'Anh ấy có thể giải quyết vấn đề nhanh.' },
  ], usage: 'solve a problem = giải quyết vấn đề.' },
]

export const L10_LEVEL1_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "Have you ___ lost your keys?"', options: ['ever', 'never', 'already', 'yet'], answer: 'ever', explanation: 'ever = đã từng, dùng trong câu hỏi.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "I\'ve ___ missed a flight."', options: ['never', 'ever', 'just', 'already'], answer: 'never', explanation: 'never = chưa từng.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"already" dùng trong câu khẳng định, "yet" dùng trong câu hỏi/phủ định.', answer: 'true', explanation: 'already (khẳng định), yet (hỏi/phủ định).', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn từ đúng: "She\'s ___ sent the message."', options: ['just', 'already', 'yet', 'never'], answer: 'just', explanation: 'just = vừa mới.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ từ cho "tính đến giờ":', answer: 'so far', explanation: 'so far = tính đến giờ.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "I\'ve lived here ___ 2020."', options: ['since', 'for', 'from', 'during'], answer: 'since', explanation: 'since + mốc thời gian.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'ever', right: 'đã từng' }, { left: 'never', right: 'chưa từng' }, { left: 'already', right: 'đã rồi' }, { left: 'yet', right: 'chưa' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['I\'ve known her for five years.', 'I\'ve known her since five years.', 'I\'ve known her for 2020.', 'I\'ve known her since years.'], answer: 'I\'ve known her for five years.', explanation: 'for + khoảng thời gian.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"twice" nghĩa là "hai lần".', answer: 'true', explanation: 'twice = hai lần.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ từ cho "vừa mới":', answer: 'just', explanation: 'just = vừa mới.', instruction: 'Gõ từ đúng.' },
]

export const L10_LEVEL2_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "We\'ve used this service ___ ."', options: ['several times', 'twice', 'once', 'never'], answer: 'several times', explanation: 'several times = vài lần.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "Have you ___ yet?"', options: ['got a refund', 'changed a booking', 'made a decision', 'solved a problem'], answer: 'got a refund', explanation: 'get a refund = được hoàn tiền.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"keep in touch" nghĩa là "giữ liên lạc".', answer: 'true', explanation: 'keep in touch = giữ liên lạc.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn từ đúng: "I\'ve never ___ ."', options: ['missed a flight', 'missed a train', 'lost my keys', 'made a decision'], answer: 'missed a flight', explanation: 'miss a flight = lỡ chuyến bay.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "đặt qua mạng":', answer: 'book online', explanation: 'book online = đặt qua mạng.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "She ___ yesterday."', options: ['solved a problem', 'solves a problem', 'solve a problem', 'solving a problem'], answer: 'solved a problem', explanation: 'Quá khứ đơn: solved.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép cụm với nghĩa:', pairs: [{ left: 'keep in touch', right: 'giữ liên lạc' }, { left: 'hear from someone', right: 'nhận tin từ ai' }, { left: 'make a decision', right: 'đưa ra quyết định' }, { left: 'solve a problem', right: 'giải quyết vấn đề' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['We haven\'t made a decision yet.', 'We haven\'t made a decision already.', 'We haven\'t made a decision never.', 'We haven\'t made a decision ever.'], answer: 'We haven\'t made a decision yet.', explanation: 'yet dùng trong câu phủ định.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"lose my keys" và "miss a flight" đều là cụm động từ chỉ sự cố.', answer: 'true', explanation: 'Cả hai đều chỉ sự cố tiêu cực.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "đổi lịch đặt":', answer: 'change a booking', explanation: 'change a booking = đổi lịch đặt.', instruction: 'Gõ từ đúng.' },
]

export const L10_LEVEL1_DICTATION = [
  { audio: 'Have you ever lost your keys?', answer: 'Have you ever lost your keys?', vi: 'Bạn đã từng làm mất chìa khóa chưa?' },
  { audio: 'I\'ve never missed a flight.', answer: 'I\'ve never missed a flight.', vi: 'Tôi chưa từng lỡ chuyến bay.' },
  { audio: 'I\'ve already booked the room.', answer: 'I\'ve already booked the room.', vi: 'Tôi đã đặt phòng rồi.' },
  { audio: 'Have you checked the address yet?', answer: 'Have you checked the address yet?', vi: 'Bạn đã kiểm tra địa chỉ chưa?' },
  { audio: 'She\'s just sent the message.', answer: 'She\'s just sent the message.', vi: 'Cô ấy vừa mới gửi tin nhắn.' },
  { audio: 'Have you bought anything useful recently?', answer: 'Have you bought anything useful recently?', vi: 'Bạn đã mua gì hữu ích gần đây không?' },
  { audio: 'I haven\'t seen my neighbors lately.', answer: 'I haven\'t seen my neighbors lately.', vi: 'Tôi không gặp hàng xóm dạo gần đây.' },
  { audio: 'We\'ve visited two places so far.', answer: 'We\'ve visited two places so far.', vi: 'Chúng tôi đã thăm hai nơi tính đến giờ.' },
  { audio: 'Up to now, I\'ve had no problems.', answer: 'Up to now, I\'ve had no problems.', vi: 'Cho đến hiện tại, tôi chưa có vấn đề gì.' },
  { audio: 'I\'ve lived here since 2020.', answer: 'I\'ve lived here since 2020.', vi: 'Tôi sống ở đây từ 2020.' },
  { audio: 'I\'ve known her for five years.', answer: 'I\'ve known her for five years.', vi: 'Tôi biết cô ấy 5 năm rồi.' },
  { audio: 'I\'ve been there twice.', answer: 'I\'ve been there twice.', vi: 'Tôi đã đi đó hai lần.' },
]

export const L10_LEVEL2_DICTATION = [
  { audio: 'We\'ve used this service several times.', answer: 'We\'ve used this service several times.', vi: 'Chúng tôi đã dùng dịch vụ này vài lần.' },
  { audio: 'When was the last time you went there?', answer: 'When was the last time you went there?', vi: 'Lần gần nhất bạn đi đó là khi nào?' },
  { audio: 'Have you tried something new lately?', answer: 'Have you tried something new lately?', vi: 'Bạn đã thử điều mới dạo gần đây không?' },
  { audio: 'I booked online last night.', answer: 'I booked online last night.', vi: 'Tôi đã đặt qua mạng tối qua.' },
  { audio: 'I\'ve changed a booking once.', answer: 'I\'ve changed a booking once.', vi: 'Tôi đã đổi lịch đặt một lần.' },
  { audio: 'Have you got a refund yet?', answer: 'Have you got a refund yet?', vi: 'Bạn đã được hoàn tiền chưa?' },
  { audio: 'I lost my keys yesterday.', answer: 'I lost my keys yesterday.', vi: 'Tôi đã làm mất chìa khóa hôm qua.' },
  { audio: 'I\'ve never missed a flight.', answer: 'I\'ve never missed a flight.', vi: 'Tôi chưa từng lỡ chuyến bay.' },
  { audio: 'We\'ve kept in touch since school.', answer: 'We\'ve kept in touch since school.', vi: 'Chúng tôi giữ liên lạc từ hồi đi học.' },
  { audio: 'Have you heard from the hotel yet?', answer: 'Have you heard from the hotel yet?', vi: 'Bạn đã nhận tin từ khách sạn chưa?' },
  { audio: 'We haven\'t made a decision yet.', answer: 'We haven\'t made a decision yet.', vi: 'Chúng tôi chưa đưa ra quyết định.' },
  { audio: 'She solved the problem yesterday.', answer: 'She solved the problem yesterday.', vi: 'Cô ấy giải quyết vấn đề hôm qua.' },
]

export const L10_LEVEL1_PRONUNCIATION = [
  { word: 'ever', ipa: '/ˈevər/', vi: 'đã từng' },
  { word: 'never', ipa: '/ˈnevər/', vi: 'chưa từng' },
  { word: 'already', ipa: '/ɔːlˈredi/', vi: 'đã rồi' },
  { word: 'yet', ipa: '/jet/', vi: 'chưa' },
  { word: 'just', ipa: '/dʒʌst/', vi: 'vừa mới' },
  { word: 'recently', ipa: '/ˈriːsəntli/', vi: 'gần đây' },
  { word: 'lately', ipa: '/ˈleɪtli/', vi: 'dạo gần đây' },
  { word: 'so far', ipa: '/soʊ fɑːr/', vi: 'tính đến giờ' },
  { word: 'up to now', ipa: '/ʌp tə naʊ/', vi: 'cho đến hiện tại' },
  { word: 'since', ipa: '/sɪns/', vi: 'từ mốc thời gian' },
  { word: 'for', ipa: '/fər/', vi: 'trong khoảng thời gian' },
  { word: 'twice', ipa: '/twaɪs/', vi: 'hai lần' },
]

export const L10_LEVEL2_PRONUNCIATION = [
  { word: 'several times', ipa: '/ˈsevrəl taɪmz/', vi: 'vài lần' },
  { word: 'the last time', ipa: '/ðə læst taɪm/', vi: 'lần gần nhất' },
  { word: 'try something new', ipa: '/traɪ ˌsʌmθɪŋ ˈnuː/', vi: 'thử điều mới' },
  { word: 'book online', ipa: '/bʊk ˌɑːnˈlaɪn/', vi: 'đặt qua mạng' },
  { word: 'change a booking', ipa: '/tʃeɪndʒ ə ˈbʊkɪŋ/', vi: 'đổi lịch đặt' },
  { word: 'get a refund', ipa: '/ɡet ə ˈriːfʌnd/', vi: 'được hoàn tiền' },
  { word: 'lose my keys', ipa: '/luːz maɪ kiːz/', vi: 'làm mất chìa khóa' },
  { word: 'miss a flight', ipa: '/mɪs ə flaɪt/', vi: 'lỡ chuyến bay' },
  { word: 'keep in touch', ipa: '/kiːp ɪn tʌtʃ/', vi: 'giữ liên lạc' },
  { word: 'hear from someone', ipa: '/hɪr frəm ˈsʌmwʌn/', vi: 'nhận tin từ ai' },
  { word: 'make a decision', ipa: '/meɪk ə dɪˈsɪʒən/', vi: 'đưa ra quyết định' },
  { word: 'solve a problem', ipa: '/sɑːlv ə ˈprɑːbləm/', vi: 'giải quyết vấn đề' },
]

export const L10_META = {
  title: 'L10 · Past and Present Perfect Tense',
  subtitle: 'Quá khứ đơn và hiện tại hoàn thành',
  description: 'Kể trải nghiệm. Hỏi chi tiết. Kết nối quá khứ với hiện tại.',
}
