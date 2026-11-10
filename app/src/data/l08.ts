import type { VocabItem, Exercise, DictationItem, PronunciationItem } from '../screens/LessonView'

export { type VocabItem, type Exercise, type DictationItem, type PronunciationItem }

export const L08_LEVEL1_VOCAB: VocabItem[] = [
  { word: 'a few friends', ipa: '/ə fjuː frendz/', vi: 'một vài người bạn', pos: 'phrase', youglish: 'https://youglish.com/pronounce/a%20few%20friends', examples: [
    { sentence: 'I have ___ here.', answer: 'a few friends', vi: 'Tôi có một vài người bạn ở đây.' },
    { sentence: 'She invited ___ to her party.', answer: 'a few friends', vi: 'Cô ấy mời một vài người bạn đến tiệc.' },
  ], usage: 'a few = một số (không nhiều), dùng với danh từ đếm được.' },
  { word: 'few friends', ipa: '/fjuː frendz/', vi: 'ít bạn, gần như không có', pos: 'phrase', youglish: 'https://youglish.com/pronounce/few%20friends', examples: [
    { sentence: 'I have ___ here.', answer: 'few friends', vi: 'Tôi có ít bạn ở đây.' },
    { sentence: 'He has ___ in this city.', answer: 'few friends', vi: 'Anh ấy có ít bạn trong thành phố này.' },
  ], usage: 'few (không có a) = rất ít, mang ý nghĩa tiêu cực.' },
  { word: 'a little time', ipa: '/ə ˈlɪtəl taɪm/', vi: 'một chút thời gian', pos: 'phrase', youglish: 'https://youglish.com/pronounce/a%20little%20time', examples: [
    { sentence: 'We have ___ to rest.', answer: 'a little time', vi: 'Chúng tôi có một chút thời gian để nghỉ.' },
    { sentence: 'She needs ___ to finish.', answer: 'a little time', vi: 'Cô ấy cần một chút thời gian để xong.' },
  ], usage: 'a little = một chút (không nhiều), dùng với danh từ không đếm được.' },
  { word: 'little time', ipa: '/ˈlɪtəl taɪm/', vi: 'rất ít thời gian', pos: 'phrase', youglish: 'https://youglish.com/pronounce/little%20time', examples: [
    { sentence: 'We have ___ to finish.', answer: 'little time', vi: 'Chúng tôi có rất ít thời gian để xong.' },
    { sentence: 'He has ___ to prepare.', answer: 'little time', vi: 'Anh ấy có rất ít thời gian để chuẩn bị.' },
  ], usage: 'little (không có a) = rất ít, mang ý nghĩa tiêu cực.' },
  { word: 'some advice', ipa: '/səm ədˈvaɪs/', vi: 'một ít lời khuyên', pos: 'phrase', youglish: 'https://youglish.com/pronounce/some%20advice', examples: [
    { sentence: 'I need ___ from you.', answer: 'some advice', vi: 'Tôi cần một ít lời khuyên từ bạn.' },
    { sentence: 'She asked for ___ .', answer: 'some advice', vi: 'Cô ấy xin một ít lời khuyên.' },
  ], usage: 'some = một số/một ít, thường dùng trong câu khẳng định.' },
  { word: 'any questions', ipa: '/ˈeni ˈkwestʃənz/', vi: 'câu hỏi nào', pos: 'phrase', youglish: 'https://youglish.com/pronounce/any%20questions', examples: [
    { sentence: 'Do you have ___ ?', answer: 'any questions', vi: 'Bạn có câu hỏi nào không?' },
    { sentence: 'She has no ___ .', answer: 'any questions', vi: 'Cô ấy không có câu hỏi nào.' },
  ], usage: 'any = bất kỳ, dùng trong câu hỏi/phủ định.' },
  { word: 'many options', ipa: '/ˈmeni ˈɑːpʃənz/', vi: 'nhiều lựa chọn', pos: 'phrase', youglish: 'https://youglish.com/pronounce/many%20options', examples: [
    { sentence: 'We have ___ to choose.', answer: 'many options', vi: 'Chúng tôi có nhiều lựa chọn để chọn.' },
    { sentence: 'There are ___ in this menu.', answer: 'many options', vi: 'Có nhiều lựa chọn trong menu này.' },
  ], usage: 'many = nhiều, dùng với danh từ đếm được.' },
  { word: 'much information', ipa: '/mʌtʃ ˌɪnfɚˈmeɪʃən/', vi: 'nhiều thông tin', pos: 'phrase', youglish: 'https://youglish.com/pronounce/much%20information', examples: [
    { sentence: 'We don\'t have ___ .', answer: 'much information', vi: 'Chúng tôi không có nhiều thông tin.' },
    { sentence: 'She needs ___ about this.', answer: 'much information', vi: 'Cô ấy cần nhiều thông tin về điều này.' },
  ], usage: 'much = nhiều, dùng với danh từ không đếm được, thường trong câu phủ định/hỏi.' },
  { word: 'most people', ipa: '/moʊst ˈpiːpəl/', vi: 'đa số mọi người', pos: 'phrase', youglish: 'https://youglish.com/pronounce/most%20people', examples: [
    { sentence: '___ like this place.', answer: 'Most people', vi: 'Đa số mọi người thích nơi này.' },
    { sentence: '___ agree with this idea.', answer: 'Most people', vi: 'Đa số mọi người đồng ý với ý tưởng này.' },
  ], usage: 'most = đa số, dùng với danh từ đếm được.' },
  { word: 'most of us', ipa: '/moʊst əv əs/', vi: 'đa số chúng ta', pos: 'phrase', youglish: 'https://youglish.com/pronounce/most%20of%20us', examples: [
    { sentence: '___ work nearby.', answer: 'Most of us', vi: 'Đa số chúng ta làm việc gần đây.' },
    { sentence: '___ like coffee.', answer: 'Most of us', vi: 'Đa số chúng ta thích cà phê.' },
  ], usage: 'most of + pronoun = đa số trong nhóm.' },
  { word: 'almost all', ipa: '/ˈɔːlmoʊst ɔːl/', vi: 'gần như tất cả', pos: 'phrase', youglish: 'https://youglish.com/pronounce/almost%20all', examples: [
    { sentence: '___ the seats are taken.', answer: 'Almost all', vi: 'Gần như tất cả ghế đều đã có người.' },
    { sentence: '___ students passed.', answer: 'Almost all', vi: 'Gần như tất cả học sinh đều đạt.' },
  ], usage: 'almost all = gần như tất cả.' },
  { word: 'each person', ipa: '/iːtʃ ˈpɜːrsən/', vi: 'từng người', pos: 'phrase', youglish: 'https://youglish.com/pronounce/each%20person', examples: [
    { sentence: '___ has a ticket.', answer: 'Each person', vi: 'Từng người có một vé.' },
    { sentence: '___ needs to register.', answer: 'Each person', vi: 'Từng người cần đăng ký.' },
  ], usage: 'each = từng (một trong nhóm).' },
]

export const L08_LEVEL2_VOCAB: VocabItem[] = [
  { word: 'every day', ipa: '/ˈevri deɪ/', vi: 'mỗi ngày', pos: 'phrase', youglish: 'https://youglish.com/pronounce/every%20day', examples: [
    { sentence: 'I study ___ .', answer: 'every day', vi: 'Tôi học mỗi ngày.' },
    { sentence: 'She practices ___ .', answer: 'every day', vi: 'Cô ấy luyện tập mỗi ngày.' },
  ], usage: 'every = mỗi (tất cả trong nhóm).' },
  { word: 'both of us', ipa: '/boʊθ əv əs/', vi: 'cả hai chúng ta', pos: 'phrase', youglish: 'https://youglish.com/pronounce/both%20of%20us', examples: [
    { sentence: '___ are ready.', answer: 'Both of us', vi: 'Cả hai chúng ta đều sẵn sàng.' },
    { sentence: '___ like coffee.', answer: 'Both of us', vi: 'Cả hai chúng ta đều thích cà phê.' },
  ], usage: 'both = cả hai.' },
  { word: 'either of them', ipa: '/ˈiːðɚ əv ðəm/', vi: 'một trong hai', pos: 'phrase', youglish: 'https://youglish.com/pronounce/either%20of%20them', examples: [
    { sentence: '___ is fine.', answer: 'Either of them', vi: 'Một trong hai cái nào cũng được.' },
    { sentence: '___ can help you.', answer: 'Either of them', vi: 'Một trong hai người có thể giúp bạn.' },
  ], usage: 'either = một trong hai.' },
  { word: 'neither of them', ipa: '/ˈniːðɚ əv ðəm/', vi: 'không cái nào trong hai', pos: 'phrase', youglish: 'https://youglish.com/pronounce/neither%20of%20them', examples: [
    { sentence: '___ is available.', answer: 'Neither of them', vi: 'Không cái nào trong hai có sẵn.' },
    { sentence: '___ works.', answer: 'Neither of them', vi: 'Không cái nào trong hai hoạt động.' },
  ], usage: 'neither = không cái nào trong hai.' },
  { word: 'feedback', ipa: '/ˈfiːdbæk/', vi: 'ý kiến phản hồi', pos: 'n', youglish: 'https://youglish.com/pronounce/feedback', examples: [
    { sentence: 'Can you give me some ___ ?', answer: 'feedback', vi: 'Bạn có thể cho tôi một ít ý kiến phản hồi không?' },
    { sentence: 'We need ___ from customers.', answer: 'feedback', vi: 'Chúng tôi cần ý kiến phản hồi từ khách hàng.' },
  ], usage: 'feedback = ý kiến phản hồi, không đếm được.' },
  { word: 'equipment', ipa: '/ɪˈkwɪpmənt/', vi: 'thiết bị', pos: 'n', youglish: 'https://youglish.com/pronounce/equipment', examples: [
    { sentence: 'All the ___ is new.', answer: 'equipment', vi: 'Tất cả thiết bị đều mới.' },
    { sentence: 'We need more ___ .', answer: 'equipment', vi: 'Chúng tôi cần thêm thiết bị.' },
  ], usage: 'equipment = thiết bị, không đếm được.' },
  { word: 'luggage', ipa: '/ˈlʌɡɪdʒ/', vi: 'hành lý', pos: 'n', youglish: 'https://youglish.com/pronounce/luggage', examples: [
    { sentence: 'How much ___ do you have?', answer: 'luggage', vi: 'Bạn có bao nhiêu hành lý?' },
    { sentence: 'I don\'t have much ___ .', answer: 'luggage', vi: 'Tôi không có nhiều hành lý.' },
  ], usage: 'luggage = hành lý, không đếm được.' },
  { word: 'advice', ipa: '/ədˈvaɪs/', vi: 'lời khuyên', pos: 'n', youglish: 'https://youglish.com/pronounce/advice', examples: [
    { sentence: 'Can I ask for some ___ ?', answer: 'advice', vi: 'Tôi có thể xin một ít lời khuyên không?' },
    { sentence: 'She gave me good ___ .', answer: 'advice', vi: 'Cô ấy cho tôi lời khuyên tốt.' },
  ], usage: 'advice = lời khuyên, không đếm được.' },
  { word: 'information', ipa: '/ˌɪnfɚˈmeɪʃən/', vi: 'thông tin', pos: 'n', youglish: 'https://youglish.com/pronounce/information', examples: [
    { sentence: 'This ___ is useful.', answer: 'information', vi: 'Thông tin này hữu ích.' },
    { sentence: 'We need more ___ .', answer: 'information', vi: 'Chúng tôi cần thêm thông tin.' },
  ], usage: 'information = thông tin, không đếm được.' },
  { word: 'option', ipa: '/ˈɑːpʃən/', vi: 'phương án, lựa chọn', pos: 'n', youglish: 'https://youglish.com/pronounce/option', examples: [
    { sentence: 'Which ___ do you prefer?', answer: 'option', vi: 'Bạn thích phương án nào?' },
    { sentence: 'We have two ___ .', answer: 'option', vi: 'Chúng tôi có hai phương án.' },
  ], usage: 'option = phương án, đếm được.' },
  { word: 'choice', ipa: '/tʃɔɪs/', vi: 'sự lựa chọn', pos: 'n', youglish: 'https://youglish.com/pronounce/choice', examples: [
    { sentence: 'Either ___ is fine.', answer: 'choice', vi: 'Sự lựa chọn nào cũng được.' },
    { sentence: 'You have a ___ to make.', answer: 'choice', vi: 'Bạn có một sự lựa chọn phải làm.' },
  ], usage: 'choice = sự lựa chọn.' },
  { word: 'supplies', ipa: '/səˈplaɪz/', vi: 'đồ dùng, vật tư', pos: 'n', youglish: 'https://youglish.com/pronounce/supplies', examples: [
    { sentence: 'We need more office ___ .', answer: 'supplies', vi: 'Chúng tôi cần thêm đồ dùng văn phòng.' },
    { sentence: 'We have enough ___ for everyone.', answer: 'supplies', vi: 'Chúng tôi có đủ vật tư cho mọi người.' },
  ], usage: 'supplies = đồ dùng, vật tư (số nhiều).' },
]

export const L08_LEVEL1_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "I have ___ friends here."', options: ['a few', 'few', 'many', 'much'], answer: 'a few', explanation: 'a few = một vài (không nhiều nhưng đủ).', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "We have ___ time to rest."', options: ['a little', 'little', 'much', 'many'], answer: 'a little', explanation: 'a little = một chút (đủ để làm gì).', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"few" (không có a) mang ý nghĩa tiêu cực.', answer: 'true', explanation: 'few = rất ít, mang ý nghĩa tiêu cực.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn từ đúng: "Do you have ___ questions?"', options: ['any', 'some', 'many', 'much'], answer: 'any', explanation: 'any = bất kỳ, dùng trong câu hỏi.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ cụm từ cho "đa số mọi người":', answer: 'most people', explanation: 'most people = đa số mọi người.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "Almost ___ the seats are taken."', options: ['all', 'every', 'each', 'both'], answer: 'all', explanation: 'almost all = gần như tất cả.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'a few', right: 'một vài' }, { left: 'few', right: 'rất ít (tiêu cực)' }, { left: 'a little', right: 'một chút' }, { left: 'little', right: 'rất ít (tiêu cực)' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['Most people like this.', 'Most people likes this.', 'Most people is like this.', 'Most people are like this.'], answer: 'Most people like this.', explanation: 'Most people là số nhiều → động từ không thêm -s.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"many" dùng với danh từ đếm được, "much" dùng với danh từ không đếm được.', answer: 'true', explanation: 'many + countable, much + uncountable.', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ cụm từ cho "từng người":', answer: 'each person', explanation: 'each person = từng người.', instruction: 'Gõ từ đúng.' },
]

export const L08_LEVEL2_EXERCISES = [
  { type: 'mc', question: 'Chọn từ đúng: "Both ___ us are ready."', options: ['of', 'the', 'a', 'an'], answer: 'of', explanation: 'both of us = cả hai chúng ta.', instruction: 'Chọn đáp án đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "Neither of them ___ available."', options: ['is', 'are', 'was', 'were'], answer: 'is', explanation: 'neither of them là số ít → is.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"either" nghĩa là "một trong hai".', answer: 'true', explanation: 'either = một trong hai.', instruction: 'Đúng hay sai?' },
  { type: 'mc', question: 'Chọn từ đúng: "All the ___ is new."', options: ['equipment', 'equipments', 'an equipment', 'the equipments'], answer: 'equipment', explanation: 'equipment không đếm được → không thêm -s.', instruction: 'Chọn đáp án đúng.' },
  { type: 'typing', question: 'Gõ từ cho "hành lý":', answer: 'luggage', explanation: 'luggage = hành lý.', instruction: 'Gõ từ đúng.' },
  { type: 'mc', question: 'Chọn từ đúng: "Can I ask for some ___ ?"', options: ['advice', 'advices', 'an advice', 'the advices'], answer: 'advice', explanation: 'advice không đếm được.', instruction: 'Chọn đáp án đúng.' },
  { type: 'matching', question: 'Ghép từ với nghĩa:', pairs: [{ left: 'feedback', right: 'ý kiến phản hồi' }, { left: 'equipment', right: 'thiết bị' }, { left: 'luggage', right: 'hành lý' }, { left: 'supplies', right: 'đồ dùng' }], answer: 'matched', explanation: 'Ghép đúng.', instruction: 'Ghép đúng.' },
  { type: 'mc', question: 'Chọn câu đúng:', options: ['This information is useful.', 'These information are useful.', 'This informations is useful.', 'These informations are useful.'], answer: 'This information is useful.', explanation: 'information không đếm được → this + is.', instruction: 'Chọn đáp án đúng.' },
  { type: 'tf', question: '"option" và "choice" đều là danh từ đếm được.', answer: 'true', explanation: 'Cả hai đều đếm được (an option, a choice).', instruction: 'Đúng hay sai?' },
  { type: 'typing', question: 'Gõ từ cho "sự lựa chọn":', answer: 'choice', explanation: 'choice = sự lựa chọn.', instruction: 'Gõ từ đúng.' },
]

export const L08_LEVEL1_DICTATION = [
  { audio: 'a few friends', answer: 'a few friends', vi: 'một vài người bạn' },
  { audio: 'few friends', answer: 'few friends', vi: 'ít bạn' },
  { audio: 'a little time', answer: 'a little time', vi: 'một chút thời gian' },
  { audio: 'little time', answer: 'little time', vi: 'rất ít thời gian' },
  { audio: 'some advice', answer: 'some advice', vi: 'một ít lời khuyên' },
  { audio: 'any questions', answer: 'any questions', vi: 'câu hỏi nào' },
  { audio: 'many options', answer: 'many options', vi: 'nhiều lựa chọn' },
  { audio: 'much information', answer: 'much information', vi: 'nhiều thông tin' },
  { audio: 'most people', answer: 'most people', vi: 'đa số mọi người' },
  { audio: 'most of us', answer: 'most of us', vi: 'đa số chúng ta' },
  { audio: 'almost all', answer: 'almost all', vi: 'gần như tất cả' },
  { audio: 'each person', answer: 'each person', vi: 'từng người' },
]

export const L08_LEVEL2_DICTATION = [
  { audio: 'every day', answer: 'every day', vi: 'mỗi ngày' },
  { audio: 'both of us', answer: 'both of us', vi: 'cả hai chúng ta' },
  { audio: 'either of them', answer: 'either of them', vi: 'một trong hai' },
  { audio: 'neither of them', answer: 'neither of them', vi: 'không cái nào trong hai' },
  { audio: 'feedback', answer: 'feedback', vi: 'ý kiến phản hồi' },
  { audio: 'equipment', answer: 'equipment', vi: 'thiết bị' },
  { audio: 'luggage', answer: 'luggage', vi: 'hành lý' },
  { audio: 'advice', answer: 'advice', vi: 'lời khuyên' },
  { audio: 'information', answer: 'information', vi: 'thông tin' },
  { audio: 'option', answer: 'option', vi: 'phương án' },
  { audio: 'choice', answer: 'choice', vi: 'sự lựa chọn' },
  { audio: 'supplies', answer: 'supplies', vi: 'đồ dùng' },
]

export const L08_LEVEL1_PRONUNCIATION = [
  { word: 'a few friends', ipa: '/ə fjuː frendz/', vi: 'một vài người bạn' },
  { word: 'few friends', ipa: '/fjuː frendz/', vi: 'ít bạn' },
  { word: 'a little time', ipa: '/ə ˈlɪtəl taɪm/', vi: 'một chút thời gian' },
  { word: 'little time', ipa: '/ˈlɪtəl taɪm/', vi: 'rất ít thời gian' },
  { word: 'some advice', ipa: '/səm ədˈvaɪs/', vi: 'một ít lời khuyên' },
  { word: 'any questions', ipa: '/ˈeni ˈkwestʃənz/', vi: 'câu hỏi nào' },
  { word: 'many options', ipa: '/ˈmeni ˈɑːpʃənz/', vi: 'nhiều lựa chọn' },
  { word: 'much information', ipa: '/mʌtʃ ˌɪnfɚˈmeɪʃən/', vi: 'nhiều thông tin' },
  { word: 'most people', ipa: '/moʊst ˈpiːpəl/', vi: 'đa số mọi người' },
  { word: 'most of us', ipa: '/moʊst əv əs/', vi: 'đa số chúng ta' },
  { word: 'almost all', ipa: '/ˈɔːlmoʊst ɔːl/', vi: 'gần như tất cả' },
  { word: 'each person', ipa: '/iːtʃ ˈpɜːrsən/', vi: 'từng người' },
]

export const L08_LEVEL2_PRONUNCIATION = [
  { word: 'every day', ipa: '/ˈevri deɪ/', vi: 'mỗi ngày' },
  { word: 'both of us', ipa: '/boʊθ əv əs/', vi: 'cả hai chúng ta' },
  { word: 'either of them', ipa: '/ˈiːðɚ əv ðəm/', vi: 'một trong hai' },
  { word: 'neither of them', ipa: '/ˈniːðɚ əv ðəm/', vi: 'không cái nào trong hai' },
  { word: 'feedback', ipa: '/ˈfiːdbæk/', vi: 'ý kiến phản hồi' },
  { word: 'equipment', ipa: '/ɪˈkwɪpmənt/', vi: 'thiết bị' },
  { word: 'luggage', ipa: '/ˈlʌɡɪdʒ/', vi: 'hành lý' },
  { word: 'advice', ipa: '/ədˈvaɪs/', vi: 'lời khuyên' },
  { word: 'information', ipa: '/ˌɪnfɚˈmeɪʃən/', vi: 'thông tin' },
  { word: 'option', ipa: '/ˈɑːpʃən/', vi: 'phương án' },
  { word: 'choice', ipa: '/tʃɔɪs/', vi: 'sự lựa chọn' },
  { word: 'supplies', ipa: '/səˈplaɪz/', vi: 'đồ dùng' },
]

export const L08_META = {
  title: 'L08 · Confusing Quantity and Choice',
  subtitle: 'few/a few, most/almost, either/neither, danh từ không đếm được',
  description: 'Chọn đúng lượng. Nói rõ ý trong từng ngữ cảnh.',
}
