# Ứng dụng Quản lý Sách 23IT293

Project giữa kỳ môn Điện toán đám mây của Huỳnh Tuấn Tú, MSSV 23IT293. Ứng dụng dùng hai `MongoClient` độc lập để tách quyền đọc và ghi theo nguyên tắc least privilege.

## Kiến trúc

```text
Browser
  ├─ GET /, /books ──> readDb  ──> books
  ├─ POST /books ────> writeDb ──> books
  └─ session cookie ─> connect-mongo ──> sessions
```

- `readClient` chỉ dùng `READ_MONGO_URI`.
- `writeClient` chỉ dùng `WRITE_MONGO_URI`.
- `connect-mongo` dùng `SESSION_MONGO_URI`; ứng dụng không dùng session store trong RAM.
- Backend kiểm tra prefix `293` và tự tính giá sau VAT `9%` trước khi insert.

## Khởi động nhanh

Yêu cầu Node.js 18 trở lên.

1. Sao chép `.env.example` thành `.env`.
2. Điền `READ_MONGO_URI`, `WRITE_MONGO_URI`, `SESSION_MONGO_URI` và `SESSION_SECRET` bằng giá trị thật trên máy local.
3. Chạy `npm ci`.
4. Chạy `npm start`.
5. Mở `http://localhost:3000`.

Không commit file `.env` hoặc bất kỳ URI và mật khẩu thật nào lên Git.

## Biến môi trường

| Biến | Giá trị hoặc vai trò |
| --- | --- |
| `NODE_ENV` | `development` ở local, `production` trên Render |
| `PORT` | `3000` ở local; Render tự cấp port khi chạy |
| `DB_NAME` | `DB_23IT293` |
| `READ_MONGO_URI` | URI của `reader_23IT293` |
| `WRITE_MONGO_URI` | URI của `writer_23IT293` |
| `SESSION_MONGO_URI` | URI của user có quyền cần thiết trên collection `sessions` |
| `SESSION_SECRET` | Chuỗi ngẫu nhiên dài, chỉ lưu trong local/Render secrets |
| `PRODUCT_PREFIX` | `293` |
| `VAT_RATE` | `9` |

## Luồng dữ liệu

- `GET /` và `GET /books` đọc collection `books` bằng `READ_MONGO_URI`.
- `POST /books` kiểm tra dữ liệu rồi ghi collection `books` bằng `WRITE_MONGO_URI`.
- Mã sách phải bắt đầu bằng `293`.
- Backend tự tính VAT `9%`; client không được quyết định giá sau thuế.
- Session không dùng `MemoryStore`. `connect-mongo` lưu phiên tập trung trong collection `sessions` của `DB_23IT293`, và số lượt truy cập trong phiên tăng sau mỗi lần mở trang quản lý.

## Kiểm thử

Chạy `npm test`. Bộ test kiểm tra:

- `293001` được chấp nhận.
- Mã sai prefix bị từ chối trước `insertOne`.
- Giá `100000` được tính thành `109000` sau VAT.
- Danh sách dùng đối tượng `readDb`; thao tác thêm dùng đối tượng `writeDb`.
- Route GET/POST được chạy thật trên HTTP server test.
- Session store trỏ tới database `DB_23IT293`, collection `sessions`.

Test Atlas thật chỉ thực hiện được sau khi `.env` đã có URI và mật khẩu hợp lệ.

## Đẩy lên GitHub

Project giữ hai nhánh `feature/database` và `feature/session`, được merge về `main` bằng merge commit. Sau khi tạo repository GitHub đúng tài khoản:

```bash
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main feature/database feature/session
```

Không push nếu `git status` hoặc `git ls-files` cho thấy `.env` hay secret đang được theo dõi.

## Triển khai Render

Repository có file `render.yaml` để chuẩn bị Web Service. Có thể dùng Blueprint hoặc tạo Web Service thủ công với:

- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/health`

Nhập đủ các biến trong bảng trên vào Render Environment. Không đưa secret thật vào `render.yaml` hoặc source. MongoDB Atlas Network Access phải cho phép kết nối từ Render theo chính sách mạng bạn chọn; project không tự thay đổi cấu hình Atlas hay hard-code IP.

### Checklist sau deploy

1. URL public trả về trang quản lý sách.
2. Danh sách sách tải thành công qua tài khoản đọc.
3. Thêm sách bằng mã bắt đầu `293` thành công.
4. Mã sai prefix hiển thị lỗi và không tạo document.
5. Giá `100000` hiển thị giá sau VAT là `109000`.
6. Footer hiển thị Huỳnh Tuấn Tú, MSSV 23IT293 và VAT 9%.
7. Collection `books` có document mới đúng schema.
8. Số lượt truy cập tăng khi refresh và collection `sessions` có document.
9. Sau khi restart Web Service, ứng dụng không phụ thuộc vào session trong RAM.

## Màn hình nên chụp cho báo cáo

1. Cấu trúc thư mục và file `.env.example` không chứa secret.
2. `src/config/db.js` thể hiện hai `MongoClient` độc lập.
3. Route/service thể hiện GET dùng `readDb`, POST dùng `writeDb`.
4. Test prefix và VAT chạy thành công bằng `npm test`.
5. Giao diện danh sách sách và footer.
6. Giao diện báo lỗi prefix.
7. Document mới trong Atlas collection `books`.
8. Document session và số lượt truy cập sau khi refresh.
9. `git log --graph --oneline --decorate --all` có hai feature branch và hai merge node.
10. GitHub repository có đủ ba branch.
11. Render Environment với giá trị secret đã được che.
12. Render deploy log thành công và URL public hoạt động.
