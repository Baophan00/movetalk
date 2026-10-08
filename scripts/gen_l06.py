#!/usr/bin/env python3
"""Generate L06 data from PPTX content."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

lesson = {
    "title": "What Is Around You?",
    "vi": "Có gì xung quanh bạn?",
    "goal": "By the end of this lesson, you can describe your home, office, and neighborhood using There is/There are. You can distinguish This is (identify) from There is (exist), and use linking and reduction naturally.",
    "today": [
        "Review this/that/these/those from L05",
        "Learn There is/There are",
        "Practice Is there…? / Are there…?",
        "Describe your space"
    ],
    "parts": {
        "vocab": [
            {"t": "h", "text": "Places & things"},
            {"t": "flashcard", "items": [
                {"word": "a balcony", "phonetic": "/ə ˈbælkəni/", "vi": "một ban công", "def": "a platform outside a window", "examples": [
                    {"text": "There is a small balcony in the apartment.", "context": "daily"},
                    {"text": "My office has a balcony.", "context": "work"}
                ]},
                {"word": "an elevator", "phonetic": "/ən ˈelɪveɪtə/", "vi": "một thang máy", "def": "a machine that takes you up and down", "examples": [
                    {"text": "Is there an elevator in your building?", "context": "daily"},
                    {"text": "The elevator is on the left.", "context": "work"}
                ]},
                {"word": "a meeting room", "phonetic": "/ə ˈmiːtɪŋ ruːm/", "vi": "một phòng họp", "def": "a room for meetings", "examples": [
                    {"text": "There are two meeting rooms in the office.", "context": "work"},
                    {"text": "I booked a meeting room.", "context": "work"}
                ]},
                {"word": "a convenience store", "phonetic": "/ə kənˈviːniəns stɔː/", "vi": "một cửa hàng tiện lợi", "def": "a small shop for everyday items", "examples": [
                    {"text": "There is a convenience store downstairs.", "context": "daily"},
                    {"text": "I bought coffee at the convenience store.", "context": "daily"}
                ]},
                {"word": "two bedrooms", "phonetic": "/tuː ˈbedruːmz/", "vi": "hai phòng ngủ", "def": "two rooms for sleeping", "examples": [
                    {"text": "There are two bedrooms in my apartment.", "context": "daily"},
                    {"text": "My office has two bedrooms for guests.", "context": "work"}
                ]},
                {"word": "some small shops", "phonetic": "/sʌm smɔːl ʃɒps/", "vi": "một vài cửa hàng nhỏ", "def": "a few small stores", "examples": [
                    {"text": "There are some small shops downstairs.", "context": "daily"},
                    {"text": "There are some small shops near the office.", "context": "work"}
                ]},
                {"word": "many trees", "phonetic": "/ˈmeni triːz/", "vi": "nhiều cây", "def": "a lot of trees", "examples": [
                    {"text": "There are many trees in this area.", "context": "daily"},
                    {"text": "There are many trees outside the office.", "context": "work"}
                ]},
                {"word": "several cafés", "phonetic": "/ˈsevrəl ˈkæfeɪz/", "vi": "vài quán cà phê", "def": "a few coffee shops", "examples": [
                    {"text": "There are several cafés nearby.", "context": "daily"},
                    {"text": "There are several cafés near the office.", "context": "work"}
                ]},
                {"word": "a supermarket", "phonetic": "/ə ˈsuːpəmɑːkɪt/", "vi": "một siêu thị", "def": "a large food store", "examples": [
                    {"text": "Is there a supermarket near your place?", "context": "daily"},
                    {"text": "There is a supermarket across from the building.", "context": "work"}
                ]},
                {"word": "a park", "phonetic": "/ə pɑːk/", "vi": "một công viên", "def": "a public green space", "examples": [
                    {"text": "There is a park near my house.", "context": "daily"},
                    {"text": "There is a park outside the office.", "context": "work"}
                ]}
            ]},
            {"t": "note", "text": "Choose two people. Say who they are and one thing you like or dislike about them. Accept simple language — ask one follow-up: How do you know them? or What are they like?"}
        ],
        "grammar": [
            {"t": "h", "text": "There is vs There are — existence map"},
            {"t": "table", "head": ["Number", "Structure", "Example"], "rows": [
                ["One thing", "There is + a/an + singular noun", "There is a balcony."],
                ["More than one", "There are + number/some + plural noun", "There are two bedrooms."],
                ["One thing (spoken)", "There's + a/an + singular noun", "There's a café nearby."],
                ["More than one (spoken)", "There are + number/some + plural noun", "There are some shops nearby."]
            ]},
            {"t": "h", "text": "This is vs There is — two different jobs"},
            {"t": "table", "head": ["Question", "Answer", "Use"], "rows": [
                ["What is this?", "This is my office.", "Identify a thing/place"],
                ["What is in your office?", "There is a meeting room.", "Say what exists in a place"],
                ["Is this a café?", "Yes, it is. This is a café.", "Confirm identity"],
                ["Is there a café nearby?", "Yes, there is.", "Ask if something exists"]
            ]},
            {"t": "note", "text": "THIS = IDENTIFY · THERE = EXIST / AVAILABLE"},
            {"t": "h", "text": "Yes-No question engine — flip is/are to the front"},
            {"t": "table", "head": ["Statement", "Question", "Answer"], "rows": [
                ["There is a balcony.", "Is there a balcony?", "Yes, there is. / No, there isn't."],
                ["There is an elevator.", "Is there an elevator?", "Yes, there is. / No, there isn't."],
                ["There are two meeting rooms.", "Are there two meeting rooms?", "Yes, there are. / No, there aren't."],
                ["There are some cafés nearby.", "Are there any cafés nearby?", "Yes, there are. / No, there aren't."]
            ]},
            {"t": "note", "text": "SOME in statements · ANY is common in questions. There's a café. → Is there a café?"}
        ],
        "reading": [
            {"t": "h", "text": "Model answer · A complete turn"},
            {"t": "p", "text": "This is my new workplace. Our small sales team works on the second floor. That woman near the window is my manager, Anna. Her desk is beside those blue cabinets. These two laptops belong to our new employees. My favorite place is the little coffee corner near the meeting room. Our morning meetings usually start there."},
            {"t": "note", "text": "Notice: There is/There are + thing + place. The place comes after the thing."}
        ],
        "conversations": [
            {"t": "dialog", "title": "A new apartment", "target": "there's a… · there are…", "lift": "Is there…? · Are there…?", "lines": [
                {"speaker": "Mia", "text": "Is your new apartment comfortable?"},
                {"speaker": "Lan", "text": "Yes. There's a bright living room and a small balcony."},
                {"speaker": "Mia", "text": "Is there a desk in your bedroom?"},
                {"speaker": "Lan", "text": "Yes, there is. There's a desk next to the window."},
                {"speaker": "Mia", "text": "Are there any cafés nearby?"},
                {"speaker": "Lan", "text": "Yes, there are. There are two cafés across from my building."},
                {"speaker": "Mia", "text": "Is there a supermarket near your place?"},
                {"speaker": "Lan", "text": "No, there isn't, but there are some small shops downstairs."}
            ], "check": ["Is Lan's new apartment comfortable?", "Is there a desk in her bedroom?", "Are there any cafés nearby?", "Is there a supermarket near her place?"], "answers": "1. Yes, it is. 2. Yes, there is. 3. Yes, there are. 4. No, there isn't.", "note": "Notice: there's a…, there are…, Is there…? Are there…? Thing first, place later."},
            {"t": "dialog", "title": "At the office", "target": "there is… · there are…", "lift": "Is there…? · Are there…?", "lines": [
                {"speaker": "Mia", "text": "Is there a meeting room in your office?"},
                {"speaker": "Lan", "text": "Yes, there is. There is a meeting room on the second floor."},
                {"speaker": "Mia", "text": "Are there any cafés nearby?"},
                {"speaker": "Lan", "text": "Yes, there are. There are two cafés across the street."},
                {"speaker": "Mia", "text": "Is there a supermarket near your office?"},
                {"speaker": "Lan", "text": "No, there isn't, but there are some small shops downstairs."}
            ], "check": ["Is there a meeting room in Lan's office?", "Are there any cafés nearby?", "Is there a supermarket near her office?"], "answers": "1. Yes, there is. 2. Yes, there are. 3. No, there isn't.", "note": "Notice: there is…, there are…, Is there…? Are there…? Thing first, place later."},
            {"t": "dialog", "title": "This is vs There is", "target": "this is… · there is…", "lift": "What is this? · What is in…?", "lines": [
                {"speaker": "Mia", "text": "What is this?"},
                {"speaker": "Lan", "text": "This is my office."},
                {"speaker": "Mia", "text": "What is in your office?"},
                {"speaker": "Lan", "text": "There is a meeting room."},
                {"speaker": "Mia", "text": "Is this a café?"},
                {"speaker": "Lan", "text": "Yes, it is. This is a café."},
                {"speaker": "Mia", "text": "Is there a café nearby?"},
                {"speaker": "Lan", "text": "Yes, there is."}
            ], "check": ["What is this?", "What is in Lan's office?", "Is this a café?", "Is there a café nearby?"], "answers": "1. This is my office. 2. There is a meeting room. 3. Yes, it is. 4. Yes, there is.", "note": "Notice: This is = identify, There is = exist. Different questions, different answers."}
        ],
        "listening": [
            {"t": "h", "text": "Shadowing · Nghe từng câu rồi nhắc lại"},
            {"t": "note", "text": "Bấm 🔊 để nghe từng câu, sau đó nhắc lại y hệt ngữ điệu. Làm 2 lượt: lượt 1 nhìn chữ, lượt 2 che chữ."},
            {"t": "say", "items": [
                "There is a balcony.",
                "There are two bedrooms.",
                "There's a café nearby.",
                "There are some shops nearby.",
                "Is there a balcony?",
                "Are there any cafés nearby?"
            ]}
        ],
        "exercises": [
            {"t": "h", "text": "Bài tập 1 · Chọn There is hay There are"},
            {"t": "quiz", "items": [
                {"q": "___ a balcony in the apartment.", "options": ["There is", "There are", "There be", "There was"], "answer": 0},
                {"q": "___ two bedrooms in my apartment.", "options": ["There is", "There are", "There be", "There was"], "answer": 1},
                {"q": "___ a café nearby.", "options": ["There is", "There are", "There be", "There was"], "answer": 0},
                {"q": "___ some small shops downstairs.", "options": ["There is", "There are", "There be", "There was"], "answer": 1}
            ]},
            {"t": "note", "text": "Đáp án: 1 There is · 2 There are · 3 There is · 4 There are. Quy tắc: one thing → is, more than one → are."},
            {"t": "h", "text": "Bài tập 2 · Đảo câu hỏi"},
            {"t": "quiz", "items": [
                {"q": "There is a balcony. → Question?", "options": ["Is there a balcony?", "Are there a balcony?", "Is it a balcony?", "Are they a balcony?"], "answer": 0},
                {"q": "There are two meeting rooms. → Question?", "options": ["Is there two meeting rooms?", "Are there two meeting rooms?", "Is it two meeting rooms?", "Are they two meeting rooms?"], "answer": 1},
                {"q": "There are some cafés nearby. → Question?", "options": ["Is there some cafés nearby?", "Are there any cafés nearby?", "Is it some cafés nearby?", "Are they some cafés nearby?"], "answer": 1}
            ]},
            {"t": "note", "text": "Đáp án: 1 Is there a balcony? 2 Are there two meeting rooms? 3 Are there any cafés nearby? Quy tắc: đảo is/are lên trước there. SOME → ANY in questions."}
        ],
        "speaking": [
            {"t": "h", "text": "Question lab · Describe your space"},
            {"t": "p", "text": "Work with a partner. Ask 5 Yes-No questions about your home, office, or neighborhood. Use Is there…? / Are there…? Answer with full messages."},
            {"t": "say", "items": [
                "Is there a balcony in your apartment?",
                "Are there any cafés nearby?",
                "Is there a supermarket near your place?",
                "Are there any meeting rooms in your office?",
                "There is a small balcony in the apartment.",
                "There are two cafés across the street."
            ]},
            {"t": "note", "text": "Use: Is there…? / Are there…? Answer with Yes, there is. / Yes, there are. + full message."}
        ],
        "roleplay": [
            {"t": "steps", "title": "60-second engine challenge", "context": "Work with a partner. Take turns asking and answering Yes-No questions with Is there…? / Are there…?", "steps": [
                "Partner A asks: Is there a…?",
                "Partner B answers: Yes, there is. / No, there isn't.",
                "Partner A asks: Are there any…?",
                "Partner B answers: Yes, there are. / No, there aren't.",
                "Switch roles. Keep it fast — 10 seconds per question."
            ], "useful": "Is there a balcony? · Are there any cafés nearby? · Is there a supermarket? · Are there any meeting rooms?"}
        ],
        "finalTask": [
            {"t": "label", "text": "THREE-MINUTE SHARED CONVERSATION"},
            {"t": "p", "text": "Work with a partner. Have a 3-minute conversation about your home, office, or neighborhood. Use Is there…? / Are there…? questions and answer with full messages."},
            {"t": "note", "text": "Goal: 10+ questions, 10+ full answers. Notice when you use is vs are."}
        ],
        "reference": [
            {"t": "h", "text": "Retrieval challenge · 5 giây mỗi từ"},
            {"t": "note", "text": "Che cột tiếng Anh, dịch từ tiếng Việt. Sau đó đảo chiều. Chạy lượt 2 theo thứ tự ngẫu nhiên."},
            {"t": "retrieval", "items": [
                {"vi": "một ban công", "en": "a balcony"},
                {"vi": "một thang máy", "en": "an elevator"},
                {"vi": "một phòng họp", "en": "a meeting room"},
                {"vi": "một cửa hàng tiện lợi", "en": "a convenience store"},
                {"vi": "hai phòng ngủ", "en": "two bedrooms"},
                {"vi": "một vài cửa hàng nhỏ", "en": "some small shops"},
                {"vi": "nhiều cây", "en": "many trees"},
                {"vi": "vài quán cà phê", "en": "several cafés"},
                {"vi": "một siêu thị", "en": "a supermarket"},
                {"vi": "một công viên", "en": "a park"}
            ]}
        ]
    }
}

out = os.path.join(DATA, "L06.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(lesson, f, ensure_ascii=False, indent=2)
print(f"Written {out}")
print(f"  title: {lesson['title']}")
print(f"  vocab flashcards: {len(lesson['parts']['vocab'][1]['items'])}")
print(f"  conversations: {len(lesson['parts']['conversations'])}")
