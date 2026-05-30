/*******************************************************************************
 * SMART HOME GAS MONITOR - SỬA CÒI
 ******************************************************************************/

#define BLYNK_TEMPLATE_ID   "TMPL6xRaDV3Lf"
#define BLYNK_TEMPLATE_NAME "SmartHome"
#define BLYNK_AUTH_TOKEN    "bVSR8ppuW2fjsaVIAONWIlruSW4-X9Dh"

#include "secrets.h"

#include <WiFi.h>
#include <WiFiClient.h>
#include <BlynkSimpleEsp32.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "DHT.h"

char ssid[] = "BONRIUS";
char pass[] = "88888888";

int THRESHOLD_GAS = 800;
float THRESHOLD_TEMP = 35.0;
float THRESHOLD_HUMI = 70.0;

const uint8_t PIN_GAS = 36;
const uint8_t PIN_DHT = 23;
const uint8_t PIN_BTN = 12;
const uint8_t PIN_BZR = 25;
const uint8_t PIN_RLY = 26;

bool fanRunning = false;
bool buzzerRunning = false;
bool systemDanger = false;
bool lastDanger = false;
bool fanTimerActive = false;
bool manualFan = false;
bool manualBuzzer = false;
uint32_t fanTimerEnd = 0;

Adafruit_SSD1306 display(128, 64, &Wire, -1);
DHT dht(PIN_DHT, DHT11);

void IRAM_ATTR isr_Button() {
  static uint32_t lastPress = 0;
  if (millis() - lastPress > 250) {
    lastPress = millis();
    buzzerRunning = !buzzerRunning;
    manualBuzzer = true;
    digitalWrite(PIN_BZR, buzzerRunning ? HIGH : LOW);
  }
}

BLYNK_WRITE(V0) {
  fanRunning = param.asInt();
  manualFan = true;
  digitalWrite(PIN_RLY, fanRunning ? HIGH : LOW);
  Blynk.virtualWrite(V0, fanRunning ? 1 : 0);
}

BLYNK_WRITE(V4) {
  buzzerRunning = param.asInt();
  manualBuzzer = true;
  digitalWrite(PIN_BZR, buzzerRunning ? HIGH : LOW);
  Blynk.virtualWrite(V4, buzzerRunning ? 1 : 0);
}

BLYNK_WRITE(V7) {
  int gio = param.asInt();
  if (gio > 0 && fanRunning) {
    fanTimerEnd = millis() + (gio * 3600000UL);
    fanTimerActive = true;
  }
}

BLYNK_WRITE(V10) { THRESHOLD_GAS = param.asInt(); }
BLYNK_WRITE(V11) { THRESHOLD_TEMP = param.asFloat(); }
BLYNK_WRITE(V12) { THRESHOLD_HUMI = param.asFloat(); }

void setup() {
  Serial.begin(115200);
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) while(1);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(10, 10);
  display.println("KHOI DONG...");
  display.display();
  
  dht.begin();
  pinMode(PIN_BTN, INPUT_PULLUP);
  pinMode(PIN_BZR, OUTPUT);
  pinMode(PIN_RLY, OUTPUT);
  digitalWrite(PIN_BZR, LOW);
  digitalWrite(PIN_RLY, LOW);
  attachInterrupt(digitalPinToInterrupt(PIN_BTN), isr_Button, FALLING);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  
  int dem = 0;
  while (WiFi.status() != WL_CONNECTED && dem < 20) {
    delay(500);
    dem++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
  }
}

void loop() {
  // 1. ĐỌC CẢM BIẾN
  int gas = analogRead(PIN_GAS);
  float temp = dht.readTemperature();
  float humi = dht.readHumidity();
  if (isnan(temp)) temp = 0;
  if (isnan(humi)) humi = 0;
  
  // 2. KIỂM TRA NGUY HIỂM
  bool gasD = gas > THRESHOLD_GAS;
  bool tempD = temp > THRESHOLD_TEMP;
  bool humiD = humi > THRESHOLD_HUMI;
  bool wasDanger = systemDanger;
  systemDanger = gasD || tempD || humiD;
  
  // 3. THÔNG BÁO
  if (systemDanger && !wasDanger) {
    Serial.println("!!! CANH BAO !!!");
    buzzerRunning = true;  // CÒI TỰ BẬT KHI NGUY HIỂM
    if (WiFi.status() == WL_CONNECTED) {
      Blynk.virtualWrite(V5, 1);
      Blynk.logEvent("alert");
    }
  }
  if (!systemDanger && wasDanger) {
    buzzerRunning = false;  // CÒI TỰ TẮT KHI AN TOÀN
    manualBuzzer = false;
    if (WiFi.status() == WL_CONNECTED) {
      Blynk.virtualWrite(V5, 0);
    }
  }
  
  // 4. QUẠT AUTO
  if (systemDanger && !manualFan && !fanRunning) {
    fanRunning = true;
    digitalWrite(PIN_RLY, HIGH);
  }
  if (!systemDanger && !manualFan && fanRunning) {
    fanRunning = false;
    digitalWrite(PIN_RLY, LOW);
  }
  if (!systemDanger && manualFan && !fanRunning) {
    manualFan = false;
  }
  
  // 5. ĐIỀU KHIỂN CÒI TRỰC TIẾP
  if (buzzerRunning) {
    digitalWrite(PIN_BZR, (millis() % 400 < 200) ? HIGH : LOW);
  } else {
    digitalWrite(PIN_BZR, LOW);
  }
  
  // 6. HẾT GIỜ
  if (fanTimerActive && millis() >= fanTimerEnd) {
    fanRunning = false;
    manualFan = false;
    fanTimerActive = false;
    digitalWrite(PIN_RLY, LOW);
  }
  
  // 7. OLED
  display.clearDisplay();
  display.setTextSize(1);
  
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
  
  display.setTextColor(WHITE);
  display.setCursor(0, 16);
  display.print("Gas: ");
  display.print(gas);
  display.print(" ppm");
  
  display.setCursor(0, 28);
  display.print("Temp: ");
  display.print(temp, 1);
  display.print("C");
  
  display.setCursor(0, 40);
  display.print("Humi: ");
  display.print(humi, 1);
  display.print("%");
  
  display.setCursor(0, 52);
  display.print("Q:");
  display.print(fanRunning ? "ON" : "OFF");
  display.print(" C:");
  display.print(buzzerRunning ? "ON" : "OFF");
  
  if (systemDanger) {
    display.setCursor(80, 52);
    display.print("!");
  }
  
  display.display();
  
  // 8. GỬI BLYNK
  if (WiFi.status() == WL_CONNECTED) {
    Blynk.run();
    Blynk.virtualWrite(V1, temp);
    Blynk.virtualWrite(V2, humi);
    Blynk.virtualWrite(V3, gas);
    Blynk.virtualWrite(V0, fanRunning ? 1 : 0);
    Blynk.virtualWrite(V4, buzzerRunning ? 1 : 0);
    if (fanTimerActive) {
      Blynk.virtualWrite(V7, (fanTimerEnd - millis()) / 3600000);
    }
  }
  
  delay(500);
}