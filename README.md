# Đề tài 02 — Hệ thống Quản lý Sinh viên

Hệ thống Quản lý Sinh viên (Student Management System) hoàn chỉnh được đóng gói và vận hành bằng **Docker Compose**, tích hợp đầy đủ hạ tầng Giám sát tài nguyên (Monitoring), Nhật ký tập trung (Logging) và Bảo mật nâng cao (System Hardening).

---

## 📌 Thông tin Sinh viên Thực hiện
* **Mã số Sinh viên:** DTC245180120
* **Tên đề tài:** Đề tài 2 — Triển khai & Quản trị Hệ thống Quản lý Sinh viên

---

## 🚀 Danh sách Dịch vụ & Đường dẫn Truy cập

| Dịch vụ | Giao thức / Cổng | Đường dẫn / Endpoint | Chức năng |
| :--- | :---: | :--- | :--- |
| **Web Application** | HTTPS (443) | `https://192.168.37.129` | Giao diện Quản lý Sinh viên (Node.js) |
| **phpMyAdmin** | HTTPS (443) | `https://192.168.37.129/phpmyadmin/` | Quản trị CSDL MySQL |
| **Grafana Dashboard** | HTTP (3000) | `http://192.168.37.129:3000` | Trực quan hóa Metrics & Query Logs |
| **Prometheus** | HTTP (9090) | `http://192.168.37.129:9090` | Thu thập & Quản lý Metrics thời gian thực |
| **Grafana Loki** | HTTP (3100) | `http://loki:3100` | Hệ thống quản lý Log tập trung |

---

## 🛠 Kiến trúc Công nghệ & Hạ tầng (09 Containers)

* **Core Application:** Node.js Web App, MySQL 8.0 Database.
* **Reverse Proxy & SSL:** Nginx (Cấu hình HTTPS tự ký, Nginx Security Headers, HTTP Redirect 301).
* **Monitoring Stack:** Prometheus, cAdvisor (Container Resource Metrics), Grafana.
* **Logging Stack:** Grafana Loki, Promtail (Đọc log trực tiếp từ Docker Socket).
* **Orchestration:** Docker Compose (Network Isolation: `frontend_net`, `backend_net`).

---

## 🔒 Các Biện pháp Bảo mật Hệ thống (Hardening)
1. **Non-root Container:** Chạy ứng dụng Web bằng tài khoản không có quyền root (`USER node`).
2. **Network Isolation:** Phân tách mạng nội bộ, cách ly MySQL hoàn toàn khỏi truy cập ngoài Internet.
3. **HTTP Security Headers:** Nginx bổ sung `X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`.
4. **Mật khẩu phức tạp:** Đặt chuỗi mật khẩu mạnh cho tài khoản MySQL root, database user và Grafana.

---

## ⚙️ Hướng dẫn Khởi chạy Hệ thống

```bash
# 1. Clone repository về máy ảo Ubuntu
git clone [https://github.com/dtc245180120-rgb/dtc245180120-student-management.git](https://github.com/dtc245180120-rgb/dtc245180120-student-management.git)
cd dtc245180120-student-management

# 2. Khởi chạy toàn bộ 09 container dịch vụ
docker-compose up -d

# 3. Kiểm tra trạng thái các container
docker-compose ps
