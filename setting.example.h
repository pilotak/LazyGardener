#define DEBUG

#define DEVICE_NAME "LazyGardener" // used for MQTT and OTA
#define WIFI_SSID "***"
#define WIFI_PASSWORD "******"

#define MQTT_SERVER "xxx.xxx.xxx.xxx"
#define MQTT_PORT 1883
#define MQTT_USER "***"
#define MQTT_PASSWORD "******"
#define MQTT_CMD_TOPIC "LazyGardener/cmd"
#define MQTT_STATE_TOPIC "LazyGardener/state"

#define CONNECTION_INTERVAL 5000      // 5s
#define WIFI_CONNECTION_TIMEOUT 20000 // 20s

#define MAX_RELAY_TIMEOUT 1800000 // 30min

const unsigned long default_relay_timeout[NO_OF_RELAYS] = {
  360000, // 6min herbs
  600000, // 10min fruit
  900000, // 15min flowers
  420000, // 7min veg
  360000, // 6min shade flowers
  600000  // 10min spare relay
 };
