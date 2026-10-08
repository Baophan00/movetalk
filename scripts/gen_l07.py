#!/usr/bin/env python3
"""Generate L07 data from PPTX content."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

lesson = {
    "title": "Confusing Quantifiers & Determiners",
    "vi": "Từ chỉ số lượng và từ hạn định dễ gây nhầm",
    "goal": "By the end of this lesson, you can use quantifiers and determiners accurately: almost/most, each/every, few/little, much/many, some/any/no, another/other, fewer/less, both/either/neither, enough/too, all/whole.",
    "today": [
        "Review There is/There are from L06",
        "Learn 10 groups of quantifiers",
        "Practice choosing by meaning",
        "Build accurate sentences"
    ],
    "parts": {
        "vocab": [
            {"t": "h", "text": "Quantifiers & determiners"},
            {"t": "flashcard", "items": [
                {"word": "almost", "phonetic": "/ˈɔːlməʊst/", "vi": "gần như", "def": "nearly, but not completely", "examples": [
                    {"text": "It's almost ready.", "context": "work"},
                    {"text": "I almost forgot the meeting.", "context": "work"}
                ]},
                {"word": "most", "phonetic": "/məʊst/", "vi": "hầu hết, đa số", "def": "the majority of", "examples": [
                    {"text": "Most people agree.", "context": "work"},
                    {"text": "Most of my friends live here.", "context": "daily"}
                ]},
                {"word": "each", "phonetic": "/iːtʃ/", "vi": "mỗi (từng cái riêng)", "def": "every one individually", "examples": [
                    {"text": "Each student has a task.", "context": "work"},
                    {"text": "Each of us has a role.", "context": "work"}
                ]},
                {"word": "every", "phonetic": "/ˈevri/", "vi": "mọi (cả nhóm)", "def": "all members of a group", "examples": [
                    {"text": "Every student has a task.", "context": "work"},
                    {"text": "Every day I study English.", "context": "daily"}
                ]},
                {"word": "a few", "phonetic": "/ə fjuː/", "vi": "một vài (đủ dùng)", "def": "a small number, enough", "examples": [
                    {"text": "I have a few questions.", "context": "work"},
                    {"text": "A few friends came to the party.", "context": "daily"}
                ]},
                {"word": "few", "phonetic": "/fjuː/", "vi": "quá ít", "def": "not many, not enough", "examples": [
                    {"text": "Few people understand the problem.", "context": "work"},
                    {"text": "I have few options.", "context": "work"}
                ]},
                {"word": "a little", "phonetic": "/ə ˈlɪtl/", "vi": "một chút (đủ dùng)", "def": "a small amount, enough", "examples": [
                    {"text": "We have a little time left.", "context": "work"},
                    {"text": "I speak a little English.", "context": "daily"}
                ]},
                {"word": "little", "phonetic": "/ˈlɪtl/", "vi": "quá ít", "def": "not much, not enough", "examples": [
                    {"text": "We have little time left.", "context": "work"},
                    {"text": "There is little information.", "context": "work"}
                ]},
                {"word": "much", "phonetic": "/mʌtʃ/", "vi": "nhiều (không đếm được)", "def": "a large amount of uncountable noun", "examples": [
                    {"text": "How much time do you have?", "context": "work"},
                    {"text": "I don't have much free time.", "context": "daily"}
                ]},
                {"word": "many", "phonetic": "/ˈmeni/", "vi": "nhiều (đếm được)", "def": "a large number of countable noun", "examples": [
                    {"text": "How many meetings do you have?", "context": "work"},
                    {"text": "I have many friends here.", "context": "daily"}
                ]},
                {"word": "a lot of", "phonetic": "/ə lɒt əv/", "vi": "rất nhiều", "def": "a large number/amount", "examples": [
                    {"text": "I have a lot of work today.", "context": "work"},
                    {"text": "There are a lot of people here.", "context": "daily"}
                ]},
                {"word": "some", "phonetic": "/sʌm/", "vi": "một vài", "def": "an unspecified amount", "examples": [
                    {"text": "I need some help.", "context": "work"},
                    {"text": "Would you like some coffee?", "context": "daily"}
                ]},
                {"word": "any", "phonetic": "/ˈeni/", "vi": "bất kỳ", "def": "one or some, in questions/negatives", "examples": [
                    {"text": "Do you have any questions?", "context": "work"},
                    {"text": "I don't have any time.", "context": "work"}
                ]},
                {"word": "another", "phonetic": "/əˈnʌðə/", "vi": "một cái khác", "def": "one more, a different one", "examples": [
                    {"text": "I need another day.", "context": "work"},
                    {"text": "Let's try another way.", "context": "work"}
                ]},
                {"word": "other", "phonetic": "/ˈʌðə/", "vi": "khác", "def": "different ones", "examples": [
                    {"text": "Do you have any other questions?", "context": "work"},
                    {"text": "Other people prefer tea.", "context": "daily"}
                ]},
                {"word": "fewer", "phonetic": "/ˈfjuːə/", "vi": "ít hơn (đếm được)", "def": "a smaller number of countable noun", "examples": [
                    {"text": "We have fewer meetings this month.", "context": "work"},
                    {"text": "I make fewer mistakes now.", "context": "work"}
                ]},
                {"word": "less", "phonetic": "/les/", "vi": "ít hơn (không đếm được)", "def": "a smaller amount of uncountable noun", "examples": [
                    {"text": "This takes less time.", "context": "work"},
                    {"text": "I feel less pressure now.", "context": "work"}
                ]},
                {"word": "both", "phonetic": "/bəʊθ/", "vi": "cả hai", "def": "the two together", "examples": [
                    {"text": "Both options are fine.", "context": "work"},
                    {"text": "Both of us work from home.", "context": "work"}
                ]},
                {"word": "either", "phonetic": "/ˈaɪðə/", "vi": "một trong hai", "def": "one or the other of two", "examples": [
                    {"text": "Either option is fine.", "context": "work"},
                    {"text": "You can choose either day.", "context": "work"}
                ]},
                {"word": "neither", "phonetic": "/ˈnaɪðə/", "vi": "không cái nào", "def": "not one and not the other", "examples": [
                    {"text": "Neither solution works.", "context": "work"},
                    {"text": "I don't like either one.", "context": "daily"}
                ]},
                {"word": "enough", "phonetic": "/ɪˈnʌf/", "vi": "đủ", "def": "as much as needed", "examples": [
                    {"text": "We don't have enough chairs.", "context": "work"},
                    {"text": "Do you have enough information?", "context": "work"}
                ]},
                {"word": "too much", "phonetic": "/tuː mʌtʃ/", "vi": "quá nhiều (không đếm được)", "def": "more than needed, uncountable", "examples": [
                    {"text": "I have too much work.", "context": "work"},
                    {"text": "There is too much noise.", "context": "daily"}
                ]},
                {"word": "too many", "phonetic": "/tuː ˈmeni/", "vi": "quá nhiều (đếm được)", "def": "more than needed, countable", "examples": [
                    {"text": "There are too many emails.", "context": "work"},
                    {"text": "I have too many meetings.", "context": "work"}
                ]},
                {"word": "all", "phonetic": "/ɔːl/", "vi": "tất cả", "def": "the whole amount", "examples": [
                    {"text": "All students passed the test.", "context": "work"},
                    {"text": "I work all day.", "context": "work"}
                ]},
                {"word": "whole", "phonetic": "/həʊl/", "vi": "toàn bộ", "def": "the complete amount", "examples": [
                    {"text": "The whole team agreed.", "context": "work"},
                    {"text": "I worked the whole day.", "context": "work"}
                ]}
            ]},
            {"t": "note", "text": "Choose two people. Say who they are and one thing you like or dislike about them. Accept simple language — ask one follow-up: How do you know them? or What are they like?"}
        ],
        "grammar": [
            {"t": "h", "text": "The decision map — 10 groups"},
            {"t": "table", "head": ["Group", "Words", "Meaning"], "rows": [
                ["1 · Mức độ", "almost / most / almost all", "gần như / đa số"],
                ["2 · Từng người", "each / every", "từng cái riêng / cả nhóm"],
                ["3 · Ít hay quá ít", "a few / few · a little / little", "một vài / quá ít"],
                ["4 · Nhiều", "many / much / a lot of", "nhiều đếm được / không đếm được"],
                ["5 · Một cái khác", "another / other / the other / others", "thêm một / khác"],
                ["6 · So sánh ít hơn", "fewer / less", "ít hơn đếm được / không đếm được"],
                ["7 · Hai lựa chọn", "both / either / neither", "cả hai / một trong hai / không cái nào"],
                ["8 · Đủ hay quá nhiều", "enough / too much / too many", "đủ / quá nhiều"],
                ["9 · Tất cả", "all / whole", "tất cả / toàn bộ"]
            ]},
            {"t": "h", "text": "Key contrasts"},
            {"t": "table", "head": ["Pair", "Meaning", "Example"], "rows": [
                ["a few vs few", "đủ dùng vs quá ít", "a few options (OK) / few options (not enough)"],
                ["a little vs little", "đủ dùng vs quá ít", "a little time (OK) / little time (not enough)"],
                ["fewer vs less", "đếm được vs không đếm được", "fewer meetings / less time"],
                ["each vs every", "từng cái riêng vs cả nhóm", "each document / every day"],
                ["some vs any", "khẳng định vs câu hỏi/phủ định", "some help / any questions"],
                ["enough + N vs adj + enough", "đủ vs đủ", "enough time / big enough"]
            ]}
        ],
        "reading": [
            {"t": "h", "text": "Model answer · A complete turn"},
            {"t": "p", "text": "Almost everyone arrived early, but a few people were still on the way. Each team had a short meeting, and every manager shared the same update. We had little time and too many tasks. Most of the urgent emails were answered, but some other messages had to wait. Neither solution was perfect, so we asked for another day."},
            {"t": "note", "text": "Notice: almost everyone, a few people, each team, every manager, little time, too many tasks, most of, some other, neither solution, another day."}
        ],
        "conversations": [
            {"t": "dialog", "title": "A busy Monday", "target": "almost everyone · a few people · each team · every manager", "lift": "most of · some other · neither solution", "lines": [
                {"speaker": "Mia", "text": "Almost everyone arrived early today."},
                {"speaker": "Lan", "text": "Yes, but a few people were still on the way."},
                {"speaker": "Mia", "text": "Each team had a short meeting."},
                {"speaker": "Lan", "text": "Every manager shared the same update."},
                {"speaker": "Mia", "text": "We had little time and too many tasks."},
                {"speaker": "Lan", "text": "Most of the urgent emails were answered."},
                {"speaker": "Mia", "text": "But some other messages had to wait."},
                {"speaker": "Lan", "text": "Neither solution was perfect, so we asked for another day."}
            ], "check": ["Did almost everyone arrive early?", "Were a few people still on the way?", "Did each team have a meeting?", "Did every manager share the same update?", "Did they have much time?", "Were most urgent emails answered?", "Were some other messages answered?", "Was either solution perfect?"], "answers": "1. Yes. 2. Yes. 3. Yes. 4. Yes. 5. No, they had little time. 6. Yes. 7. No, they had to wait. 8, No, neither was perfect.", "note": "Notice: almost everyone, a few people, each team, every manager, little time, too many tasks, most of, some other, neither solution, another day."},
            {"t": "dialog", "title": "How much or how many?", "target": "how much time · how many meetings · a lot of work", "lift": "too much · too many", "lines": [
                {"speaker": "Mia", "text": "How much time do you have?"},
                {"speaker": "Lan", "text": "Not much. I have too much work today."},
                {"speaker": "Mia", "text": "How many meetings do you have?"},
                {"speaker": "Lan", "text": "Too many. I have a lot of meetings."},
                {"speaker": "Mia", "text": "Do you have any free time?"},
                {"speaker": "Lan", "text": "No, I don't have any free time."}
            ], "check": ["How much time does Lan have?", "How many meetings does Lan have?", "Does Lan have a lot of work?", "Does Lan have any free time?"], "answers": "1. Not much. 2. Too many. 3. Yes, a lot. 4, No, none.", "note": "Notice: how much + uncountable, how many + countable, too much + uncountable, too many + countable, a lot of + both, any + questions/negatives."},
            {"t": "dialog", "title": "Both, either, neither", "target": "both options · either day · neither solution", "lift": "both of us · either one", "lines": [
                {"speaker": "Mia", "text": "Both options are fine."},
                {"speaker": "Lan", "text": "You can choose either day."},
                {"speaker": "Mia", "text": "Neither solution works."},
                {"speaker": "Lan", "text": "Both of us work from home."},
                {"speaker": "Mia", "text": "I don't like either one."},
                {"speaker": "Lan", "text": "Let's try another way."}
            ], "check": ["Are both options fine?", "Can Lan choose either day?", "Does either solution work?", "Do both of them work from home?", "Does Mia like either one?", "What should they try?"], "answers": "1. Yes. 2. Yes. 3. No, neither works. 4. Yes. 5. No. 6. Another way.", "note": "Notice: both + plural, either + singular, neither + singular, both of + pronoun, either one, another way."}
        ],
        "listening": [
            {"t": "h", "text": "Shadowing · Nghe từng câu rồi nhắc lại"},
            {"t": "note", "text": "Bấm 🔊 để nghe từng câu, sau đó nhắc lại y hệt ngữ điệu. Làm 2 lượt: lượt 1 nhìn chữ, lượt 2 che chữ."},
            {"t": "say", "items": [
                "Almost everyone arrived early.",
                "A few people were still on the way.",
                "Each team had a short meeting.",
                "Every manager shared the same update.",
                "We had little time and too many tasks.",
                "Most of the urgent emails were answered."
            ]}
        ],
        "exercises": [
            {"t": "h", "text": "Bài tập 1 · Chọn quantifier đúng"},
            {"t": "quiz", "items": [
                {"q": "___ people understand the problem.", "options": ["Few", "A few", "Little", "A little"], "answer": 0},
                {"q": "We have ___ time left.", "options": ["few", "a few", "little", "a little"], "answer": 2},
                {"q": "I have ___ questions.", "options": ["few", "a few", "little", "a little"], "answer": 1},
                {"q": "She has ___ experience.", "options": ["few", "a few", "little", "a little"], "answer": 3},
                {"q": "___ meetings do you have?", "options": ["How much", "How many", "How long", "How far"], "answer": 1},
                {"q": "___ time do you have?", "options": ["How much", "How many", "How long", "How far"], "answer": 0}
            ]},
            {"t": "note", "text": "Đáp án: 1 Few · 2 little · 3 a few · 4 a little · 5 How many · 6 How much. Quy tắc: few/a few + đếm được, little/a little + không đếm được."},
            {"t": "h", "text": "Bài tập 2 · Chọn từ đúng"},
            {"t": "quiz", "items": [
                {"q": "___ options are possible.", "options": ["Both", "Either", "Neither", "Another"], "answer": 0},
                {"q": "You can choose ___ day.", "options": ["both", "either", "neither", "another"], "answer": 1},
                {"q": "___ solution works.", "options": ["Both", "Either", "Neither", "Another"], "answer": 2},
                {"q": "Let's try ___ way.", "options": ["both", "either", "neither", "another"], "answer": 3},
                {"q": "We have ___ chairs.", "options": ["enough", "too much", "too many", "another"], "answer": 0},
                {"q": "There are ___ emails.", "options": ["enough", "too much", "too many", "another"], "answer": 2}
            ]},
            {"t": "note", "text": "Đáp án: 1 Both · 2 either · 3 Neither · 4 another · 5 enough · 6 too many. Quy tắc: both + plural, either/neither + singular, enough + N, too many + đếm được."}
        ],
        "speaking": [
            {"t": "h", "text": "Question lab · Use quantifiers"},
            {"t": "p", "text": "Work with a partner. Ask 5 questions using quantifiers: How much…? How many…? Do you have any…? Are there many…? Answer with full sentences."},
            {"t": "say", "items": [
                "How much time do you have?",
                "How many meetings do you have?",
                "Do you have any free time?",
                "Are there many people here?",
                "I have a lot of work today.",
                "There are too many emails."
            ]},
            {"t": "note", "text": "Use: How much…? How many…? Do you have any…? Are there many…? Answer with a lot of, too much, too many, enough, some, any."}
        ],
        "roleplay": [
            {"t": "steps", "title": "60-second engine challenge", "context": "Work with a partner. Take turns asking and answering questions with quantifiers.", "steps": [
                "Partner A asks: How much…? / How many…?",
                "Partner B answers with a lot of, too much, too many, enough, some, any.",
                "Partner A asks: Do you have any…? / Are there many…?",
                "Partner B answers with Yes, there are. / No, there aren't.",
                "Switch roles. Keep it fast — 10 seconds per question."
            ], "useful": "How much time? · How many meetings? · Do you have any free time? · Are there many people?"}
        ],
        "finalTask": [
            {"t": "label", "text": "THREE-MINUTE SHARED CONVERSATION"},
            {"t": "p", "text": "Work with a partner. Have a 3-minute conversation about your work or daily life. Use quantifiers: almost, most, each, every, few, little, much, many, some, any, another, fewer, less, both, either, neither, enough, too much, too many, all, whole."},
            {"t": "note", "text": "Goal: 10+ questions, 10+ full answers. Notice when you use each quantifier correctly."}
        ],
        "reference": [
            {"t": "h", "text": "Retrieval challenge · 5 giây mỗi từ"},
            {"t": "note", "text": "Che cột tiếng Anh, dịch từ tiếng Việt. Sau đó đảo chiều. Chạy lượt 2 theo thứ tự ngẫu nhiên."},
            {"t": "retrieval", "items": [
                {"vi": "gần như", "en": "almost"},
                {"vi": "hầu hết", "en": "most"},
                {"vi": "mỗi (từng cái riêng)", "en": "each"},
                {"vi": "mọi (cả nhóm)", "en": "every"},
                {"vi": "một vài (đủ dùng)", "en": "a few"},
                {"vi": "quá ít", "en": "few"},
                {"vi": "một chút (đủ dùng)", "en": "a little"},
                {"vi": "quá ít", "en": "little"},
                {"vi": "nhiều (không đếm được)", "en": "much"},
                {"vi": "nhiều (đếm được)", "en": "many"},
                {"vi": "rất nhiều", "en": "a lot of"},
                {"vi": "một vài", "en": "some"},
                {"vi": "bất kỳ", "en": "any"},
                {"vi": "một cái khác", "en": "another"},
                {"vi": "khác", "en": "other"},
                {"vi": "ít hơn (đếm được)", "en": "fewer"},
                {"vi": "ít hơn (không đếm được)", "en": "less"},
                {"vi": "cả hai", "en": "both"},
                {"vi": "một trong hai", "en": "either"},
                {"vi": "không cái nào", "en": "neither"},
                {"vi": "đủ", "en": "enough"},
                {"vi": "quá nhiều (không đếm được)", "en": "too much"},
                {"vi": "quá nhiều (đếm được)", "en": "too many"},
                {"vi": "tất cả", "en": "all"},
                {"vi": "toàn bộ", "en": "whole"}
            ]}
        ]
    }
}

out = os.path.join(DATA, "L07.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(lesson, f, ensure_ascii=False, indent=2)
print(f"Written {out}")
print(f"  title: {lesson['title']}")
print(f"  vocab flashcards: {len(lesson['parts']['vocab'][1]['items'])}")
print(f"  conversations: {len(lesson['parts']['conversations'])}")
