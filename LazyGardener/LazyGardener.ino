#include <WiFi.h>
#include <ESPmDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>

#include "pins.h"
#include "setting.h"
#include "fn.h"
#include "_wifi.h"
#include "mqtt.h"
#include "valve.h"

void setup() {
  Serial.begin(115200);
  #if defined(DEBUG)
    Serial.print(F("\n\nBooting "));
    Serial.println(DEVICE_NAME);
  #endif

  for(byte i = 0; i < NO_OF_RELAYS; i++){
    pinMode(relay[i], OUTPUT);
    pinMode(led[i], OUTPUT);
    delay(1);
    digitalWrite(relay[i], LOW);
    digitalWrite(led[i], LOW);
  }

  pinMode(RELAY_24V_PIN, OUTPUT);
  pinMode(LED_INFO_PIN, OUTPUT);
  digitalWrite(RELAY_24V_PIN, HIGH);
  digitalWrite(LED_INFO_PIN, LOW);

  if(wifiReconnect()) setupMqtt();
  else ESP.restart();

  setupBlinker();
}

void loop() {
  if(relay_on > -1){
    if(millis() - relay_last_on >= relay_timeout) set_valve(relay_on, false);
  }
  
  if(wifiReconnect()) {
    ArduinoOTA.handle();
    mqtt_connected = mqttReconnect();

    if(mqtt_connected){
      mqtt.loop();
    }
  }
  else {
    digitalWrite(LED_INFO_PIN, LOW);
  }
}
