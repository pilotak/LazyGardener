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
wget https://raw.githubusercontent.com/pilotak/LazyGardener/master/install/install.sh
sudo ./install.sh
```
