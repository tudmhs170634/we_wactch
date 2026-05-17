# Kế hoạch Triển khai Livestream HLS với Tua (DVR) và Simulcast (Tối ưu Chi phí Server)

Tài liệu này tổng hợp phương án sử dụng **Simulcast** để cung cấp tính năng đa chất lượng cho người xem HLS mà không làm quá tải server, phù hợp với VPS cấu hình thấp (Basic Droplet).

---

## 1. Mục tiêu và Định hướng
*   **Mô hình:** Phòng nhỏ từ 10 - 20 người.
*   **Tính năng cốt lõi:** 
    *   Cho phép người xem tua lại luồng live (như YouTube).
    *   Cho phép người xem chọn các mức chất lượng (1080p, 720p, 480p).
*   **Phương án chọn:** Sử dụng **Simulcast** ở phía Client (Host) để chia nhỏ chất lượng, và dùng **HLS Egress** ở server để đóng gói. Giúp tiết kiệm tối đa tài nguyên CPU của server.

---

## 2. Yêu cầu Cấu hình Hệ thống

### 2.1. Phía Server (DigitalOcean)
*   **Droplet:** Có thể sử dụng gói **Basic Droplet (Shared CPU)** rẻ tiền (ví dụ: gói $6 hoặc $12/tháng).
*   **Storage:** DigitalOcean Spaces ($5/tháng) để chứa file HLS.

### 2.3. Phía Người phát (Host) - YÊU CẦU QUAN TRỌNG
Vì gánh nặng xử lý video được đẩy về phía client, máy tính của Host cần đạt cấu hình tối thiểu sau để không bị giật lag:
*   **CPU:** Intel Core i5 (Thế hệ 8 trở lên) hoặc AMD Ryzen 5 trở lên. (Nếu dùng Macbook chip M1/M2/M3 thì chạy cực kỳ mượt mà).
*   **RAM:** Tối thiểu 8GB (Khuyến nghị 16GB).
*   **Mạng (Upload):** Tốc độ tải lên (Upload) tối thiểu **10 Mbps** và ổn định.

---

## 3. Quy trình Triển khai Chi tiết

### Bước 1: Kích hoạt Simulcast ở Client (Host)
*   Khi Host bắt đầu chia sẻ màn hình, trong code LiveKit Client, bật thuộc tính `simulcast: true`.
*   Trình duyệt của Host sẽ tự động mã hóa video thành 3 luồng: High (1080p), Medium (720p), và Low (480p) để gửi lên LiveKit.

### Bước 2: Đóng gói HLS ở Backend (NestJS)
*   Backend gọi API của LiveKit để bật Egress.
*   Egress sẽ lấy các luồng Simulcast có sẵn và đóng gói thành file Master Playlist (`.m3u8`) chứa thông tin của cả 3 mức chất lượng.
*   File được đẩy thẳng lên DigitalOcean Spaces.

### Bước 3: Đọc luồng ở Client (Viewer)
*   Sử dụng `VideoPlayer.tsx` với `hls.js` để đọc file HLS.
*   Người xem có thể tự do chọn chất lượng hoặc để Auto. Khi tua, âm thanh của Host sẽ tự động không có (như đã thống nhất ở phương án trước).

---

## 4. Ưu và Nhược điểm của Phương án

### 👍 Ưu điểm:
*   **Cực kỳ tiết kiệm:** Giúp bạn giữ được chi phí thuê server ở mức thấp nhất (Dùng VPS Basic).
*   **Tính năng đầy đủ:** Vừa tua được, vừa chọn được chất lượng.

### 👎 Nhược điểm:
*   Kén máy người phát. Nếu Host dùng máy quá cũ hoặc mạng yếu, buổi stream sẽ bị giật lag ngay tại nguồn phát.
