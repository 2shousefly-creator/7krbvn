# 7K RBVN

Website hướng dẫn dành cho cộng đồng Seven Knights Re:Birth Việt Nam.

## Cấu trúc

- `public/index.html`: nội dung và cấu trúc trang.
- `public/styles-v3.css`: giao diện cho máy tính và điện thoại.
- `public/app-v4.js`: Ruby Calculator hai tab, các nguồn Key/Ruby và phóng to ảnh.
- `public/calculator-core-v3.js`: công thức giá Key Bundle, ước tính Round theo Stage, Fodder và Ruby; không phụ thuộc giao diện.
- `tests/*.test.cjs`: kiểm tra công thức, thiết lập mặc định và ảnh trong bài viết (`node --test tests/*.test.cjs`).
- `public/assets/`: hình minh họa sử dụng trong bài viết.
- `worker.js`: Cloudflare Worker phục vụ các tệp trong `public/` từ nhánh `main`; nội dung mới xuất hiện sau khi bộ nhớ đệm ngắn hết hạn.

Các tệp giao diện và công thức cũ được giữ lại cho các trình duyệt còn lưu phiên bản trang trước trong bộ nhớ đệm.

Trang là website tĩnh, có thể chạy thử bằng bất kỳ máy chủ HTTP tĩnh nào. Worker hiện tại đọc các tệp công khai từ repository, vì vậy website phụ thuộc vào khả năng truy cập GitHub. Nếu chuyển sang Cloudflare Pages kết nối Git, chọn thư mục đầu ra `public` và không cần lệnh build.
