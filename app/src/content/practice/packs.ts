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
  paragraph?: { prompt: string; vi: string; model: string; must: string[] }
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
    paragraph: {
      prompt: 'Write a short message to a friend: you are ill today, what you have, what you should do, and when you will be back at school.',
      vi: 'Viết tin nhắn cho bạn: hôm nay bạn bị ốm, triệu chứng, bạn nên làm gì và khi nào đi học lại.',
      model: 'Hi Lan, I am sorry but I cannot come to class today. I have a sore throat and a light fever. The doctor says I should stay home and take one tablet three times a day. I will be back at school on Monday. See you then.',
      must: ['sore', 'tablet'],
    },
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
    paragraph: {
      prompt: 'Write a short message to the owner: which room you want, when you can see it, and one question about the rent.',
      vi: 'Viết tin nhắn cho chủ nhà: bạn muốn phòng nào, khi nào xem được và một câu hỏi về tiền thuê.',
      model: 'Hello, I am interested in the room near the bus stop. I can come and see it this afternoon after five. Does the rent include the electricity bill? Please let me know. Thank you.',
      must: ['rent', 'room'],
    },
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
  {
    id: 'a2-train',
    level: 'A2',
    title: 'At the train station',
    vi: 'Ở ga tàu',
    lines: [
      'Two tickets to Da Nang, please.',
      'Do you want a window seat?',
      'The train leaves at half past seven.',
      'How long does the journey take?',
      'About four hours, with one stop.',
      'You need to change at Hue.',
    ],
    reading: {
      title: 'Travel notice',
      text:
        'The morning train to Da Nang leaves at half past seven from platform three. The journey takes about four hours and there is one stop at Hue, where passengers must change trains. Tickets cost fifteen dollars and a window seat costs two dollars more. Please arrive fifteen minutes before departure. Food and drinks are sold on the train, but hot meals are only available in the first carriage.',
      glossary: {
        platform: 'sân ga',
        journey: 'chuyến đi',
        passengers: 'hành khách',
        departure: 'giờ khởi hành',
        carriage: 'toa tàu',
        available: 'có sẵn',
        change: 'đổi (tàu)',
        seat: 'chỗ ngồi',
      },
      questions: [
        {
          q: 'What time does the train leave?',
          options: ['Seven o’clock', 'Half past seven', 'Half past eight', 'Fifteen minutes later'],
          answer: 'Half past seven',
        },
        {
          q: 'Where must passengers change trains?',
          options: ['At Da Nang', 'At Hue', 'At platform three', 'Nowhere'],
          answer: 'At Hue',
        },
        {
          q: 'Where can you buy a hot meal?',
          options: ['At the station', 'In the first carriage', 'In every carriage', 'Nowhere on the train'],
          answer: 'In the first carriage',
        },
      ],
    },
    build: [
      { en: 'I would like two tickets to Da Nang.', vi: 'Tôi muốn hai vé đi Đà Nẵng.' },
      { en: 'The train leaves at half past seven.', vi: 'Tàu khởi hành lúc 7 giờ 30.' },
      { en: 'How long does the journey take?', vi: 'Chuyến đi mất bao lâu?' },
    ],
    translate: [
      { vi: 'Tôi muốn mua hai vé đi Đà Nẵng.', en: 'I would like two tickets to Da Nang.' },
      { vi: 'Tôi phải đổi tàu ở đâu?', en: 'Where do I have to change trains?' },
    ],
    paragraph: {
      prompt: 'Write a short message to a friend about your train: where you are going, what time it leaves and when you arrive.',
      vi: 'Viết tin nhắn cho bạn về chuyến tàu: bạn đi đâu, tàu khởi hành lúc mấy giờ và khi nào đến.',
      model: 'Hi Nam, I am going to Da Nang tomorrow. The train leaves at half past seven from platform three. The journey takes about four hours, so I will arrive before lunch. I will call you when I get there.',
      must: ['train', 'leaves'],
    },
  },
  {
    id: 'a2-restaurant',
    level: 'A2',
    title: 'Ordering at a restaurant',
    vi: 'Gọi món ở nhà hàng',
    lines: [
      'Could we see the menu, please?',
      'I would like the chicken soup.',
      'Does it come with rice?',
      'Would you like something to drink?',
      'Just water, thank you.',
      'Could we have the bill, please?',
    ],
    reading: {
      title: 'Tonight’s menu',
      text:
        'The restaurant opens at six in the evening and closes at eleven. Today’s soup is chicken with rice, and the fish is served with potatoes and salad. A small bottle of water costs one dollar. Tea and coffee are free after eight. We do not take cards under ten dollars, so please pay in cash. The kitchen closes at ten thirty, but drinks are served until closing time.',
      glossary: {
        menu: 'thực đơn',
        served: 'được phục vụ',
        salad: 'rau trộn',
        free: 'miễn phí',
        cash: 'tiền mặt',
        kitchen: 'nhà bếp',
        bill: 'hoá đơn',
        order: 'gọi món',
      },
      questions: [
        {
          q: 'What comes with the fish?',
          options: ['Rice and soup', 'Potatoes and salad', 'Bread and tea', 'Nothing'],
          answer: 'Potatoes and salad',
        },
        {
          q: 'When is tea free?',
          options: ['All evening', 'Before six', 'After eight', 'Never'],
          answer: 'After eight',
        },
        {
          q: 'How should you pay for a small order?',
          options: ['By card', 'In cash', 'By phone', 'With a coupon'],
          answer: 'In cash',
        },
      ],
    },
    build: [
      { en: 'Could I have the menu, please?', vi: 'Cho tôi xem thực đơn được không?' },
      { en: 'I would like the chicken soup.', vi: 'Tôi muốn món súp gà.' },
      { en: 'Could we have the bill, please?', vi: 'Cho chúng tôi hoá đơn được không?' },
    ],
    translate: [
      { vi: 'Tôi muốn thanh toán.', en: 'I would like to pay.' },
      { vi: 'Món này có kèm cơm không?', en: 'Does it come with rice?' },
    ],
    paragraph: {
      prompt: 'Write a short review of a restaurant: what you ate, how the service was and if you will come back.',
      vi: 'Viết một đánh giá ngắn về nhà hàng: bạn ăn gì, phục vụ thế nào và có quay lại không.',
      model: 'I went to a small restaurant near my house last night. I had chicken soup with rice and it was very good. The staff were friendly and the bill was only eight dollars. I will come back next week with my family.',
      must: ['restaurant', 'bill'],
    },
  },
  {
    id: 'a2-weekend',
    level: 'A2',
    title: 'My last weekend',
    vi: 'Cuối tuần trước của tôi',
    lines: [
      'What did you do at the weekend?',
      'I went to the beach with my sister.',
      'We swam and ate seafood.',
      'Did you take any photos?',
      'Yes, but my phone got wet.',
      'That sounds like a good day anyway.',
    ],
    reading: {
      title: 'A message about Saturday',
      text:
        'On Saturday my sister and I went to the beach near Vung Tau. We left at six in the morning and arrived two hours later. The water was warm, so we swam for a long time. In the afternoon we ate seafood at a small restaurant and it was cheap. I took a lot of photos, but my phone fell in the water and stopped working. We came home late but very happy.',
      glossary: {
        beach: 'bãi biển',
        arrived: 'đến nơi',
        swam: 'đã bơi',
        cheap: 'rẻ',
        photos: 'ảnh',
        stopped: 'ngừng hoạt động',
        late: 'muộn',
        happy: 'vui',
      },
      questions: [
        {
          q: 'When did they leave?',
          options: ['At six in the morning', 'At two in the afternoon', 'At six in the evening', 'At midnight'],
          answer: 'At six in the morning',
        },
        {
          q: 'What happened to the phone?',
          options: ['It was stolen', 'It fell in the water', 'It ran out of battery', 'It was left at home'],
          answer: 'It fell in the water',
        },
        {
          q: 'How was the meal?',
          options: ['Expensive', 'Cheap', 'Cold', 'Late'],
          answer: 'Cheap',
        },
      ],
    },
    build: [
      { en: 'I went to the beach with my sister.', vi: 'Tôi đã đi biển với chị gái.' },
      { en: 'We swam and ate seafood.', vi: 'Chúng tôi bơi và ăn hải sản.' },
      { en: 'Did you take any photos?', vi: 'Bạn có chụp ảnh nào không?' },
    ],
    translate: [
      { vi: 'Cuối tuần trước bạn đã làm gì?', en: 'What did you do at the weekend?' },
      { vi: 'Tôi đã về nhà muộn.', en: 'I came home late.' },
    ],
    paragraph: {
      prompt: 'Write about your last weekend: where you went, what you did and how you felt.',
      vi: 'Viết về cuối tuần trước: bạn đi đâu, làm gì và cảm thấy thế nào.',
      model: 'Last Saturday I went to the beach with my sister. We left early in the morning and swam for two hours. In the afternoon we ate seafood at a cheap restaurant. It was a very good day and I felt happy.',
      must: ['went', 'was'],
    },
  },
  {
    id: 'a2-plans',
    level: 'A2',
    title: 'Plans for next week',
    vi: 'Kế hoạch tuần sau',
    lines: [
      'What are you going to do next week?',
      'I am going to start a new English class.',
      'Are you going to study every evening?',
      'I am going to try, but I work late.',
      'We could practise together on Saturday.',
      'That is a good idea.',
    ],
    reading: {
      title: 'Mai’s plan',
      text:
        'Mai is going to start a new English class on Monday. The class is on Tuesday and Thursday evenings, from seven to nine. She is going to study for thirty minutes every morning before work. On Saturday she is going to practise speaking with a friend in a coffee shop. She is not going to take a holiday this year, because she wants to save money for a trip to Japan.',
      glossary: {
        plan: 'kế hoạch',
        practise: 'luyện tập',
        save: 'tiết kiệm',
        trip: 'chuyến đi',
        holiday: 'kỳ nghỉ',
        evenings: 'các buổi tối',
        together: 'cùng nhau',
        start: 'bắt đầu',
      },
      questions: [
        {
          q: 'When is Mai’s class?',
          options: ['Monday morning', 'Tuesday and Thursday evenings', 'Every morning', 'Saturday afternoon'],
          answer: 'Tuesday and Thursday evenings',
        },
        {
          q: 'What is she going to do on Saturday?',
          options: ['Work late', 'Practise speaking with a friend', 'Take a holiday', 'Study grammar alone'],
          answer: 'Practise speaking with a friend',
        },
        {
          q: 'Why is she not taking a holiday?',
          options: ['She has no time', 'She wants to save money', 'Her class is expensive', 'She dislikes travel'],
          answer: 'She wants to save money',
        },
      ],
    },
    build: [
      { en: 'I am going to start a new class.', vi: 'Tôi định bắt đầu một lớp mới.' },
      { en: 'We could practise together on Saturday.', vi: 'Chúng ta có thể luyện cùng nhau vào thứ Bảy.' },
      { en: 'What are you going to do next week?', vi: 'Tuần sau bạn định làm gì?' },
    ],
    translate: [
      { vi: 'Tôi định học tiếng Anh mỗi tối.', en: 'I am going to study English every evening.' },
      { vi: 'Chủ nhật tôi sẽ không đi làm.', en: 'I am not going to work on Sunday.' },
    ],
    paragraph: {
      prompt: 'Write about your plans for next week: two things you are going to do and one thing you are not going to do.',
      vi: 'Viết về kế hoạch tuần sau: hai việc bạn định làm và một việc bạn không định làm.',
      model: 'Next week I am going to start a new English class on Tuesday evening. I am also going to practise speaking with a friend on Saturday. I am not going to work at the weekend because I need to rest.',
      must: ['going', 'not'],
    },
  },
  {
    id: 'a2-clothes',
    level: 'A2',
    title: 'Shopping for clothes',
    vi: 'Mua quần áo',
    lines: [
      'Can I try this jacket on?',
      'What size are you looking for?',
      'Do you have it in a smaller size?',
      'It is a bit too long.',
      'We have a blue one in medium.',
      'How much is it?',
    ],
    reading: {
      title: 'Shop information',
      text:
        'You can try clothes on in the rooms at the back of the shop. If the size is wrong, please ask a member of staff and we will bring another one. Clothes can be returned within fourteen days if you keep the receipt. Sale items cannot be returned. We accept cards and cash. The shop is open from nine to nine every day except Sunday, when we close at six.',
      glossary: {
        size: 'cỡ, kích cỡ',
        return: 'trả lại',
        receipt: 'hoá đơn',
        sale: 'giảm giá',
        accept: 'chấp nhận',
        staff: 'nhân viên',
        except: 'trừ',
        medium: 'cỡ vừa',
      },
      questions: [
        {
          q: 'Where can you try clothes on?',
          options: ['At the front door', 'In the rooms at the back', 'At the cash desk', 'Online only'],
          answer: 'In the rooms at the back',
        },
        {
          q: 'How long do you have to return something?',
          options: ['Seven days', 'Fourteen days', 'One month', 'No returns'],
          answer: 'Fourteen days',
        },
        {
          q: 'What time does the shop close on Sunday?',
          options: ['At six', 'At nine', 'At noon', 'It stays open'],
          answer: 'At six',
        },
      ],
    },
    build: [
      { en: 'Can I try this jacket on?', vi: 'Tôi có thể thử áo khoác này không?' },
      { en: 'Do you have it in a smaller size?', vi: 'Có cỡ nhỏ hơn không?' },
      { en: 'How much is this shirt?', vi: 'Cái áo sơ mi này giá bao nhiêu?' },
    ],
    translate: [
      { vi: 'Cái này hơi dài.', en: 'This is a bit too long.' },
      { vi: 'Tôi muốn trả lại cái áo này.', en: 'I would like to return this shirt.' },
    ],
    paragraph: {
      prompt: 'Write a short message to a shop: what you bought, what is wrong with it and what you want them to do.',
      vi: 'Viết tin nhắn cho cửa hàng: bạn mua gì, có vấn đề gì và bạn muốn họ làm gì.',
      model: 'Hello, I bought a blue jacket in your shop on Monday. The size is wrong and it is a bit too long for me. Can I change it for a smaller size? I still have the receipt. Thank you.',
      must: ['size', 'receipt'],
    },
  },
  {
    id: 'a2-appointment',
    level: 'A2',
    title: 'Booking a doctor’s appointment',
    vi: 'Đặt lịch khám',
    lines: [
      'I would like to book an appointment.',
      'Are you free on Thursday morning?',
      'I have a pain in my back.',
      'Can you come at ten thirty?',
      'I will be there at ten fifteen.',
      'Please bring your insurance card.',
    ],
    reading: {
      title: 'Clinic information',
      text:
        'The clinic is open from eight in the morning until six in the evening, Monday to Friday. Appointments are free, but please arrive ten minutes early. Bring your insurance card and a list of your medicines. If you cannot come, call us at least one day before, because other patients are waiting. For emergencies, go to the hospital on the next street, which is open all night.',
      glossary: {
        appointment: 'cuộc hẹn khám',
        clinic: 'phòng khám',
        insurance: 'bảo hiểm',
        medicines: 'thuốc',
        emergencies: 'trường hợp khẩn cấp',
        patients: 'bệnh nhân',
        early: 'sớm',
        hospital: 'bệnh viện',
      },
      questions: [
        {
          q: 'When does the clinic close?',
          options: ['At six in the morning', 'At six in the evening', 'At eight', 'It never closes'],
          answer: 'At six in the evening',
        },
        {
          q: 'What should you bring?',
          options: ['Money for the appointment', 'Your insurance card', 'A friend', 'Food'],
          answer: 'Your insurance card',
        },
        {
          q: 'What should you do for an emergency?',
          options: ['Wait until Monday', 'Call the clinic at six', 'Go to the hospital nearby', 'Book online'],
          answer: 'Go to the hospital nearby',
        },
      ],
    },
    build: [
      { en: 'I would like to book an appointment.', vi: 'Tôi muốn đặt lịch khám.' },
      { en: 'I have a pain in my back.', vi: 'Tôi bị đau lưng.' },
      { en: 'Are you free on Thursday morning?', vi: 'Thứ Năm buổi sáng bạn có rảnh không?' },
    ],
    translate: [
      { vi: 'Tôi muốn đổi lịch hẹn.', en: 'I would like to change my appointment.' },
      { vi: 'Tôi sẽ đến lúc mười giờ mười lăm.', en: 'I will be there at ten fifteen.' },
    ],
    paragraph: {
      prompt: 'Write a short message to the clinic: why you need an appointment, when you are free and your phone number.',
      vi: 'Viết tin nhắn cho phòng khám: vì sao bạn cần đặt lịch, khi nào bạn rảnh và số điện thoại.',
      model: 'Hello, I would like to book an appointment because I have a pain in my back. I am free on Thursday morning or Friday afternoon. My phone number is 0901 234 567. Thank you very much.',
      must: ['appointment', 'free'],
    },
  },
]

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2']

export function packsFor(level: Level): Pack[] {
  return PACKS.filter((p) => p.level === level)
}
