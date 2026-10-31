# 7K RBVN

Website hướng dẫn dành cho cộng đồng Seven Knights Re:Birth Việt Nam.

## Cấu trúc

- `public/index.html`: nội dung và cấu trúc trang.
- `public/styles-v2.css`: giao diện cho máy tính và điện thoại.
- `public/app-v2.js`: giao diện Ruby Calculator, các nguồn Key/Ruby và phóng to ảnh.
- `public/calculator-core-v2.js`: công thức giá Key Bundle, Round, Fodder và Ruby; không phụ thuộc giao diện.
- `tests/calculator.test.cjs`: kiểm tra các ví dụ và trường hợp biên của công cụ tính (`node --test tests/*.test.cjs`).
- `public/assets/`: hình minh họa sử dụng trong bài viết.
- `worker.js`: Cloudflare Worker phục vụ các tệp trong `public/` từ nhánh `main`; nội dung mới xuất hiện sau khi bộ nhớ đệm ngắn hết hạn.

`styles.css` và `app.js` được giữ lại cho các trình duyệt còn lưu phiên bản trang cũ trong bộ nhớ đệm.

Trang là website tĩnh, có thể chạy thử bằng bất kỳ máy chủ HTTP tĩnh nào. Worker hiện tại đọc các tệp công khai từ repository, vì vậy website phụ thuộc vào khả năng truy cập GitHub. Nếu chuyển sang Cloudflare Pages kết nối Git, chọn thư mục đầu ra `public` và không cần lệnh build.
