# TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG - ICTU
## KHOA CÔNG NGHỆ THÔNG TIN
### BÁO CÁO MÔN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
**Đề Tài:** ĐỀ 2 - TRIỂN KHAI HỆ THỐNG QUẢN LÝ SINH VIÊN

---

- **Giảng viên hướng dẫn:** Hoàng Văn Tâm
- **Sinh viên thực hiện:** Dương Văn Chuẩn
- **Lớp:** KTPM-K23A
- **Mã sinh viên:** DTC245180120
- **Thời gian:** Thái Nguyên, ngày 23 tháng 10 năm 2026

---

## 📑 MỤC LỤC
- [CHƯƠNG 1: TỔNG QUAN YÊU CẦU VÀ KIẾN TRÚC HỆ THỐNG MICROSERVICES](#chương-1-tổng-quan-yêu-cầu-và-kiến-trúc-hệ-thống-microservices)
- [CHƯƠNG 1 (Tiếp): THIẾT KẾ MẠNG VÀ PHÂN LẬP NỘI BỘ (NETWORK ISOLATION)](#chương-1-tiếp-thiết-kế-mạng-và-phân-lập-nội-bộ-network-isolation)
- [CHƯƠNG 2: TRIỂN KHAI WEB APP, DATABASE VÀ PHPMYADMIN (COMMIT 1)](#chương-2-triển-khai-web-app-database-và-phpmyadmin-commit-1)
- [CHƯƠNG 2 (Tiếp): CẤU HÌNH NGXINX REVERSE PROXY VÀ HTTPS SSL TỰ KÝ](#chương-2-tiếp-cấu-hình-nginx-reverse-proxy-và-https-ssl-tự-ký)
- [CHƯƠNG 3: HỆ THỐNG GIÁM SÁT HẠ TẦNG PROMETHEUS VÀ CADVISOR (COMMIT 2)](#chương-3-hệ-thống-giám-sát-hạ-tầng-prometheus-và-cadvisor-commit-2)
- [CHƯƠNG 3 (Tiếp): TRỰC QUAN HÓA BẰNG GRAFANA DASHBOARD](#chương-3-tiếp-trực-quan-hóa-bằng-grafana-dashboard)
- [CHƯƠNG 4: HỆ THỐNG QUẢN LÝ LOG TẬP TRUNG LOKI VÀ PROMTAIL (COMMIT 3)](#chương-4-hệ-thống-quản-lý-log-tập-trung-loki-và-promtail-commit-3)
- [CHƯƠNG 4 (Tiếp): PHÂN TÍCH VÀ TRUY VẤN CÂU LỆNH LOGQL TRÊN GRAFANA EXPLORE](#chương-4-tiếp-phân-tích-và-truy-vấn-câu-lệnh-logql-trên-grafana-explore)
- [CHƯƠNG 5: CÁC BIỆN PHÁP HARDENING HỆ THỐNG VÀ QUẢN LÝ MÃ NGUỒN GITHUB](#chương-5-các-biện-pháp-hardening-hệ-thống-và-quản-lý-mã-nguồn-github)
- [PHẦN KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN](#phần-kết-luận-và-hướng-phát-triển)
- [TÀI LIỆU THAM KHẢO](#tài-liệu-tham-khảo)

---

## CHƯƠNG 1: TỔNG QUAN YÊU CẦU VÀ KIẾN TRÚC HỆ THỐNG MICROSERVICES

Đề tài yêu cầu đóng gói toàn bộ ứng dụng Quản lý Sinh viên cùng hạ tầng phụ trợ trên môi trường Docker Compose. Mô hình được thiết kế theo kiến trúc Microservices gồm 9 dịch vụ độc lập nhằm đảm bảo tính sẵn sàng cao, khả năng bảo mật và giám sát toàn diện.

### Bảng Danh Sách 9 Containers Trong Hệ Thống (Docker Compose Services)

| STT | Service Name | Container Name | Port Mapping | Nhiệm Vụ Kỹ Thuật Chi Tiết |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `app` | `student_app` | 3000:3000 (Nội bộ) | Chạy ứng dụng Web Node.js xử lý logic CRUD sinh viên |
| **2** | `db` | `mysql_db` | 3306:3306 (Nội bộ) | Lưu trữ CSDL MySQL quan hệ, chỉ truy cập trong `backend_net` |
| **3** | `phpmyadmin` | `phpmyadmin` | 80:80 (Nội bộ) | Giao diện quản trị CSDL qua trình duyệt bằng HTTP/HTTPS proxy |
| **4** | `proxy` | `nginx_proxy` | 80:80, 443:443 (Host) | Reverse Proxy tiếp nhận request mã hóa SSL và Security Headers |
| **5** | `prometheus` | `prometheus` | 9090:9090 (Host) | Cào và lưu trữ time-series metrics từ cAdvisor theo chu kỳ 15s |
| **6** | `cadvisor` | `cadvisor` | 8080:8080 (Nội bộ) | Thu thập thông số CPU, RAM, Network Tx/Rx của từng container |
| **7** | `grafana` | `grafana` | 3000:3000 (Host) | Giao diện trực quan hóa Dashboard chỉ số và truy vấn LogQL |
| **8** | `loki` | `loki` | 3100:3100 (Nội bộ) | Lưu trữ và indexing log tập trung từ Promtail agent |
| **9** | `promtail` | `promtail` | 9080:9080 (Nội bộ) | Gom file log từ Docker Socket và đẩy trực tiếp về Loki |

---

## CHƯƠNG 1 (Tiếp): THIẾT KẾ MẠNG VÀ PHÂN LẬP NỘI BỘ (NETWORK ISOLATION)

Bảo mật hạ tầng mạng container là yếu tố cốt lõi trong quy trình Hardening. Trong dự án này, hệ thống được thiết lập hai mạng ảo riêng biệt bằng chuẩn driver bridge của Docker Compose nhằm cách ly hoàn toàn vùng chứa dữ liệu nhạy cảm khỏi nguy cơ truy cập trái phép từ bên ngoài.

### Bảng Quy Tắc Phân Lập Mạng Chi Tiết (Network Security Policy)

| Tên Mạng Docker | Driver | Danh Sách Service Tham Gia | Chính Sách Bảo Mật & Truy Cập |
| :--- | :---: | :--- | :--- |
| **frontend_net** | bridge | `nginx_proxy`, `student_app`, `prometheus`, `cadvisor`, `grafana`, `loki`, `promtail` | Cho phép giao tiếp giữa Nginx Proxy với ứng dụng web và các công cụ giám sát chỉ số/log. Mở cổng 80, 443, 3000, 9090 ra ngoài Host. |
| **backend_net** | bridge | `student_app`, `mysql_db`, `phpmyadmin` | Cách ly tuyệt đối CSDL MySQL 8.0. Không map cổng 3306 ra máy host. Chỉ ứng dụng web và phpmyadmin được phép truy vấn dữ liệu. |

---

## CHƯƠNG 2: TRIỂN KHAI WEB APP, DATABASE VÀ PHPMYADMIN (COMMIT 1)

Trong mốc phát triển đầu tiên (Commit 1), các dịch vụ nền tảng phục vụ lưu trữ và vận hành ứng dụng được đóng gói hoàn chỉnh. Ứng dụng Node.js kết nối tới MySQL 8.0 qua biến môi trường an toàn và được quản lý bảng dữ liệu trực quan qua phpMyAdmin.

### Bảng Cấu Trúc Dữ Liệu Bảng Sinh Viên (`students` Table Schema)

| Tên Trường (Column) | Kiểu Dữ Liệu (Type) | Ràng Buộc (Constraint) | Mô Tả Chức Năng Dữ Liệu |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Mã định danh tự động tăng của sinh viên |
| `student_id` | VARCHAR(20) | UNIQUE, NOT NULL | Mã số sinh viên (Ví dụ: DTC245180120) |
| `full_name` | VARCHAR(100) | NOT NULL | Họ và tên đầy đủ của sinh viên |
| `email` | VARCHAR(100) | NOT NULL | Địa chỉ Email học viện do ICTU cấp |
| `class_name` | VARCHAR(50) | NOT NULL | Tên lớp quản lý hoặc lớp học phần |

---

## CHƯƠNG 2 (Tiếp): CẤU HÌNH NGXINX REVERSE PROXY VÀ HTTPS SSL TỰ KÝ

Dịch vụ Nginx đóng vai trò là điểm tiếp nhận lưu lượng mạng duy nhất. Toàn bộ yêu cầu truy cập từ trình duyệt người dùng qua giao thức HTTP không mã hóa (Port 80) sẽ bị Nginx ép buộc chuyển hướng 301 sang giao thức an toàn HTTPS (Port 443) đi kèm chứng chỉ SSL tự ký.

### Bảng Phân Tích Các Header Bảo Mật (Nginx Security Headers)

| Tên Security Header | Giá Trị Cấu Hình | Mục Đích Phòng Chống Tấn Công |
| :--- | :--- | :--- |
| **X-Frame-Options** | `SAMEORIGIN` | Chống tấn công Clickjacking, ngăn trang web bị nhúng vào iframe lạ |
| **X-Content-Type-Options** | `nosniff` | Ngăn trình duyệt tự ý đoán sai MIME-type để thực thi script độc hại |
| **X-XSS-Protection** | `1; mode=block` | Kích hoạt bộ lọc XSS tích hợp sẵn của trình duyệt web |
| **Strict-Transport-Security** | `max-age=31536000` | Bắt buộc trình duyệt chỉ kết nối bằng HTTPS trong vòng 1 năm |

---

## CHƯƠNG 3: HỆ THỐNG GIÁM SÁT HẠ TẦNG PROMETHEUS VÀ CADVISOR (COMMIT 2)

Ở mốc phát triển thứ hai (Commit 2), hệ thống được tích hợp năng lực giám sát hiệu năng theo thời gian thực. cAdvisor kết nối trực tiếp tới Docker Daemon để cào chỉ số tài nguyên phần cứng của từng container, sau đó Prometheus đóng vai trò thu thập và lưu trữ time-series database.

### Bảng Danh Sách Các Metric Cốt Lõi Thu Thập Từ cAdvisor

| Tên Metric Chuẩn | Kiểu Metric | Ý Nghĩa Kỹ Thuật Giám Sát |
| :--- | :---: | :--- |
| `container_cpu_usage_seconds_total` | Counter | Tổng số giây CPU đã sử dụng của từng container |
| `container_memory_usage_bytes` | Gauge | Dung lượng bộ nhớ RAM thực tế đang bị chiếm dụng (Bytes) |
| `container_network_receive_bytes_total` | Counter | Lưu lượng dữ liệu mạng đầu vào (Rx Network) |
| `container_network_transmit_bytes_total` | Counter | Lưu lượng dữ liệu mạng đầu ra (Tx Network) |
| `up{job="cadvisor"}` | Gauge | Cờ kiểm tra trạng thái sống/chết của cAdvisor (1 = UP, 0 = DOWN) |

---

## CHƯƠNG 3 (Tiếp): TRỰC QUAN HÓA BẰNG GRAFANA DASHBOARD

Grafana được cấu hình kết nối trực tiếp tới Data Source Prometheus qua đường ống mạng nội bộ `http://prometheus:9090`. Các biểu đồ trực quan hóa dữ liệu giúp quản trị viên nhanh chóng phát hiện các sự cố tắc nghẽn tài nguyên CPU hoặc tràn bộ nhớ RAM của ứng dụng.

### Bảng Các Câu Truy Vấn PromQL Được Thiết Lập Trên Grafana

| Thành Phần Giám Sát | Cú Pháp Truy Vấn PromQL Chuẩn | Đơn Vị Hiển Thị |
| :--- | :--- | :---: |
| **Phần Trăm CPU Container** | `sum(rate(container_cpu_usage_seconds_total[5m])) by (name) * 100` | Percent (%) |
| **Dung Lượng RAM Chiếm Dụng** | `container_memory_usage_bytes{name!=""}` | Megabytes (MB) |
| **Tốc Độ Mạng Đọc Inbound** | `sum(rate(container_network_receive_bytes_total[5m])) by (name)` | KB / Second |
| **Số Lượng Container Đang Chạy** | `count(container_last_seen{name!=""})` | Containers Count |

---

## CHƯƠNG 4: HỆ THỐNG QUẢN LÝ LOG TẬP TRUNG LOKI VÀ PROMTAIL (COMMIT 3)

Tại mốc phát triển thứ ba (Commit 3), giải pháp quản lý nhật ký tập trung Grafana Loki Stack được đưa vào vận hành. Promtail đóng vai trò agent đọc file log từ Docker Daemon Socket `/var/run/docker.sock`, tự động gán nhãn label và đẩy dữ liệu về Loki lưu trữ.

### Bảng So Sánh Giải Pháp Log Tập Trung Loki Với Syslog Truyền Thống

| Tiêu Chí So Sánh | Giải Pháp Nhật Ký Tập Trung Grafana Loki | Phương Pháp Truyền Thống (File / Syslog) |
| :--- | :--- | :--- |
| **Cơ Chế Đánh Chỉ Mục** | Chỉ đánh chỉ mục nhãn (Labels Indexing) giúp tiết kiệm dung lượng | Đánh chỉ mục toàn bộ nội dung văn bản (Full-text indexing) tốn bộ nhớ |
| **Khả Năng Tích Hợp** | Gắn liền trực tiếp vào giao diện Grafana Explore bằng ngôn ngữ LogQL | Phải mở từng file bằng SSH gõ lệnh cat/grep thủ công |
| **Mức Độ Tiêu Tốn RAM** | Rất thấp, phù hợp môi trường Container hóa quy mô nhỏ & vừa | Yêu cầu tài nguyên RAM/Disk cực kỳ lớn khi lượng log tăng |

---

## CHƯƠNG 4 (Tiếp): PHÂN TÍCH VÀ TRUY VẤN CÂU LỆNH LOGQL TRÊN GRAFANA EXPLORE

### Bảng Tổng Hợp Danh Sách Câu Lệnh Truy Vấn LogQL Thực Tế

| STT | Cú Pháp Truy Vấn LogQL | Ý Nghĩa Kỹ Thuật & Kết Quả Trả Về |
| :---: | :--- | :--- |
| **1** | `{container=~".+"}` | Xem toàn bộ log thời gian thực phát sinh từ cả 9 containers trong hệ thống |
| **2** | `{container="student_app"}` | Lọc riêng các dòng log xử lý yêu cầu HTTP và truy vấn CSDL của Web App |
| **3** | `{container="nginx_proxy"} \|= "GET"` | Lọc tất cả các truy vấn dạng HTTP GET đi qua Reverse Proxy Nginx |
| **4** | `{container="mysql_db"} \|= "error"` | Kiểm tra danh sách các thông báo lỗi phát sinh bên trong CSDL MySQL 8.0 |
| **5** | `{container="promtail"} \|= "level=error"` | Theo dõi nhật ký cảnh báo sự cố từ chính agent thu thập log Promtail |

> **Kịch Bản Thử Nghiệm Sinh Log Thời Gian Thực (Real-time Log Generation Test):**  
> Để minh chứng khả năng bắt log tức thì của Loki, tiến hành tải lại trang Web App HTTPS 5 lần liên tiếp trên trình duyệt, ngay lập tức các dòng nhật ký mới sẽ xuất hiện trên Grafana Explore.

---

## CHƯƠNG 5: CÁC BIỆN PHÁP HARDENING HỆ THỐNG VÀ QUẢN LÝ MÃ NGUỒN GITHUB

### Bảng Ma Trận Đánh Giá Biện Pháp Hardening Hệ Thống (Security Audit Matrix)

| Biện Pháp Hardening | Vị Trí Cấu Hình Thực Tế | Hiệu Quả Bảo Mật Đạt Được |
| :--- | :--- | :--- |
| **Non-root Container User** | Dockerfile (`USER node`) | Chống rủi ro leo thang quyền Root máy chủ khi container bị chiếm quyền |
| **Phân Lập Mạng Nội Bộ** | `docker-compose.yml` | Cách ly CSDL MySQL 8.0 hoàn toàn khỏi lưu lượng truy cập Internet |
| **Mật Khẩu Phức Tạp** | Biến môi trường `.env` | Chống tấn công dò quét mật khẩu Brute-force vào MySQL/Grafana/phpMyAdmin |
| **Nginx Security Headers** | `nginx/default.conf` | Phòng chống tấn công Clickjacking, Cross-Site Scripting (XSS) và MIME sniffing |

### Lịch Sử Quản Lý Mã Nguồn Trên GitHub (3 Commits)

```bash
duongvanchuan@duongvanchuan:~/student-management$ git log --oneline
b0e4a74 (HEAD -> main, origin/main) Commit 3: Trien khai Loki va Promtail thu thap log tap trung va truy van LogQL
e0fb5b3 Commit 2: Tich hop Prometheus, cAdvisor va Grafana giam sat he thong
25b35b7 Commit 1: Trien khai Web App, MySQL, phpMyAdmin va Nginx Reverse Proxy HTTPS
