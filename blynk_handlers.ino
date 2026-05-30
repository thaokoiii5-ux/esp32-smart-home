// ==========================================
// BLYNK EVENT HANDLERS (ĐIỀU KHIỂN TỪ XA)
// ==========================================

// Nhận lệnh bật tắt Quạt từ V0 
BLYNK_WRITE(V0) {
  fanRunning = param.asInt(); 
  manualFan = true; 
  digitalWrite(PIN_RLY, fanRunning ? HIGH : LOW); 
  Blynk.virtualWrite(V0, fanRunning ? 1 : 0); 
}

// Nhận lệnh bật tắt Còi từ V4 
BLYNK_WRITE(V4) {
  buzzerRunning = param.asInt(); 
  manualBuzzer = true; 
  digitalWrite(PIN_BZR, buzzerRunning ? HIGH : LOW); 
  Blynk.virtualWrite(V4, buzzerRunning ? 1 : 0); 
}

// Nhận thời gian hẹn giờ tắt Quạt từ V7 
BLYNK_WRITE(V7) {
  int gio = param.asInt(); 
  if (gio > 0 && fanRunning) { 
    fanTimerEnd = millis() + (gio * 3600000UL); 
    fanTimerActive = true; 
  }
}

// Cập nhật ngưỡng cảnh báo từ xa 
BLYNK_WRITE(V10) { THRESHOLD_GAS = param.asInt(); } 
BLYNK_WRITE(V11) { THRESHOLD_TEMP = param.asFloat(); } 
BLYNK_WRITE(V12) { THRESHOLD_HUMI = param.asFloat(); }