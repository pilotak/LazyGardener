LazyGardener
==========
Node.js app running on Raspberry Pi A+ _(Jessie)_ controlling sprinkler valves (manually at the moment) in the garden.

* All soil moisture data are harvested [over WiFi soil moisture probes](../../../LazyGardener-probes)
* [Meteo station over "extended-length" I2C](../../../LazyGardener-meteo)
* Integrated fan for cooling down in-box
* Contains two battery chargers (for soil moisture probes)
* Integrated relay for power supply ~24V to valves or it can be used to switch pump on
* or if you have a pump away from the box it can be done through Wi-Fi
* Integrated time server for probe time synchronization

I believe it will run on B+/Zero with no problems but have not tried

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

#Install
```Shell
cd ~
wget https://raw.githubusercontent.com/pilotak/LazyGardener/master/install.sh
chmod 777 ./install.sh
#You would need to confirm a few prompts to confirm installation of packages
sudo ./install.sh 
```
Now go to your Raspberry Pi IP address to port :8083 through your web browser and create user and DB
```SQL
CREATE USER "root" WITH PASSWORD 'root' WITH ALL PRIVILEGES
CREATE USER "api" WITH PASSWORD 'password'
CREATE DATABASE "LazyGardener"
```
_(of course you can create any name or password you like, but you have to update ./config/config.js)_

after you do some updates in ./config/config.js, restart and finally start
```Shell
sudo reboot
cd /home/$(logname)/LazyGardener && pm2 start startup.json
```
