void mqttCallback(char* topic, byte* payload, unsigned int length) {
  #if defined(DEBUG)
    Serial.print("Message arrived [");
    Serial.print(topic);
    Serial.print("] ");
    for (int i = 0; i < length; i++) {
      Serial.print((char)payload[i]);
    }
    Serial.println();
  #endif
  DynamicJsonBuffer inBuffer(bufferSize);
  JsonObject& inData = inBuffer.parseObject(payload);
  
  
  if (!inData.success()) {
    #if defined(DEBUG)
      Serial.println(F("parseObject() failed"));
    #endif
    return;
  }

  if(inData.containsKey("status")) {
    for(unsigned int i = 0; i < 6; i++){
      send_state(i,(relay_on == i ? 1 : 0));
    }
  }
  else if(inData.containsKey("valve") && inData.containsKey("state")){
    unsigned int valve = inData.get<int>("valve");
    bool state = inData.get<bool>("state");
    unsigned int time = inData.get<int>("time");
    
    set_valve(valve, state, time);
  }
}

bool send_state(int valve, bool state){
  char buffer[100];
  StaticJsonBuffer<100> outBuffer;
  JsonObject& outData = outBuffer.createObject();

  outData["valve"] = valve;
  outData["state"] = (byte)state;

  #if defined(DEBUG)
    Serial.println(F("Sending: "));
    outData.prettyPrintTo(Serial);
    Serial.println();
  #endif
  
  outData.printTo(buffer, sizeof(buffer));
  delay(1);
  return mqtt.publish(MQTT_STATE_TOPIC, buffer);
}

void setupMqtt(){
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
  blink_enabled = true;
}

bool mqttReconnect(){
  static unsigned long lastReconnectAttempt = 0;
   if (!mqtt.connected()) {
    blink_enabled = true;
    unsigned long now = millis();
    
    if (now - lastReconnectAttempt > CONNECTION_INTERVAL) {
      #if defined(DEBUG)
        Serial.print(F("Connecting to MQTT: "));
      #endif
      lastReconnectAttempt = now;

      if (mqtt.connect(DEVICE_NAME, MQTT_USER, MQTT_PASSWORD)) {
        mqtt.subscribe(MQTT_CMD_TOPIC);
        lastReconnectAttempt = 0;

        #if defined(DEBUG)
          Serial.println(F("OK"));
        #endif

        // send state on reconnect
        for(unsigned int i = 0; i < 6; i++){
          send_state(i,(relay_on == i ? 1 : 0));
        }
      }
      else {
        #if defined(DEBUG)
          Serial.println(F("failed"));
        #endif
      }
      return mqtt.connected();
    }
  }
  blink_enabled = false;
  digitalWrite(LED_INFO_PIN, HIGH);
  return true; 
}



