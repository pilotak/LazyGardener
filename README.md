# LazyGardener 

An open-source ESP32 based sprinkler controller board. It has 24AC power supply built-in for sprinkle valves as well as 5V for providing power to relays and processor, just plug into 230V power outlet. Power supply is made out of analog transformers so it's radio-amateur frindly to compare with switching supplies which generate a lot radio noise. 

It has been designed in Arduino IDE so it's easily hackable.

## Main features
* MQTT powered, JSON used
* [HomeAssistant](https://home-assistant.io/) ready, or any other MQTT based smarthome apps *ie. Domoticz*
* Arduino OTA enabled
* 6 channel relays
    * Each channel has its timeout, so once switched on it will automatically turns off
    * Only one channel is switched on at the time to preserve pressure in water system *(useful if you have pipes too far from pump)*
    * LED indication of each channel
* Yellow LED
    * **_Off_**: no Wifi, no MQTT connection
    * **_Blinking_**: connected to Wifi but no MQTT connection
    * **_On_**: Wifi and MQTT connected

*The reason why ESP32 was chosen it that once Bluetooth stack is available from Espressif it will behave as a Bluetooth to MQTT bridge for Xiaomi Mi Flora.*


In order to compile, you need to install following libraries ans rename `setting.example.h` to `setting.h`
* ArduinoJSON https://github.com/bblanchon/ArduinoJson
* PubSubClient (Imroy version) https://github.com/Imroy/pubsubclient

### Configuration.yaml for HomeAssistant
```yaml
switch:
  - platform: mqtt
    name: "LazyGardener_herbs"
    state_topic: "LazyGardener/state"
    command_topic: "LazyGardener/cmd"
    payload_on: '{"valve":2,"state":1}'
    payload_off: '{"valve":2,"state":0}'
    optimistic: false
    qos: 1
```
