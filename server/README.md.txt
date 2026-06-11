# Tầng Server - ThingsBoard IoT Cloud

Hệ thống sử dụng hạ tầng đám mây trung tâm của **ThingsBoard Cloud** làm Broker xử lý dữ liệu thông qua giao thức HTTP REST API.

### Chức năng chính:
1. Hứng dữ liệu giám sát thời gian thực (`temperature`, `humidity`, `gas`) từ tầng `device`.
2. Quản lý trạng thái hệ thống và lưu trữ lịch sử cảnh báo nguy hiểm (`danger = true`).
3. Cung cấp API `shared attributes` để đồng bộ hóa lệnh điều khiển Quạt (`fanRunning`) và Còi (`buzzerRunning`) giữa giao diện Web với thiết bị phần cứng.