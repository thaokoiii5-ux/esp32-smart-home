# Smart Home Gas Monitoring and Safety System

## Introduction

Smart Home Gas Monitoring and Safety System is an IoT-based project developed using ESP32 to monitor gas concentration and improve household safety. The system provides real-time monitoring, remote control, and instant alerts when dangerous gas levels are detected.

## Project Objectives

* Detect gas leakage in real time.
* Monitor sensor data remotely through a web application.
* Alert users when gas concentration exceeds a predefined threshold.
* Improve safety in smart home environments.
* Demonstrate the application of IoT technologies in home automation.

---

## Project Structure

```text
.
├── client/          # Web application interface
├── device/          # ESP32 firmware source code
├── server/          # Backend configuration and automation rules
├── README.md
└── .gitignore
```

---

## Hardware Components

* ESP32 Development Board
* MQ Gas Sensor
* OLED Display
* Buzzer
* LED Indicators
* Relay Module (optional)
* Jumper Wires
* Power Supply

---

## Software Technologies

* Arduino IDE
* ESP32 Framework
* JavaScript
* HTML/CSS
* Node.js
* IoT Communication Protocols

---

## System Workflow

1. ESP32 continuously reads gas concentration data.
2. Sensor values are processed and compared against safety thresholds.
3. Data is displayed on the OLED screen and transmitted to the monitoring application.
4. If gas levels exceed the threshold:

   * Alarm buzzer is activated.
   * Warning notifications are generated.
   * Safety automation can be triggered.
5. Users can monitor system status remotely through the web interface.

---

## Installation

### Device

1. Open the source code inside the `device` folder.
2. Configure Wi-Fi credentials.
3. Upload the firmware to ESP32 using Arduino IDE.

### Client

```bash
npm install
npm start
```

### Server

Configure automation rules and backend settings inside the `server` directory.

---

## Features

* Real-time gas monitoring
* Smart home safety alerts
* OLED display visualization
* Remote monitoring
* IoT connectivity
* Expandable architecture

---

## Team Information

Internet of Things (IoT) Project

PTIT – Posts and Telecommunications Institute of Technology

Topic: Smart Home Gas Monitoring and Safety System
