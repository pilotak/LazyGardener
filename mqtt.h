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

  StaticJsonBuffer<100> inBuffer;
  JsonObject& inData = inBuffer.parseObject(payload);
  
  
  if (!inData.success()) {
    #if defined(DEBUG)
      Serial.println(F("parseObject() failed"));
    #endif
    return;
  }

  if(inData.containsKey("status")) {
    char buffer[100];
    StaticJsonBuffer<100> outBuffer;
    JsonObject& outData = outBuffer.createObject();
  
    outData["valve1"] = (relay_on == 0 ? 1: 0);
    outData["valve2"] = (relay_on == 1 ? 1: 0);
    outData["valve3"] = (relay_on == 2 ? 1: 0);
    outData["valve4"] = (relay_on == 3 ? 1: 0);
    outData["valve5"] = (relay_on == 4 ? 1: 0);
    outData["valve6"] = (relay_on == 5 ? 1: 0);

    #if defined(DEBUG)
      Serial.println(F("Sending: "));
      outData.prettyPrintTo(Serial);
      Serial.println();
    #endif
    
    outData.printTo(buffer, sizeof(buffer));
    mqtt.publish(MQTT_STATE_TOPIC, buffer);
  }
  else if(inData.containsKey("valve") && inData.containsKey("state")){
    unsigned int valve = inData.get<int>("valve");
    bool state = inData.get<bool>("state");
    unsigned int time = inData.get<int>("time");
    
    set_valve(valve, state, time);
  }
}

bool send_state(unsigned int valve, bool state){
  char buffer[50];
  StaticJsonBuffer<50> outBuffer;
  JsonObject& outData = outBuffer.createObject();

  outData["valve"] = valve;
  outData["state"] = (byte)state;

  #if defined(DEBUG)
    Serial.println(F("Sending: "));
    outData.prettyPrintTo(Serial);
    Serial.println();
  #endif
  
  outData.printTo(buffer, sizeof(buffer));
  return mqtt.publish(MQTT_STATE_TOPIC, buffer);
}

void setupMqtt(){
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
}

bool mqttReconnect(){
  static unsigned long lastReconnectAttempt = 0;
   if (!mqtt.connected()) {
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
      }
      else {
        #if defined(DEBUG)
          Serial.println(F("failed"));
        #endif
      }
      return mqtt.connected();
    }
  }

  return true; 
}



