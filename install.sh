#!/bin/bash

echo -e "\e[30;48;5;208mInstall necessary packages\e[0m"
apt-get update
apt-get install python-dev
apt-get install python-smbus
apt-get install i2c-tools
apt-get install git
apt-get install mosquitto
apt-get install npm
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mEnable I2C kernel module...\e[0m"

cat <<EOF >/etc/modules
# /etc/modules: kernel modules to load at boot time.
#
# This file contains the names of kernel modules that should be loaded
# at boot time, one per line. Lines beginning with "#" are ignored.
# Parameters can be specified after the module name.

snd-bcm2835
i2c-bcm2708 
i2c-dev
EOF
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mBoot setting for I2C and 1-Wire...\e[0m"
cat <<EOF >>/boot/config.txt
dtparam=i2c_arm=on
dtoverlay=w1-gpio,gpiopin=4,pullup=on
EOF
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mInstall node.js...\e[0m"
wget https://nodejs.org/dist/v5.8.0/node-v5.8.0-linux-armv6l.tar.xz
tar -xvf node-v5.8.0-linux-armv6l.tar.xz
cd node-v5.8.0-linux-armv6l
cp -R * /usr/local/
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mInstall node.js global packages...\e[0m"
npm install -g pm2
npm install -g bower
npm install -g grunt-cli
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mCreate daemon file..\e[0m"
pm2 completion install
pm2 startup systemd -u $(logname)
systemctl enable mosquitto
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mInstall database...\e[0m"
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

echo -e "\e[30;48;5;208mClone LazyGardener repo...\e[0m"
su $(logname) -c "cd /home/$(logname) && git clone git://github.com/pilotak/LazyGardener.git"
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mInstall node.js modules, this will take a while\e[0m"
cd /home/$(logname)/LazyGardener
npm install
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mInstall bower modules\e[0m"

su $(logname) -c "cd /home/$(logname)/LazyGardener && bower install"
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mRepaire morris.js\e[0m"
su $(logname) -c "cd /home/$(logname)/LazyGardener && mkdir 'temp' && cd /home/$(logname)/LazyGardener/temp"
su $(logname) -c "wget 'https://raw.githubusercontent.com/morrisjs/morris.js/master/morris.js' && cat morris.js > /home/$(logname)/LazyGardener/bower_components/morrisjs/morris.js"
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mCompile...\e[0m"
su $(logname) -c "cd /home/$(logname)/LazyGardener && grunt"
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo


echo -e "\e[30;48;5;208mCleaning up...\e[0m"
rm /home/$(logname)/install.sh
rm -rf /home/$(logname)/LazyGardener/temp
rm /home/$(logname)/node-v5.8.0-linux-armv6l.tar.xz
rm -rf /home/$(logname)/node-v5.8.0-linux-armv6l
rm /home/$(logname)/influxdb_0.9.6_armhf.deb
rm /home/$(logname)/grafana_2.6.0_armhf.deb
rm /home/$(logname)/morris.js
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo

echo -e "\e[30;48;5;208mChanging ownership...\e[0m"
chown -R $(logname) /home/$(logname)/LazyGardener/node_modules
chown -R $(logname) /home/$(logname)/LazyGardener/node_modules/*
echo -e "\e[30;48;5;208mDone\e[0m"
echo
echo
