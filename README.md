LazyGardener
==========
Node.js app running on Raspberry Pi A+ controlling sprinkler valves (manually at the moment) in the garden and real-time charts.

* All soil moisture data are harvested [over WiFi soil probes](../../../LazyGardener-probes)
* [Meteo station over "extended" I2C](../../../LazyGardener-meteo)
* Integrated fan for cooling down in-box temperature uses DS18B20
* Contains two battery chargers (for soil probes) and two power supplies: ~24V for valves & =5V for chargers and Raspberry Pi

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

#Install
```Shell
cd ~
wget https://raw.githubusercontent.com/pilotak/LazyGardener/master/install.sh
chmod 777 ./install.sh
#You would need to confirm a few prompts to confirm installation of packages
sudo ./install.sh 
```
Now go to your Raspberry Pi ip address to port :8083 through web browser and create user and DB (you can create any name or password you like, but you have to update ./config/config.js)
```SQL
CREATE USER "root" WITH PASSWORD 'root' WITH ALL PRIVILEGES
CREATE DATABASE "LazyGardener"
```
and than through SSH
```Shell
sudo service LazyGardener start
```
