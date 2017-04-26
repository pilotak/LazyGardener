WiFiClient espClient;
PubSubClient mqtt(espClient);

bool mqtt_connected = false;
int relay_on = -1;
unsigned long relay_last_on = 0;
unsigned long relay_timeout = 0;

bool send_state(unsigned int valve, bool state);
bool set_valve(unsigned int valve, bool state, unsigned int time = 0);

bool wifiReconnect();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void setupMqtt();
bool mqttReconnect();
