void mqttCallback(const MQTT::Publish& pub) {
  #if defined(DEBUG)
    Serial.print("Message arrived [");
    Serial.print(pub.payload_string());
    Serial.print("] ");
    for (int i = 0; i < pub.payload_len(); i++) {
      Serial.print((char)pub.payload()[i]);
    }
    Serial.println();
  #endif
  
  String topic = pub.topic();

  if(topic == MQTT_STATUS_TOPIC) {
    for(uint8_t i = 0; i < NO_OF_RELAYS; i++){
      send_state(i, (relay_on == i ? 1 : 0));
    }
  }
  else if(topic.substring(0,topic.length()-1) == MQTT_RELAY_TOPIC ){
    uint8_t relay = topic.substring(topic.length()-1).toInt();

    String topic = pub.payload_string();

    if(topic == MQTT_STATE_ON) set_valve(relay, HIGH);
    else if(topic == MQTT_STATE_OFF) set_valve(relay, LOW);
  }
}

bool send_state(int valve, bool state){
  char buffer[20];
  String topic = MQTT_RELAY_TOPIC;
  topic.concat(valve);
  topic.concat(MQTT_RELAY_TOPIC_STATE);

  if(state) {
    memcpy(buffer, MQTT_STATE_ON, sizeof(MQTT_STATE_ON));
  }
  else {
    memcpy(buffer, MQTT_STATE_OFF, sizeof(MQTT_STATE_OFF));
  }

  #if defined(DEBUG)
    Serial.print(F("Sending valve"));
    Serial.print(valve);
    Serial.print(F(" state: "));
    Serial.println((state ? MQTT_STATE_ON : MQTT_STATE_OFF));
  #endif
  
  return mqtt.publish(MQTT::Publish(topic, buffer).set_retain().set_qos(1));
}

void setupMqtt(){
  mqtt.set_callback(mqttCallback);
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

      if (mqtt.connect(MQTT::Connect(DEVICE_NAME).set_auth(MQTT_USER, MQTT_PASSWORD))) {
        mqtt.subscribe(MQTT::Subscribe()
                  .add_topic(MQTT_STATUS_TOPIC, 1));
                  
        for(uint8_t i = 0; i < NO_OF_RELAYS; i++){
          String topic = MQTT_RELAY_TOPIC;
          topic.concat(i);
          mqtt.subscribe(MQTT::Subscribe().add_topic(topic, 1));
        }
        
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
        return false;
      }
      return mqtt.connected();
    }
  }
  blink_enabled = false;
  digitalWrite(LED_INFO_PIN, HIGH);
  return true; 
}



