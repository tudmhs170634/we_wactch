PROJECT SUMMARY: WE WATCH 2.0
Mission: Xây dựng nền tảng "Social Entertainment Space" cho phép người dùng xem nội dung số đồng bộ và tương tác thời gian thực (Audio/Video/Chat).

1. Core Models & Modes
We Watch Mode (Private): * Giới hạn: 5 người.

Logic: Full-sync (Tất cả có quyền điều khiển Play/Pause/Seek).

Interaction: WebRTC Many-to-Many (Full Camera/Mic).

Community Live Mode (Public):

Giới hạn: 20 người.

Logic: Host-driven Sync (Chỉ Host điều khiển, viewer đồng bộ theo Host).

Feature Key: Sub-group Audio (Tạo nhóm nhỏ nói chuyện riêng bằng Audio Routing trong phòng lớn).

2. Technical Stack
Frontend: Next.js (App/Pages Router), Tailwind CSS (Contemporary Style), Lucide Icons, Canvas API (Emoji Rain).

Backend: Node.js, Socket.io (Real-time events).

Database:

PostgreSQL: Quản lý User, Room, Video, Chat History (JSONB cho Metadata).

Redis: Quản lý Real-time State (Timestamp, Room locks), Sub-group list và Message Buffer.

Media & Infra:

WebRTC: LiveKit SFU (xử lý Audio/Video stream).

Storage: S3-Compatible (Presigned URLs để client upload trực tiếp).

Processing: FFmpeg (Worker xử lý Thumbnail/Metadata).

3. Key Logic Algorithms
Sync Engine: * Latency Compensation: AdjustedTime = ServerTimestamp + (Ping/2).

Timestamp Locking: Khóa lệnh điều khiển trong 500ms để tránh xung đột trạng thái (Race conditions).

Data Consistency: * Batch Writing: Gom tin nhắn từ Redis Buffer ghi vào Postgres theo đợt để giảm tải I/O.

Sub-group Routing: * Phân tách luồng âm thanh dựa trên RoomID + GroupID thông qua LiveKit SFU.

4. Design Guidelines (Contemporary Style)
Layout: Bento Grid (bo góc lớn ~24px - 32px).

Colors: Primary #C800DF (Fuchsia), Background #0A0A0B (Deep Black).

Typography: Jost (Display), Overpass Mono (Technical data/Timestamps).

UX: Dark-mode centric, tối ưu hóa hiển thị video, tương tác không che khuất nội dung chính.

5. Development Constraints
Security: JWT Stateless Auth, HTTPS bắt buộc cho WebRTC.

Performance: Tối ưu DOM (dùng Canvas cho hiệu ứng), tránh re-render thừa khi nhận socket events.

Deployment: Docker Compose (Node, Postgres, Redis, LiveKit).

Ghi chú cho Agent: Khi hỗ trợ viết code, hãy ưu tiên sử dụng TypeScript, tuân thủ kiến trúc Clean Code và bám sát các logic đồng bộ hóa (Sync) đã mô tả ở mục 3.
