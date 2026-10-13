# MoveTalk — cấu trúc chốt (đọc trước khi sửa bất cứ thứ gì)

Nguyên tắc: **làm cấp trên cho đúng rồi mới đi vào cấp dưới.** Không nhảy vào
chi tiết trong khi khung còn sai.

## CẤP 1 — Khung

1. **Landing** (chưa đăng nhập): giới thiệu → 3 chương trình (Foundation,
   Activation, Expand) → phương pháp → bài kiểm tra xếp trình độ → đăng nhập /
   đăng ký. Người chưa có tài khoản chỉ thấy trang này.
2. **Đăng nhập** → chia hai luồng theo vai trò. Học viên mới đăng ký ở trạng thái
   chờ duyệt; chưa được duyệt thì chưa thấy bài tập.

## CẤP 2 — Hai luồng

### Giáo viên — chỉ `nhutruong0407@gmail.com` — sidebar 5 mục

1. **Dashboard** — thẻ số (học viên · giờ đã dạy · bài chờ chấm · buổi sắp tới),
   bảng **bài chờ chấm** (học viên · bài · nộp lúc · mở học viên), và **lịch**:
   xếp buổi + bảng buổi học (hôm nay và sắp tới / đã xong và đã huỷ).
2. **Courses** — 3 chương trình → 6 khoá → bài học. Có nút **Xem bài** và **Dạy**
   (studio toàn màn hình). Khoá chưa có nội dung thì nói thật, không có nút Dạy.
3. **Students** — danh sách + duyệt người chờ + chi tiết từng học viên + **giao bài**.
4. **Materials** — tài liệu (chưa có kho lưu trữ: nói thật, chưa có ô chọn tệp).
5. **Chat** — Coming soon.

### Học viên — sidebar: Home · Learning path · My homework · Vocabulary · Dashboard

1. **Dashboard** — Self-study (từng khoá, số bài đã mở / tổng) · Level (kết quả
   bài kiểm tra xếp trình độ) · Activity (đếm từ bản ghi của chính học viên) ·
   Lịch học với giáo viên (bảng buổi) · Today (việc tới hạn, từ cần ôn, bài tiếp).
2. **Learning path** — bài học chia module, trạng thái, nút đi tiếp; studio cho
   giáo viên.
3. **My homework** — task card nhóm To do / Handed in, có hạn, điểm, việc kế tiếp;
   mở ra: tóm tắt cần ghi nhớ + liên kết bài học + câu trả lời + nộp.
4. **Vocabulary** — 134 từ đọc từ chính bài học; tìm, lọc theo chương trình, lưu từ.

## CẤP 3 — Chức năng trong từng khối

- **Giao bài ôn tập**: liên kết bài học + tóm tắt cần ghi nhớ + hạn + học viên →
  học viên nhận, đọc, xác nhận đã ôn → giáo viên thấy ai đã ôn.
- **Xếp buổi học**: giáo viên tạo/huỷ buổi; học viên đã duyệt nhìn thấy.
- **Duyệt học viên**: chấp nhận / từ chối (từ chối phải hỏi lại).
- **Chấm bài**: điểm + nhận xét; câu tự luận chờ giáo viên chấm.
- **Khoá khu giáo viên**: chỉ đúng một email vào được.

## Thứ tự build

1. Landing + đăng nhập + phân vai — **chưa đúng thì chưa làm gì khác.**
2. Khung từng vai: sidebar + tiêu đề + các khu (kể cả khu rỗng).
3. Từng khu một, theo thứ tự: Dashboard → Students → Courses → Homework →
   Vocabulary → Materials → Chat.
4. Chức năng trong từng khu, làm trọn một việc rồi mới sang việc khác.

## Quy tắc không vi phạm

- Không nút chết. Bấm mà không đi đâu hoặc không làm gì là lỗi.
- Không số liệu bịa. Không có dữ liệu thì nói chưa có.
- Không lộ tên nội bộ (module, v1/v2) và không dùng jargon (venue → DEX).
- Không đổi nội dung bài học, không đổi backend/cơ sở dữ liệu khi chưa hỏi.
- Một commit cho một việc; test phải xanh trước khi deploy.
