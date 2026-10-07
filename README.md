# Ứng dụng Quản lý Sách 23IT293

Project giữa kỳ môn Điện toán đám mây của Huỳnh Tuấn Tú, MSSV 23IT293. Ứng dụng dùng hai `MongoClient` độc lập để tách quyền đọc và ghi theo nguyên tắc least privilege.

## Khởi động nhanh

1. Sao chép `.env.example` thành `.env` và điền các URI MongoDB Atlas cùng session secret.
2. Chạy `npm install`.
3. Chạy `npm start`.
4. Mở `http://localhost:3000`.

Không commit file `.env` hoặc bất kỳ URI và mật khẩu thật nào lên Git.

## Luồng dữ liệu

- `GET /` và `GET /books` đọc collection `books` bằng `READ_MONGO_URI`.
- `POST /books` kiểm tra dữ liệu rồi ghi collection `books` bằng `WRITE_MONGO_URI`.
- Mã sách phải bắt đầu bằng `293`.
- Backend tự tính VAT `9%`; client không được quyết định giá sau thuế.
- Session không dùng `MemoryStore`. `connect-mongo` lưu phiên tập trung trong collection `sessions` của `DB_23IT293`, và số lượt truy cập trong phiên tăng sau mỗi lần mở trang quản lý.

## Kiểm thử

Chạy `npm test` để kiểm tra prefix, phép tính VAT và việc điều hướng `readDb`/`writeDb`.
