LazyGardener
==========
Node.js app running on Raspberry Pi A+ controlling sprinkler valves (manually at the moment) in the garden and real-time charts.

* All soil moisture data are harvested [wirelessly over nRF24L01](../../../LazyGardener-probes)
* Rain gauge is the WH1080 connected to Raspberry Pi
* For temperature are used two DS18B20 - one for outside temperature and one monitoring Raspberry Pi in the box as it also contains two battery chargers and two power supplies: ~24V for valves & =5V for chargers and Raspberry Pi

#Prepare Raspberry
##Allow I2C & SPI
```Shell
sudo apt-get install python-dev
sudo nano /etc/modules
	i2c-bcm2708 
	i2c-dev

sudo apt-get install python-smbus
    
sudo nano /etc/modprobe.d/raspi-blacklist.conf
#blacklist spi-bcm2708
#blacklist i2c-bcm2708
```
##Install MySQL
```Shell
sudo apt-get update
sudo apt-get install mysql-server --fix-missing
# you will be prompt to set username and password, i have choosen "root" & "root"
```
###Create new database
```Shell
mysql -u [username] -p
```
```SQL
CREATE DATABASE raspi
USE raspi;

	CREATE TABLE emails (
	  id int(10) unsigned NOT NULL AUTO_INCREMENT,
	  sensor_id smallint(5) unsigned NOT NULL,
	  `timestamp` int(10) unsigned NOT NULL,
	  PRIMARY KEY (id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
	
	CREATE TABLE probes (
	  id int(10) unsigned NOT NULL AUTO_INCREMENT,
	  sensor_id smallint(5) unsigned NOT NULL,
	  `value` smallint(5) unsigned NOT NULL,
	  voltage float NOT NULL,
	  `timestamp` int(10) unsigned NOT NULL,
	  PRIMARY KEY (id)
	) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
	
	CREATE TABLE rain (
	  id int(10) unsigned NOT NULL AUTO_INCREMENT,
	  `timestamp` int(10) unsigned NOT NULL,
	  PRIMARY KEY (id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
	
	CREATE TABLE temperature (
	  id int(10) unsigned NOT NULL AUTO_INCREMENT,
	  temp_id tinyint(4) unsigned NOT NULL,
	  temp float NOT NULL,
	  `timestamp` int(10) unsigned NOT NULL,
	  PRIMARY KEY (id)
	) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
	
	CREATE TABLE valve (
	  id int(10) unsigned NOT NULL AUTO_INCREMENT,
	  valve_id smallint(6) NOT NULL,
	  `status` tinyint(1) unsigned NOT NULL,
	  `timestamp` int(10) NOT NULL,
	  PRIMARY KEY (id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
```

##Install Node.js
```Shell
wget http://node-arm.herokuapp.com/node_latest_armhf.deb
sudo dpkg -i node_latest_armhf.deb
sudo npm install -g node-gyp
sudo npm install -g forever
sudo npm install -g bower
sudo npm install -g grunt-cli
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
npm install
bower install
```

##Compile all files
```Shell
grunt
```
#And finally start
```Shell
sudo service LazyGardener start
```
