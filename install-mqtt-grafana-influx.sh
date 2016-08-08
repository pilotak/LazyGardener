#!/bin/bash

echo -e "\e[30;48;5;208mInstalling MQTT\e[0m"
apt-get install mosquitto
systemctl enable mosquitto


echo -e "\e[30;48;5;208mInstall InfluxDB...\e[0m"
cd /home/$(logname)
wget https://nicolas.steinmetz.fr/influxdb/armv6/influxdb_0.9.6_armhf.deb
dpkg -i influxdb_0.9.6_armhf.deb
systemctl enable influxdb
systemctl start influxdb
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mInstall Grafana...\e[0m"
wget https://nicolas.steinmetz.fr/influxdb/armv6/grafana_2.6.0_armhf.deb
dpkg -i grafana_2.6.0_armhf.deb
/bin/systemctl start grafana-server
systemctl enable grafana-server.service 
systemctl start grafana-server.service
curl 'http://admin:admin@127.0.0.1:3000/api/datasources' -X POST -H 'Content-Type: application/json;charset=UTF-8' --data-binary '{"name":"LazyGardener","type":"influxdb","url":"http://localhost:8086","access":"proxy","isDefault":true,"database":"LazyGardener","user":"root","password":"root"}'
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mCleaning up...\e[0m"
rm /home/$(logname)/influxdb_0.9.6_armhf.deb
rm /home/$(logname)/grafana_2.6.0_armhf.deb