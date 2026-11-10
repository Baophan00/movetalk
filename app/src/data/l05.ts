// L05 - This That These Those + To Be
// Vocabulary data extracted from PPTX

import type { VocabItem, Exercise, DictationItem, PronunciationItem } from '../screens/LessonView'

export { type VocabItem, type Exercise, type DictationItem, type PronunciationItem }

export const L05_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'mug', ipa: '/mʌɡ/', vi: 'cốc có quai', pos: 'n', youglish: 'https://youglish.com/pronounce/mug', examples: [
    { sentence: 'Is this your ___?', answer: 'mug', vi: 'Đây là cốc của bạn à?' },
    { sentence: 'I drink coffee from this ___ every morning.', answer: 'mug', vi: 'Tôi uống cà phê từ cốc này mỗi sáng.' },
  ], usage: 'Danh từ đếm được. Dùng với this/that cho một vật gần hoặc xa.' },
  { word: 'notebook', ipa: '/ˈnoʊtbʊk/', vi: 'sổ tay', pos: 'n', youglish: 'https://youglish.com/pronounce/notebook', examples: [
    { sentence: 'Are these your ___?', answer: 'notebooks', vi: 'Đây là sổ tay của bạn à?' },
    { sentence: 'She writes notes in her ___ during class.', answer: 'notebook', vi: 'Cô ấy ghi chú vào sổ tay trong giờ học.' },
  ], usage: 'Danh từ đếm được. Số nhiều: notebooks.' },
  { word: 'charger', ipa: '/ˈtʃɑːrdʒər/', vi: 'bộ sạc', pos: 'n', youglish: 'https://youglish.com/pronounce/charger', examples: [
    { sentence: 'Is that your ___?', answer: 'charger', vi: 'Đó là bộ sạc của bạn à?' },
    { sentence: 'I need a ___ for my phone.', answer: 'charger', vi: 'Tôi cần một bộ sạc cho điện thoại.' },
  ], usage: 'Danh từ đếm được. Dùng với that cho vật ở xa.' },
  { word: 'receipt', ipa: '/rɪˈsiːt/', vi: 'hóa đơn, biên lai', pos: 'n', youglish: 'https://youglish.com/pronounce/receipt', examples: [
    { sentence: 'Is this your ___?', answer: 'receipt', vi: 'Đây là hóa đơn của bạn à?' },
    { sentence: 'Please keep the ___ for your records.', answer: 'receipt', vi: 'Vui lòng giữ biên lai để đối chiếu.' },
  ], usage: 'Danh từ đếm được. Dùng khi hỏi về đồ vật vừa mua.' },
  { word: 'counter', ipa: '/ˈkaʊntər/', vi: 'quầy', pos: 'n', youglish: 'https://youglish.com/pronounce/counter', examples: [
    { sentence: 'There is a bag by the ___.', answer: 'counter', vi: 'Có một cái túi bên cạnh quầy.' },
    { sentence: 'Please pay at the ___.', answer: 'counter', vi: 'Vui lòng thanh toán tại quầy.' },
  ], usage: 'Danh từ đếm được. Thường dùng với There is/are.' },
  { word: 'shelf', ipa: '/ʃelf/', vi: 'kệ', pos: 'n', youglish: 'https://youglish.com/pronounce/shelf', examples: [
    { sentence: 'Are those cups on the ___?', answer: 'shelf', vi: 'Những cốc kia có ở trên kệ không?' },
    { sentence: 'There are books on the ___.', answer: 'shelf', vi: 'Có sách trên kệ.' },
  ], usage: 'Danh từ đếm được. Số nhiều: shelves.' },
  { word: 'socket', ipa: '/ˈsɑːkɪt/', vi: 'ổ cắm điện', pos: 'n', youglish: 'https://youglish.com/pronounce/socket', examples: [
    { sentence: 'Is there a ___ near this table?', answer: 'socket', vi: 'Có ổ cắm điện gần bàn này không?' },
    { sentence: 'There are two ___s under the desk.', answer: 'socket', vi: 'Có hai ổ cắm điện dưới bàn.' },
  ], usage: 'Danh từ đếm được. Dùng với Is there/are there.' },
  { word: 'entrance', ipa: '/ˈentrəns/', vi: 'lối vào', pos: 'n', youglish: 'https://youglish.com/pronounce/entrance', examples: [
    { sentence: 'There are two chairs by the ___.', answer: 'entrance', vi: 'Có hai chiếc ghế bên cạnh lối vào.' },
    { sentence: 'The ___ is next to the counter.', answer: 'entrance', vi: 'Lối vào ở bên cạnh quầy.' },
  ], usage: 'Danh từ đếm được. Dùng để chỉ nơi vào.' },
]

export const L05_LEVEL2_VOCAB: VocabItem[] = [
  { word: 'over here', ipa: '/ˌoʊvər ˈhɪr/', vi: 'ở đằng này', pos: 'adv.phr', youglish: 'https://youglish.com/pronounce/over%20here', examples: [
    { sentence: 'These seats ___ ___ are free.', answer: 'over here', vi: 'Những ghế ở đằng này còn trống.' },
    { sentence: 'Please sit ___ ___.', answer: 'over here', vi: 'Vui lòng ngồi ở đằng này.' },
  ], usage: 'Cụm trạng từ, chỉ vị trí gần người nói.' },
  { word: 'over there', ipa: '/ˌoʊvər ˈðer/', vi: 'ở đằng kia', pos: 'adv.phr', youglish: 'https://youglish.com/pronounce/over%20there', examples: [
    { sentence: 'That bag ___ ___ is mine.', answer: 'over there', vi: 'Cái túi ở đằng kia là của tôi.' },
    { sentence: 'There are two empty seats ___ ___.', answer: 'over there', vi: 'Có hai ghế trống ở đằng kia.' },
  ], usage: 'Cụm trạng từ, chỉ vị trí xa người nói.' },
  { word: 'next to', ipa: '/ˈnekst tə/', vi: 'bên cạnh', pos: 'prep.phr', youglish: 'https://youglish.com/pronounce/next%20to', examples: [
    { sentence: 'There is a plant ___ ___ the desk.', answer: 'next to', vi: 'Có một cây xanh bên cạnh bàn.' },
    { sentence: 'The socket is ___ ___ the door.', answer: 'next to', vi: 'Ổ cắm điện ở bên cạnh cửa.' },
  ], usage: 'Cụm giới từ, chỉ vị trí bên cạnh.' },
  { word: 'in front of', ipa: '/ɪn ˈfrʌnt əv/', vi: 'phía trước', pos: 'prep.phr', youglish: 'https://youglish.com/pronounce/in%20front%20of', examples: [
    { sentence: 'There are two chairs ___ ___ ___ the desk.', answer: 'in front of', vi: 'Có hai ghế phía trước bàn.' },
    { sentence: 'He is standing ___ ___ ___ me.', answer: 'in front of', vi: 'Anh ấy đang đứng phía trước tôi.' },
  ], usage: 'Cụm giới từ, chỉ vị trí phía trước.' },
  { word: 'behind', ipa: '/bɪˈhaɪnd/', vi: 'phía sau', pos: 'prep', youglish: 'https://youglish.com/pronounce/behind', examples: [
    { sentence: 'The printer is ___ you.', answer: 'behind', vi: 'Máy in ở phía sau bạn.' },
    { sentence: 'There is a bag ___ the counter.', answer: 'behind', vi: 'Có một cái túi phía sau quầy.' },
  ], usage: 'Giới từ, chỉ vị trí phía sau.' },
  { word: 'available', ipa: '/əˈveɪləbəl/', vi: 'còn trống, có thể dùng', pos: 'adj', youglish: 'https://youglish.com/pronounce/available', examples: [
    { sentence: 'Are those seats ___?', answer: 'available', vi: 'Những ghế kia còn trống không?' },
    { sentence: 'Is this table ___?', answer: 'available', vi: 'Bàn này còn trống không?' },
  ], usage: 'Tính từ, dùng với be verb để hỏi về tình trạng trống.' },
  { word: 'the one', ipa: '/ðə wʌn/', vi: 'cái đó, cái được nhắc đến', pos: 'NP', youglish: 'https://youglish.com/pronounce/the%20one', examples: [
    { sentence: '___ by the window is mine.', answer: 'The one', vi: 'Cái ở cạnh cửa sổ là của tôi.' },
    { sentence: 'Which ___ do you want?', answer: 'one', vi: 'Bạn muốn cái nào?' },
  ], usage: 'Cụm danh từ, dùng để chọn một vật trong nhóm.' },
  { word: 'the ones', ipa: '/ðə wʌnz/', vi: 'những cái được nhắc đến', pos: 'NP', youglish: 'https://youglish.com/pronounce/the%20ones', examples: [
    { sentence: '___ on the shelf are clean.', answer: 'The ones', vi: 'Những cái trên kệ sạch.' },
    { sentence: 'I like ___ by the door.', answer: 'the ones', vi: 'Tôi thích những cái ở cạnh cửa.' },
  ], usage: 'Cụm danh từ, dùng để chọn nhiều vật trong nhóm.' },
  { word: 'experience', ipa: '/ɪkˈspɪriəns/', vi: 'trải nghiệm; kinh nghiệm', pos: 'n', youglish: 'https://youglish.com/pronounce/experience', examples: [
    { sentence: 'This is my first ___ of pottery.', answer: 'experience', vi: 'Đây là lần đầu trải nghiệm làm gốm.' },
    { sentence: 'That is a new ___ for me.', answer: 'experience', vi: 'Đó là một trải nghiệm mới với tôi.' },
  ], usage: 'Danh từ đếm được. Dùng với first experience of + N/V-ing.' },
  { word: 'first time', ipa: '/ˌfɜːrst ˈtaɪm/', vi: 'lần đầu tiên', pos: 'NP', youglish: 'https://youglish.com/pronounce/first%20time', examples: [
    { sentence: 'This is my ___ ___ making pottery.', answer: 'first time', vi: 'Đây là lần đầu tiên tôi làm gốm.' },
    { sentence: 'Is this your ___ ___ here?', answer: 'first time', vi: 'Đây là lần đầu tiên bạn ở đây à?' },
  ], usage: 'Cụm danh từ, dùng để nói về lần đầu làm gì.' },
  { word: 'second visit', ipa: '/ˌsekənd ˈvɪzɪt/', vi: 'lần ghé thăm thứ hai', pos: 'NP', youglish: 'https://youglish.com/pronounce/second%20visit', examples: [
    { sentence: 'This is my ___ ___ to Hoi An.', answer: 'second visit', vi: 'Đây là lần ghé thăm thứ hai của tôi đến Hội An.' },
    { sentence: 'Is this your ___ ___?', answer: 'second visit', vi: 'Đây là lần ghé thăm thứ hai của bạn à?' },
  ], usage: 'Cụm danh từ, dùng để nói về số thứ tự chuyến đi.' },
  { word: 'business trip', ipa: '/ˈbɪznəs trɪp/', vi: 'chuyến công tác', pos: 'NP', youglish: 'https://youglish.com/pronounce/business%20trip', examples: [
    { sentence: 'Is that your first ___ ___?', answer: 'business trip', vi: 'Đó là chuyến công tác đầu tiên của bạn à?' },
    { sentence: 'She is on a ___ ___ to Singapore.', answer: 'business trip', vi: 'Cô ấy đang trong chuyến công tác đến Singapore.' },
  ], usage: 'Cụm danh từ, dùng để nói về chuyến đi làm việc.' },
  { word: 'first choice', ipa: '/ˌfɜːrst ˈtʃɔɪs/', vi: 'lựa chọn ưu tiên số một', pos: 'NP', youglish: 'https://youglish.com/pronounce/first%20choice', examples: [
    { sentence: 'Is that your ___ ___?', answer: 'first choice', vi: 'Đó là lựa chọn ưu tiên số một của bạn à?' },
    { sentence: 'That boat tour is my ___ ___.', answer: 'first choice', vi: 'Tour thuyền đó là lựa chọn ưu tiên số một của tôi.' },
  ], usage: 'Cụm danh từ, dùng để nói về lựa chọn đầu tiên.' },
  { word: 'favorite place', ipa: '/ˈfeɪvərɪt pleɪs/', vi: 'địa điểm yêu thích', pos: 'NP', youglish: 'https://youglish.com/pronounce/favorite%20place', examples: [
    { sentence: 'This is my ___ ___ in town.', answer: 'favorite place', vi: 'Đây là địa điểm yêu thích của tôi trong thành phố.' },
    { sentence: 'Is this your ___ ___?', answer: 'favorite place', vi: 'Đây là địa điểm yêu thích của bạn à?' },
  ], usage: 'Cụm danh từ, dùng để nói về nơi yêu thích.' },
  { word: 'once a year', ipa: '/ˌwʌns ə ˈjɪr/', vi: 'mỗi năm một lần', pos: 'adv.phr', youglish: 'https://youglish.com/pronounce/once%20a%20year', examples: [
    { sentence: 'We take a trip together ___ ___ ___.', answer: 'once a year', vi: 'Chúng tôi đi du lịch cùng nhau mỗi năm một lần.' },
    { sentence: 'I visit my hometown ___ ___ ___.', answer: 'once a year', vi: 'Tôi về quê mỗi năm một lần.' },
  ], usage: 'Cụm trạng từ, dùng để nói về tần suất.' },
  { word: 'twice a month', ipa: '/ˌtwaɪs ə ˈmʌnθ/', vi: 'mỗi tháng hai lần', pos: 'adv.phr', youglish: 'https://youglish.com/pronounce/twice%20a%20month', examples: [
    { sentence: 'I come here ___ ___ ___.', answer: 'twice a month', vi: 'Tôi đến đây mỗi tháng hai lần.' },
    { sentence: 'She joins a workshop ___ ___ ___.', answer: 'twice a month', vi: 'Cô ấy tham gia workshop mỗi tháng hai lần.' },
  ], usage: 'Cụm trạng từ, dùng để nói về tần suất.' },
]

export const L05_LEVEL1_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "Is this your ___?" (cốc có quai)', options: ['mug', 'notebook', 'charger', 'receipt'], answer: 'mug', explanation: 'mug = cốc có quai.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Từ nào nghĩa là "ổ cắm điện"?', options: ['socket', 'shelf', 'counter', 'entrance'], answer: 'socket', explanation: 'socket = ổ cắm điện.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"Are those cups on the shelf?" hỏi về nhiều cốc ở xa.', answer: 'true', explanation: 'those = xa, số nhiều; cups = nhiều cốc.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Hoàn thành: "There is a bag by the ___." ', options: ['counter', 'shelf', 'socket', 'entrance'], answer: 'counter', explanation: 'counter = quầy.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ từ tiếng Anh cho "lối vào":', answer: 'entrance', explanation: 'entrance = lối vào.', instruction: 'Gõ từ đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'mug', right: 'cốc có quai' }, { left: 'notebook', right: 'sổ tay' }, { left: 'charger', right: 'bộ sạc' }, { left: 'receipt', right: 'hóa đơn, biên lai' }], answer: 'matched', explanation: 'Ghép đúng các từ.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: '"Is there a socket near this table?" là câu hỏi về gì?', options: ['sự hiện diện', 'vị trí', 'sở hữu', 'giá cả'], answer: 'sự hiện diện', explanation: 'Is there...? hỏi về sự hiện diện.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"receipt" nghĩa là hóa đơn, biên lai.', answer: 'true', explanation: 'receipt = hóa đơn, biên lai.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn câu đúng ngữ pháp:', options: ['Is that your charger?', 'Are that your charger?', 'Is those your charger?', 'Are those your chargers?'], answer: 'Is that your charger?', explanation: 'that + is cho một vật ở xa.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ từ tiếng Anh cho "kệ":', answer: 'shelf', explanation: 'shelf = kệ.', instruction: 'Gõ từ đúng.' },
]

export const L05_LEVEL2_EXERCISES = [
  { type: 'mc', question: 'Chọn cụm đúng: "These seats ___ ___ are free."', options: ['over here', 'over there', 'next to', 'behind'], answer: 'over here', explanation: 'over here = ở đằng này.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Cụm nào nghĩa là "ở đằng kia"?', options: ['over here', 'over there', 'in front of', 'behind'], answer: 'over there', explanation: 'over there = ở đằng kia.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"next to" nghĩa là bên cạnh.', answer: 'true', explanation: 'next to = bên cạnh.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Hoàn thành: "There are two chairs ___ ___ ___ the desk."', options: ['in front of', 'behind', 'next to', 'over here'], answer: 'in front of', explanation: 'in front of = phía trước.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "cái đó, cái được nhắc đến":', answer: 'the one', explanation: 'the one = cái đó, cái được nhắc đến.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Hoàn thành: "This is my first ___ of pottery."', options: ['experience', 'first time', 'second visit', 'business trip'], answer: 'experience', explanation: 'experience of = trải nghiệm về.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: '"first choice" nghĩa là gì?', options: ['lựa chọn ưu tiên số một', 'địa điểm yêu thích', 'chuyến công tác', 'lần đầu tiên'], answer: 'lựa chọn ưu tiên số một', explanation: 'first choice = lựa chọn ưu tiên số một.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"once a year" và "twice a month" đều nói về tần suất.', answer: 'true', explanation: 'Cả hai đều là cụm trạng từ chỉ tần suất.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "mỗi tháng hai lần":', answer: 'twice a month', explanation: 'twice a month = mỗi tháng hai lần.', instruction: 'Gõ từ đúng.' },
  { type: 'matching', question: 'Ghép cụm với nghĩa:', pairs: [{ left: 'over here', right: 'ở đằng này' }, { left: 'over there', right: 'ở đằng kia' }, { left: 'available', right: 'còn trống' }, { left: 'the one', right: 'cái đó, cái được nhắc đến' }], answer: 'matched', explanation: 'Ghép đúng các cụm.', instruction: 'Ghép đúng.' },
]

export const L05_LEVEL1_DICTATION = [
  { audio: 'mug', answer: 'mug', vi: 'cốc có quai' },
  { audio: 'notebook', answer: 'notebook', vi: 'sổ tay' },
  { audio: 'charger', answer: 'charger', vi: 'bộ sạc' },
  { audio: 'receipt', answer: 'receipt', vi: 'hóa đơn, biên lai' },
  { audio: 'counter', answer: 'counter', vi: 'quầy' },
  { audio: 'shelf', answer: 'shelf', vi: 'kệ' },
  { audio: 'socket', answer: 'socket', vi: 'ổ cắm điện' },
  { audio: 'entrance', answer: 'entrance', vi: 'lối vào' },
]

export const L05_LEVEL2_DICTATION = [
  { audio: 'over here', answer: 'over here', vi: 'ở đằng này' },
  { audio: 'over there', answer: 'over there', vi: 'ở đằng kia' },
  { audio: 'next to', answer: 'next to', vi: 'bên cạnh' },
  { audio: 'in front of', answer: 'in front of', vi: 'phía trước' },
  { audio: 'behind', answer: 'behind', vi: 'phía sau' },
  { audio: 'available', answer: 'available', vi: 'còn trống, có thể dùng' },
  { audio: 'the one', answer: 'the one', vi: 'cái đó, cái được nhắc đến' },
  { audio: 'the ones', answer: 'the ones', vi: 'những cái được nhắc đến' },
  { audio: 'experience', answer: 'experience', vi: 'trải nghiệm; kinh nghiệm' },
  { audio: 'first time', answer: 'first time', vi: 'lần đầu tiên' },
  { audio: 'second visit', answer: 'second visit', vi: 'lần ghé thăm thứ hai' },
  { audio: 'business trip', answer: 'business trip', vi: 'chuyến công tác' },
  { audio: 'first choice', answer: 'first choice', vi: 'lựa chọn ưu tiên số một' },
  { audio: 'favorite place', answer: 'favorite place', vi: 'địa điểm yêu thích' },
  { audio: 'once a year', answer: 'once a year', vi: 'mỗi năm một lần' },
  { audio: 'twice a month', answer: 'twice a month', vi: 'mỗi tháng hai lần' },
]

export const L05_LEVEL1_PRONUNCIATION = [
  { word: 'mug', ipa: '/mʌɡ/', vi: 'cốc có quai' },
  { word: 'notebook', ipa: '/ˈnoʊtbʊk/', vi: 'sổ tay' },
  { word: 'charger', ipa: '/ˈtʃɑːrdʒər/', vi: 'bộ sạc' },
  { word: 'receipt', ipa: '/rɪˈsiːt/', vi: 'hóa đơn, biên lai' },
  { word: 'counter', ipa: '/ˈkaʊntər/', vi: 'quầy' },
  { word: 'shelf', ipa: '/ʃelf/', vi: 'kệ' },
  { word: 'socket', ipa: '/ˈsɑːkɪt/', vi: 'ổ cắm điện' },
  { word: 'entrance', ipa: '/ˈentrəns/', vi: 'lối vào' },
]

export const L05_LEVEL2_PRONUNCIATION = [
  { word: 'over here', ipa: '/ˌoʊvər ˈhɪr/', vi: 'ở đằng này' },
  { word: 'over there', ipa: '/ˌoʊvər ˈðer/', vi: 'ở đằng kia' },
  { word: 'next to', ipa: '/ˈnekst tə/', vi: 'bên cạnh' },
  { word: 'in front of', ipa: '/ɪn ˈfrʌnt əv/', vi: 'phía trước' },
  { word: 'behind', ipa: '/bɪˈhaɪnd/', vi: 'phía sau' },
  { word: 'available', ipa: '/əˈveɪləbəl/', vi: 'còn trống, có thể dùng' },
  { word: 'the one', ipa: '/ðə wʌn/', vi: 'cái đó, cái được nhắc đến' },
  { word: 'the ones', ipa: '/ðə wʌnz/', vi: 'những cái được nhắc đến' },
  { word: 'experience', ipa: '/ɪkˈspɪriəns/', vi: 'trải nghiệm; kinh nghiệm' },
  { word: 'first time', ipa: '/ˌfɜːrst ˈtaɪm/', vi: 'lần đầu tiên' },
  { word: 'second visit', ipa: '/ˌsekənd ˈvɪzɪt/', vi: 'lần ghé thăm thứ hai' },
  { word: 'business trip', ipa: '/ˈbɪznəs trɪp/', vi: 'chuyến công tác' },
  { word: 'first choice', ipa: '/ˌfɜːrst ˈtʃɔɪs/', vi: 'lựa chọn ưu tiên số một' },
  { word: 'favorite place', ipa: '/ˈfeɪvərɪt pleɪs/', vi: 'địa điểm yêu thích' },
  { word: 'once a year', ipa: '/ˌwʌns ə ˈjɪr/', vi: 'mỗi năm một lần' },
  { word: 'twice a month', ipa: '/ˌtwaɪs ə ˈmʌnθ/', vi: 'mỗi tháng hai lần' },
]

export const L05_META = {
  title: 'L05 · This That These Those + To Be',
  subtitle: 'This / That / These / Those + To Be',
  description: 'Chỉ đúng vật. Mô tả nơi bạn đang ở.',
}
