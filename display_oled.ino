// ==========================================
// OLED DISPLAY FUNCTIONS (GIAO DIỆN OLED)
// ==========================================

void hienThiOLED(int gas, float temp, float humi) { 
  display.clearDisplay(); 
  display.setTextSize(1); 
  
  // Hiển thị thanh trạng thái WiFi 
  if (WiFi.status() == WL_CONNECTED) { 
    display.fillRect(0, 0, 128, 12, WHITE); 
    display.setTextColor(BLACK); 
    display.setCursor(10, 2); 
    display.print("WIFI OK"); 
  } else {
    display.drawRect(0, 0, 128, 12, WHITE); 
    display.setTextColor(WHITE); 
    display.setCursor(10, 2); 
    display.print("CHUA CO WiFi"); 
  }
  
  // In thông số Gas 
  display.setTextColor(WHITE); 
  display.setCursor(0, 16); 
  display.print("Gas: "); 
  display.print(gas); 
  display.print(" ppm"); 
  
  // In thông số Nhiệt độ 
  display.setCursor(0, 28); 
  display.print("Temp: "); 
  display.print(temp, 1); 
  display.print("C"); 
  
  // In thông số Độ ẩm 
  display.setCursor(0, 40); 
  display.print("Humi: "); 
  display.print(humi, 1); 
  display.print("%"); 
  
  // In trạng thái Quạt và Còi 
  display.setCursor(0, 52); 
  display.print("Q:"); 
  display.print(fanRunning ? "ON" : "OFF"); 
  display.print(" C:"); 
  display.print(buzzerRunning ? "ON" : "OFF"); 
  
  // Ký hiệu cảnh báo nguy hiểm 
  if (systemDanger) { 
    display.setCursor(80, 52); 
    display.print("!"); 
  }
  
  display.display(); 
}