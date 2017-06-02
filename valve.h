bool set_valve(int valve, bool state){
  if(valve > -1 && valve <= 6){
    #if defined(DEBUG)
      Serial.print(F("Turning 24V "));
      Serial.println((state ? "ON" : "OFF"));
    #endif
    if(state) digitalWrite(RELAY_24V_PIN, state);
    
    if(state && relay_on > -1){ // only one can be on at the time, if another is already on, turn it off
      #if defined(DEBUG)
        Serial.print(F("Turning valve "));
        Serial.print(relay_on);
        Serial.println(" OFF");
      #endif
      digitalWrite(relay[relay_on], LOW);
      digitalWrite(led[relay_on], LOW);
      send_state(relay_on, false);
    }

    relay_timeout = default_relay_timeout[valve];

    if(state) relay_last_on = millis();

    #if defined(DEBUG)
      Serial.print(F("Turning valve "));
      Serial.print(valve);
      Serial.print((state ? " ON" : " OFF"));
      
      if(state){
        Serial.print(F(" for "));
        Serial.print(relay_timeout);
        Serial.print(F("ms = "));
        Serial.print(relay_timeout/60000);
        Serial.print(F("min"));
      }
      Serial.println();
    #endif

    relay_on = (state ? valve : -1);
    digitalWrite(relay[valve], state);
    digitalWrite(led[valve], state);

    if(!state) {
      delay(300);
      digitalWrite(RELAY_24V_PIN, state);
    }
    
    send_state(valve, state);

    return true;
  }
  return false;
}
