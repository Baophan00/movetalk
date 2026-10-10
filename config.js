/* Cấu hình backend (Supabase).
   - URL + anon key là khoá CÔNG KHAI, cố ý để trong code web.
     Bảo mật thật nằm ở Row Level Security + các hàm chấm điểm phía
     Postgres (xem sql/001_homework.sql), không phụ thuộc việc giấu key.
   - Để trống = app chạy chế độ khách như trước giờ (tiến độ trong browser),
     khu Homework/Teaching sẽ báo chưa kết nối backend. */
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';
