#include <WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>
#include "ESPmDNS.h"

#include "pins.h"
#include "setting.h"
#include "fn.h"
#include "network.h"
#include "mqtt.h"
#include "valve.h"

void setup() {
#if defined(DEBUG_SERIAL)
    Serial.begin(115200);
#endif

    snprintf(sbuf, sizeof(sbuf), "\n\nBooting %s\n", DEVICE_NAME);
    telnetSerial(sbuf);

    pinMode(RELAY_24V_PIN, OUTPUT);
    pinMode(LED_INFO_PIN, OUTPUT);
    digitalWrite(RELAY_24V_PIN, LOW);
    digitalWrite(LED_INFO_PIN, LOW);

    for (byte i = 0; i < NO_OF_RELAYS; i++) {
        pinMode(relay[i], OUTPUT);
        pinMode(led[i], OUTPUT);
        delay(1);
        digitalWrite(relay[i], LOW);
        digitalWrite(led[i], LOW);
    }

    if (wifiReconnect()) {
        snprintf(sbuf, sizeof(sbuf), "Setting up MQTT\n");
        telnetSerial(sbuf);
        setupMqtt();
    }
    else {
        ESP.restart();
    }

    setupBlinker();
}

void loop() {
    if (relay_on > -1) {
        if (millis() - relay_last_on >= relay_timeout) set_valve(relay_on, false);
    }

    if (wifiReconnect()) {
        ArduinoOTA.handle();
        telnetLoop();
        mqtt_connected = mqttReconnect();

        if (mqtt_connected) {
            mqtt.loop();

            if (millis() - last_status >= MQTT_STATUS_INTERVAL) {
                last_status = millis();
                sendStatus();
            }
        }

    } else {
        digitalWrite(LED_INFO_PIN, LOW);
    }
}
