# 🌟 Smart Home Gas & Environment Monitor System (ESP32)

Dự án giám sát rò rỉ khí Gas, Nhiệt độ và Độ ẩm thông minh sử dụng vi điều khiển **ESP32** kết hợp nền tảng đám mây **Blynk IoT**. Hệ thống tích hợp khả năng tự động xử lý sự cố tại chỗ và điều khiển từ xa linh hoạt.

---

## 1. 🏗️ Kiến trúc hệ thống (System Architecture)

Luồng dữ liệu của hệ thống tuân thủ mô hình IoT chuẩn: **Device → Gateway → Cloud → App**

```text
[ Thiết bị đầu cuối (Device) ] 
       │ (ESP32 + Cảm biến MQ/DHT11/OLED/Buzzer/Relay)
       ▼
[ Cổng kết nối (Gateway) ] 
       │ (Bộ định tuyến Wi-Fi Router tại nhà)
       ▼
[ Nền tảng Đám mây (Cloud) ] 
       │ (Blynk IoT Cloud Server)
       ▼
[ Ứng dụng điều khiển (App) ] 
         (Giao diện Blynk App trên Smartphone)
