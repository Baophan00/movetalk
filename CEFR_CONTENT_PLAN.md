# MoveTalk — CEFR Learning Content Plan

## 0. Mục tiêu

Thiết kế lại toàn bộ nội dung học CEFR trong MoveTalk để người dùng thực sự học được tiếng Anh theo chuẩn CEFR, từ A1 đến C2, với đầy đủ 4 kỹ năng (nghe, nói, đọc, viết) + từ vựng + ngữ pháp.

## 1. Vấn đề hiện tại

- A1: 10 bài, mỗi bài có vocab/grammar/dialogue/listenCheck/speakPrompts — nhưng nội dung rải rác, thiếu cấu trúc rõ ràng
- A2–B2: chỉ có practice packs (dialogue + reading + build + translate) — thiếu vocab, grammar, listening, speaking riêng
- B1–C2: chưa có nội dung
- Không có writing exercises
- Không có unit review / tổng kết
- Không có spaced repetition cho từ vựng
- Audio chỉ có cho A1 (ElevenLabs), chưa có cho packs mới

## 2. Kiến trúc nội dung mới

### 2.1 Cấu trúc tổng thể

```
CEFR
├── Level (A1, A2, B1, B2, C1, C2)
│   ├── Can-do descriptors (theo chuẩn CEFR)
│   ├── Skill tracking (listening, speaking, reading, writing, vocab, grammar)
│   └── Units (8-12 units/level)
│       ├── Unit overview (title, topic, objectives, grammar, vocab)
│       ├── Vocabulary (15-25 từ/unit)
│       ├── Grammar (1-2 cấu trúc/unit)
│       ├── Dialogue (hội thoại mẫu)
│       ├── Listening (comprehension + dictation + gap-fill)
│       ├── Speaking (prompts + shadowing + role-play)
│       ├── Reading (passage + questions)
│       ├── Writing (guided prompt + template)
│       └── Review (tổng kết unit)
```

### 2.2 Số lượng unit theo level

| Level | Units | Từ vựng/unit | Tổng từ | Grammar structures |
|-------|-------|-------------|---------|-------------------|
| A1 | 10 (đã có) | 8-12 | ~100 | 10 |
| A2 | 8 | 12-15 | ~100 | 8 |
| B1 | 10 | 15-20 | ~170 | 10 |
| B2 | 10 | 20-25 | ~220 | 10 |
| C1 | 8 | 25-30 | ~220 | 8 |
| C2 | 6 | 30+ | ~200 | 6 |
| **Tổng** | **52** | | **~1010** | **52** |

## 3. Chủ đề theo level (dựa trên English File 5e)

### A1 — Beginner (đã có, cần cải thiện)
1. Meeting people & greetings
2. Daily routine & time
3. Food & cooking
4. Work & commute
5. Café & ordering
6. Shopping basics
7. Groceries & market
8. Cooking & dinner
9. Technology shopping
10. Hotel booking

**Cải thiện:** Thêm writing prompt, shadowing, unit review. Chuẩn hóa vocab format.

### A2 — Elementary (cần tạo)
1. Hobbies & free time
2. Weather & seasons
3. Past experiences (simple past)
4. Future plans
5. Directions & transport
6. Phone calls & messages
7. Social media & communication
8. Health & body

**Grammar focus:** Simple past, present continuous, going to, comparatives, modals (can/must/should)

### B1 — Intermediate (cần tạo)
1. Travel experiences
2. Work situations & interviews
3. Education & learning
4. Health & wellness
5. Environment & nature
6. Media & news
7. Technology & digital life
8. Relationships & emotions
9. Food & culture
10. Money & shopping

**Grammar focus:** Present perfect, past continuous, conditionals (1st/2nd), passive voice, relative clauses

### B2 — Upper-Intermediate (cần tạo)
1. Abstract ideas & opinions
2. Work culture & career
3. Global issues
4. Arts & entertainment
5. Science & innovation
6. Social media & influence
7. Travel & culture shock
8. Health systems & wellbeing
9. Education systems
10. Future of work

**Grammar focus:** Advanced conditionals, subjunctive, inversion, participle clauses, advanced passive

### C1 — Advanced (cần tạo)
1. Academic discourse
2. Professional communication
3. Nuanced arguments
4. Specialized topics (law, medicine, tech)
5. Cultural analysis
6. Media literacy
7. Leadership & management
8. Research & methodology

**Grammar focus:** Advanced grammar for precision, stylistic choices, register awareness

### C2 — Proficiency (cần tạo)
1. Near-native fluency
2. Subtlety & humor
3. Cultural references
4. Academic writing
5. Professional presentations
6. Literary analysis

**Grammar focus:** Mastery of all structures, stylistic variation, idiom mastery

## 4. Cấu trúc bài học chuẩn (mỗi unit)

Mỗi unit gồm 8 phần, theo thứ tự:

### 4.1 Unit Overview
- Title (EN + VI)
- Topic description
- Learning objectives (3-5 can-do statements)
- Grammar focus
- Vocabulary count
- Estimated time: 45-60 phút

### 4.2 Vocabulary (15-25 từ)
Format hiện tại (VocabItem):
```json
{
  "word": "appointment",
  "pos": "n",
  "ipa": "/əˈpɔɪntmənt/",
  "def": "an arrangement to meet someone at a particular time",
  "example": "I have an appointment with the doctor at 3pm.",
  "vi": "cuộc hẹn",
  "cloze": "I have an ___ with the doctor."
}
```
**Cải thiện:**
- Thêm `collocations` (cụm từ đi kèm)
- Thêm `synonyms` / `antonyms`
- Thêm `register` (formal/informal/neutral)
- Audio file path

### 4.3 Grammar (1-2 cấu trúc)
Format hiện tại (GrammarSection):
```json
{
  "section": "Present Simple",
  "sub": "Statements and questions",
  "lines": ["I work. / She works.", "Do you work? / Does she work?"]
}
```
**Cải thiện:**
- Thêm `explanation` (giải thích tiếng Việt)
- Thêm `common mistakes` (lỗi thường gặp)
- Thêm `practice` (3-5 câu luyện tập)

### 4.4 Dialogue (hội thoại mẫu)
Format hiện tại (Turn):
```json
{ "who": "Mai", "line": "Hi, I'm Mai. Are you new here?" }
```
**Cải thiện:**
- Thêm `context` (tình huống)
- Thêm `key phrases` (cụm từ quan trọng trong hội thoại)
- Audio file path cho từng câu

### 4.5 Listening
- **Comprehension:** 5-8 câu hỏi về hội thoại (đã có listenCheck)
- **Gap-fill:** Điền từ vào chỗ trống (ẩn câu gốc)
- **Dictation:** Nghe và viết lại (mới)
- **Audio-only:** Nghe không xem text, trả lời câu hỏi (mới)

### 4.6 Speaking
- **Prompts:** 5-8 câu để học viên nói (đã có speakPrompts)
- **Shadowing:** Nghe câu mẫu, nhắc lại (mới)
- **Role-play:** Đóng vai trong hội thoại (mới)
- **STT scoring:** Chấm điểm bằng speech recognition (Chrome/Edge)
- **Fallback:** Self-check trên Safari/iOS

### 4.7 Reading
- **Passage:** 100-200 từ (đã có reading)
- **Questions:** 3-5 câu (multiple choice)
- **Glossary:** từ mới trong bài đọc
- **Cải thiện:** Thêm `highlight` từ vựng đã học trong bài đọc

### 4.8 Writing (MỚI)
- **Guided prompt:** Viết 3-5 câu theo mẫu
- **Template:** Câu mẫu để tham khảo
- **Must-use words:** Từ vựng bắt buộc dùng
- **Self-check:** Checklist để tự đánh giá

### 4.9 Review (MỚI)
- **Summary:** Tóm tắt unit (vocab + grammar + key phrases)
- **Quick quiz:** 5 câu tổng hợp
- **Next unit preview:** Xem trước unit tiếp theo

## 5. Hệ thống tracking tiến độ

### 5.1 Per-skill tracking
Mỗi học viên có progress riêng cho:
- Listening (% bài nghe hoàn thành)
- Speaking (% bài nói hoàn thành)
- Reading (% bài đọc hoàn thành)
- Writing (% bài viết hoàn thành)
- Vocabulary (% từ đã học/ôn)
- Grammar (% cấu trúc đã học)

### 5.2 Spaced repetition
- Từ vựng: ôn lại sau 1, 3, 7, 14, 30 ngày
- Ngữ pháp: ôn lại sau mỗi 3 unit
- Hội thoại: ôn lại sau 1 tuần

### 5.3 Daily goals
- 10 phút/ngày minimum
- 1 unit/tuần
- Streak tracking

## 6. Thứ tự thực hiện

### Phase 1: Cải thiện A1 (1-2 tuần)
- [ ] Chuẩn hóa format vocab (thêm collocations, synonyms, register)
- [ ] Thêm writing prompt cho mỗi bài
- [ ] Thêm shadowing + role-play cho speaking
- [ ] Thêm dictation cho listening
- [ ] Thêm unit review
- [ ] Render audio cho listenCheck + speakPrompts mới
- [ ] Test trên mobile + desktop

### Phase 2: Tạo A2 (2-3 tuần)
- [ ] Viết 8 units (vocab + grammar + dialogue + listening + speaking + reading + writing)
- [ ] Tạo quiz cho mỗi unit
- [ ] Render audio
- [ ] Test

### Phase 3: Tạo B1 (3-4 tuần)
- [ ] Viết 10 units
- [ ] Tạo quiz
- [ ] Render audio
- [ ] Test

### Phase 4: Tạo B2 (3-4 tuần)
### Phase 5: Tạo C1 (3-4 tuần)
### Phase 6: Tạo C2 (2-3 tuần)

### Phase 7: Hệ thống tổng hợp
- [ ] Spaced repetition
- [ ] Daily goals
- [ ] Progress dashboard
- [ ] Teacher review UI

## 7. Nguồn tham khảo

- CEFR official descriptors (Council of Europe)
- Oxford English File 5e (structure reference)
- Cambridge English (exercise types)
- British Council LearnEnglish (free resources)
- MoveTalk A1 existing content (reuse)

## 8. Quy tắc nội dung

1. **Không copy** từ giáo trình có bản quyền — chỉ tham khảo cấu trúc
2. **Từ vựng phải có** IPA, definition, example, Vietnamese, cloze
3. **Ngữ pháp phải có** explanation tiếng Việt + common mistakes
4. **Hội thoại phải thực tế** — đời sống hằng ngày, công việc
5. **Audio render sau** khi có key ElevenLabs (hoặc dùng edge-tts tạm)
6. **Mỗi unit phải có** ít nhất 1 writing prompt
7. **Spaced repetition** cho từ vựng quan trọng
8. **Track per-skill** — không chỉ overall score
9. **Mobile-first** — tất cả bài phải dùng được trên điện thoại
10. **Không nút giả** — mọi nút phải có tác dụng