// L07 - Review L01-L06
// Vocabulary data extracted from PPTX

import type { VocabItem, Exercise, DictationItem, PronunciationItem } from '../screens/LessonView'

export { type VocabItem, type Exercise, type DictationItem, type PronunciationItem }

export const L07_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'get to work', ipa: '/ɡet tə wɝːk/', vi: 'đến nơi làm việc', pos: 'v', youglish: 'https://youglish.com/pronounce/get%20to%20work', examples: [
    { sentence: 'How do you ___?', answer: 'get to work', vi: 'Bạn đi làm bằng gì?' },
    { sentence: 'She ___ by bus every day.', answer: 'gets to work', vi: 'Cô ấy đi làm bằng xe buýt mỗi ngày.' },
  ], usage: 'Cụm động từ, dùng để nói về phương tiện đi làm.' },
  { word: 'spend time with', ipa: '/spend taɪm wɪð/', vi: 'dành thời gian với', pos: 'v', youglish: 'https://youglish.com/pronounce/spend%20time%20with', examples: [
    { sentence: 'I like to ___ my family.', answer: 'spend time with', vi: 'Tôi thích dành thời gian với gia đình.' },
    { sentence: 'She ___ her children every weekend.', answer: 'spends time with', vi: 'Cô ấy dành thời gian với con mỗi cuối tuần.' },
  ], usage: 'Cụm động từ, dùng để nói về dành thời gian cho ai.' },
  { word: 'wash the dishes', ipa: '/wɑːʃ ðə ˈdɪʃɪz/', vi: 'rửa chén', pos: 'v', youglish: 'https://youglish.com/pronounce/wash%20the%20dishes', examples: [
    { sentence: 'He ___ after dinner.', answer: 'washes the dishes', vi: 'Anh ấy rửa chén sau bữa tối.' },
    { sentence: 'I ___ every night.', answer: 'wash the dishes', vi: 'Tôi rửa chén mỗi tối.' },
  ], usage: 'Cụm động từ, dùng để nói về việc nhà.' },
  { word: 'once a week', ipa: '/wʌns ə wiːk/', vi: 'mỗi tuần một lần', pos: 'phrase', youglish: 'https://youglish.com/pronounce/once%20a%20week', examples: [
    { sentence: 'We eat out ___.', answer: 'once a week', vi: 'Chúng tôi ăn ngoài mỗi tuần một lần.' },
    { sentence: 'I go shopping ___.', answer: 'once a week', vi: 'Tôi đi mua sắm mỗi tuần một lần.' },
  ], usage: 'Cụm tần suất, dùng để nói về mức độ thường xuyên.' },
  { word: 'another place', ipa: '/əˈnʌðɚ pleɪs/', vi: 'một địa điểm khác', pos: 'n', youglish: 'https://youglish.com/pronounce/another%20place', examples: [
    { sentence: 'Do you know ___?', answer: 'another place', vi: 'Bạn có biết một nơi khác không?' },
    { sentence: 'Let us try ___.', answer: 'another place', vi: 'Hãy thử một nơi khác.' },
  ], usage: 'Cụm danh từ, dùng để đề xuất lựa chọn khác.' },
  { word: 'our current plan', ipa: '/aʊɚ ˈkɜːrənt plæn/', vi: 'kế hoạch hiện tại của nhóm', pos: 'n', youglish: 'https://youglish.com/pronounce/our%20current%20plan', examples: [
    { sentence: 'Is this ___?', answer: 'our current plan', vi: 'Đây có phải kế hoạch hiện tại không?' },
    { sentence: '___ is to meet at seven.', answer: 'Our current plan', vi: 'Kế hoạch hiện tại là gặp lúc bảy giờ.' },
  ], usage: 'Cụm danh từ, dùng để xác nhận kế hoạch.' },
  { word: 'local food', ipa: '/ˈloʊkəl fuːd/', vi: 'đồ ăn địa phương', pos: 'n', youglish: 'https://youglish.com/pronounce/local%20food', examples: [
    { sentence: 'Does it serve ___?', answer: 'local food', vi: 'Nó có phục vụ đồ ăn địa phương không?' },
    { sentence: 'We like ___.', answer: 'local food', vi: 'Chúng tôi thích đồ ăn địa phương.' },
  ], usage: 'Cụm danh từ, dùng để nói về ẩm thực địa phương.' },
  { word: 'across the street', ipa: '/əˈkrɔːs ðə striːt/', vi: 'bên kia đường', pos: 'prep', youglish: 'https://youglish.com/pronounce/across%20the%20street', examples: [
    { sentence: 'The entrance is ___.', answer: 'across the street', vi: 'Lối vào ở bên kia đường.' },
    { sentence: 'The café is ___ from the park.', answer: 'across the street', vi: 'Quán cà phê ở bên kia đường so với công viên.' },
  ], usage: 'Cụm giới từ, dùng để chỉ vị trí.' },
]

export const L07_LEVEL2_VOCAB: VocabItem[] = [
  { word: 'appointment', ipa: '/əˈpɔɪntmənt/', vi: 'cuộc hẹn', pos: 'n', youglish: 'https://youglish.com/pronounce/appointment', examples: [
    { sentence: 'What time is your ___?', answer: 'appointment', vi: 'Cuộc hẹn của bạn lúc mấy giờ?' },
    { sentence: 'I have an ___ at three.', answer: 'appointment', vi: 'Tôi có cuộc hẹn lúc ba giờ.' },
  ], usage: 'Danh từ đếm được, dùng để nói về cuộc hẹn.' },
  { word: 'available', ipa: '/əˈveɪləbəl/', vi: 'còn trống, có thể dùng', pos: 'adj', youglish: 'https://youglish.com/pronounce/available', examples: [
    { sentence: 'Is this table ___?', answer: 'available', vi: 'Bàn này còn trống không?' },
    { sentence: 'Are you ___ tomorrow?', answer: 'available', vi: 'Bạn rảnh ngày mai không?' },
  ], usage: 'Tính từ, dùng để hỏi về sự còn trống.' },
  { word: 'crowded', ipa: '/ˈkraʊdɪd/', vi: 'đông người', pos: 'adj', youglish: 'https://youglish.com/pronounce/crowded', examples: [
    { sentence: 'Is the café ___?', answer: 'crowded', vi: 'Quán cà phê có đông không?' },
    { sentence: 'The market is ___ on weekends.', answer: 'crowded', vi: 'Chợ đông vào cuối tuần.' },
  ], usage: 'Tính từ, dùng để mô tả nơi đông người.' },
  { word: 'recommend', ipa: '/ˌrekəˈmend/', vi: 'gợi ý, đề xuất', pos: 'v', youglish: 'https://youglish.com/pronounce/recommend', examples: [
    { sentence: 'Which café do you ___?', answer: 'recommend', vi: 'Bạn gợi ý quán cà phê nào?' },
    { sentence: 'I ___ this restaurant.', answer: 'recommend', vi: 'Tôi đề xuất nhà hàng này.' },
  ], usage: 'Động từ, dùng để đưa ra gợi ý.' },
  { word: 'reserve a table', ipa: '/rɪˈzɜːrv ə ˈteɪbəl/', vi: 'đặt trước một bàn', pos: 'v', youglish: 'https://youglish.com/pronounce/reserve%20a%20table', examples: [
    { sentence: 'Can I ___?', answer: 'reserve a table', vi: 'Tôi có thể đặt bàn trước không?' },
    { sentence: 'We need to ___ for four.', answer: 'reserve a table', vi: 'Chúng tôi cần đặt bàn cho bốn người.' },
  ], usage: 'Cụm động từ, dùng để đặt bàn trước.' },
  { word: 'entrance', ipa: '/ˈentrəns/', vi: 'lối vào', pos: 'n', youglish: 'https://youglish.com/pronounce/entrance', examples: [
    { sentence: 'Where is the ___?', answer: 'entrance', vi: 'Lối vào ở đâu?' },
    { sentence: 'The ___ is across the street.', answer: 'entrance', vi: 'Lối vào ở bên kia đường.' },
  ], usage: 'Danh từ đếm được, dùng để chỉ lối vào.' },
  { word: 'a quiet corner', ipa: '/ə ˈkwaɪət ˈkɔːrnɚ/', vi: 'một góc yên tĩnh', pos: 'n', youglish: 'https://youglish.com/pronounce/a%20quiet%20corner', examples: [
    { sentence: 'We need ___.', answer: 'a quiet corner', vi: 'Chúng tôi cần một góc yên tĩnh.' },
    { sentence: 'Is there ___?', answer: 'a quiet corner', vi: 'Có góc yên tĩnh nào không?' },
  ], usage: 'Cụm danh từ, dùng để yêu cầu không gian yên tĩnh.' },
  { word: 'pick up a friend', ipa: '/pɪk ʌp ə frend/', vi: 'đón một người bạn', pos: 'v', youglish: 'https://youglish.com/pronounce/pick%20up%20a%20friend', examples: [
    { sentence: 'I ___ after work.', answer: 'pick up a friend', vi: 'Tôi đón bạn sau giờ làm.' },
    { sentence: 'She ___ at the station.', answer: 'picks up a friend', vi: 'Cô ấy đón bạn ở nhà ga.' },
  ], usage: 'Cụm động từ, dùng để nói về đón người.' },
  { word: "How's it going?", ipa: '/haʊz ɪt ˈɡoʊɪŋ/', vi: 'Dạo này thế nào?', pos: 'chunk', youglish: "https://youglish.com/pronounce/how's%20it%20going", examples: [
    { sentence: 'Hey, ___? — Pretty good.', answer: "How's it going?", vi: 'Chào, dạo này thế nào? — Khá ổn.' },
    { sentence: '___? I have not seen you for a while.', answer: "How's it going?", vi: 'Dạo này thế nào? Lâu rồi không gặp.' },
  ], usage: 'Câu chào hỏi thân mật.' },
  { word: 'Pretty good.', ipa: '/ˈprɪti ɡʊd/', vi: 'Khá ổn.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/pretty%20good', examples: [
    { sentence: 'How are you? — ___.', answer: 'Pretty good.', vi: 'Bạn thế nào? — Khá ổn.' },
    { sentence: 'I am ___ today.', answer: 'pretty good', vi: 'Hôm nay tôi khá ổn.' },
  ], usage: 'Trả lời về tình trạng.' },
  { word: 'Not really.', ipa: '/nɑːt ˈrɪəli/', vi: 'Không hẳn.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/not%20really', examples: [
    { sentence: 'Are you busy? — ___.', answer: 'Not really.', vi: 'Bạn bận không? — Không hẳn.' },
    { sentence: 'Do you like it? — ___.', answer: 'Not really.', vi: 'Bạn thích nó không? — Không hẳn.' },
  ], usage: 'Trả lời phủ định nhẹ.' },
  { word: 'That sounds good.', ipa: '/ðæt saʊndz ɡʊd/', vi: 'Nghe hay đấy.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/that%20sounds%20good', examples: [
    { sentence: 'Coffee at three? — ___.', answer: 'That sounds good.', vi: 'Cà phê lúc ba giờ? — Nghe hay đấy.' },
    { sentence: '___ to me.', answer: 'That sounds good', vi: 'Nghe ổn với tôi.' },
  ], usage: 'Đồng ý với đề xuất.' },
  { word: 'Are you serious?', ipa: '/ɑr ju ˈsɪriəs/', vi: 'Thật hả?', pos: 'chunk', youglish: 'https://youglish.com/pronounce/are%20you%20serious', examples: [
    { sentence: 'The tickets are free. — ___?', answer: 'Are you serious', vi: 'Vé miễn phí. — Thật hả?' },
    { sentence: '___? She really quit?', answer: 'Are you serious', vi: 'Thật hả? Cô ấy thực sự nghỉ việc?' },
  ], usage: 'Biểu lộ ngạc nhiên.' },
  { word: 'No worries.', ipa: '/noʊ ˈwɜːriz/', vi: 'Không sao đâu.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/no%20worries', examples: [
    { sentence: 'Sorry I am late. — ___.', answer: 'No worries.', vi: 'Xin lỗi tôi đi muộn. — Không sao đâu.' },
    { sentence: '___, take your time.', answer: 'No worries', vi: 'Không sao đâu, bạn cứ thong thả.' },
  ], usage: 'Trấn an, không trách móc.' },
  { word: 'Do you need a hand?', ipa: '/də ju niːd ə hænd/', vi: 'Bạn cần giúp không?', pos: 'chunk', youglish: 'https://youglish.com/pronounce/do%20you%20need%20a%20hand', examples: [
    { sentence: '___ with the report?', answer: 'Do you need a hand', vi: 'Bạn cần giúp với báo cáo không?' },
    { sentence: '___? I can help.', answer: 'Do you need a hand', vi: 'Bạn cần giúp không? Tôi có thể giúp.' },
  ], usage: 'Đề nghị giúp đỡ.' },
  { word: 'Sounds like a plan.', ipa: '/saʊndz laɪk ə plæn/', vi: 'Vậy chốt thế nhé.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/sounds%20like%20a%20plan', examples: [
    { sentence: 'Let us meet at six. — ___.', answer: 'Sounds like a plan.', vi: 'Gặp lúc sáu giờ nhé. — Vậy chốt thế nhé.' },
    { sentence: '___ then.', answer: 'Sounds like a plan', vi: 'Vậy chốt thế nhé.' },
  ], usage: 'Chốt kế hoạch.' },
  { word: 'What are you up to?', ipa: '/wʌt ɑr ju ʌp tə/', vi: 'Bạn đang làm gì đấy?', pos: 'chunk', youglish: 'https://youglish.com/pronounce/what%20are%20you%20up%20to', examples: [
    { sentence: '___? — Just cooking.', answer: 'What are you up to?', vi: 'Bạn đang làm gì đấy? — Đang nấu ăn.' },
    { sentence: 'Hey, ___?', answer: 'What are you up to?', vi: 'Này, bạn đang làm gì đấy?' },
  ], usage: 'Hỏi về hoạt động hiện tại.' },
  { word: "I'm on my way.", ipa: '/aɪm ɑːn maɪ weɪ/', vi: 'Tôi đang trên đường đến.', pos: 'chunk', youglish: "https://youglish.com/pronounce/i'm%20on%20my%20way", examples: [
    { sentence: '___ to your place.', answer: "I'm on my way", vi: 'Tôi đang trên đường đến chỗ bạn.' },
    { sentence: '___ now.', answer: "I'm on my way", vi: 'Tôi đang trên đường rồi.' },
  ], usage: 'Thông báo đang đi.' },
  { word: 'Give me a minute.', ipa: '/ɡɪv mi ə ˈmɪnɪt/', vi: 'Chờ tôi một chút.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/give%20me%20a%20minute', examples: [
    { sentence: '___, I am almost ready.', answer: 'Give me a minute.', vi: 'Chờ tôi một chút, tôi sắp sẵn sàng.' },
    { sentence: '___ to finish.', answer: 'Give me a minute', vi: 'Chờ tôi một chút để hoàn thành.' },
  ], usage: 'Xin thời gian.' },
  { word: "I'll let you know.", ipa: '/aɪl let ju noʊ/', vi: 'Tôi sẽ báo bạn.', pos: 'chunk', youglish: "https://youglish.com/pronounce/i'll%20let%20you%20know", examples: [
    { sentence: '___ if I need help.', answer: "I'll let you know", vi: 'Tôi sẽ báo bạn nếu cần giúp.' },
    { sentence: '___ later.', answer: "I'll let you know", vi: 'Tôi sẽ báo bạn sau.' },
  ], usage: 'Cam kết thông báo.' },
  { word: 'Fair enough.', ipa: '/fer ɪˈnʌf/', vi: 'Ừ, cũng hợp lý.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/fair%20enough', examples: [
    { sentence: 'I am too tired to go out. — ___.', answer: 'Fair enough.', vi: 'Tôi mệt quá không đi chơi được. — Ừ, cũng hợp lý.' },
    { sentence: '___, let us stay.', answer: 'Fair enough', vi: 'Ừ, cũng hợp lý, chúng ta ở lại.' },
  ], usage: 'Đồng ý với lý do.' },
  { word: 'Thanks anyway.', ipa: '/θæŋks ˈeniweɪ/', vi: 'Dù sao cũng cảm ơn bạn.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/thanks%20anyway', examples: [
    { sentence: 'No tables left? ___.', answer: 'Thanks anyway.', vi: 'Hết bàn rồi? Dù sao cũng cảm ơn.' },
    { sentence: '___ for your help.', answer: 'Thanks anyway', vi: 'Dù sao cũng cảm ơn sự giúp đỡ.' },
  ], usage: 'Cảm ơn dù từ chối.' },
  { word: "I'm just looking.", ipa: '/aɪm dʒʌst ˈlʊkɪŋ/', vi: 'Tôi chỉ xem thôi.', pos: 'chunk', youglish: "https://youglish.com/pronounce/i'm%20just%20looking", examples: [
    { sentence: 'Can I help you? — ___.', answer: "I'm just looking.", vi: 'Tôi giúp được gì không? — Tôi chỉ xem thôi.' },
    { sentence: '___ around.', answer: "I'm just looking", vi: 'Tôi chỉ xem thôi.' },
  ], usage: 'Từ chối hỗ trợ mua sắm.' },
  { word: 'See you in a bit.', ipa: '/siː ju ɪn ə bɪt/', vi: 'Lát nữa gặp nhé.', pos: 'chunk', youglish: 'https://youglish.com/pronounce/see%20you%20in%20a%20bit', examples: [
    { sentence: "I'm on my way. ___.", answer: 'See you in a bit.', vi: 'Tôi đang trên đường. Lát nữa gặp nhé.' },
    { sentence: '___ then.', answer: 'See you in a bit', vi: 'Lát nữa gặp nhé.' },
  ], usage: 'Chào tạm biệt.' },
]

export const L07_LEVEL1_EXERCISES: Exercise[] = [
  { type: 'mc', question: 'Cụm nào nghĩa là "đến nơi làm việc"?', options: ['get to work', 'spend time with', 'wash the dishes', 'once a week'], answer: 'get to work', explanation: 'get to work = đến nơi làm việc.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: '"spend time with" nghĩa là gì?', options: ['dành thời gian với', 'rửa chén', 'đến nơi làm việc', 'mỗi tuần một lần'], answer: 'dành thời gian với', explanation: 'spend time with = dành thời gian với.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"wash the dishes" = rửa chén.', answer: 'true', explanation: 'wash the dishes = rửa chén.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "mỗi tuần một lần":', answer: 'once a week', explanation: 'once a week = mỗi tuần một lần.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn cụm đúng: "Do you know ___?"', options: ['another place', 'our current plan', 'local food', 'across the street'], answer: 'another place', explanation: 'another place = một địa điểm khác.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: '"our current plan" nghĩa là gì?', options: ['kế hoạch hiện tại của nhóm', 'đồ ăn địa phương', 'bên kia đường', 'một địa điểm khác'], answer: 'kế hoạch hiện tại của nhóm', explanation: 'our current plan = kế hoạch hiện tại của nhóm.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"local food" = đồ ăn địa phương.', answer: 'true', explanation: 'local food = đồ ăn địa phương.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "bên kia đường":', answer: 'across the street', explanation: 'across the street = bên kia đường.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn câu đúng ngữ pháp:', options: ['She spends time with her family.', 'She spend time with her family.', 'She spending time with her family.', 'She spent time with her family.'], answer: 'She spends time with her family.', explanation: 'Chủ ngữ she dùng động từ thêm -s (spends).', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép cụm với nghĩa:', pairs: [{ left: 'get to work', right: 'đến nơi làm việc' }, { left: 'spend time with', right: 'dành thời gian với' }, { left: 'wash the dishes', right: 'rửa chén' }, { left: 'local food', right: 'đồ ăn địa phương' }], answer: 'matched', explanation: 'Ghép đúng các cụm từ.', instruction: 'Ghép đúng.' },
]

export const L07_LEVEL2_EXERCISES: Exercise[] = [
  { type: 'mc', question: 'Cụm nào nghĩa là "cuộc hẹn"?', options: ['appointment', 'entrance', 'available', 'crowded'], answer: 'appointment', explanation: 'appointment = cuộc hẹn.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: '"available" nghĩa là gì?', options: ['còn trống', 'đông người', 'gợi ý', 'đặt trước bàn'], answer: 'còn trống', explanation: 'available = còn trống, có thể dùng.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"crowded" = đông người.', answer: 'true', explanation: 'crowded = đông người.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ từ cho "gợi ý":', answer: 'recommend', explanation: 'recommend = gợi ý, đề xuất.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn cụm đúng: "Can I ___?"', options: ['reserve a table', 'pick up a friend', 'a quiet corner', 'entrance'], answer: 'reserve a table', explanation: 'reserve a table = đặt trước một bàn.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: '"entrance" nghĩa là gì?', options: ['lối vào', 'góc yên tĩnh', 'cuộc hẹn', 'địa điểm khác'], answer: 'lối vào', explanation: 'entrance = lối vào.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"a quiet corner" = một góc yên tĩnh.', answer: 'true', explanation: 'a quiet corner = một góc yên tĩnh.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "đón một người bạn":', answer: 'pick up a friend', explanation: 'pick up a friend = đón một người bạn.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: '"How\'s it going?" dùng để làm gì?', options: ['Chào hỏi dạo này thế nào', 'Đề nghị giúp đỡ', 'Chốt kế hoạch', 'Biểu lộ ngạc nhiên'], answer: 'Chào hỏi dạo này thế nào', explanation: 'How\'s it going? = Dạo này thế nào?', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: '"That sounds good." nghĩa là gì?', options: ['Nghe hay đấy', 'Không sao đâu', 'Vậy chốt thế nhé', 'Không hẳn'], answer: 'Nghe hay đấy', explanation: 'That sounds good. = Nghe hay đấy.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"No worries." = Không sao đâu.', answer: 'true', explanation: 'No worries. = Không sao đâu.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "Vậy chốt thế nhé":', answer: 'Sounds like a plan.', explanation: 'Sounds like a plan. = Vậy chốt thế nhé.', instruction: 'Gõ từ đúng.' },
]

export const L07_LEVEL1_DICTATION: DictationItem[] = [
  { audio: 'get to work', answer: 'get to work', vi: 'đến nơi làm việc' },
  { audio: 'spend time with', answer: 'spend time with', vi: 'dành thời gian với' },
  { audio: 'wash the dishes', answer: 'wash the dishes', vi: 'rửa chén' },
  { audio: 'once a week', answer: 'once a week', vi: 'mỗi tuần một lần' },
  { audio: 'another place', answer: 'another place', vi: 'một địa điểm khác' },
  { audio: 'our current plan', answer: 'our current plan', vi: 'kế hoạch hiện tại của nhóm' },
  { audio: 'local food', answer: 'local food', vi: 'đồ ăn địa phương' },
  { audio: 'across the street', answer: 'across the street', vi: 'bên kia đường' },
]

export const L07_LEVEL2_DICTATION: DictationItem[] = [
  { audio: 'appointment', answer: 'appointment', vi: 'cuộc hẹn' },
  { audio: 'available', answer: 'available', vi: 'còn trống' },
  { audio: 'crowded', answer: 'crowded', vi: 'đông người' },
  { audio: 'recommend', answer: 'recommend', vi: 'gợi ý' },
  { audio: 'reserve a table', answer: 'reserve a table', vi: 'đặt trước một bàn' },
  { audio: 'entrance', answer: 'entrance', vi: 'lối vào' },
  { audio: 'a quiet corner', answer: 'a quiet corner', vi: 'một góc yên tĩnh' },
  { audio: 'pick up a friend', answer: 'pick up a friend', vi: 'đón một người bạn' },
  { audio: "How's it going?", answer: "How's it going?", vi: 'Dạo này thế nào?' },
  { audio: 'That sounds good.', answer: 'That sounds good.', vi: 'Nghe hay đấy.' },
]

export const L07_LEVEL1_PRONUNCIATION: PronunciationItem[] = [
  { word: 'get to work', ipa: '/ɡet tə wɝːk/', vi: 'đến nơi làm việc' },
  { word: 'spend time with', ipa: '/spend taɪm wɪð/', vi: 'dành thời gian với' },
  { word: 'wash the dishes', ipa: '/wɑːʃ ðə ˈdɪʃɪz/', vi: 'rửa chén' },
  { word: 'once a week', ipa: '/wʌns ə wiːk/', vi: 'mỗi tuần một lần' },
  { word: 'another place', ipa: '/əˈnʌðɚ pleɪs/', vi: 'một địa điểm khác' },
  { word: 'our current plan', ipa: '/aʊɚ ˈkɜːrənt plæn/', vi: 'kế hoạch hiện tại của nhóm' },
  { word: 'local food', ipa: '/ˈloʊkəl fuːd/', vi: 'đồ ăn địa phương' },
  { word: 'across the street', ipa: '/əˈkrɔːs ðə striːt/', vi: 'bên kia đường' },
]

export const L07_LEVEL2_PRONUNCIATION: PronunciationItem[] = [
  { word: 'appointment', ipa: '/əˈpɔɪntmənt/', vi: 'cuộc hẹn' },
  { word: 'available', ipa: '/əˈveɪləbəl/', vi: 'còn trống' },
  { word: 'crowded', ipa: '/ˈkraʊdɪd/', vi: 'đông người' },
  { word: 'recommend', ipa: '/ˌrekəˈmend/', vi: 'gợi ý' },
  { word: 'reserve a table', ipa: '/rɪˈzɜːrv ə ˈteɪbəl/', vi: 'đặt trước một bàn' },
  { word: 'entrance', ipa: '/ˈentrəns/', vi: 'lối vào' },
  { word: 'a quiet corner', ipa: '/ə ˈkwaɪət ˈkɔːrnɚ/', vi: 'một góc yên tĩnh' },
  { word: 'pick up a friend', ipa: '/pɪk ʌp ə frend/', vi: 'đón một người bạn' },
  { word: "How's it going?", ipa: '/haʊz ɪt ˈɡoʊɪŋ/', vi: 'Dạo này thế nào?' },
  { word: 'That sounds good.', ipa: '/ðæt saʊndz ɡʊd/', vi: 'Nghe hay đấy.' },
  { word: 'No worries.', ipa: '/noʊ ˈwɜːriz/', vi: 'Không sao đâu.' },
  { word: 'Sounds like a plan.', ipa: '/saʊndz laɪk ə plæn/', vi: 'Vậy chốt thế nhé.' },
]

export const L07_META = {
  title: 'Review L01-L06',
  subtitle: 'L07 · Review L01-L06',
  description: 'Hỏi, nghe và phản hồi. Dùng lại kiến thức L01-L06.',
}
