#!/usr/bin/env python3
"""Generate L09 data: Tenses."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

lesson = {
    "title": "Tenses & Time",
    "vi": "Thì và thời gian",
    "goal": "By the end of this lesson, you can recognize the contrast between Past Simple vs Present Perfect, Present Simple vs Present Continuous, Future Simple vs Future Intention. You can choose the right auxiliary verb for Yes-No and Wh- questions.",
    "today": [
        "Review Wh- questions from L08",
        "Learn 6 tenses and their contrasts",
        "Practice choosing the right auxiliary",
        "Build time expressions"
    ],
    "parts": {
        "vocab": [
            {"t": "h", "text": "Time & tenses"},
            {"t": "flashcard", "items": [
                {"word": "yesterday", "phonetic": "/ˈjestədeɪ/", "vi": "hôm qua", "def": "the day before today", "examples": [{"text": "I worked yesterday.", "context": "work"}, {"text": "I went to the beach yesterday.", "context": "daily"}]},
                {"word": "last week", "phonetic": "/lɑːst wiːk/", "vi": "tuần trước", "def": "the week before this week", "examples": [{"text": "I had a meeting last week.", "context": "work"}, {"text": "I visited my family last week.", "context": "daily"}]},
                {"word": "since Monday", "phonetic": "/sɪns ˈmʌndeɪ/", "vi": "từ thứ Hai", "def": "from Monday until now", "examples": [{"text": "I have worked here since Monday.", "context": "work"}, {"text": "I have been busy since Monday.", "context": "daily"}]},
                {"word": "for three years", "phonetic": "/fɔː θriː jɪəz/", "vi": "trong ba năm", "def": "during a period of three years", "examples": [{"text": "I have worked here for three years.", "context": "work"}, {"text": "I have lived here for three years.", "context": "daily"}]},
                {"word": "right now", "phonetic": "/raɪt naʊ/", "vi": "ngay bây giờ", "def": "at this moment", "examples":[{"text": "I am working right now.", "context": "work"}, {"text": "I am eating right now.", "context": "daily"}]},
                {"word": "at the moment", "phonetic": "/æt ðə ˈməʊmənt/", "vi": "hiện tại", "def": "at this time", "examples": [{"text": "I am working at the moment.", "context": "work"}, {"text": "I am studying at the moment.", "context": "daily"}]},
                {"word": "tomorrow", "phonetic": "/təˈmɒrəʊ/", "vi": "ngày mai", "def": "the day after today", "examples": [{"text": "I will have a meeting tomorrow.", "context": "work"}, {"text": "I will go to the beach tomorrow.", "context": "daily"}]},
                {"word": "next week", "phonetic": "/nekst wiːk/", "vi": "tuần tới", "def": "the week after this week", "examples": [{"text": "I will finish the project next week.", "context": "work"}, {"text": "I will visit my family next week.", "context": "daily"}]},
                {"word": "going to", "phonetic": "/ˈɡəʊɪŋ tuː/", "vi": "sắp, dự định", "def": "future intention or plan", "examples": [{"text": "I am going to start a new project.", "context": "work"}, {"text": "I am going to visit my parents.", "context": "daily"}]}
            ]},
            {"t": "note", "text": "Choose two people. Ask them about their past, present, and future. Use the right tense."}
        ],
        "grammar": [
            {"t": "h", "text": "6 tenses — contrasts"},
            {"t": "table", "head": ["Tense", "Structure", "Time", "Example"], "rows": [
                ["Past Simple", "S + V2/ed", "finished past", "I worked yesterday."],
                ["Present Perfect", "S + have/has + V3", "past until now", "I have worked here for three years."],
                ["Present Simple", "S + V1/s/es", "habits, facts", "I work every day."],
                ["Present Continuous", "S + am/is/are + V-ing", "now, temporary", "I am working right now."],
                ["Future Simple", "S + will + V1", "prediction, decision", "I will work tomorrow."],
                ["Future Intention", "S + am/is/are + going to + V1", "plan, intention", "I am going to start a new project."]
            ]},
            {"t": "h", "text": "Key contrasts"},
            {"t": "table", "head": ["Contrast", "Difference", "Example"], "rows": [
                ["Past Simple vs Present Perfect", "finished vs unfinished", "I worked yesterday. / I have worked here for three years."],
                ["Present Simple vs Present Continuous", "habit vs now", "I work every day. / I am working right now."],
                ["Future Simple vs Future Intention", "decision vs plan", "I will help you. / I am going to help you."]
            ]},
            {"t": "h", "text": "Auxiliary verbs for questions"},
            {"t": "table", "head": ["Tense", "Yes-No question", "Wh- question"], "rows": [
                ["Past Simple", "Did you work yesterday?", "When did you work?"],
                ["Present Perfect", "Have you worked here for three years?", "How long have you worked here?"],
                ["Present Simple", "Do you work every day?", "What do you do every day?"],
                ["Present Continuous", "Are you working right now?", "What are you doing right now?"],
                ["Future Simple", "Will you work tomorrow?", "When will you work?"],
                ["Future Intention", "Are you going to start a new project?", "What are you going to do?"]
            ]}
        ],
        "reading": [
            {"t": "h", "text": "Model answer · A complete turn"},
            {"t": "p", "text": "I have worked here for three years. I started in 2023. I work every day from 9 to 5. Right now, I am working on a new project. Tomorrow, I will have a meeting with a new client. Next week, I am going to visit the office in Hanoi."},
            {"t": "note", "text": "Notice: have worked (present perfect), started (past simple), work (present simple), am working (present continuous), will have (future simple), am going to visit (future intention)."}
        ],
        "conversations": [
            {"t": "dialog", "title": "Past vs Present Perfect", "target": "did you work? · have you worked?", "lift": "for three years · since Monday", "lines": [
                {"speaker": "Mia", "text": "Did you work yesterday?"},
                {"speaker": "Lan", "text": "Yes, I worked yesterday."},
                {"speaker": "Mia", "text": "Have you worked here for three years?"},
                {"speaker": "Lan", "text": "Yes, I have worked here for three years."},
                {"speaker": "Mia", "text": "When did you start?"},
                {"speaker": "Lan", "text": "I started in 2023."}
            ], "check": ["Did Lan work yesterday?", "Has Lan worked here for three years?", "When did she start?"], "answers": "1. Yes, she did. 2. Yes, she has. 3. In 2023.", "note": "Notice: did + V1 (past simple), have + V3 (present perfect), for + duration, since + starting point."},
            {"t": "dialog", "title": "Present Simple vs Continuous", "target": "do you work? · are you working?", "lift": "every day · right now", "lines": [
                {"speaker": "Mia", "text": "Do you work every day?"},
                {"speaker": "Lan", "text": "Yes, I work every day from 9 to 5."},
                {"speaker": "Mia", "text": "Are you working right now?"},
                {"speaker": "Lan", "text": "Yes, I am working right now."},
                {"speaker": "Mia", "text": "What are you doing?"},
                {"speaker": "Lan", "text": "I am working on a new project."}
            ], "check": ["Does Lan work every day?", "Is she working right now?", "What is she doing?"], "answers": "1. Yes, she does. 2. Yes, she is. 3. Working on a new project.", "note": "Notice: do/does + V1 (habit), am/is/are + V-ing (now)."},
            {"t": "dialog", "title": "Future Simple vs Intention", "target": "will you work? · are you going to…?", "lift": "tomorrow · next week", "lines": [
                {"speaker": "Mia", "text": "Will you work tomorrow?"},
                {"speaker": "Lan", "text": "Yes, I will work tomorrow."},
                {"speaker": "Mia", "text": "Are you going to start a new project?"},
                {"speaker": "Lan", "text": "Yes, I am going to start a new project."},
                {"speaker": "Mia", "text": "When will you finish?"},
                {"speaker": "Lan", "text": "I will finish next week."}
            ], "check": ["Will Lan work tomorrow?", "Is she going to start a new project?", "When will she finish?"], "answers": "1. Yes, she will. 2. Yes, she is. 3. Next week.", "note": "Notice: will + V1 (decision), am going to + V1 (plan)."}
        ],
        "listening": [
            {"t": "h", "text": "Shadowing · Nghe từng câu rồi nhắc lại"},
            {"t": "note", "text": "Bấm 🔊 để nghe từng câu, sau đó nhắc lại y hệt ngữ điệu. Làm 2 lượt: lượt 1 nhìn chữ, lượt 2 che chữ."},
            {"t": "say", "items": ["I worked yesterday.", "I have worked here for three years.", "I work every day.", "I am working right now.", "I will work tomorrow.", "I am going to start a new project."]}
        ],
        "exercises": [
            {"t": "h", "text": "Bài tập 1 · Chọn thì đúng"},
            {"t": "quiz", "items": [
                {"q": "I ___ yesterday.", "options": ["work", "worked", "have worked", "am working"], "answer": 1},
                {"q": "I ___ here for three years.", "options": ["work", "worked", "have worked", "am working"], "answer": 2},
                {"q": "I ___ every day.", "options": ["work", "worked", "have worked", "am working"], "answer": 0},
                {"q": "I ___ right now.", "options": ["work", "worked", "have worked", "am working"], "answer": 3},
                {"q": "I ___ tomorrow.", "options": ["work", "worked", "will work", "am working"], "answer": 2},
                {"q": "I ___ going to start a new project.", "options": ["am", "is", "are", "be"], "answer": 0}
            ]},
            {"t": "note", "text": "Đáp án: 1 worked · 2 have worked · 3 work · 4 am working · 5 will work · 6 am. Quy tắc: past simple (V2), present perfect (have+V3), present simple (V1), present continuous (am+V-ing), future simple (will+V1), future intention (am going to+V1)."},
            {"t": "h", "text": "Bài tập 2 · Chọn auxiliary đúng"},
            {"t": "quiz", "items": [
                {"q": "___ you work yesterday?", "options": ["Did", "Have", "Do", "Are"], "answer": 0},
                {"q": "___ you worked here for three years?", "options": ["Did", "Have", "Do", "Are"], "answer": 1},
                {"q": "___ you work every day?", "options": ["Did", "Have", "Do", "Are"], "answer": 2},
                {"q": "___ you working right now?", "options": ["Did", "Have", "Do", "Are"], "answer": 3},
                {"q": "___ you work tomorrow?", "options": ["Did", "Have", "Will", "Are"], "answer": 2},
                {"q": "___ you going to start a new project?", "options": ["Did", "Have", "Will", "Are"], "answer": 3}
            ]},
            {"t": "note", "text": "Đáp án: 1 Did · 2 Have · 3 Do · 4 Are · 5 Will · 6 Are. Quy tắc: chọn auxiliary đúng với thì."}
        ],
        "speaking": [
            {"t": "h", "text": "Question lab · Ask about time"},
            {"t": "p", "text": "Work with a partner. Ask 5 questions about past, present, and future. Use the right tense and auxiliary."},
            {"t": "say", "items": ["Did you work yesterday?", "Have you worked here for three years?", "Do you work every day?", "Are you working right now?", "Will you work tomorrow?", "Are you going to start a new project?"]},
            {"t": "note", "text": "Use: Did you…? Have you…? Do you…? Are you…? Will you…? Are you going to…? Answer with full sentences."}
        ],
        "roleplay": [
            {"t": "steps", "title": "60-second engine challenge", "context": "Work with a partner. Take turns asking and answering questions about past, present, and future.", "steps": [
                "Partner A asks: Did you…? / Have you…?",
                "Partner B answers with full sentences.",
                "Partner A asks: Do you…? / Are you…?",
                "Partner B answers with full sentences.",
                "Partner A asks: Will you…? / Are you going to…?",
                "Partner B answers with full sentences.",
                "Switch roles. Keep it fast — 10 seconds per question."
            ], "useful": "Did you work yesterday? · Have you worked here for three years? · Do you work every day? · Are you working right now? · Will you work tomorrow? · Are you going to start a new project?"}
        ],
        "finalTask": [
            {"t": "label", "text": "THREE-MINUTE SHARED CONVERSATION"},
            {"t": "p", "text": "Work with a partner. Have a 3-minute conversation about your past, present, and future. Use all 6 tenses: Past Simple, Present Perfect, Present Simple, Present Continuous, Future Simple, Future Intention."},
            {"t": "note", "text": "Goal: 10+ questions, 10+ full answers. Notice when you use each tense correctly."}
        ],
        "reference": [
            {"t": "h", "text": "Retrieval challenge · 5 giây mỗi từ"},
            {"t": "note", "text": "Che cột tiếng Anh, dịch từ tiếng Việt. Sau đó đảo chiều. Chạy lượt 2 theo thứ tự ngẫu nhiên."},
            {"t": "retrieval", "items": [
                {"vi": "hôm qua", "en": "yesterday"},
                {"vi": "tuần trước", "en": "last week"},
                {"vi": "từ thứ Hai", "en": "since Monday"},
                {"vi": "trong ba năm", "en": "for three years"},
                {"vi": "ngay bây giờ", "en": "right now"},
                {"vi": "hiện tại", "en": "at the moment"},
                {"vi": "ngày mai", "en": "tomorrow"},
                {"vi": "tuần tới", "en": "next week"},
                {"vi": "sắp, dự định", "en": "going to"}
            ]}
        ]
    }
}

out = os.path.join(DATA, "L09.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(lesson, f, ensure_ascii=False, indent=2)
print(f"Written {out}")
print(f"  title: {lesson['title']}")
print(f"  vocab flashcards: {len(lesson['parts']['vocab'][1]['items'])}")
print(f"  conversations: {len(lesson['parts']['conversations'])}")
