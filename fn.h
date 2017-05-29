WiFiClient espClient;
PubSubClient mqtt(espClient, MQTT_SERVER, MQTT_PORT);

hw_timer_t * timer = NULL;
volatile SemaphoreHandle_t makeBlink;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

bool mqtt_connected = false;
int relay_on = -1;
unsigned long relay_last_on = 0;
unsigned long relay_timeout = 0;

bool blink_state = false;
volatile bool blink_enabled = true;
#define blink_interval 250

const size_t bufferSize = JSON_OBJECT_SIZE(3) + 40; // according to https://bblanchon.github.io/ArduinoJson/assistant/

bool send_state(int valve, bool state);
bool set_valve(int valve, bool state, unsigned int time = 0);

bool wifiReconnect();
void mqttCallback(const MQTT::Publish& pub);
void setupMqtt();
bool mqttReconnect();


void IRAM_ATTR onTimer(){
  xSemaphoreGiveFromISR(makeBlink, NULL);
  blink_state = !blink_state;
  if(blink_enabled) digitalWrite(LED_INFO_PIN, blink_state);
}

void setupBlinker(){
  makeBlink = xSemaphoreCreateBinary();
  timer = timerBegin(0, 80, true);
  timerAttachInterrupt(timer, &onTimer, true);
  timerAlarmWrite(timer, blink_interval*1000, true);
  timerAlarmEnable(timer);
}

