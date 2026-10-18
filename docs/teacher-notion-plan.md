# Khu vực giáo viên + lịch Notion — kế hoạch và trạng thái

Cập nhật: 2026-10-18. Tài liệu này ghi cái đã kiểm tra, cái đã làm, cái còn thiếu.
Không có mục nào ở đây được coi là "đã xong" nếu chưa có dòng kiểm chứng kèm theo.

## 1. Kiểm tra hiện trạng (trước khi sửa)

| Hạng mục | Thực tế trong repo |
| --- | --- |
| Frontend | Một file `index.html` (HTML/CSS/JS thuần), không framework, không bước build bắt buộc |
| Backend | Supabase (Postgres + Auth + Storage), gọi trực tiếp từ trình duyệt bằng anon key |
| Auth | Supabase Auth; `profiles.role` = teacher/student, khoá đổi role bằng trigger |
| Dữ liệu bài học | `TRACKS` + `LESSON_DATA` sinh từ `data/`, 6 chương trình F1…E2, A1 có 10 bài, E2 có 3 bài |
| Bài tập | `assignments`, `assignment_recipients`, `submissions`, `question_keys`, `lesson_progress` |
| Buổi học | `class_sessions`: title, starts_at, duration_min, lesson_track, lesson_no, note, status ∈ (scheduled, cancelled) |
| Tài liệu | `materials` + bucket riêng tư `materials` (006), tải lên/xoá bằng giáo viên, học viên active tải về |
| Deploy | Surge (`tools/deploy.sh`), file tĩnh; không có server chạy nền |
| Notion | **Không có dấu vết nào** trong code, SQL, config hay biến môi trường |

Hệ quả quan trọng:

- `class_sessions` **không có** cột học viên, không có giờ kết thúc (chỉ `duration_min`), và **không có trạng thái "đã hoàn thành"**. Vì vậy màn hình chỉ được nói "Đã qua", không được nói "đã dạy".
- Không có backend riêng: mọi thứ chạy ở trình duyệt + Postgres. Đồng bộ Notion **bắt buộc** phải nằm ở phía máy chủ (Supabase Edge Function), không thể nhúng token vào file tĩnh.

## 2. Đã làm (Phase 1)

- Điều hướng giáo viên còn đúng 4 mục: **Dashboard · Dạy · Học viên · Tài liệu**.
- **Dashboard** (`#teacher/dashboard`): 5 chỉ số thật, lịch dạy hôm nay / 7 ngày, danh sách "Cần xử lý", 4 thao tác nhanh.
- **Dạy** (`#teacher/teach`): danh sách chương trình + rail lịch + khu xếp buổi. Không còn trộn với số liệu tổng quan.
- Học viên và Tài liệu giữ nguyên hành vi đang chạy.
- Sửa lỗi mobile có sẵn: shadow `100vmax` của sidebar làm tối cả trang khi drawer đóng.

## 3. Cách tính 5 chỉ số (đều từ `TC.*`, không có số cứng)

| Chỉ số | Công thức |
| --- | --- |
| Ca dạy hôm nay | `class_sessions` có `starts_at` trong ngày địa phương hiện tại và `status ≠ cancelled` |
| Buổi đã qua | như trên, 7 ngày, `starts_at < now`, `status ≠ cancelled` — nhãn "đã qua", không phải "đã dạy" |
| Học viên | `profiles.role = student` và `status = active` |
| Bài chờ chấm | `submissions.status = submitted` |
| Bài quá hạn | `assignments.status = published`, hạn đã qua, và còn học viên trong `assignment_recipients` chưa có submission `submitted`/`graded` |

## 4. Notion — thiết kế đề xuất, CHƯA triển khai

Không thể bắt đầu khi chưa biết cấu trúc database thật. Cần người dùng cung cấp:

1. `NOTION_TOKEN` của internal integration (quyền Read content).
2. Link/ID database lịch dạy.
3. Database đã được **share** cho integration đó.
4. Tên thuộc tính thật: ngày, giờ bắt đầu, giờ kết thúc (hoặc thời lượng), học viên, khoá, bài, trạng thái.

Thiết kế dự kiến (một chiều Notion → MoveTalk trước):

- Supabase Edge Function `notion-sync`, token nằm trong function secrets, **không** xuống trình duyệt.
- Migration thêm (không phá dữ liệu):
  - `class_sessions.notion_page_id text unique`
  - `class_sessions.notion_last_edited timestamptz`
  - `class_sessions.completed_at timestamptz` (để có "đã hoàn thành" thật)
  - bảng `notion_sync_runs(id, started_at, finished_at, ok, imported, updated, skipped, error)`
- Upsert theo `notion_page_id`; chạy lại cùng một trang không tạo buổi trùng.
- Trang bị xoá/archived → set `status = cancelled`, không xoá row.
- Học viên không khớp → lưu buổi với `note` ghi lý do, không gán bừa.
- Cron 5–10 phút (pg_cron gọi function, hoặc cron ngoài). Webhook chỉ khi đã có endpoint công khai và verify chữ ký.
- Hai chiều: chỉ sau khi có quy tắc trường nào thuộc bên nào; mặc định **một chiều**.

## 5. Việc còn lại

- Phase 2: Dạy — bộ lọc cấp độ, tìm kiếm bài, mở bài gắn với buổi của một học viên.
- Phase 3: Học viên — hồ sơ đầy đủ (mục tiêu, lịch sử buổi, ghi chú, bài tập, điểm cần cải thiện) và luồng giao bài từ hồ sơ.
- Phase 4: Tài liệu — nhóm theo kỹ năng/loại, lọc, xem trước, giao tài liệu cho học viên.
- Phase 5: Notion sync (chờ thông tin ở mục 4).
- Phase 6: Trạng thái "hoàn thành" cho buổi học + đếm lại dashboard.
