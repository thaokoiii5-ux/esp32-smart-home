/*******************************************************************************
 * SMART HOME GAS MONITOR - HTTP REST API (ThingsBoard Cloud)
 * Giao thức: HTTP (port 80)
 * Logic: Danger Detection + Auto Fan/Buzzer + Button Control + OLED Display
 * PHIÊN BẢN: FULL FEATURE - ĐÃ TEST
 ******************************************************************************/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "DHT.h"
#include <ArduinoJson.h>

// ============= CONFIG THINGBOARD =============
#define THINGBOARD_SERVER    "thingsboard.cloud"
#define ACCESS_TOKEN         "  "

// WiFi
#define WIFI_SSID            "BONRIUS"
#define WIFI_PASSWORD        "88888888"

// Pins
#define PIN_GAS              36
#define PIN_DHT              23
#define PIN_BTN              12
#define PIN_BZR              25
#define PIN_RLY              26

// Thresholds
#define THRESHOLD_GAS        800
#define THRESHOLD_TEMP       40.0
#define THRESHOLD_HUMI       70.0

// Timing
#define TELEMETRY_INTERVAL   5000    // Gửi mỗi 5s
#define HTTP_TIMEOUT         10000
// ============================================

// ============= BIẾN TRẠNG THÁI =============
bool fanRunning = false;
bool buzzerRunning = false;
bool systemDanger = false;
bool manualFan = false;
bool manualBuzzer = false;
float temperature = 0;
float humidity = 0;
int gasValue = 0;

unsigned long lastTelemetry = 0;
unsigned long lastButtonPress = 0;
bool wifiConnected = false;
bool lastHttpSuccess = false;
// ============================================

// ============= THIẾT BỊ =============
Adafruit_SSD1306 display(128, 64, &Wire, -1);
DHT dht(PIN_DHT, DHT11);
// ============================================

// ============= GỬI TELEMETRY QUA HTTP =============
bool sendTelemetryHTTP() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("❌ WiFi not connected!");
        return false;
    }
    
    WiFiClient client;
    HTTPClient http;
    
    String url = "http://" + String(THINGBOARD_SERVER) + 
                 "/api/v1/" + String(ACCESS_TOKEN) + "/telemetry";
    
    // Tạo JSON payload
    StaticJsonDocument<256> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["gas"] = gasValue;
    doc["fanRunning"] = fanRunning;
    doc["buzzerRunning"] = buzzerRunning;
    doc["danger"] = systemDanger;
    
    String payload;
    serializeJson(doc, payload);
    
    Serial.println("📤 Sending: " + payload);
    
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT);
    
    int httpCode = http.POST(payload);
    
    Serial.print("📊 HTTP Response: ");
    Serial.println(httpCode);
    
    http.end();
    
    if (httpCode == 200 || httpCode == 201) {
        Serial.println("✅ Data sent successfully!");
        return true;
    } else {
        Serial.println("❌ Send failed!");
        return false;
    }
}
// ============================================

// ============= BUTTON INTERRUPT =============
void IRAM_ATTR isrButton() {
    unsigned long now = millis();
    if (now - lastButtonPress > 250) {  // Debounce
        lastButtonPress = now;
        buzzerRunning = !buzzerRunning;
        manualBuzzer = true;
        Serial.println("🔔 Button Pressed - Buzzer: " + String(buzzerRunning ? "ON" : "OFF"));
    }
}
// ============================================

// ============= SETUP =============
void setup() {
    Serial.begin(115200);
    delay(100);
    
    Serial.println("\n\n");
    Serial.println("🚀 ESP32 Gas Monitor - HTTP Version");
    Serial.println("=====================================");
    
    // OLED Init
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("❌ OLED Failed!");
        while(1);
    }
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setCursor(20, 20);
    display.println("INITIALIZING...");
    display.display();
    Serial.println("✅ OLED OK");
    
    // DHT Init
    dht.begin();
    delay(100);
    Serial.println("✅ DHT11 OK");
    
    // Pin Setup
    pinMode(PIN_BTN, INPUT_PULLUP);
    pinMode(PIN_BZR, OUTPUT);
    pinMode(PIN_RLY, OUTPUT);
    digitalWrite(PIN_BZR, LOW);
    digitalWrite(PIN_RLY, LOW);
    attachInterrupt(digitalPinToInterrupt(PIN_BTN), isrButton, FALLING);
    Serial.println("✅ Pins OK");
    
    // WiFi Connect
    Serial.print("📶 WiFi: " + String(WIFI_SSID) + "...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempt = 0;
    while (WiFi.status() != WL_CONNECTED && attempt < 20) {
        delay(500);
        Serial.print(".");
        attempt++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        Serial.println(" ✅");
        Serial.print("🌐 IP: ");
        Serial.println(WiFi.localIP());
    } else {
        wifiConnected = false;
        Serial.println(" ❌");
    }
    
    Serial.println("🚀 Ready!");
    Serial.println("=====================================\n");
}
// ============================================

// ============= LOOP =============
void loop() {
    // Maintain WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        wifiConnected = false;
        if (millis() % 10000 < 100) {  // Log mỗi 10s
            Serial.println("⚠️  WiFi disconnected, reconnecting...");
            WiFi.reconnect();
        }
    } else {
        wifiConnected = true;
    }
    
    // ========== 1. ĐỌC CẢM BIẾN ==========
    gasValue = analogRead(PIN_GAS);
    float tempRead = dht.readTemperature();
    float humiRead = dht.readHumidity();
    
    if (!isnan(tempRead)) {
        temperature = tempRead;
    }
    if (!isnan(humiRead)) {
        humidity = humiRead;
    }
    
    // ========== 2. KIỂM TRA NGUY HIỂM ==========
    bool gasD = gasValue > THRESHOLD_GAS;
    bool tempD = temperature > THRESHOLD_TEMP;
    bool humiD = humidity > THRESHOLD_HUMI;
    bool wasDanger = systemDanger;
    
    systemDanger = gasD || tempD || humiD;
    
    // Khi vừa phát hiện nguy hiểm
    if (systemDanger && !wasDanger) {
        Serial.println("\n⚠️ ⚠️ ⚠️ DANGER DETECTED! ⚠️ ⚠️ ⚠️");
        Serial.println("Gas: " + String(gasValue) + ", Temp: " + String(temperature) + "C, Humi: " + String(humidity) + "%");
        buzzerRunning = true;  // Auto bíp
    }
    
    // ========== 3. ĐIỀU KHIỂN BUZZER ==========
    // Auto off buzzer khi không còn nguy hiểm (nếu không manual)
    if (!systemDanger && wasDanger && !manualBuzzer) {
        buzzerRunning = false;
    }
    
    // Xuất điều khiển Buzzer
    if (buzzerRunning) {
        // Bíp 200ms on, 200ms off
        digitalWrite(PIN_BZR, (millis() % 400 < 200) ? HIGH : LOW);
    } else {
        digitalWrite(PIN_BZR, LOW);
    }
    
    // ========== 4. ĐIỀU KHIỂN QUẠT ==========
    // Auto bật quạt khi nguy hiểm
    if (systemDanger && !manualFan && !fanRunning) {
        fanRunning = true;
        digitalWrite(PIN_RLY, HIGH);
        Serial.println("🌀 Fan Auto ON");
    }
    
    // Auto tắt quạt khi hết nguy hiểm (nếu không manual)
    if (!systemDanger && !manualFan && fanRunning) {
        fanRunning = false;
        digitalWrite(PIN_RLY, LOW);
        Serial.println("🌀 Fan Auto OFF");
    }
    
    // Reset manual mode khi hết nguy hiểm
    if (!systemDanger && manualFan && !fanRunning) {
        manualFan = false;
    }
    
    // ========== 5. HIỂN THỊ OLED ==========
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(WHITE);
    
    // Status Bar
    if (wifiConnected && lastHttpSuccess) {
        display.fillRect(0, 0, 128, 12, WHITE);
        display.setTextColor(BLACK);
        display.setCursor(5, 2);
        display.print("THINGBOARD HTTP OK");
    } else if (wifiConnected) {
        display.drawRect(0, 0, 128, 12, WHITE);
        display.setTextColor(WHITE);
        display.setCursor(5, 2);
        display.print("WiFi OK, HTTP...");
    } else {
        display.drawRect(0, 0, 128, 12, WHITE);
        display.setTextColor(WHITE);
        display.setCursor(20, 2);
        display.print("NO WiFi");
    }
    
    // Sensor Data
    display.setTextColor(WHITE);
    display.setCursor(0, 16);
    display.print("Gas: "); display.print(gasValue);
    if (gasD) display.print(" !GAS!");
    else display.print(" ppm");
    
    display.setCursor(0, 28);
    display.print("T: "); display.print(temperature, 1); display.print("C");
    if (tempD) display.print(" !HOT!");
    
    display.setCursor(0, 40);
    display.print("H: "); display.print(humidity, 1); display.print("%");
    if (humiD) display.print(" !WET!");
    
    // Control Status
    display.setCursor(0, 52);
    display.print("F:"); display.print(fanRunning ? "ON" : "OFF");
    display.print(" B:"); display.print(buzzerRunning ? "ON" : "OFF");
    
    // Danger Indicator
    if (systemDanger) {
        display.setTextColor(BLACK);
        display.fillRect(105, 50, 23, 14, WHITE);
        display.setCursor(110, 52);
        display.setTextSize(2);
        display.print("!");
        display.setTextSize(1);
    }
    
    display.display();
    
    // ========== 6. GỬI TELEMETRY ==========
    if (millis() - lastTelemetry > TELEMETRY_INTERVAL) {
        lastTelemetry = millis();
        if (wifiConnected) {
            lastHttpSuccess = sendTelemetryHTTP();
        }
    }
    
    // ========== 7. ĐỌC LỆNH ĐIỀU KHIỂN TỪ THINGSBOARD ==========
    // Web App ghi shared attribute → ESP32 đọc về để bật/tắt relay và còi
    static unsigned long lastCmdPoll = 0;
    if (millis() - lastCmdPoll > 3000 && wifiConnected) {
        lastCmdPoll = millis();
        
        WiFiClient cmdClient;
        HTTPClient cmdHttp;
        
        String cmdUrl = "http://" + String(THINGBOARD_SERVER) +
                        "/api/v1/" + String(ACCESS_TOKEN) +
                        "/attributes?sharedKeys=fanRunning,buzzerRunning";
        
        cmdHttp.begin(cmdClient, cmdUrl);
        cmdHttp.setTimeout(5000);
        int cmdCode = cmdHttp.GET();
        
        if (cmdCode == 200) {
            String cmdBody = cmdHttp.getString();
            Serial.println("📥 CMD: " + cmdBody);
            
            StaticJsonDocument<256> cmdDoc;
            if (!deserializeJson(cmdDoc, cmdBody)) {
                JsonObject shared = cmdDoc["shared"];
                
                if (shared.containsKey("fanRunning")) {
                    bool newFan = shared["fanRunning"].as<bool>();
                    if (newFan != fanRunning) {
                        fanRunning = newFan;
                        manualFan = true;
                        digitalWrite(PIN_RLY, fanRunning ? HIGH : LOW);
                        Serial.println("🌀 Fan CMD → " + String(fanRunning ? "ON" : "OFF"));
                    }
                }
                
                if (shared.containsKey("buzzerRunning")) {
                    bool newBzr = shared["buzzerRunning"].as<bool>();
                    if (newBzr != buzzerRunning) {
                        buzzerRunning = newBzr;
                        manualBuzzer = true;
                        Serial.println("🔔 Buzzer CMD → " + String(buzzerRunning ? "ON" : "OFF"));
                    }
                }
            }
        }
        cmdHttp.end();
    }
    // =============================================================

    delay(100);
}
// ============================================
