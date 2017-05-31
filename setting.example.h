#define DEBUG

#define DEVICE_NAME "LazyGardener" // used for MQTT and OTA
#define WIFI_SSID "***"
#define WIFI_PASSWORD "******"

IPAddress MQTT_SERVER(192, 168, 0, 100);
#define MQTT_PORT 1883
#define MQTT_USER "***"
#define MQTT_PASSWORD "******"
#define MQTT_STATUS_TOPIC DEVICE_NAME "/status"
#define MQTT_RELAY_TOPIC DEVICE_NAME "/relay" // will result ie. wifi-relay/relay* where aterisk is relay number
#define MQTT_RELAY_TOPIC_STATE  "/state" // will result ie. wifi-relay/relay1/state

#define MQTT_STATE_ON "ON"
#define MQTT_STATE_OFF "OFF"

#define CONNECTION_INTERVAL 5000      // 5s
#define WIFI_CONNECTION_TIMEOUT 20000 // 20s

const unsigned long default_relay_timeout[NO_OF_RELAYS] = {
  360000, // 6min herbs
  600000, // 10min fruit
  900000, // 15min flowers
  420000, // 7min veg
  360000, // 6min shade flowers
  600000  // 10min spare relay
 };
