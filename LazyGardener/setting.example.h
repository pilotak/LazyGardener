#define DEVICE_NAME "LazyGardener"  // used for MQTT, OTA, mdns
#define WIFI_SSID "***"
#define WIFI_PASSWORD "******"
#define OTA_PORT 3232

#define DEBUG_SERIAL
#define DEBUG_TELNET

IPAddress MQTT_SERVER(192, 168, 0, 123);
#define MQTT_PORT 1883
#define MQTT_USER "admin"
#define MQTT_PASSWORD "admin"
#define MQTT_QOS 1
#define MQTT_STATUS_INTERVAL 60000
#define MQTT_IP_TOPIC DEVICE_NAME "/ip"  // will result ie. LazyGardener/ip
#define MQTT_RSSI_TOPIC DEVICE_NAME "/rssi"  // will result ie. LazyGardener/rssi
#define MQTT_STATUS_TOPIC DEVICE_NAME "/status"  // will result ie. LazyGardener/status
#define MQTT_STATUS_RSSI DEVICE_NAME "/rssi"  // will result ie. LazyGardener/rssi
#define MQTT_RELAY_TOPIC_STATE DEVICE_NAME "/state"  // will result ie. LazyGardener/state
#define MQTT_RELAY_TOPIC_RELAY_STATE DEVICE_NAME "/relay"  // will result ie. LazyGardener/relay/* where aterisk is relay number
#define MQTT_RELAY_TOPIC_SET_APPENDIX "set"  // will result ie. LazyGardener/relay/*/set
#define MQTT_STATE_ON "1"
#define MQTT_STATE_OFF "0"
#define MQTT_STATUS_ALIVE MQTT_STATE_ON
#define MQTT_STATUS_DEAD MQTT_STATE_OFF


#define TELNET_MAX_CLIENTS 2
#define TELNET_PORT 23

#define CONNECTION_INTERVAL 5000       // 5s
#define WIFI_CONNECTION_TIMEOUT 20000  // 20s

const uint32_t default_relay_timeout[NO_OF_RELAYS] = {
    600000,  // 10min
    600000,  // 10min
    600000,  // 10min
    600000,  // 10min
    600000,  // 10min
    600000   // 10min fruit
};
