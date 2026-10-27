/**
 * Self-study content, written by hand and kept next to the code.
 * A1 comes from the course lessons; A2–B2 live here so a learner can practise above
 * their class level without waiting for a new slide deck.
 * Every question is closed (one right answer) so the app can mark it without a teacher.
 */

export type Level = 'A1' | 'A2' | 'B1' | 'B2'

export type Question = { q: string; options: string[]; answer: string }

export type Pack = {
  id: string
  level: Level
  title: string
  vi: string
  lines: string[]
  reading: { title: string; text: string; glossary: Record<string, string>; questions: Question[] }
  build: { en: string; vi: string }[]
  translate: { vi: string; en: string }[]
}

export const PACKS: Pack[] = [
  {
    id: 'a2-pharmacy',
    level: 'A2',
    title: 'At the pharmacy',
    vi: 'Ở nhà thuốc',
    lines: [
      'Good morning. I need something for a sore throat.',
      'Do you have a fever as well?',
      'Take one tablet three times a day after meals.',
      'You should drink plenty of warm water.',
      'How much is the cough syrup?',
      'It is eight dollars. Would you like a receipt?',
    ],
    reading: {
      title: 'A note from the doctor',
      text:
        'Mai has a sore throat and a light fever. The doctor says it is not serious. She should take one tablet three times a day, after meals. She must drink warm water and stay home for two days. She should not drink cold drinks or coffee. If the fever is still high on Friday, she has to come back to the clinic. The medicine costs eight dollars and the receipt is in her bag.',
      glossary: {
        sore: 'đau, rát',
        throat: 'cổ họng',
        fever: 'sốt',
        tablet: 'viên thuốc',
        serious: 'nghiêm trọng',
        clinic: 'phòng khám',
        receipt: 'hoá đơn',
        medicine: 'thuốc',
      },
      questions: [
        {
          q: 'How often should Mai take the tablet?',
          options: ['Once a day', 'Three times a day', 'Every two hours', 'Only at night'],
          answer: 'Three times a day',
        },
        {
          q: 'What should she avoid?',
          options: ['Warm water', 'Cold drinks and coffee', 'Rice and soup', 'Rest at home'],
          answer: 'Cold drinks and coffee',
        },
        {
          q: 'When must she go back to the clinic?',
          options: ['On Monday', 'If the fever is still high on Friday', 'Every morning', 'After one month'],
          answer: 'If the fever is still high on Friday',
        },
      ],
    },
    build: [
      { en: 'I have a sore throat today.', vi: 'Hôm nay tôi bị đau họng.' },
      { en: 'Take this medicine after lunch.', vi: 'Uống thuốc này sau bữa trưa.' },
      { en: 'How much does it cost?', vi: 'Cái này giá bao nhiêu?' },
    ],
    translate: [
      { vi: 'Tôi bị đau họng.', en: 'I have a sore throat.' },
      { vi: 'Tôi nên uống thuốc mấy lần một ngày?', en: 'How many times a day should I take the medicine?' },
    ],
  },
  {
    id: 'a2-renting',
    level: 'A2',
    title: 'Looking for a room',
    vi: 'Tìm phòng trọ',
    lines: [
      'I am calling about the room you advertised.',
      'Is it still available?',
      'The rent is four hundred dollars a month.',
      'Does it include the electricity bill?',
      'You can move in next Monday.',
      'Can I see it this afternoon?',
    ],
    reading: {
      title: 'Room for rent',
      text:
        'A small room is free from next Monday. The rent is four hundred dollars a month and it includes water, but not electricity. The room is on the second floor of a quiet house near the bus stop. There is a desk, a bed and a small kitchen. No pets are allowed. Visitors can stay for a few days, but they must tell the owner first. Please call between six and eight in the evening.',
      glossary: {
        rent: 'tiền thuê',
        include: 'bao gồm',
        electricity: 'tiền điện',
        floor: 'tầng',
        owner: 'chủ nhà',
        quiet: 'yên tĩnh',
        pets: 'thú nuôi',
        visitors: 'khách đến chơi',
      },
      questions: [
        {
          q: 'What does the rent include?',
          options: ['Electricity', 'Water', 'Internet', 'Breakfast'],
          answer: 'Water',
        },
        {
          q: 'Where is the room?',
          options: ['On the ground floor', 'On the second floor', 'In a hotel', 'Outside the city'],
          answer: 'On the second floor',
        },
        {
          q: 'When should you call?',
          options: ['In the morning', 'At lunchtime', 'Between six and eight in the evening', 'Any time at night'],
          answer: 'Between six and eight in the evening',
        },
      ],
    },
    build: [
      { en: 'I would like to see the room.', vi: 'Tôi muốn xem phòng.' },
      { en: 'The rent includes water but not electricity.', vi: 'Tiền thuê gồm nước nhưng không gồm điện.' },
      { en: 'Is the flat near the bus stop?', vi: 'Căn hộ có gần trạm xe buýt không?' },
    ],
    translate: [
      { vi: 'Tôi muốn xem phòng.', en: 'I would like to see the room.' },
      { vi: 'Tiền thuê đã gồm tiền điện chưa?', en: 'Does the rent include electricity?' },
    ],
  },
  {
    id: 'b1-interview',
    level: 'B1',
    title: 'A job interview',
    vi: 'Phỏng vấn xin việc',
    lines: [
      'Could you tell me a little about yourself?',
      'I have worked in sales for three years.',
      'What made you apply for this role?',
      'I would like to grow into a team lead position.',
      'When would you be able to start?',
      'I can start at the beginning of next month.',
    ],
    reading: {
      title: 'Candidate summary',
      text:
        'Lan has worked in sales for three years, first in a small shop and then for an online company. She is applying for a team lead role because she enjoys training new staff. Her manager says she is reliable and calm with difficult customers. She speaks English and Vietnamese, and she is studying for a marketing certificate in the evening. She can start at the beginning of next month, after she finishes her current projects.',
      glossary: {
        apply: 'ứng tuyển',
        reliable: 'đáng tin cậy',
        staff: 'nhân viên',
        training: 'đào tạo',
        certificate: 'chứng chỉ',
        current: 'hiện tại',
        manager: 'quản lý',
        customers: 'khách hàng',
      },
      questions: [
        {
          q: 'Why is Lan applying for the role?',
          options: ['She wants a higher salary', 'She enjoys training new staff', 'She is moving abroad', 'She dislikes sales'],
          answer: 'She enjoys training new staff',
        },
        {
          q: 'What is she studying in the evening?',
          options: ['English', 'Accounting', 'A marketing certificate', 'Design'],
          answer: 'A marketing certificate',
        },
        {
          q: 'When can she start?',
          options: ['Immediately', 'Next week', 'At the beginning of next month', 'Next year'],
          answer: 'At the beginning of next month',
        },
      ],
    },
    build: [
      { en: 'I have three years of experience in sales.', vi: 'Tôi có ba năm kinh nghiệm bán hàng.' },
      { en: 'I am interested in this position.', vi: 'Tôi quan tâm đến vị trí này.' },
      { en: 'I can start at the beginning of next month.', vi: 'Tôi có thể bắt đầu vào đầu tháng sau.' },
    ],
    translate: [
      { vi: 'Tôi có ba năm kinh nghiệm trong lĩnh vực bán hàng.', en: 'I have three years of experience in sales.' },
      { vi: 'Tôi muốn phát triển thành trưởng nhóm.', en: 'I would like to grow into a team lead position.' },
    ],
  },
  {
    id: 'b1-complaint',
    level: 'B1',
    title: 'Complaining politely',
    vi: 'Phàn nàn lịch sự',
    lines: [
      'I am afraid there is a problem with my order.',
      'Could you check it for me?',
      'It was supposed to arrive yesterday.',
      'I understand. I will look into it right away.',
      'Would you like a refund or a replacement?',
      'A replacement would be fine, thank you.',
    ],
    reading: {
      title: 'A complaint email',
      text:
        'Dear Sir, I am writing about order 4821, which was supposed to arrive on Monday. It is now Thursday and nothing has arrived. I contacted your office twice, but I have not received an answer. I understand that delays happen, but I would appreciate an update today. If the item cannot be delivered this week, please send a replacement or a refund. I have been a customer for four years and I would like to continue shopping with you.',
      glossary: {
        order: 'đơn hàng',
        supposed: 'đáng lẽ',
        delay: 'sự chậm trễ',
        appreciate: 'cảm kích',
        update: 'thông tin mới',
        refund: 'hoàn tiền',
        replacement: 'hàng đổi',
        customer: 'khách hàng',
      },
      questions: [
        {
          q: 'When was the order supposed to arrive?',
          options: ['On Monday', 'On Thursday', 'Last month', 'Tomorrow'],
          answer: 'On Monday',
        },
        {
          q: 'What has the customer already done?',
          options: ['Cancelled the order', 'Contacted the office twice', 'Returned the item', 'Written a review'],
          answer: 'Contacted the office twice',
        },
        {
          q: 'What does the customer want?',
          options: ['A discount only', 'An update today, or a replacement or refund', 'A new email address', 'A different product'],
          answer: 'An update today, or a replacement or refund',
        },
      ],
    },
    build: [
      { en: 'I am afraid there is a problem with my order.', vi: 'Tôi e là có vấn đề với đơn hàng của tôi.' },
      { en: 'Could you send me a replacement?', vi: 'Anh có thể gửi cho tôi hàng đổi không?' },
      { en: 'It was supposed to arrive yesterday.', vi: 'Đáng lẽ nó phải đến từ hôm qua.' },
    ],
    translate: [
      { vi: 'Đơn hàng của tôi vẫn chưa đến.', en: 'My order has not arrived yet.' },
      { vi: 'Tôi muốn được hoàn tiền.', en: 'I would like a refund.' },
    ],
  },
  {
    id: 'b2-deadline',
    level: 'B2',
    title: 'Negotiating a deadline',
    vi: 'Thương lượng tiến độ',
    lines: [
      'We are concerned the timeline is too tight.',
      'We could deliver the first phase by Friday.',
      'Would you consider moving the launch back a week?',
      'That works, as long as testing is complete.',
      'We will need two extra days for quality checks.',
      'Let us confirm this in writing today.',
    ],
    reading: {
      title: 'Project update',
      text:
        'The team has completed the design phase and started development. Two of the five features are ready for review. Testing will take longer than planned because the payment provider changed its interface last week. We can still deliver the first phase by Friday, but a full launch next Wednesday would leave no time for quality checks. We suggest moving the launch back by one week and confirming the new dates in writing.',
      glossary: {
        timeline: 'tiến độ',
        phase: 'giai đoạn',
        launch: 'ra mắt',
        testing: 'kiểm thử',
        provider: 'nhà cung cấp',
        interface: 'giao diện lập trình',
        quality: 'chất lượng',
        confirm: 'xác nhận',
      },
      questions: [
        {
          q: 'Why will testing take longer?',
          options: ['The team is small', 'The payment provider changed its interface', 'Design is unfinished', 'The client is on holiday'],
          answer: 'The payment provider changed its interface',
        },
        {
          q: 'What does the team suggest?',
          options: ['Cancelling the launch', 'Moving the launch back one week', 'Skipping testing', 'Hiring new staff'],
          answer: 'Moving the launch back one week',
        },
        {
          q: 'What must still happen for Friday?',
          options: ['Design approval', 'Delivery of the first phase', 'A new provider', 'A price change'],
          answer: 'Delivery of the first phase',
        },
      ],
    },
    build: [
      { en: 'We are concerned that the timeline may be too tight.', vi: 'Chúng tôi lo rằng tiến độ có thể quá gấp.' },
      { en: 'Would you consider moving the launch back?', vi: 'Anh có cân nhắc dời ngày ra mắt không?' },
      { en: 'Let us confirm this in writing today.', vi: 'Hôm nay chúng ta xác nhận bằng văn bản nhé.' },
    ],
    translate: [
      { vi: 'Chúng tôi cần thêm hai ngày để kiểm tra chất lượng.', en: 'We need two extra days for quality checks.' },
      { vi: 'Chúng tôi có thể giao giai đoạn đầu vào thứ Sáu.', en: 'We can deliver the first phase by Friday.' },
    ],
  },
  {
    id: 'b2-numbers',
    level: 'B2',
    title: 'Presenting numbers',
    vi: 'Trình bày số liệu',
    lines: [
      'Sales grew by twelve percent last quarter.',
      'That is slightly below our target.',
      'Most of the growth came from online orders.',
      'We expect the trend to continue.',
      'What is driving the increase?',
      'Customers prefer the shorter delivery times.',
    ],
    reading: {
      title: 'Quarterly summary',
      text:
        'Sales grew by twelve percent last quarter, slightly below the fifteen percent target. Online orders produced most of the growth, while shop sales stayed flat. The average order value rose by three dollars, mainly because customers bought larger packs. Return rates fell from eight to five percent after the delivery time was cut to two days. We expect the trend to continue next quarter, although competition on price is increasing.',
      glossary: {
        quarter: 'quý',
        target: 'mục tiêu',
        growth: 'tăng trưởng',
        average: 'trung bình',
        return: 'trả lại hàng',
        trend: 'xu hướng',
        competition: 'cạnh tranh',
        delivery: 'giao hàng',
      },
      questions: [
        {
          q: 'How much did sales grow?',
          options: ['Fifteen percent', 'Twelve percent', 'Three percent', 'Five percent'],
          answer: 'Twelve percent',
        },
        {
          q: 'Why did return rates fall?',
          options: ['Prices dropped', 'Delivery time was cut to two days', 'Shops closed', 'Packs got smaller'],
          answer: 'Delivery time was cut to two days',
        },
        {
          q: 'What risk is mentioned?',
          options: ['Fewer online orders', 'Increasing price competition', 'Higher delivery costs', 'Staff shortages'],
          answer: 'Increasing price competition',
        },
      ],
    },
    build: [
      { en: 'Sales grew by twelve percent last quarter.', vi: 'Doanh số tăng 12 phần trăm trong quý trước.' },
      { en: 'Most of the growth came from online orders.', vi: 'Phần lớn mức tăng đến từ đơn hàng online.' },
      { en: 'We expect the trend to continue.', vi: 'Chúng tôi mong xu hướng này tiếp tục.' },
    ],
    translate: [
      { vi: 'Con số này thấp hơn mục tiêu một chút.', en: 'That is slightly below our target.' },
      { vi: 'Khách hàng thích thời gian giao hàng ngắn hơn.', en: 'Customers prefer the shorter delivery times.' },
    ],
  },
]

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2']

export function packsFor(level: Level): Pack[] {
  return PACKS.filter((p) => p.level === level)
}
