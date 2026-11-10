// L02 - Expand the Subject
// Vocabulary data extracted from PPTX

import type { VocabItem, Exercise, DictationItem, PronunciationItem } from '../screens/LessonView'

export { type VocabItem, type Exercise, type DictationItem, type PronunciationItem }

export const L02_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'brother', ipa: '/ˈbrʌðər/', vi: 'anh/em trai', pos: 'n', youglish: 'https://youglish.com/pronounce/brother', examples: [
    { sentence: 'My ___ is studying at university.', answer: 'brother', vi: 'Anh trai tôi đang học đại học.' },
    { sentence: 'She has a younger ___ who plays football.', answer: 'brother', vi: 'Cô ấy có em trai chơi bóng đá.' },
  ], usage: 'Danh từ đếm được. Dùng với my/his/her.' },
  { word: 'sister', ipa: '/ˈsɪstər/', vi: 'chị/em gái', pos: 'n', youglish: 'https://youglish.com/pronounce/sister', examples: [
    { sentence: 'My ___ works at a hospital.', answer: 'sister', vi: 'Chị gái tôi làm việc ở bệnh viện.' },
    { sentence: 'He called his ___ to ask for advice.', answer: 'sister', vi: 'Anh ấy gọi chị gái để xin lời khuyên.' },
  ], usage: 'Danh từ đếm được. Dùng với my/his/her.' },
  { word: 'mother', ipa: '/ˈmʌðər/', vi: 'mẹ', pos: 'n', youglish: 'https://youglish.com/pronounce/mother', examples: [
    { sentence: 'My ___ cooks dinner every evening.', answer: 'mother', vi: 'Mẹ tôi nấu bữa tối mỗi tối.' },
    { sentence: 'She looks like her ___.', answer: 'mother', vi: 'Cô ấy giống mẹ.' },
  ], usage: 'Danh từ đếm được. Có thể dùng "mom" (Mỹ) hoặc "mum" (Anh).' },
  { word: 'father', ipa: '/ˈfɑːðər/', vi: 'bố', pos: 'n', youglish: 'https://youglish.com/pronounce/father', examples: [
    { sentence: 'My ___ drives to work every day.', answer: 'father', vi: 'Bố tôi lái xe đi làm mỗi ngày.' },
    { sentence: 'He learned to play guitar from his ___.', answer: 'father', vi: 'Anh ấy học chơi guitar từ bố.' },
  ], usage: 'Danh từ đếm được. Có thể dùng "dad" (thân mật).' },
  { word: 'parents', ipa: '/ˈperənts/', vi: 'bố mẹ', pos: 'n', youglish: 'https://youglish.com/pronounce/parents', examples: [
    { sentence: 'My ___ live in the countryside.', answer: 'parents', vi: 'Bố mẹ tôi sống ở quê.' },
    { sentence: 'She visits her ___ every weekend.', answer: 'parents', vi: 'Cô ấy thăm bố mẹ mỗi cuối tuần.' },
  ], usage: 'Danh từ số nhiều. Luôn dùng dạng số nhiều.' },
  { word: 'friend', ipa: '/frend/', vi: 'bạn', pos: 'n', youglish: 'https://youglish.com/pronounce/friend', examples: [
    { sentence: 'I met my best ___ in college.', answer: 'friend', vi: 'Tôi gặp bạn thân nhất ở đại học.' },
    { sentence: 'She called a ___ for help.', answer: 'friend', vi: 'Cô ấy gọi bạn để nhờ giúp.' },
  ], usage: 'Danh từ đếm được. "best friend" = bạn thân nhất.' },
  { word: 'neighbor', ipa: '/ˈneɪbər/', vi: 'hàng xóm', pos: 'n', youglish: 'https://youglish.com/pronounce/neighbor', examples: [
    { sentence: 'My ___ is very friendly and helpful.', answer: 'neighbor', vi: 'Hàng xóm của tôi rất thân thiện và hay giúp đỡ.' },
    { sentence: 'She borrowed sugar from her ___.', answer: 'neighbor', vi: 'Cô ấy mượn đường từ hàng xóm.' },
  ], usage: 'Danh từ đếm được. Viết "neighbour" (Anh), "neighbor" (Mỹ).' },
  { word: 'coworker', ipa: '/ˈkoʊwɜːrkər/', vi: 'đồng nghiệp', pos: 'n', youglish: 'https://youglish.com/pronounce/coworker', examples: [
    { sentence: 'My ___ helped me with the project.', answer: 'coworker', vi: 'Đồng nghiệp tôi giúp tôi với dự án.' },
    { sentence: 'She had lunch with a ___ today.', answer: 'coworker', vi: 'Cô ấy ăn trưa với đồng nghiệp hôm nay.' },
  ], usage: 'Danh từ đếm được. Cũng viết "colleague".' },
  { word: 'teacher', ipa: '/ˈtiːtʃər/', vi: 'giáo viên', pos: 'n', youglish: 'https://youglish.com/pronounce/teacher', examples: [
    { sentence: 'My ___ explains things very clearly.', answer: 'teacher', vi: 'Giáo viên tôi giải thích rất rõ ràng.' },
    { sentence: 'She became a ___ after graduating.', answer: 'teacher', vi: 'Cô ấy trở thành giáo viên sau khi tốt nghiệp.' },
  ], usage: 'Danh từ đếm được. Dùng cho cả nam và nữ.' },
  { word: 'doctor', ipa: '/ˈdɑːktər/', vi: 'bác sĩ', pos: 'n', youglish: 'https://youglish.com/pronounce/doctor', examples: [
    { sentence: 'The ___ said I need more rest.', answer: 'doctor', vi: 'Bác sĩ nói tôi cần nghỉ ngơi nhiều hơn.' },
    { sentence: 'She is a ___ at the city hospital.', answer: 'doctor', vi: 'Cô ấy là bác sĩ ở bệnh viện thành phố.' },
  ], usage: 'Danh từ đếm được. Có thể dùng "Dr." viết tắt.' },
  { word: 'driver', ipa: '/ˈdraɪvər/', vi: 'tài xế', pos: 'n', youglish: 'https://youglish.com/pronounce/driver', examples: [
    { sentence: 'The bus ___ was very careful.', answer: 'driver', vi: 'Tài xế xe buýt rất cẩn thận.' },
    { sentence: 'My father is a taxi ___.', answer: 'driver', vi: 'Bố tôi là tài xế taxi.' },
  ], usage: 'Danh từ đếm được. driver = người lái xe.' },
  { word: 'shop', ipa: '/ʃɑːp/', vi: 'cửa hàng', pos: 'n', youglish: 'https://youglish.com/pronounce/shop', examples: [
    { sentence: 'There is a small ___ near my house.', answer: 'shop', vi: 'Có một cửa hàng nhỏ gần nhà tôi.' },
    { sentence: 'She works at a clothing ___.', answer: 'shop', vi: 'Cô ấy làm việc ở cửa hàng quần áo.' },
  ], usage: 'Danh từ đếm được. "go shopping" = đi mua sắm.' },
]

export const L02_LEVEL2_VOCAB: VocabItem[] = [
  { word: 'café', ipa: '/kæˈfeɪ/', vi: 'quán cà phê', pos: 'n', youglish: 'https://youglish.com/pronounce/cafe', examples: [
    { sentence: 'Let us meet at the ___ on Main Street.', answer: 'café', vi: 'Hãy gặp nhau ở quán cà phê trên phố chính.' },
    { sentence: 'The ___ is open until 10 PM.', answer: 'café', vi: 'Quán cà phê mở đến 10 giờ tối.' },
  ], usage: 'Danh từ đếm được. Cũng viết "cafe".' },
  { word: 'restaurant', ipa: '/ˈrestərɑːnt/', vi: 'nhà hàng', pos: 'n', youglish: 'https://youglish.com/pronounce/restaurant', examples: [
    { sentence: 'We had dinner at a nice ___.', answer: 'restaurant', vi: 'Chúng tôi ăn tối ở một nhà hàng đẹp.' },
    { sentence: 'The ___ is always busy on weekends.', answer: 'restaurant', vi: 'Nhà hàng luôn đông vào cuối tuần.' },
  ], usage: 'Danh từ đếm được.' },
  { word: 'park', ipa: '/pɑːrk/', vi: 'công viên', pos: 'n', youglish: 'https://youglish.com/pronounce/park', examples: [
    { sentence: 'I go for a walk in the ___ every morning.', answer: 'park', vi: 'Tôi đi dạo trong công viên mỗi sáng.' },
    { sentence: 'The children play in the ___ after school.', answer: 'park', vi: 'Bọn trẻ chơi trong công viên sau giờ học.' },
  ], usage: 'Danh từ đếm được. "park" cũng là động từ (đỗ xe).' },
  { word: 'supermarket', ipa: '/ˈsuːpərmɑːrkɪt/', vi: 'siêu thị', pos: 'n', youglish: 'https://youglish.com/pronounce/supermarket', examples: [
    { sentence: 'I buy groceries at the ___.', answer: 'supermarket', vi: 'Tôi mua đồ ăn tại siêu thị.' },
    { sentence: 'The ___ is closed on Sundays.', answer: 'supermarket', vi: 'Siêu thị đóng cửa vào Chủ nhật.' },
  ], usage: 'Danh từ đếm được. Viết tắt "supermarket".' },
  { word: 'breakfast', ipa: '/ˈbrekfəst/', vi: 'bữa sáng', pos: 'n', youglish: 'https://youglish.com/pronounce/breakfast', examples: [
    { sentence: 'I usually eat ___ at 7 AM.', answer: 'breakfast', vi: 'Tôi thường ăn sáng lúc 7 giờ.' },
    { sentence: 'She skips ___ when she is late.', answer: 'breakfast', vi: 'Cô ấy bỏ bữa sáng khi đi muộn.' },
  ], usage: 'Danh từ không đếm được (uncountable) trong ngữ cảnh bữa ăn.' },
  { word: 'lunch', ipa: '/lʌntʃ/', vi: 'bữa trưa', pos: 'n', youglish: 'https://youglish.com/pronounce/lunch', examples: [
    { sentence: 'We have ___ together at noon.', answer: 'lunch', vi: 'Chúng tôi ăn trưa cùng nhau lúc 12 giờ.' },
    { sentence: 'He brings ___ to work every day.', answer: 'lunch', vi: 'Anh ấy mang bữa trưa đi làm mỗi ngày.' },
  ], usage: 'Danh từ không đếm được. "have lunch" = ăn trưa.' },
  { word: 'dinner', ipa: '/ˈdɪnər/', vi: 'bữa tối', pos: 'n', youglish: 'https://youglish.com/pronounce/dinner', examples: [
    { sentence: 'We cook ___ at home on Sundays.', answer: 'dinner', vi: 'Chúng tôi nấu bữa tối ở nhà vào Chủ nhật.' },
    { sentence: 'She had ___ with her family last night.', answer: 'dinner', vi: 'Cô ấy ăn tối với gia đình tối qua.' },
  ], usage: 'Danh từ không đếm được. "have dinner" = ăn tối.' },
  { word: 'together', ipa: '/təˈɡeðər/', vi: 'cùng nhau', pos: 'adv', youglish: 'https://youglish.com/pronounce/together', examples: [
    { sentence: 'We work ___ on this project.', answer: 'together', vi: 'Chúng tôi làm việc cùng nhau trong dự án này.' },
    { sentence: 'They eat ___ every weekend.', answer: 'together', vi: 'Họ ăn cùng nhau mỗi cuối tuần.' },
  ], usage: 'Trạng từ. Dùng sau động từ.' },
  { word: 'car', ipa: '/kɑːr/', vi: 'ô tô', pos: 'n', youglish: 'https://youglish.com/pronounce/car', examples: [
    { sentence: 'My father drives a ___.', answer: 'car', vi: 'Bố tôi lái ô tô.' },
    { sentence: 'She bought a new ___ last month.', answer: 'car', vi: 'Cô ấy mua ô tô mới tháng trước.' },
  ], usage: 'Danh từ đếm được. "by car" = bằng ô tô.' },
  { word: 'bike', ipa: '/baɪk/', vi: 'xe đạp', pos: 'n', youglish: 'https://youglish.com/pronounce/bike', examples: [
    { sentence: 'She rides a ___ to work.', answer: 'bike', vi: 'Cô ấy đi xe đạp đi làm.' },
    { sentence: 'I bought a new ___ for my son.', answer: 'bike', vi: 'Tôi mua xe đạp mới cho con trai.' },
  ], usage: 'Danh từ đếm được. "bike" = xe đạp, "motorbike" = xe máy.' },
  { word: 'hungry', ipa: '/ˈhʌŋɡri/', vi: 'đói', pos: 'adj', youglish: 'https://youglish.com/pronounce/hungry', examples: [
    { sentence: 'I am ___ after skipping breakfast.', answer: 'hungry', vi: 'Tôi đói sau khi bỏ bữa sáng.' },
    { sentence: 'The children are ___ after school.', answer: 'hungry', vi: 'Bọn trẻ đói sau giờ học.' },
  ], usage: 'Tính từ, đi với be verb. "hungry" = đói, "thirsty" = khát.' },
  { word: 'thirsty', ipa: '/ˈθɜːrsti/', vi: 'khát nước', pos: 'adj', youglish: 'https://youglish.com/pronounce/thirsty', examples: [
    { sentence: 'I am ___ after running.', answer: 'thirsty', vi: 'Tôi khát nước sau khi chạy.' },
    { sentence: 'She was ___ so she drank water.', answer: 'thirsty', vi: 'Cô ấy khát nước nên uống nước.' },
  ], usage: 'Tính từ, đi với be verb. "thirsty" = khát nước.' },
]

export const L02_LEVEL1_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "My ___ is at home."', options: ['brother', 'sister', 'mother', 'father'], answer: 'brother', explanation: 'brother = anh/em trai.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "My ___ likes tea."', options: ['brother', 'mother', 'father', 'friend'], answer: 'mother', explanation: 'mother = mẹ, thích trà (tea).', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"parents" nghĩa là "bố mẹ".', answer: 'true', explanation: 'parents = bố mẹ (số nhiều).', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Từ nào nghĩa là "hàng xóm"?', options: ['friend', 'neighbor', 'coworker', 'brother'], answer: 'neighbor', explanation: 'neighbor = hàng xóm.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ từ tiếng Anh cho "đồng nghiệp":', answer: 'coworker', explanation: 'coworker = đồng nghiệp.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: '"My parents are at home" — parents là số nhiều hay số ít?', options: ['Số ít', 'Số nhiều', 'Cả hai', 'Không rõ'], answer: 'Số nhiều', explanation: 'parents luôn là số nhiều.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'brother', right: 'anh/em trai' }, { left: 'sister', right: 'chị/em gái' }, { left: 'mother', right: 'mẹ' }, { left: 'father', right: 'bố' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['Does your brother live here?', 'Do your brother live here?', 'Is your brother live here?', 'Are your brother live here?'], answer: 'Does your brother live here?', explanation: 'Chủ ngữ he/she/it dùng Does + V1.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"friend" và "neighbor" đều là danh từ đếm được.', answer: 'true', explanation: 'Cả hai đều là danh từ đếm được.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ từ tiếng Anh cho "bạn (bạn bè)":', answer: 'friend', explanation: 'friend = bạn.', instruction: 'Gõ từ đúng.' },
]

export const L02_LEVEL2_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "The ___ is open until 10 PM."', options: ['shop', 'café', 'restaurant', 'park'], answer: 'café', explanation: 'café = quán cà phê, mở đến 10 giờ tối.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Từ nào nghĩa là "nhà hàng"?', options: ['shop', 'café', 'restaurant', 'supermarket'], answer: 'restaurant', explanation: 'restaurant = nhà hàng.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"breakfast" là bữa ăn đầu tiên trong ngày.', answer: 'true', explanation: 'breakfast = bữa sáng, bữa ăn đầu tiên.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn từ đúng: "She rides a ___ to work."', options: ['car', 'bike', 'bus', 'train'], answer: 'bike', explanation: 'bike = xe đạp, ride a bike = đi xe đạp.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ từ tiếng Anh cho "đói":', answer: 'hungry', explanation: 'hungry = đói.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: '"together" nghĩa là gì?', options: ['một mình', 'cùng nhau', 'nhanh chóng', 'chậm rãi'], answer: 'cùng nhau', explanation: 'together = cùng nhau.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'breakfast', right: 'bữa sáng' }, { left: 'lunch', right: 'bữa trưa' }, { left: 'dinner', right: 'bữa tối' }, { left: 'together', right: 'cùng nhau' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['Does he have a car?', 'Do he have a car?', 'Is he have a car?', 'Are he have a car?'], answer: 'Does he have a car?', explanation: 'Chủ ngữ he dùng Does + have (động từ nguyên mẫu).', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"thirsty" nghĩa là "đói".', answer: 'false', explanation: 'thirsty = khát nước, hungry = đói.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ từ tiếng Anh cho "khát nước":', answer: 'thirsty', explanation: 'thirsty = khát nước.', instruction: 'Gõ từ đúng.' },
]

export const L02_LEVEL1_DICTATION = [
  { audio: 'brother', answer: 'brother', vi: 'anh/em trai' },
  { audio: 'sister', answer: 'sister', vi: 'chị/em gái' },
  { audio: 'mother', answer: 'mother', vi: 'mẹ' },
  { audio: 'father', answer: 'father', vi: 'bố' },
  { audio: 'parents', answer: 'parents', vi: 'bố mẹ' },
  { audio: 'friend', answer: 'friend', vi: 'bạn' },
  { audio: 'neighbor', answer: 'neighbor', vi: 'hàng xóm' },
  { audio: 'coworker', answer: 'coworker', vi: 'đồng nghiệp' },
  { audio: 'teacher', answer: 'teacher', vi: 'giáo viên' },
  { audio: 'doctor', answer: 'doctor', vi: 'bác sĩ' },
  { audio: 'driver', answer: 'driver', vi: 'tài xế' },
  { audio: 'shop', answer: 'shop', vi: 'cửa hàng' },
]

export const L02_LEVEL2_DICTATION = [
  { audio: 'café', answer: 'café', vi: 'quán cà phê' },
  { audio: 'restaurant', answer: 'restaurant', vi: 'nhà hàng' },
  { audio: 'park', answer: 'park', vi: 'công viên' },
  { audio: 'supermarket', answer: 'supermarket', vi: 'siêu thị' },
  { audio: 'breakfast', answer: 'breakfast', vi: 'bữa sáng' },
  { audio: 'lunch', answer: 'lunch', vi: 'bữa trưa' },
  { audio: 'dinner', answer: 'dinner', vi: 'bữa tối' },
  { audio: 'together', answer: 'together', vi: 'cùng nhau' },
  { audio: 'car', answer: 'car', vi: 'ô tô' },
  { audio: 'bike', answer: 'bike', vi: 'xe đạp' },
  { audio: 'hungry', answer: 'hungry', vi: 'đói' },
  { audio: 'thirsty', answer: 'thirsty', vi: 'khát nước' },
]

export const L02_LEVEL1_PRONUNCIATION = [
  { word: 'brother', ipa: '/ˈbrʌðər/', vi: 'anh/em trai' },
  { word: 'sister', ipa: '/ˈsɪstər/', vi: 'chị/em gái' },
  { word: 'mother', ipa: '/ˈmʌðər/', vi: 'mẹ' },
  { word: 'father', ipa: '/ˈfɑːðər/', vi: 'bố' },
  { word: 'parents', ipa: '/ˈperənts/', vi: 'bố mẹ' },
  { word: 'friend', ipa: '/frend/', vi: 'bạn' },
  { word: 'neighbor', ipa: '/ˈneɪbər/', vi: 'hàng xóm' },
  { word: 'coworker', ipa: '/ˈkoʊwɜːrkər/', vi: 'đồng nghiệp' },
  { word: 'teacher', ipa: '/ˈtiːtʃər/', vi: 'giáo viên' },
  { word: 'doctor', ipa: '/ˈdɑːktər/', vi: 'bác sĩ' },
  { word: 'driver', ipa: '/ˈdraɪvər/', vi: 'tài xế' },
  { word: 'shop', ipa: '/ʃɑːp/', vi: 'cửa hàng' },
]

export const L02_LEVEL2_PRONUNCIATION = [
  { word: 'café', ipa: '/kæˈfeɪ/', vi: 'quán cà phê' },
  { word: 'restaurant', ipa: '/ˈrestərɑːnt/', vi: 'nhà hàng' },
  { word: 'park', ipa: '/pɑːrk/', vi: 'công viên' },
  { word: 'supermarket', ipa: '/ˈsuːpərmɑːrkɪt/', vi: 'siêu thị' },
  { word: 'breakfast', ipa: '/ˈbrekfəst/', vi: 'bữa sáng' },
  { word: 'lunch', ipa: '/lʌntʃ/', vi: 'bữa trưa' },
  { word: 'dinner', ipa: '/ˈdɪnər/', vi: 'bữa tối' },
  { word: 'together', ipa: '/təˈɡeðər/', vi: 'cùng nhau' },
  { word: 'car', ipa: '/kɑːr/', vi: 'ô tô' },
  { word: 'bike', ipa: '/baɪk/', vi: 'xe đạp' },
  { word: 'hungry', ipa: '/ˈhʌŋɡri/', vi: 'đói' },
  { word: 'thirsty', ipa: '/ˈθɜːrsti/', vi: 'khát nước' },
]

export const L02_META = {
  title: 'L02 · Expand the Subject',
  subtitle: 'IS / DOES…? or ARE / DO…?',
  description: 'Cùng ý muốn hỏi. Đổi chủ ngữ, chọn đúng cấu trúc.',
}
