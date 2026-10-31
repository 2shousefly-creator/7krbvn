# 7K RBVN

Website hướng dẫn dành cho cộng đồng Seven Knights Re:Birth Việt Nam.

## Cấu trúc

- `public/index.html`: nội dung và cấu trúc trang.
- `public/styles.css`: giao diện cho máy tính và điện thoại.
- `public/app.js`: công cụ tính Ruby và phóng to ảnh.
- `public/assets/`: hình minh họa sử dụng trong bài viết.
- `worker.js`: Cloudflare Worker phục vụ các tệp trong `public/` từ nhánh `main`; nội dung mới xuất hiện sau khi bộ nhớ đệm ngắn hết hạn.

Trang là website tĩnh, có thể chạy thử bằng bất kỳ máy chủ HTTP tĩnh nào. Worker hiện tại đọc các tệp công khai từ repository, vì vậy website phụ thuộc vào khả năng truy cập GitHub. Nếu chuyển sang Cloudflare Pages kết nối Git, chọn thư mục đầu ra `public` và không cần lệnh build.
