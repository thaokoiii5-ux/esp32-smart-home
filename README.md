\# ESP32 Smart Home Gas Monitoring System



\## Overview



This project implements a Smart Home Gas Monitoring and Safety System using ESP32. The system continuously monitors gas concentration and environmental conditions, displays real-time information, and sends alerts when abnormal situations are detected.



\## Features



\* Real-time gas leakage detection.

\* OLED display for system status and sensor readings.

\* Remote monitoring through IoT platform.

\* Automatic alarm activation when gas concentration exceeds the safety threshold.

\* Smart home integration using ESP32 Wi-Fi connectivity.

\* Real-time notifications to users.



\## Hardware Components



\* ESP32 Development Board

\* Gas Sensor (MQ Series)

\* OLED Display (I2C)

\* Buzzer

\* LEDs

\* Relay Module (optional)

\* Jumper Wires

\* Power Supply



\## Software \& Technologies



\* Arduino IDE

\* ESP32 Framework

\* C/C++

\* JavaScript

\* Wi-Fi Communication

\* IoT Cloud Platform



\## Project Structure



```text

.

├── code\_nh\_m.ino      # Main ESP32 firmware

├── App.js             # Application/User Interface

├── secrets.h          # Private configuration (not uploaded)

└── README.md

```



\## System Workflow



1\. ESP32 reads data from the gas sensor.

2\. Sensor data is processed and evaluated.

3\. Information is displayed on the OLED screen.

4\. If gas concentration exceeds the predefined threshold:



&#x20;  \* Activate buzzer alarm.

&#x20;  \* Send notification to the user.

&#x20;  \* Trigger safety actions if configured.

5\. Users can monitor the system remotely through the IoT application.



\## Installation



\### Hardware Setup



\* Connect the gas sensor to ESP32.

\* Connect the OLED display via I2C.

\* Connect buzzer and LEDs to GPIO pins.

\* Power the ESP32 board.



\### Software Setup



1\. Install Arduino IDE.

2\. Install ESP32 board support package.

3\. Install required libraries.

4\. Configure Wi-Fi credentials in `secrets.h`.

5\. Upload `code\_nh\_m.ino` to ESP32.



\## Future Improvements



\* Mobile application integration.

\* Historical data storage and analytics.

\* Multiple gas sensor support.

\* AI-based anomaly detection.

\* Smart ventilation control.



\## Authors



PTIT - Internet of Things (IoT) Project



Smart Home Gas Monitoring and Safety System



