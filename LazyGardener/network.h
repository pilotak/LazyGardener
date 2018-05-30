WiFiServer telnet(TELNET_PORT);
WiFiClient telnetClients[TELNET_MAX_CLIENTS];


void telnetSerial(const char * buf) {
#if defined(DEBUG_SERIAL)
    Serial.print(buf);
#endif

#if defined(DEBUG_TELNET)

    if (wifi_connected) {
        // push data to all connected telnet clients
        for (uint8_t i = 0; i < TELNET_MAX_CLIENTS; i++) {
            if (telnetClients[i] && telnetClients[i].connected()) {
                telnetClients[i].write(buf, strlen(buf));
                delay(1);
            }
        }
    }

#endif
}

void telnetLoop() {
    uint8_t i;

    if (telnet.hasClient()) {
        for (i = 0; i < TELNET_MAX_CLIENTS; i++) {
            // find free/disconnected spot
            if (!telnetClients[i] || !telnetClients[i].connected()) {
                if (telnetClients[i]) telnetClients[i].stop();

                telnetClients[i] = telnet.available();

                if (!telnetClients[i]) Serial.println("available broken");

                Serial.print("New client: ");
                Serial.print(i); Serial.print(' ');
                Serial.println(telnetClients[i].remoteIP());
                break;
            }
        }

        if (i >= TELNET_MAX_CLIENTS) {
            // no free/disconnected spot so reject
            telnet.available().stop();
        }
    }
}

bool wifiReconnect() {
    if (WiFi.status() != WL_CONNECTED) {
        digitalWrite(LED_INFO_PIN, LOW);
        wifi_connected = false;

        snprintf(sbuf, sizeof(sbuf), "Connecting to: %s\n", WIFI_SSID);
        telnetSerial(sbuf);

        WiFi.disconnect();
        WiFi.mode(WIFI_STA);
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        WiFi.setHostname(DEVICE_NAME);

        uint32_t now = millis();

        while (WiFi.status() != WL_CONNECTED) {
            delay(250);
            snprintf(sbuf, sizeof(sbuf), ".");
            telnetSerial(sbuf);

            if (millis() - now >= WIFI_CONNECTION_TIMEOUT) {
                snprintf(sbuf, sizeof(sbuf), "WiFi connection timeout, restarting...\n");
                telnetSerial(sbuf);
                ESP.restart();
                return false;
            }
        }

        /*while (WiFi.waitForConnectResult() != WL_CONNECTED) {
            snprintf(sbuf, sizeof(sbuf), "WiFi connection timeout, restarting...\n");
            telnetSerial(sbuf);
            delay(5000);
            ESP.restart();
        }*/

        snprintf(sbuf, sizeof(sbuf), "OK\n");
        telnetSerial(sbuf);

        ArduinoOTA.setPort(OTA_PORT);
        ArduinoOTA.setHostname(DEVICE_NAME);


        ArduinoOTA.onStart([]() {
            snprintf(sbuf, sizeof(sbuf), "\nStarting OTA\n");
            telnetSerial(sbuf);
        });
        ArduinoOTA.onEnd([]() {
            snprintf(sbuf, sizeof(sbuf), "\nEnd\n");
            telnetSerial(sbuf);
        });
        ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
            snprintf(sbuf, sizeof(sbuf), "Progress: %u\n", (progress / (total / 100)));
            telnetSerial(sbuf);
        });
        ArduinoOTA.onError([](ota_error_t error) {
            snprintf(sbuf, sizeof(sbuf), "Error[%u] \n", error);
            telnetSerial(sbuf);

            if (error == OTA_AUTH_ERROR) Serial.println(F("Auth Failed"));
            else if (error == OTA_BEGIN_ERROR) Serial.println(F("Begin Failed"));
            else if (error == OTA_CONNECT_ERROR) Serial.println(F("Connect Failed"));
            else if (error == OTA_RECEIVE_ERROR) Serial.println(F("Receive Failed"));
            else if (error == OTA_END_ERROR) Serial.println(F("End Failed"));
        });

        ArduinoOTA.begin();
        MDNS.begin(DEVICE_NAME);
        MDNS.addService("telnet", "tcp", TELNET_PORT);

        telnet.begin();
        telnet.setNoDelay(true);

        // reset telnet
        for (uint8_t i = 0; i < TELNET_MAX_CLIENTS; i++) {
            if (telnetClients[i]) telnetClients[i].stop();
        }

        snprintf(sbuf, sizeof(sbuf), "My IP: %s\n", WiFi.localIP().toString().c_str());
        telnetSerial(sbuf);
    }

    wifi_connected = true;
    return true;
}
