// L03 - Build the Message
// Vocabulary data extracted from PPTX

import type { VocabItem, Exercise, DictationItem, PronunciationItem } from '../screens/LessonView'

export { type VocabItem, type Exercise, type DictationItem, type PronunciationItem }

export const L03_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'cook dinner', ipa: '/kʊk ˈdɪnɚ/', vi: 'nấu bữa tối', pos: 'v', youglish: 'https://youglish.com/pronounce/cook%20dinner', examples: [
    { sentence: 'She usually ___ at home.', answer: 'cooks dinner', vi: 'Cô ấy thường nấu bữa tối ở nhà.' },
    { sentence: 'I ___ for my family on Sundays.', answer: 'cook dinner', vi: 'Tôi nấu bữa tối cho gia đình vào Chủ nhật.' },
  ], usage: 'Cụm động từ, dùng để nói về nấu ăn buổi tối.' },
  { word: 'go for a walk', ipa: '/ɡoʊ fər ə wɔːk/', vi: 'đi dạo', pos: 'v', youglish: 'https://youglish.com/pronounce/go%20for%20a%20walk', examples: [
    { sentence: 'We ___ in the park every evening.', answer: 'go for a walk', vi: 'Chúng tôi đi dạo trong công viên mỗi tối.' },
    { sentence: 'She ___ after dinner.', answer: 'goes for a walk', vi: 'Cô ấy đi dạo sau bữa tối.' },
  ], usage: 'Cụm động từ, dùng để nói về đi bộ thư giãn.' },
  { word: 'stay at home', ipa: '/steɪ æt hoʊm/', vi: 'ở nhà', pos: 'v', youglish: 'https://youglish.com/pronounce/stay%20at%20home', examples: [
    { sentence: 'I prefer to ___ on weekends.', answer: 'stay at home', vi: 'Tôi thích ở nhà vào cuối tuần.' },
    { sentence: 'He ___ because he is sick.', answer: 'stays at home', vi: 'Anh ấy ở nhà vì bị ốm.' },
  ], usage: 'Cụm động từ, trái nghĩa với go out.' },
  { word: 'go out with friends', ipa: '/ɡoʊ aʊt wɪð frendz/', vi: 'đi chơi với bạn', pos: 'v', youglish: 'https://youglish.com/pronounce/go%20out%20with%20friends', examples: [
    { sentence: 'We ___ every Friday night.', answer: 'go out with friends', vi: 'Chúng tôi đi chơi với bạn mỗi tối thứ Sáu.' },
    { sentence: 'She ___ to the cinema.', answer: 'goes out with friends', vi: 'Cô ấy đi chơi với bạn đến rạp chiếu phim.' },
  ], usage: 'Cụm động từ, dùng để nói về hoạt động xã hội.' },
  { word: 'spend time with', ipa: '/spend taɪm wɪð/', vi: 'dành thời gian với', pos: 'v', youglish: 'https://youglish.com/pronounce/spend%20time%20with', examples: [
    { sentence: 'I like to ___ my family.', answer: 'spend time with', vi: 'Tôi thích dành thời gian với gia đình.' },
    { sentence: 'She ___ her children every weekend.', answer: 'spends time with', vi: 'Cô ấy dành thời gian với con mỗi cuối tuần.' },
  ], usage: 'Cụm động từ, dùng để nói về chất lượng thời gian.' },
  { word: 'watch movies', ipa: '/wɑːtʃ ˈmuːviz/', vi: 'xem phim', pos: 'v', youglish: 'https://youglish.com/pronounce/watch%20movies', examples: [
    { sentence: 'We ___ at home on Sundays.', answer: 'watch movies', vi: 'Chúng tôi xem phim ở nhà vào Chủ nhật.' },
    { sentence: 'She ___ with her boyfriend.', answer: 'watches movies', vi: 'Cô ấy xem phim với bạn trai.' },
  ], usage: 'Cụm động từ, dùng để nói về giải trí.' },
  { word: 'live with', ipa: '/lɪv wɪð/', vi: 'sống cùng', pos: 'v', youglish: 'https://youglish.com/pronounce/live%20with', examples: [
    { sentence: 'He ___ his parents.', answer: 'lives with', vi: 'Anh ấy sống cùng bố mẹ.' },
    { sentence: 'I ___ my roommate.', answer: 'live with', vi: 'Tôi sống cùng bạn cùng phòng.' },
  ], usage: 'Cụm động từ, dùng để nói về cùng ở.' },
  { word: 'usually', ipa: '/ˈjuːʒuəli/', vi: 'thường', pos: 'adv', youglish: 'https://youglish.com/pronounce/usually', examples: [
    { sentence: 'I ___ wake up at 6 AM.', answer: 'usually', vi: 'Tôi thường thức dậy lúc 6 giờ sáng.' },
    { sentence: 'She ___ cooks dinner.', answer: 'usually', vi: 'Cô ấy thường nấu bữa tối.' },
  ], usage: 'Trạng từ, đứng trước động từ thường, sau be verb.' },
  { word: 'have breakfast', ipa: '/hæv ˈbrekfəst/', vi: 'ăn sáng', pos: 'v', youglish: 'https://youglish.com/pronounce/have%20breakfast', examples: [
    { sentence: 'I ___ at 7 AM every day.', answer: 'have breakfast', vi: 'Tôi ăn sáng lúc 7 giờ mỗi ngày.' },
    { sentence: 'She ___ with her family.', answer: 'has breakfast', vi: 'Cô ấy ăn sáng với gia đình.' },
  ], usage: 'Cụm động từ, dùng để nói về bữa sáng.' },
  { word: 'walk to work', ipa: '/wɔːk tə wɝːk/', vi: 'đi bộ đi làm', pos: 'v', youglish: 'https://youglish.com/pronounce/walk%20to%20work', examples: [
    { sentence: 'She ___ every morning.', answer: 'walks to work', vi: 'Cô ấy đi bộ đi làm mỗi sáng.' },
    { sentence: 'I ___ because my office is near.', answer: 'walk to work', vi: 'Tôi đi bộ đi làm vì văn phòng gần.' },
  ], usage: 'Cụm động từ, dùng để nói về đi làm bằng chân.' },
  { word: 'help with', ipa: '/help wɪð/', vi: 'giúp việc gì', pos: 'v', youglish: 'https://youglish.com/pronounce/help%20with', examples: [
    { sentence: 'I ___ the cooking.', answer: 'help with', vi: 'Tôi giúp nấu ăn.' },
    { sentence: 'She ___ her homework.', answer: 'helps with', vi: 'Cô ấy giúp làm bài tập.' },
  ], usage: 'Cụm động từ, help with + noun.' },
  { word: 'wash the dishes', ipa: '/wɑːʃ ðə ˈdɪʃɪz/', vi: 'rửa chén', pos: 'v', youglish: 'https://youglish.com/pronounce/wash%20the%20dishes', examples: [
    { sentence: 'He ___ after dinner.', answer: 'washes the dishes', vi: 'Anh ấy rửa chén sau bữa tối.' },
    { sentence: 'I ___ every night.', answer: 'wash the dishes', vi: 'Tôi rửa chén mỗi tối.' },
  ], usage: 'Cụm động từ, dùng để nói về việc nhà.' },
]

export const L03_LEVEL2_VOCAB: VocabItem[] = [
  { word: 'get home early', ipa: '/ɡet hoʊm ˈɝːli/', vi: 'về nhà sớm', pos: 'v', youglish: 'https://youglish.com/pronounce/get%20home%20early', examples: [
    { sentence: 'She ___ every day.', answer: 'gets home early', vi: 'Cô ấy về nhà sớm mỗi ngày.' },
    { sentence: 'I ___ to rest.', answer: 'get home early', vi: 'Tôi về nhà sớm để nghỉ ngơi.' },
  ], usage: 'Cụm động từ, dùng để nói về giờ về nhà.' },
  { word: 'be good at', ipa: '/bi ɡʊd æt/', vi: 'giỏi về', pos: 'phrase', youglish: 'https://youglish.com/pronounce/be%20good%20at', examples: [
    { sentence: 'He ___ cooking.', answer: 'is good at', vi: 'Anh ấy giỏi nấu ăn.' },
    { sentence: 'She ___ English.', answer: 'is good at', vi: 'Cô ấy giỏi tiếng Anh.' },
  ], usage: 'Cụm tính từ, be good at + V-ing/noun.' },
  { word: 'sometimes', ipa: '/ˈsʌmtaɪmz/', vi: 'thỉnh thoảng', pos: 'adv', youglish: 'https://youglish.com/pronounce/sometimes', examples: [
    { sentence: 'I ___ eat out.', answer: 'sometimes', vi: 'Thỉnh thoảng tôi ăn ngoài.' },
    { sentence: 'She ___ works late.', answer: 'sometimes', vi: 'Cô ấy thỉnh thoảng làm việc muộn.' },
  ], usage: 'Trạng từ, đứng đầu hoặc giữa câu.' },
  { word: 'after dinner', ipa: '/ˈæftɚ ˈdɪnɚ/', vi: 'sau bữa tối', pos: 'phrase', youglish: 'https://youglish.com/pronounce/after%20dinner', examples: [
    { sentence: 'We walk ___ every night.', answer: 'after dinner', vi: 'Chúng tôi đi dạo sau bữa tối mỗi tối.' },
    { sentence: 'She reads ___ .', answer: 'after dinner', vi: 'Cô ấy đọc sách sau bữa tối.' },
  ], usage: 'Cụm từ chỉ thời gian.' },
  { word: 'friendly', ipa: '/ˈfrendli/', vi: 'thân thiện', pos: 'adj', youglish: 'https://youglish.com/pronounce/friendly', examples: [
    { sentence: 'She is ___ and helpful.', answer: 'friendly', vi: 'Cô ấy thân thiện và hay giúp đỡ.' },
    { sentence: 'My neighbor is very ___.', answer: 'friendly', vi: 'Hàng xóm của tôi rất thân thiện.' },
  ], usage: 'Tính từ, đi với be verb.' },
  { word: 'busy', ipa: '/ˈbɪzi/', vi: 'bận', pos: 'adj', youglish: 'https://youglish.com/pronounce/busy', examples: [
    { sentence: 'He is ___ today.', answer: 'busy', vi: 'Anh ấy bận hôm nay.' },
    { sentence: 'I am ___ with work.', answer: 'busy', vi: 'Tôi bận với công việc.' },
  ], usage: 'Tính từ, đi với be verb.' },
  { word: 'nearby', ipa: '/ˌnɪrˈbaɪ/', vi: 'gần đây', pos: 'adv', youglish: 'https://youglish.com/pronounce/nearby', examples: [
    { sentence: 'They live ___.', answer: 'nearby', vi: 'Họ sống gần đây.' },
    { sentence: 'There is a shop ___.', answer: 'nearby', vi: 'Có một cửa hàng gần đây.' },
  ], usage: 'Trạng từ/tính từ, dùng cho vị trí.' },
  { word: 'together', ipa: '/təˈɡeðɚ/', vi: 'cùng nhau', pos: 'adv', youglish: 'https://youglish.com/pronounce/together', examples: [
    { sentence: 'We cook ___ every weekend.', answer: 'together', vi: 'Chúng tôi nấu ăn cùng nhau mỗi cuối tuần.' },
    { sentence: 'They work ___ on projects.', answer: 'together', vi: 'Họ làm việc cùng nhau trong dự án.' },
  ], usage: 'Trạng từ, đứng sau động từ.' },
  { word: 'helpful', ipa: '/ˈhelpfəl/', vi: 'hay giúp đỡ', pos: 'adj', youglish: 'https://youglish.com/pronounce/helpful', examples: [
    { sentence: 'She is very ___.', answer: 'helpful', vi: 'Cô ấy rất hay giúp đỡ.' },
    { sentence: 'My teacher is ___.', answer: 'helpful', vi: 'Giáo viên tôi hay giúp đỡ.' },
  ], usage: 'Tính từ, đi với be verb.' },
  { word: 'every morning', ipa: '/ˈevri ˈmɔːrnɪŋ/', vi: 'mỗi buổi sáng', pos: 'phrase', youglish: 'https://youglish.com/pronounce/every%20morning', examples: [
    { sentence: 'He walks ___ .', answer: 'every morning', vi: 'Anh ấy đi bộ mỗi buổi sáng.' },
    { sentence: 'I drink coffee ___.', answer: 'every morning', vi: 'Tôi uống cà phê mỗi buổi sáng.' },
  ], usage: 'Cụm từ chỉ thời gian.' },
  { word: 'family member', ipa: '/ˈfæməli ˈmembɚ/', vi: 'người thân', pos: 'n', youglish: 'https://youglish.com/pronounce/family%20member', examples: [
    { sentence: 'I call a ___ every day.', answer: 'family member', vi: 'Tôi gọi người thân mỗi ngày.' },
    { sentence: 'She visits a ___ on weekends.', answer: 'family member', vi: 'Cô ấy thăm người thân vào cuối tuần.' },
  ], usage: 'Danh từ, dùng để nói về gia đình.' },
  { word: 'every day', ipa: '/ˈevri deɪ/', vi: 'mỗi ngày', pos: 'phrase', youglish: 'https://youglish.com/pronounce/every%20day', examples: [
    { sentence: 'He calls ___.', answer: 'every day', vi: 'Anh ấy gọi điện mỗi ngày.' },
    { sentence: 'I exercise ___.', answer: 'every day', vi: 'Tôi tập thể dục mỗi ngày.' },
  ], usage: 'Cụm từ chỉ tần suất.' },
]

export const L03_LEVEL1_EXERCISES = [
  { type: 'mc', question: 'Chọn cụm từ đúng: "She ___ at home."', options: ['cooks dinner', 'goes for a walk', 'stays at home', 'watches movies'], answer: 'stays at home', explanation: 'stay at home = ở nhà.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Cụm nào nghĩa là "đi chơi với bạn"?', options: ['spend time with', 'go out with friends', 'watch movies', 'live with'], answer: 'go out with friends', explanation: 'go out with friends = đi chơi với bạn.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"usually" đứng trước động từ thường.', answer: 'true', explanation: 'usually đứng trước động từ thường (She usually cooks).', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn cụm từ đúng: "I ___ my family."', options: ['spend time with', 'go for a walk', 'cook dinner', 'wash the dishes'], answer: 'spend time with', explanation: 'spend time with = dành thời gian với.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "rửa chén":', answer: 'wash the dishes', explanation: 'wash the dishes = rửa chén.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn cụm từ đúng: "She ___ every morning."', options: ['walks to work', 'has breakfast', 'helps with', 'washes the dishes'], answer: 'walks to work', explanation: 'walk to work = đi bộ đi làm.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép cụm với nghĩa:', pairs: [{ left: 'cook dinner', right: 'nấu bữa tối' }, { left: 'go for a walk', right: 'đi dạo' }, { left: 'stay at home', right: 'ở nhà' }, { left: 'go out with friends', right: 'đi chơi với bạn' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['She cooks dinner.', 'She cook dinner.', 'She cooking dinner.', 'She cooked dinner.'], answer: 'She cooks dinner.', explanation: 'Chủ ngữ she (he/she/it) thêm -s vào động từ.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"help with" dùng với danh từ sau.', answer: 'true', explanation: 'help with + noun (help with dinner).', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "ăn sáng":', answer: 'have breakfast', explanation: 'have breakfast = ăn sáng.', instruction: 'Gõ từ đúng.' },
]

export const L03_LEVEL2_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "She is ___ and helpful."', options: ['friendly', 'busy', 'nearby', 'together'], answer: 'friendly', explanation: 'friendly = thân thiện.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Cụm nào nghĩa là "mỗi buổi sáng"?', options: ['every day', 'every morning', 'after dinner', 'sometimes'], answer: 'every morning', explanation: 'every morning = mỗi buổi sáng.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"busy" và "free" là trái nghĩa.', answer: 'true', explanation: 'busy = bận, free = rảnh (trái nghĩa).', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn từ đúng: "They live ___."', options: ['nearby', 'together', 'friendly', 'every day'], answer: 'nearby', explanation: 'nearby = gần đây.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "người thân":', answer: 'family member', explanation: 'family member = người thân.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: '"together" nghĩa là gì?', options: ['một mình', 'cùng nhau', 'thỉnh thoảng', 'mỗi ngày'], answer: 'cùng nhau', explanation: 'together = cùng nhau.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'friendly', right: 'thân thiện' }, { left: 'busy', right: 'bận' }, { left: 'nearby', right: 'gần đây' }, { left: 'together', right: 'cùng nhau' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['She is helpful.', 'She helpful.', 'She are helpful.', 'She be helpful.'], answer: 'She is helpful.', explanation: 'Tính từ đi với be verb (is).', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"every day" và "every morning" đều là cụm từ chỉ thời gian.', answer: 'true', explanation: 'Cả hai đều là cụm từ chỉ thời gian/tần suất.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "sau bữa tối":', answer: 'after dinner', explanation: 'after dinner = sau bữa tối.', instruction: 'Gõ từ đúng.' },
]

export const L03_LEVEL1_DICTATION = [
  { audio: 'cook dinner', answer: 'cook dinner', vi: 'nấu bữa tối' },
  { audio: 'go for a walk', answer: 'go for a walk', vi: 'đi dạo' },
  { audio: 'stay at home', answer: 'stay at home', vi: 'ở nhà' },
  { audio: 'go out with friends', answer: 'go out with friends', vi: 'đi chơi với bạn' },
  { audio: 'spend time with', answer: 'spend time with', vi: 'dành thời gian với' },
  { audio: 'watch movies', answer: 'watch movies', vi: 'xem phim' },
  { audio: 'live with', answer: 'live with', vi: 'sống cùng' },
  { audio: 'usually', answer: 'usually', vi: 'thường' },
  { audio: 'have breakfast', answer: 'have breakfast', vi: 'ăn sáng' },
  { audio: 'walk to work', answer: 'walk to work', vi: 'đi bộ đi làm' },
  { audio: 'help with', answer: 'help with', vi: 'giúp việc gì' },
  { audio: 'wash the dishes', answer: 'wash the dishes', vi: 'rửa chén' },
]

export const L03_LEVEL2_DICTATION = [
  { audio: 'get home early', answer: 'get home early', vi: 'về nhà sớm' },
  { audio: 'be good at', answer: 'be good at', vi: 'giỏi về' },
  { audio: 'sometimes', answer: 'sometimes', vi: 'thỉnh thoảng' },
  { audio: 'after dinner', answer: 'after dinner', vi: 'sau bữa tối' },
  { audio: 'friendly', answer: 'friendly', vi: 'thân thiện' },
  { audio: 'busy', answer: 'busy', vi: 'bận' },
  { audio: 'nearby', answer: 'nearby', vi: 'gần đây' },
  { audio: 'together', answer: 'together', vi: 'cùng nhau' },
  { audio: 'helpful', answer: 'helpful', vi: 'hay giúp đỡ' },
  { audio: 'every morning', answer: 'every morning', vi: 'mỗi buổi sáng' },
  { audio: 'family member', answer: 'family member', vi: 'người thân' },
  { audio: 'every day', answer: 'every day', vi: 'mỗi ngày' },
]

export const L03_LEVEL1_PRONUNCIATION = [
  { word: 'cook dinner', ipa: '/kʊk ˈdɪnɚ/', vi: 'nấu bữa tối' },
  { word: 'go for a walk', ipa: '/ɡoʊ fər ə wɔːk/', vi: 'đi dạo' },
  { word: 'stay at home', ipa: '/steɪ æt hoʊm/', vi: 'ở nhà' },
  { word: 'go out with friends', ipa: '/ɡoʊ aʊt wɪð frendz/', vi: 'đi chơi với bạn' },
  { word: 'spend time with', ipa: '/spend taɪm wɪð/', vi: 'dành thời gian với' },
  { word: 'watch movies', ipa: '/wɑːtʃ ˈmuːviz/', vi: 'xem phim' },
  { word: 'live with', ipa: '/lɪv wɪð/', vi: 'sống cùng' },
  { word: 'usually', ipa: '/ˈjuːʒuəli/', vi: 'thường' },
  { word: 'have breakfast', ipa: '/hæv ˈbrekfəst/', vi: 'ăn sáng' },
  { word: 'walk to work', ipa: '/wɔːk tə wɝːk/', vi: 'đi bộ đi làm' },
  { word: 'help with', ipa: '/help wɪð/', vi: 'giúp việc gì' },
  { word: 'wash the dishes', ipa: '/wɑːʃ ðə ˈdɪʃɪz/', vi: 'rửa chén' },
]

export const L03_LEVEL2_PRONUNCIATION = [
  { word: 'get home early', ipa: '/ɡet hoʊm ˈɝːli/', vi: 'về nhà sớm' },
  { word: 'be good at', ipa: '/bi ɡʊd æt/', vi: 'giỏi về' },
  { word: 'sometimes', ipa: '/ˈsʌmtaɪmz/', vi: 'thỉnh thoảng' },
  { word: 'after dinner', ipa: '/ˈæftɚ ˈdɪnɚ/', vi: 'sau bữa tối' },
  { word: 'friendly', ipa: '/ˈfrendli/', vi: 'thân thiện' },
  { word: 'busy', ipa: '/ˈbɪzi/', vi: 'bận' },
  { word: 'nearby', ipa: '/ˌnɪrˈbaɪ/', vi: 'gần đây' },
  { word: 'together', ipa: '/təˈɡeðɚ/', vi: 'cùng nhau' },
  { word: 'helpful', ipa: '/ˈhelpfəl/', vi: 'hay giúp đỡ' },
  { word: 'every morning', ipa: '/ˈevri ˈmɔːrnɪŋ/', vi: 'mỗi buổi sáng' },
  { word: 'family member', ipa: '/ˈfæməli ˈmembɚ/', vi: 'người thân' },
  { word: 'every day', ipa: '/ˈevri deɪ/', vi: 'mỗi ngày' },
]

export const L03_META = {
  title: 'L03 · Build the Message',
  subtitle: 'Khẳng định, phủ định và động từ thêm -s/-es',
  description: 'Nói một câu đầy đủ. Thêm thông tin. Chia động từ đúng.',
}
