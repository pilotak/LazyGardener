LazyGardener
==========
Node.js app running on Raspberry Pi A+ controlling sprinkler valves (manually at the moment) in the garden and real-time charts.

* All soil moisture data are harvested [over WiFi soil probes](../../../LazyGardener-probes)
* [Meteo station over "extended" I2C](../../../LazyGardener-meteo)
* Integrated fan for cooling down in-box temperature uses DS18B20
* Contains two battery chargers (for soil probes) and two power supplies: ~24V for valves & =5V for chargers and Raspberry Pi

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

#Easy install
```Shell
wget https://raw.githubusercontent.com/pilotak/LazyGardener/master/install.sh
chmod u+x install.sh
sudo ./install.sh
```
#Manual install
##Allow I2C & SPI
```Shell
sudo apt-get install python-dev
sudo apt-get install python-smbus
sudo apt-get install i2c-tools

sudo nano /etc/modules
	snd-bcm2835
	i2c-bcm2708 
	i2c-dev
    
sudo nano /etc/modprobe.d/raspi-blacklist.conf
	#blacklist spi-bcm2708
	#blacklist i2c-bcm2708

sudo nano /boot/config.txt
	#add
	dtparam=spi=on
	dtparam=i2c1=on
	dtparam=i2c_arm=on
	dtoverlay=w1-gpio,gpiopin=4,pullup=on

sudo reboot
```
##Install InfluxDB
```Shell
sudo dpkg -i influxdb_0.9.6_armhf.deb
```

##Install Node.js
```Shell
wget https://nodejs.org/dist/v5.3.0/node-v5.3.0-linux-armv6l.tar.xz
tar -xvf node-v5.3.0-linux-armv6l.tar.xz
cd node-v5.3.0-linux-armv6l
sudo cp -R * /usr/local/

#check that node is installed correctly
node -v

sudo npm install -g node-gyp
sudo npm install -g forever
sudo npm install -g bower
sudo npm install -g grunt-cli
```
## Grafana
```Shell
sudo dpkg -i grafana_2.6.0_armhf.deb
```
##Create daemon to run node.js on start up & auto-restart on code change
```Shell
sudo touch /etc/init.d/LazyGardener
sudo chmod a+x /etc/init.d/LazyGardener
sudo update-rc.d LazyGardener defaults
```
```Shell
sudo nano /etc/init.d/LazyGardener
	#!/bin/sh

	### BEGIN INIT INFO
	# Provides:          
	# Required-Start:
	# Required-Stop:
	# Default-Start:     2 3 4 5
	# Default-Stop:      0 1 6
	# Short-Description: LazyGardener init file
	# Description:       LazyGardener init file at boot
	### END INIT INFO


	export PATH=$PATH:/usr/local/bin
	export NODE_PATH=$NODE_PATH:/usr/local/lib/node_modules
	modprobe wire
	modprobe w1-gpio
	modprobe w1-therm

	case "$1" in
	  start)
	  exec forever -w -a -l "/home/pi/LazyGardener/logs/node.log" --uid "LazyGardener" --sourceDir="/home/pi/LazyGardener" start app.js
	  ;;

	  stop)
	  exec forever stop "LazyGardener"
	  ;;

	  restart)
	  exec forever restart "LazyGardener"
	  ;;
	esac

	exit 0
```

##Install modules
```Shell
sudo apt-get install git
git clone git://github.com/pilotak/LazyGardener.git
cd ./LazyGardener
sudo npm install
bower install
```

##Fix morris.js version
you need version 0.5.1 but 0.5.0 was downloaded (don't ask me why) so lets fix it:
* copy content of https://raw.githubusercontent.com/morrisjs/morris.js/master/morris.js file
* locate
```
/home/pi/LazyGardener/bower_components/morrisjs/morris.js
```
* and replace it's content to newest version 

##Compile all files
```Shell
grunt
```
##Do some settings
```
go to config/config.js
```
###Create the database
```Shell
node setup_db.js # or you can do it through InfluxDB http admin on port :8083
```
#And finally start
```Shell
sudo service LazyGardener start
```

Special thanks to [Nicolas](http://nicolas.steinmetz.fr/) for providing compiled Grafana and InfluxDB
