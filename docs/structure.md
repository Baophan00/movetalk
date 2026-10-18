# MoveTalk — cấu trúc chốt (đọc trước khi sửa bất cứ thứ gì)

Nguyên tắc: **làm cấp trên cho đúng rồi mới đi vào cấp dưới.** Không nhảy vào
chi tiết trong khi khung còn sai. Cây này mô tả **đúng thứ đang chạy trên
`https://movetalk.surge.sh`**, không phải thứ mình định làm.

## CẤP 1 — Trang công khai (`/`, `#landing`)

Ai mở `/` cũng thấy trang này, kể cả người đã đăng nhập. Nút ở góc phải đổi chữ
theo trạng thái: **Đăng nhập** (khách) → **Vào học** (đã có phiên, bấm là về
đúng workspace của tài khoản). Logo trong sidebar của app cũng quay về đây.

Các khối theo thứ tự:

| # | Khối | Nội dung thật | Nguồn dữ liệu |
|---|------|----------------|----------------|
| 1 | Header | logo, 3 mục neo, nút giao diện, nút đăng nhập/vào học | tĩnh |
| 2 | Hero | câu định vị, đoạn dẫn, 2 nút (Bắt đầu học / Xem cách học), 3 số thật (bài học · phần mỗi bài · từ có âm thanh), thẻ flashcard mẫu | đếm từ `TRACKS` |
| 3 | `#lp-how` Ba bước | 3 thẻ: học một ít → dùng ngay → gặp lại | tĩnh |
| 4 | `#lp-lessons` Ba chương trình | 6 khoá trong 3 nhóm, mỗi khoá ghi số bài thật, khoá chưa có nội dung ghi "sắp có" | `TRACKS` |
| 5 | Nội dung mẫu | một flashcard thật + một nhiệm vụ thật, có nút nghe | bài A1 · 1 |
| 6 | `#lp-classroom` Hai workspace | 2 thẻ: giáo viên làm gì, học viên làm gì | tĩnh |
| 7 | `#lp-level` Kiểm tra trình độ | dải nền khác màu, 5 câu hỏi thật của app (2 cột ở màn rộng), gợi ý khoá bắt đầu, kết quả lưu vào `mt_selectedLevel` | `PLACEMENT_QUIZ` |
| 8 | `#lp-faq` Hỏi đáp | 4 câu thật + thẻ hỗ trợ có email | tĩnh |
| 9 | CTA cuối | "Bắt đầu từ bài đầu tiên", nhắc duyệt tài khoản | tĩnh |
| 10 | Footer | 3 cột: Học · Tài khoản · Liên hệ (có FAQ + email) + năm hiện tại | tĩnh |

### Landing: những gì đã bổ sung (2026-10-18)

1. **Nói trước là tài khoản mới phải chờ giáo viên duyệt** — ngay dưới nút Bắt đầu
   học, trong CTA cuối, và trong modal khi chọn chế độ đăng ký.
2. **Mục kiểm tra trình độ** — dùng đúng 5 câu của app, chung một mảng đáp án, làm
   xong thì kết quả hiện luôn trong dashboard (trước đây khối Trình độ không bao
   giờ có số vì chưa ai ghi `mt_selectedLevel`).
3. **FAQ 4 câu** trả lời theo đúng cách hệ thống đang chạy.
4. **Kênh hỗ trợ** — email giáo viên phụ trách, ở cả khối FAQ và chân trang.
5. **Nhịp trang** — dải kiểm tra trình độ có nền khác, FAQ hai cột, cột trái dính
   khi cuộn, nên trang không còn là một cột thẻ trắng liên tục.

### Vẫn còn mở (chưa làm, cần anh quyết)

- Không có ảnh chụp/đoạn hình thật của app; mọi hình minh hoạ hiện là HTML dựng
  bằng dữ liệu thật.
- Không có bảng phí, không có đăng ký nhận tin, không có trang điều khoản.
- Kênh hỗ trợ là email cá nhân của giáo viên; nếu sau này cần hộp thư riêng thì
  phải đổi ở cả FAQ lẫn chân trang.

## CẤP 2 — Đăng nhập và phân vai

- Một modal duy nhất, ba chế độ: đăng nhập · đăng ký · đổi mật khẩu; có thêm
  luồng quên mật khẩu gửi email.
- Sai mật khẩu thì báo tại chỗ, không đóng modal.
- Sau khi đăng nhập: giáo viên (đúng email chủ) → `#teacher`; học viên →
  `#dashboard`. Học viên mới ở trạng thái **chờ duyệt**: xem được bài, nhưng
  không thấy bài tập, không nộp được, không ghi tiến độ.
- Phiên đăng nhập sống qua lần tải lại trang (khôi phục một lần lúc khởi động).

## CẤP 3 — Hai workspace

### Giáo viên — chỉ `nhutruong0407@gmail.com` — sidebar 2 khu

1. **Dạy** (`#teacher` / `#teacher/teach`) — hai cột. Cột chính: thẻ số (học viên · giờ đã dạy ·
   bài chờ chấm · buổi sắp tới), bài chờ chấm dạng dòng có avatar và chip, **Việc cần làm** đếm từ
   dữ liệu thật, 3 chương trình có bìa màu + nút **Xem bài** / **Dạy**, rồi lịch dạy (xếp buổi +
   bảng buổi). Cột phải là rail lịch: dải 7 ngày của tuần hiện tại (ngày có buổi có chấm, bấm để
   lọc), danh sách buổi của ngày đang chọn, và **Sắp tới** ba buổi gần nhất.
2. **Quản lý học viên** (`#teacher/students`) — danh sách, duyệt người chờ, chi
   tiết từng học viên, và **giao bài**.

### Học viên — sidebar: 3 nhóm khoá + nhóm Học

- Khoá: Foundation (F1, F2) · Activation (A1, A2) · Expand (E1, E2)
- Nhóm Học: **Việc tiếp theo** (dashboard) · **Bài tập** (homework) ·
  **Từ vựng** (vocab) · **Tài liệu** (materials) · **Trang giới thiệu** (landing)
- **Trang chương trình** (`#course/<mã>`, mở từ dòng chương trình ở dashboard):
  hero + 4 tab Tổng quan · Bài học · Buổi học · Bài tập, cột phải là tiến độ,
  buổi kế tiếp và bài gần hạn. Số liệu đọc từ `lesson_progress`,
  `class_sessions` và `assignments`; tab không có dòng nào thì nói rõ.
- Thanh dưới trên điện thoại: Home · My learning · Lessons · Homework

## CẤP 4 — Trong từng khu

- **Bài học**: 10 phần (từ vựng, ngữ pháp, đọc, hội thoại, nghe, bài tập, nói,
  nhập vai, nhiệm vụ cuối, tham chiếu). Mở phần nào ghi tiến độ phần đó.
- **Bài tập**: nhóm To do / Handed in, hạn, điểm, việc kế tiếp; mở ra thấy tóm
  tắt, liên kết bài học, câu hỏi, nộp bài; nộp xong khoá lại, chờ chấm.
- **Chấm bài**: câu trắc nghiệm/điền tự chấm; câu tự luận giáo viên cho điểm và
  nhận xét; học viên đọc lại được điểm và nhận xét.
- **Lịch**: giáo viên tạo/huỷ buổi; học viên đã duyệt thấy buổi sắp tới.
- **Duyệt học viên**: chấp nhận / từ chối, từ chối hỏi lại, có thể chấp nhận lại.
- **Studio**: ẩn thanh bên, thanh điều khiển dính trên, bàn phím điều hướng
  (← → phần, ↑ ↓ bài, 1–0 nhảy phần, Space đọc, Esc thoát).

## Thứ tự build (giữ nguyên tinh thần cũ)

1. Trang công khai + đăng nhập + phân vai — sai thì chưa làm gì khác.
2. Khung từng vai: sidebar, tiêu đề, các khu (kể cả khu rỗng).
3. Từng khu một: Dạy → Quản lý học viên → Việc tiếp theo → Bài tập → Từ vựng.
4. Chức năng trong từng khu, xong trọn một việc rồi mới sang việc khác.

## Quy tắc không vi phạm

- Không nút chết. Bấm mà không đi đâu hoặc không làm gì là lỗi.
- Không số liệu bịa. Không có dữ liệu thì nói chưa có.
- Không lộ tên nội bộ (module, v1/v2) và không dùng jargon.
- Không đổi nội dung bài học, không đổi backend/cơ sở dữ liệu khi chưa hỏi.
- Một commit cho một việc; test phải xanh trước khi deploy.
