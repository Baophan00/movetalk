#!/usr/bin/env python3
"""Generate L05 data from PPTX content."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

lesson = {
    "title": "Point, Ask & Connect",
    "vi": "Chỉ, hỏi và kết nối",
    "goal": "By the end of this lesson, you can use this/that/these/those + is/are to point at things, ask Yes-No questions, and keep a conversation going with follow-ups.",
    "today": [
        "Review noun phrases from L04",
        "Learn this/that/these/those + is/are",
        "Practice Is this…? / Are these…?",
        "Build short conversations"
    ],
    "parts": {
        "vocab": [
            {"t": "h", "text": "Pointing & asking"},
            {"t": "flashcard", "items": [
                {"word": "this", "phonetic": "/ðɪs/", "vi": "này (gần, 1)", "def": "points to one thing near you", "examples": [
                    {"text": "Is this your phone?", "context": "daily"},
                    {"text": "This is my new laptop.", "context": "work"}
                ]},
                {"word": "that", "phonetic": "/ðæt/", "vi": "kia (xa, 1)", "def": "points to one thing far from you", "examples": [
                    {"text": "Is that your hotel?", "context": "daily"},
                    {"text": "That is a nice café.", "context": "daily"}
                ]},
                {"word": "these", "phonetic": "/ðiːz/", "vi": "này (gần, nhiều)", "def": "points to many things near you", "examples": [
                    {"text": "Are these your keys?", "context": "daily"},
                    {"text": "These are my new coworkers.", "context": "work"}
                ]},
                {"word": "those", "phonetic": "/ðəʊz/", "vi": "kia (xa, nhiều)", "def": "points to many things far from you", "examples": [
                    {"text": "Are those your coworkers?", "context": "work"},
                    {"text": "Those are our client files.", "context": "work"}
                ]},
                {"word": "first time", "phonetic": "/fɜːst taɪm/", "vi": "lần đầu tiên", "def": "the first occasion you do something", "examples": [
                    {"text": "Is this your first time here?", "context": "daily"},
                    {"text": "This is my first time working with a foreign client.", "context": "work"}
                ]},
                {"word": "across the street", "phonetic": "/əˈkrɒs ðə striːt/", "vi": "bên kia đường", "def": "on the other side of the road", "examples": [
                    {"text": "That's my hotel across the street.", "context": "daily"},
                    {"text": "The office is across the street.", "context": "work"}
                ]},
                {"word": "over there", "phonetic": "/ˈəʊvə ðeə/", "vi": "ở đằng kia", "def": "in that place, far from you", "examples": [
                    {"text": "Those are my coworkers over there.", "context": "work"},
                    {"text": "The café is over there.", "context": "daily"}
                ]},
                {"word": "so far", "phonetic": "/səʊ fɑː/", "vi": "cho đến bây giờ", "def": "until now", "examples": [
                    {"text": "How do you like it so far?", "context": "daily"},
                    {"text": "The project is going well so far.", "context": "work"}
                ]},
                {"word": "follow-up", "phonetic": "/ˈfɒləʊ ʌp/", "vi": "câu hỏi tiếp theo", "def": "a question that continues the conversation", "examples": [
                    {"text": "Can I ask a follow-up question?", "context": "work"},
                    {"text": "That's a good follow-up.", "context": "daily"}
                ]}
            ]},
            {"t": "note", "text": "Choose two people. Say who they are and one thing you like or dislike about them. Accept simple language — ask one follow-up: How do you know them? or What are they like?"}
        ],
        "grammar": [
            {"t": "h", "text": "The pointing system"},
            {"t": "table", "head": ["Distance", "Number", "Word", "BE", "Question"], "rows": [
                ["Near", "One", "this", "is", "Is this…?"],
                ["Far", "One", "that", "is", "Is that…?"],
                ["Near", "Many", "these", "are", "Are these…?"],
                ["Far", "Many", "those", "are", "Are those…?"]
            ]},
            {"t": "h", "text": "Yes-No question engine — flip BE to the front"},
            {"t": "table", "head": ["Statement", "Question", "Answer"], "rows": [
                ["This is your phone.", "Is this your phone?", "Yes, it is. / No, it isn't."],
                ["That is the meeting room.", "Is that the meeting room?", "Yes, it is. / No, it isn't."],
                ["These are your keys.", "Are these your keys?", "Yes, they are. / No, they aren't."],
                ["Those are our seats.", "Are those our seats?", "Yes, they are. / No, they aren't."]
            ]},
            {"t": "note", "text": "IS + THIS/THAT · ARE + THESE/THOSE. No DO or DOES needed."},
            {"t": "h", "text": "Answer & add — one → it, many → they"},
            {"t": "table", "head": ["Question", "Short answer", "Full message"], "rows": [
                ["Is this your laptop?", "Yes, it is.", "This is my work laptop."],
                ["Is that your manager?", "No, it isn't.", "That's our new client."],
                ["Are these your files?", "Yes, they are.", "These are today's reports."],
                ["Are those your seats?", "No, they aren't.", "Those are reserved seats."]
            ]}
        ],
        "reading": [
            {"t": "h", "text": "Model answer · A complete turn"},
            {"t": "p", "text": "This is my first morning in Da Nang. That's a small café across from my hotel. This is a good place to start the day, and that's an amazing view of the river. These are my travel notes, and those are my work files. A woman at the next table asks, 'Is this your first time here?' I say yes, and we start talking about the city."},
            {"t": "note", "text": "Notice: this is…, that's…, these are…, those are…. The demonstrative + BE + information pattern."}
        ],
        "conversations": [
            {"t": "dialog", "title": "First time in Da Nang", "target": "this is… · that's… · these are… · those are…", "lift": "Is this your first time…? · How do you like it so far?", "lines": [
                {"speaker": "Linh", "text": "Is this your first time in Da Nang?"},
                {"speaker": "Alex", "text": "Yes, it is. This is my first trip here."},
                {"speaker": "Linh", "text": "Is that your hotel across the street?"},
                {"speaker": "Alex", "text": "Yes, it is. That's a small hotel near the river."},
                {"speaker": "Linh", "text": "Are these your bags?"},
                {"speaker": "Alex", "text": "Yes, they are. These are my work bags."},
                {"speaker": "Linh", "text": "Are those your coworkers over there?"},
                {"speaker": "Alex", "text": "No, they aren't. Those are people from another tour group."}
            ], "check": ["Is this Alex's first time in Da Nang?", "Is that his hotel?", "Are these his bags?", "Are those his coworkers?"], "answers": "1. Yes, it is. 2. Yes, it is. 3. Yes, they are. 4. No, they aren't.", "note": "Notice: this is…, that's…, these are…, those are…. The demonstrative + BE + information pattern."},
            {"t": "dialog", "title": "At the office", "target": "this is… · that's… · these are… · those are…", "lift": "Is this your…? · Are these your…?", "lines": [
                {"speaker": "Mia", "text": "Is this your desk?"},
                {"speaker": "Lan", "text": "Yes, it is. This is my desk."},
                {"speaker": "Mia", "text": "Is that your manager?"},
                {"speaker": "Lan", "text": "No, it isn't. That's our new client."},
                {"speaker": "Mia", "text": "Are these your files?"},
                {"speaker": "Lan", "text": "Yes, they are. These are today's reports."},
                {"speaker": "Mia", "text": "Are those your seats?"},
                {"speaker": "Lan", "text": "No, they aren't. Those are reserved seats."}
            ], "check": ["Is this Lan's desk?", "Is that Lan's manager?", "Are these Lan's files?", "Are those Lan's seats?"], "answers": "1. Yes, it is. 2. No, it isn't. 3. Yes, they are. 4. No, they aren't.", "note": "Notice: this is…, that's…, these are…, those are…. The demonstrative + BE + information pattern."},
            {"t": "dialog", "title": "Follow-up ladder", "target": "Is this your first time…? · How do you like it so far?", "lift": "Yes–No opens the door. Follow-up keeps it open.", "lines": [
                {"speaker": "Linh", "text": "Is this your first time here?"},
                {"speaker": "Alex", "text": "Yes, it is."},
                {"speaker": "Linh", "text": "How do you like it so far?"},
                {"speaker": "Alex", "text": "I really like it."},
                {"speaker": "Linh", "text": "Are you here for work?"},
                {"speaker": "Alex", "text": "No, I'm here on vacation."},
                {"speaker": "Linh", "text": "Is this your first day in the city?"},
                {"speaker": "Alex", "text": "Yes. I arrived this morning."},
                {"speaker": "Linh", "text": "Do you have any plans for today?"},
                {"speaker": "Alex", "text": "Yes. I'm visiting the beach."}
            ], "check": ["Is this Alex's first time here?", "How does he like it?", "Is he here for work?", "Does he have plans for today?"], "answers": "1. Yes, it is. 2. He really likes it. 3. No, he isn't. 4. Yes, he does.", "note": "Notice: Yes–No opens the door. Follow-up keeps it open. Use the answer to ask the next question."}
        ],
        "listening": [
            {"t": "h", "text": "Shadowing · Nghe từng câu rồi nhắc lại"},
            {"t": "note", "text": "Bấm 🔊 để nghe từng câu, sau đó nhắc lại y hệt ngữ điệu. Làm 2 lượt: lượt 1 nhìn chữ, lượt 2 che chữ."},
            {"t": "say", "items": [
                "Is this your first time here?",
                "Is that your hotel?",
                "Are these your bags?",
                "Are those your coworkers?",
                "This is my first trip here.",
                "That's a small hotel near the river."
            ]}
        ],
        "exercises": [
            {"t": "h", "text": "Bài tập 1 · Chọn từ chỉ định đúng"},
            {"t": "quiz", "items": [
                {"q": "___ is my phone.", "options": ["This", "These", "That", "Those"], "answer": 0},
                {"q": "___ are my keys.", "options": ["This", "These", "That", "Those"], "answer": 1},
                {"q": "___ is your hotel.", "options": ["This", "These", "That", "Those"], "answer": 2},
                {"q": "___ are your coworkers.", "options": ["This", "These", "That", "Those"], "answer": 3}
            ]},
            {"t": "note", "text": "Đáp án: 1 This · 2 These · 3 That · 4 Those. Quy tắc: this/that + is, these/those + are. Near vs far."},
            {"t": "h", "text": "Bài tập 2 · Đảo câu hỏi"},
            {"t": "quiz", "items": [
                {"q": "This is your phone. → Question?", "options": ["Is this your phone?", "Is that your phone?", "Are these your phone?", "Are those your phone?"], "answer": 0},
                {"q": "That is the meeting room. → Question?", "options": ["Is this the meeting room?", "Is that the meeting room?", "Are these the meeting room?", "Are those the meeting room?"], "answer": 1},
                {"q": "These are your keys. → Question?", "options": ["Is this your keys?", "Is that your keys?", "Are these your keys?", "Are those your keys?"], "answer": 2},
                {"q": "Those are our seats. → Question?", "options": ["Is this our seats?", "Is that our seats?", "Are these our seats?", "Are those our seats?"], "answer": 3}
            ]},
            {"t": "note", "text": "Đáp án: 1 Is this your phone? 2 Is that the meeting room? 3 Are these your keys? 4 Are those our seats? Quy tắc: đảo BE lên trước demonstrative."}
        ],
        "speaking": [
            {"t": "h", "text": "Question lab · Point and ask"},
            {"t": "p", "text": "Work with a partner. Point to objects in the room. Ask: Is this your…? / Are these your…? Answer with full messages."},
            {"t": "say", "items": [
                "Is this your phone?",
                "Are these your keys?",
                "Is that your chair?",
                "Are those your files?",
                "This is my work laptop.",
                "Those are our client files."
            ]},
            {"t": "note", "text": "Use: Is this your…? / Are these your…? Answer with Yes, it is. / Yes, they are. + full message."}
        ],
        "roleplay": [
            {"t": "steps", "title": "60-second engine challenge", "context": "Work with a partner. Take turns pointing to objects and asking Yes-No questions with this/that/these/those.", "steps": [
                "Partner A points and asks: Is this your…?",
                "Partner B answers: Yes, it is. / No, it isn't.",
                "Partner A points and asks: Are these your…?",
                "Partner B answers: Yes, they are. / No, they aren't.",
                "Switch roles. Keep it fast — 10 seconds per question."
            ], "useful": "Is this your phone? · Are these your keys? · Is that your chair? · Are those your files?"}
        ],
        "finalTask": [
            {"t": "label", "text": "THREE-MINUTE SHARED CONVERSATION"},
            {"t": "p", "text": "Work with a partner. Have a 3-minute conversation about things around you. Use this/that/these/those + is/are questions and answer with full messages."},
            {"t": "note", "text": "Goal: 10+ questions, 10+ full answers. Notice when you use this vs these, is vs are."}
        ],
        "reference": [
            {"t": "h", "text": "Retrieval challenge · 5 giây mỗi từ"},
            {"t": "note", "text": "Che cột tiếng Anh, dịch từ tiếng Việt. Sau đó đảo chiều. Chạy lượt 2 theo thứ tự ngẫu nhiên."},
            {"t": "retrieval", "items": [
                {"vi": "này (gần, 1)", "en": "this"},
                {"vi": "kia (xa, 1)", "en": "that"},
                {"vi": "này (gần, nhiều)", "en": "these"},
                {"vi": "kia (xa, nhiều)", "en": "those"},
                {"vi": "lần đầu tiên", "en": "first time"},
                {"vi": "bên kia đường", "en": "across the street"},
                {"vi": "ở đằng kia", "en": "over there"},
                {"vi": "cho đến bây giờ", "en": "so far"},
                {"vi": "câu hỏi tiếp theo", "en": "follow-up"}
            ]}
        ]
    }
}

out = os.path.join(DATA, "L05.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(lesson, f, ensure_ascii=False, indent=2)
print(f"Written {out}")
print(f"  title: {lesson['title']}")
print(f"  vocab flashcards: {len(lesson['parts']['vocab'][1]['items'])}")
print(f"  conversations: {len(lesson['parts']['conversations'])}")
