#!/usr/bin/env python3
"""Replace conversations + roleplay in L02–L07 from MOVE Activate 1 PPTX."""
import json
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"


def load(n):
    return json.loads((DATA / f"L{n:02d}.json").read_text(encoding="utf-8"))


def save(n, d):
    (DATA / f"L{n:02d}.json").write_text(
        json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def dialog(title, target, lift, pairs, check, answers, note):
    lines = [{"speaker": a, "text": b} for a, b in pairs]
    return {
        "t": "dialog",
        "title": title,
        "target": target,
        "lift": lift,
        "lines": lines,
        "check": check,
        "answers": answers,
        "note": note,
    }


def steps(title, context, steps_list, useful):
    return {
        "t": "steps",
        "title": title,
        "context": context,
        "steps": steps_list,
        "useful": useful,
    }


# ----- L02 -----
d = load(2)
d["parts"]["conversations"] = [
    dialog(
        "New coworker",
        "Is she…? · Does she…?",
        "friendly → department → same team → busy",
        [
            ("A", "Is your new coworker friendly?"),
            ("B", "Yes, she is. She's very easy to talk to."),
            ("A", "Does she work in sales?"),
            ("B", "No, she doesn't. She works in marketing."),
            ("A", "Does she work with you every day?"),
            ("B", "Yes, she does. We're on the same team."),
            ("A", "Is she busy this week?"),
            ("B", "Yes, she is. We have a new project."),
        ],
        ["Is the new coworker friendly?", "Does she work in sales?", "Are they on the same team?"],
        "1. Yes. 2. No, marketing. 3. Yes.",
        "Notice: friendly → department → same team → busy this week.",
    ),
    dialog(
        "Family photo",
        "Is she…? · Does she…? · Are they…?",
        "relationship → place → work",
        [
            ("A", "Is she your sister?"),
            ("B", "Yes, she is. Her name is Mai."),
            ("A", "Does she live near you?"),
            ("B", "No, she doesn't. She lives in Hanoi."),
            ("A", "Does she work there?"),
            ("B", "Yes, she does. She works for a bank."),
            ("A", "Are they your parents?"),
            ("B", "Yes, they are. They live in Quy Nhon."),
        ],
        ["Is Mai A's sister?", "Does she live nearby?", "Where do the parents live?"],
        "1. Yes. 2. No, Hanoi. 3. Quy Nhon.",
        "Notice: relationship → place → work → another person in the photo.",
    ),
    dialog(
        "Busy team",
        "Are they…? · Do they…?",
        "busy → meetings → deadline → help",
        [
            ("A", "Are they busy this week?"),
            ("B", "Yes, they are. They have a new client."),
            ("A", "Do they have many meetings?"),
            ("B", "Yes, they do. They have one every morning."),
            ("A", "Are they ready for the deadline?"),
            ("B", "Not yet. They need one more day."),
            ("A", "Do they need your help?"),
            ("B", "Yes, they do. I'm checking the final report."),
        ],
        ["Are they busy?", "Do they have many meetings?", "Are they ready for the deadline?"],
        "1. Yes, new client. 2. Yes, every morning. 3. Not yet.",
        "Notice: busy → meetings → deadline → offer help.",
    ),
]
d["parts"]["roleplay"] = [
    steps(
        "Mission 1 · New coworker",
        "Partner vừa nói công ty có nhân viên mới. Hỏi để biết người đó.",
        [
            "Opener: Is your new coworker friendly?",
            "Hỏi 4+ Yes–No: Does he/she…? Is he/she…? Do they…? Are they…?",
            "Nghe 1 chi tiết rồi hỏi thêm.",
            "Đường ý: job · personality · schedule · team",
        ],
        "Does she work in sales? · Is she busy this week? · Do they work together?",
    ),
    steps(
        "Mission 2 · Family photo",
        "Partner cho xem ảnh gia đình. Đừng đoán — hãy hỏi.",
        [
            "Opener: Is she your sister?",
            "Hỏi 4+ Yes–No rồi follow-up.",
            "Đường ý: relationship · work · place · free time",
            "Report 30 giây: He's… / She… / They're…",
        ],
        "Does she live near you? · Does she work there? · Are they your parents?",
    ),
    steps(
        "Mission 3 · Busy team",
        "Hai người đang nói về một tuần làm việc bận.",
        [
            "Opener: Are they busy this week?",
            "Hỏi về project, deadline, meetings, support.",
            "Mission complete: 4+ Yes–No · 1 follow-up · 30-second report",
        ],
        "Do they have many meetings? · Are they ready for the deadline? · Do they need your help?",
    ),
]
save(2, d)

# ----- L03 -----
d = load(3)
d["parts"]["conversations"] = [
    dialog(
        "New client · introduce a colleague",
        "Is she…? · Does she…? → full message",
        "question → short answer → introduction",
        [
            ("A", "Is she the person in charge of this project?"),
            ("B", "Yes, she is. She's our sales coordinator."),
            ("A", "Does she handle client calls?"),
            ("B", "Yes, she does. She handles most client calls."),
            ("A", "Is she available this afternoon?"),
            ("B", "Yes, she is. She's free after two."),
            ("A", "So can I introduce her?"),
            ("B", "Anna is our sales coordinator. She handles client calls and she's free after two."),
        ],
        ["Is Anna in charge of the project?", "Does she handle client calls?", "When is she free?"],
        "1. Yes, sales coordinator. 2. Yes. 3. After two.",
        "Notice: question → short answer → full message → introduction.",
    ),
    dialog(
        "Foreign partner · a close friend",
        "Does he…? · Is he…?",
        "language → personality → place",
        [
            ("A", "Does he speak English?"),
            ("B", "Yes, he does. He uses English at work."),
            ("A", "Is he easy to talk to?"),
            ("B", "Yes, he is. He's very friendly."),
            ("A", "Does he live near us?"),
            ("B", "No, he doesn't. He lives near the beach."),
            ("A", "What should I know before we meet?"),
            ("B", "Minh is friendly, uses English at work, and lives near the beach."),
        ],
        ["Does Minh speak English?", "Is he easy to talk to?", "Does he live nearby?"],
        "1. Yes, at work. 2. Yes, friendly. 3. No, near the beach.",
        "Notice: language → personality → place → complete picture.",
    ),
    dialog(
        "Team update · recommend someone",
        "Is she free…? · Does she work well…?",
        "availability → ability → project knowledge",
        [
            ("A", "Is she free this week?"),
            ("B", "Yes, she is. She's free from Wednesday."),
            ("A", "Does she work well with new clients?"),
            ("B", "Yes, she does. She's very good with clients."),
            ("A", "Is she familiar with this project?"),
            ("B", "Yes, she is. She already supports the project team."),
            ("A", "Should we recommend her?"),
            ("B", "She's available, good with clients, and familiar with the project."),
        ],
        ["Is she free this week?", "Is she good with clients?", "Does she know the project?"],
        "1. From Wednesday. 2. Yes. 3. Yes.",
        "Notice: availability → ability → project knowledge → recommendation.",
    ),
]
d["parts"]["roleplay"] = [
    steps(
        "Mission 1 · New client",
        "Khách hàng sẽ làm việc với đồng nghiệp của bạn và muốn biết người đó là ai.",
        [
            "Opener: Is she the person in charge of this project?",
            "Hỏi 4+ Yes–No, ghi keywords không ghi nguyên câu.",
            "Report: He/She is… · works… · usually… · is at/in…",
            "Content: role · experience · personality · schedule",
        ],
        "Does she handle client calls? · Is she available this afternoon?",
    ),
    steps(
        "Mission 2 · Foreign partner",
        "Người yêu nước ngoài sắp gặp bạn thân của bạn lần đầu.",
        [
            "Opener: Does he speak English?",
            "Thu thập: work · personality · interests · place",
            "Giới thiệu 45 giây bằng full messages, không short answers.",
        ],
        "Is he easy to talk to? · Does he live near us?",
    ),
    steps(
        "Mission 3 · Team update",
        "Sếp hỏi ai có thể phụ trách khách hàng mới tuần này.",
        [
            "Opener: Is she free this week?",
            "Content: skills · workload · clients · availability",
            "Success: 4 questions → 5 full messages → 1 follow-up",
        ],
        "Does she work well with new clients? · Is she familiar with this project?",
    ),
]
save(3, d)

# ----- L04 -----
d = load(4)
d["parts"]["conversations"] = [
    dialog(
        "A first visit to the office",
        "This is my… · Those are…",
        "demonstrative + possessive noun phrases",
        [
            ("A", "This is my new workplace."),
            ("B", "It's nice. Is this your desk?"),
            ("A", "Yes, it is. And that person is our new manager."),
            ("B", "Are those files for the monthly report?"),
            ("A", "Yes. Those files are the detailed monthly report."),
            ("B", "Is this a small local family business?"),
            ("A", "No. This is a new professional opportunity for me."),
        ],
        ["Is it A's desk?", "Who is that person?", "What are those files?"],
        "1. Yes. 2. The new manager. 3. The detailed monthly report.",
        "Notice the English order: determiner + description + noun.",
    ),
    dialog(
        "Around the apartment",
        "this / that / these / those + noun",
        "point then name",
        [
            ("A", "This is my usual morning coffee."),
            ("B", "Is that your peaceful little balcony?"),
            ("A", "Yes. And these are a few close friends from work."),
            ("B", "Are those your comfortable travel shoes?"),
            ("A", "Yes, they are. I need them for the trip."),
        ],
        ["What is this?", "Is the balcony A's?", "Are the shoes for travel?"],
        "1. Morning coffee. 2. Yes. 3. Yes.",
        "Keep the noun phrase together. Don't split the description after the noun.",
    ),
    dialog(
        "A current project",
        "a / the / my + adj + noun",
        "subject and object noun phrases",
        [
            ("A", "We have a tight deadline this week."),
            ("B", "Do you have a detailed proposal?"),
            ("A", "Yes. My manager wants honest feedback on it."),
            ("B", "Is the workload manageable?"),
            ("A", "Not really. It's a heavy workload, but a practical solution is coming."),
        ],
        ["Is the deadline tight?", "What does the manager want?", "Is the workload light?"],
        "1. Yes. 2. Honest feedback. 3. No, heavy.",
        "Use full noun phrases, not one adjective answers.",
    ),
]
d["parts"]["roleplay"] = [
    steps(
        "Mission · First visit",
        "Một người nước ngoài ghé nơi làm việc hoặc nhà bạn lần đầu.",
        [
            "Dùng 2 demonstrative phrases (this/that/these/those).",
            "Dùng 2 possessive phrases (my/our/her…).",
            "Dùng 2 expanded noun phrases.",
            "Hỏi 3 Yes–No follow-ups.",
            "Success: listener biết đúng WHO / WHAT bạn chỉ.",
        ],
        "This is my… · That person is our… · Are those your…?",
    ),
    steps(
        "30-second · workplace",
        "Nói liên tục. Dùng mỗi khung noun phrase một lần.",
        [
            "my current ________",
            "a highly ________",
            "our long-term ________",
            "Topic: workload, one difficulty, next step.",
        ],
        "my current project · a highly detailed report · our long-term goal",
    ),
    steps(
        "Final mission · WORK or LIFE",
        "Chuẩn bị 60 giây, nói 90 giây không nhìn note.",
        [
            "WORK: project, task, client or career decision.",
            "LIFE: recent experience, relationship, purchase or plan.",
            "Required: 6 full noun phrases + 2 advanced adjectives.",
            "Partner check: determiner, description, head noun.",
        ],
        "a practical solution · confidential client information · a few close friends",
    ),
]
save(4, d)

# ----- L05 -----
d = load(5)
d["parts"]["conversations"] = [
    dialog(
        "First time here",
        "Is this your first time…?",
        "Yes–No opens the door. Follow-up keeps it open.",
        [
            ("A", "Is this your first time here?"),
            ("B", "Yes, it is."),
            ("A", "How do you like it so far?"),
            ("B", "I really like it."),
            ("A", "Are you here for work?"),
            ("B", "No, I'm here on vacation."),
            ("A", "Is this your first day in the city?"),
            ("B", "Yes. I arrived this morning."),
            ("A", "Do you have any plans for today?"),
            ("B", "Yes. I'm visiting the beach."),
        ],
        ["Is it B's first time here?", "Is B here for work?", "What are B's plans?"],
        "1. Yes. 2. No, vacation. 3. The beach.",
        "Follow the last answer. Don't jump to a new topic.",
    ),
    dialog(
        "At the office",
        "Is this your desk? · Are those…?",
        "point → ask → connect",
        [
            ("A", "Is this your desk?"),
            ("B", "Yes, it is."),
            ("A", "Is that your laptop bag?"),
            ("B", "Yes. And those are my work files."),
            ("A", "Are those your coworkers over there?"),
            ("B", "No. Those aren't my coworkers."),
            ("A", "Are they from your tour group?"),
            ("B", "No. I think they're from another team."),
        ],
        ["Is it B's desk?", "Are those B's coworkers?", "Whose files are they?"],
        "1. Yes. 2. No. 3. B's work files.",
        "this/that = one. these/those = many. Then BE: is/are.",
    ),
    dialog(
        "Travel morning in Da Nang",
        "That's a… · This is a…",
        "point things, then start talking",
        [
            ("A", "That's a small café across from my hotel."),
            ("B", "Is this a good place to start the day?"),
            ("A", "Yes. And that's an amazing view of the river."),
            ("B", "Is this your first time here?"),
            ("A", "Yes, it is. This is my first morning in Da Nang."),
        ],
        ["Where is the café?", "Is it A's first morning?", "What is the view of?"],
        "1. Across from the hotel. 2. Yes. 3. The river.",
        "this is a / that's an — keep it one breath group.",
    ),
]
d["parts"]["roleplay"] = [
    steps(
        "Café · meet someone new",
        "Bạn gặp một người mới.",
        ["Opener: Is this your first time here?", "4 Yes–No questions", "2 follow-ups", "1 full introduction"],
        "How do you like it so far? · Are you here for work? · Do you have any plans for today?",
    ),
    steps(
        "Work · show a new colleague around",
        "Bạn hướng dẫn đồng nghiệp mới.",
        ["Opener: Is this your desk?", "4 Yes–No + 2 follow-ups", "Point with this/that/these/those"],
        "Is that your laptop bag? · Are those your coworkers?",
    ),
    steps(
        "Travel · talk to a visitor",
        "Bạn bắt chuyện với khách du lịch.",
        ["Opener: Is that your hotel?", "4 Yes–No + 2 follow-ups", "Partner answers naturally. You choose the next question."],
        "Is it a good hotel? · Is this your first time in Da Nang?",
    ),
]
save(5, d)

# ----- L06 -----
d = load(6)
d["parts"]["conversations"] = [
    dialog(
        "A café near home",
        "Is there…? · Are there…?",
        "THERE questions describe the place · IT questions describe the thing",
        [
            ("A", "Is there a café near your house?"),
            ("B", "Yes, there is."),
            ("A", "Is it a quiet café?"),
            ("B", "Yes, it is."),
            ("A", "Is there outdoor seating?"),
            ("B", "Yes, there is."),
            ("A", "Are there many people on weekends?"),
            ("B", "Yes, there are."),
            ("A", "Do you go there often?"),
            ("B", "Yes. I go there twice a week."),
        ],
        ["Is there a café near B's house?", "Is it quiet?", "Are there many people on weekends?"],
        "1. Yes. 2. Yes. 3. Yes.",
        "Existence first (there is), then quality (it is).",
    ),
    dialog(
        "Home vs office",
        "There is… · My apartment has…",
        "owner first vs thing first",
        [
            ("A", "Is there a balcony in your apartment?"),
            ("B", "Yes. My apartment has a small balcony."),
            ("A", "Are there any meeting rooms in your office?"),
            ("B", "Yes. There are two meeting rooms in my office."),
            ("A", "Is there an elevator in your building?"),
            ("B", "Yes, there is."),
            ("A", "Are there any cafés near your house?"),
            ("B", "Yes. This area has many cafés."),
        ],
        ["Does B's apartment have a balcony?", "How many meeting rooms?", "Is there an elevator?"],
        "1. Yes. 2. Two. 3. Yes.",
        "Start with the owner → have/has. Start with the thing → there is/are.",
    ),
    dialog(
        "My neighborhood",
        "There's a… · There are… · There isn't…",
        "thing + place",
        [
            ("A", "What's around your building?"),
            ("B", "There's a small café across from my apartment."),
            ("A", "Are there any shops?"),
            ("B", "There are two convenience stores within walking distance."),
            ("A", "Is there a supermarket nearby?"),
            ("B", "No. There isn't a supermarket nearby."),
            ("A", "Is there a park?"),
            ("B", "Yes. There's also a park behind my building."),
        ],
        ["Is there a café?", "Is there a supermarket?", "Where is the park?"],
        "1. Yes, across from the apartment. 2. No. 3. Behind the building.",
        "There's = there is. Stress the THING: café, stores, park.",
    ),
]
d["parts"]["roleplay"] = [
    steps(
        "Guided tour · HOME",
        "Partner không nhìn nơi của bạn. Họ phải hình dung được.",
        ["Opener: Is there a balcony?", "Ask 4 questions · give 5 details · use 2 location chunks", "rooms · furniture · nearby services"],
        "right outside my bedroom · next to the window · across from my building",
    ),
    steps(
        "Guided tour · OFFICE",
        "Mô tả work areas, facilities, people.",
        ["Opener: Are there any meeting rooms?", "Ask 4 · give 5 · 2 location chunks", "Success: partner can sketch the place"],
        "a shared meeting room · plenty of natural light",
    ),
    steps(
        "Guided tour · NEIGHBORHOOD",
        "shops · cafés · parks · transport",
        ["Opener: Is there a café nearby?", "Ask 4 · give 5 · 2 location chunks", "Use There's… · There are… · My area has…"],
        "within walking distance · a quiet residential area · everything I need nearby",
    ),
]
save(6, d)

# ----- L07 -----
d = load(7)
d["parts"]["conversations"] = [
    dialog(
        "A project update",
        "almost / each / a few / enough / another",
        "choose the word by meaning",
        [
            ("A", "Are we finished?"),
            ("B", "We are almost finished with the project."),
            ("A", "Has every team finished?"),
            ("B", "Each team has completed its main task, but we still have little time."),
            ("A", "Are there many issues?"),
            ("B", "There are a few small issues, and each of them needs attention."),
            ("A", "Do we have enough information?"),
            ("B", "We don't have enough information from the client, so we may need another meeting."),
            ("A", "Which option is better?"),
            ("B", "Both options are possible, but neither solution is perfect."),
        ],
        ["Are they finished?", "Do they have much time?", "Do they need another meeting?"],
        "1. Almost. 2. Little time. 3. Yes.",
        "almost = nearly done. a few = some, enough to mention. neither = not A and not B.",
    ),
    dialog(
        "Workload talk",
        "most / a few / too much / enough",
        "quantity in a real workday",
        [
            ("A", "How are your mornings?"),
            ("B", "Most of my mornings are busy."),
            ("A", "Do you have many calls?"),
            ("B", "I usually have a few calls and a lot of messages."),
            ("A", "Do you have enough time between meetings?"),
            ("B", "No. Each client needs something different, so I have little time."),
            ("A", "What if you have too much work?"),
            ("B", "I move some tasks to another day. I usually have enough help."),
        ],
        ["Are most mornings busy?", "Does B have little time?", "Does B have enough help?"],
        "1. Yes. 2. Yes. 3. Yes.",
        "most of my mornings · a few calls · little time · another day · enough help.",
    ),
    dialog(
        "Two choices",
        "both / either / neither / another",
        "talk about two options",
        [
            ("A", "Which day is better, Monday or Tuesday?"),
            ("B", "Either day is fine with me."),
            ("A", "Can we do both meetings?"),
            ("B", "Both meetings are possible, but I need another day for the report."),
            ("A", "Do you have any other questions?"),
            ("B", "No, I don't have any other questions."),
            ("A", "So neither plan is a problem?"),
            ("B", "Neither plan is a problem. Let's choose Monday."),
        ],
        ["Is either day OK?", "Does B need another day?", "Are there other questions?"],
        "1. Yes. 2. Yes, for the report. 3. No.",
        "either = one of two. both = two. neither = zero of two. another = one more.",
    ),
]
d["parts"]["roleplay"] = [
    steps(
        "Your week",
        "Nói 2 phút. Partner hỏi lại.",
        ["Dùng: most / every / a few / little", "Không đọc script", "Partner: 3 follow-ups"],
        "Most of my… · Every morning… · I have a few… · I have little…",
    ),
    steps(
        "Workload",
        "Nói về lượng việc tuần này.",
        ["Dùng: much / many / too much / enough", "1 self-correction nếu sai", "Success: 6 target words"],
        "too much work · many meetings · enough time · not much information",
    ),
    steps(
        "A change",
        "Hai lựa chọn + một thay đổi.",
        ["Dùng: both / either / neither / the other", "Rồi: fewer / less / another / other", "Partner check meaning, not grammar labels"],
        "both options · either day · neither solution · another meeting · fewer mistakes",
    ),
]
save(7, d)

print("synced L02–L07 conversations + roleplay")
for n in range(2, 8):
    x = load(n)
    print(f"  L{n:02d} conv={len(x['parts']['conversations'])} roleplay={len(x['parts']['roleplay'])}")
