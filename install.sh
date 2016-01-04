#!/bin/bash

echo "Install necessary packages"
sudo apt-get install python-dev
sudo apt-get install python-smbus
sudo apt-get install i2c-tools
sudo apt-get install git
echo "Done"
echo
echo

echo "Enable I2C kernel module..."

sudo cat <<EOF >/etc/modules
# /etc/modules: kernel modules to load at boot time.
#
# This file contains the names of kernel modules that should be loaded
# at boot time, one per line. Lines beginning with "#" are ignored.
# Parameters can be specified after the module name.

snd-bcm2835
i2c-bcm2708 
i2c-dev
EOF
echo "Done"
echo
echo

echo "Enable I2C module from blacklist..."
sudo cat <<EOF >/etc/modprobe.d/raspi-blacklist.conf
#blacklist spi-bcm2708
#blacklist i2c-bcm2708
EOF
echo "Done"
echo
echo

echo "Boot setting for I2C and 1-Wire..."
cat <<EOF >>/boot/config.txt
dtparam=spi=on
dtparam=i2c1=on
dtparam=i2c_arm=on
dtoverlay=w1-gpio,gpiopin=4,pullup=on
EOF
echo "Done"
echo
echo

echo "Install node.js..."
wget https://nodejs.org/dist/v5.3.0/node-v5.3.0-linux-armv6l.tar.xz
tar -xvf node-v5.3.0-linux-armv6l.tar.xz
cd node-v5.3.0-linux-armv6l
sudo cp -R * /usr/local/
echo "Done"
echo
echo

cd ~

echo "Install node.js global packages..."
sudo npm install -g node-gyp
sudo npm install -g forever
sudo npm install -g bower
sudo npm install -g grunt-cli
echo "Done"
echo
echo

echo "Create daemon file.."

cat <<EOF >/etc/init.d/LazyGardener
#!/bin/sh

### BEGIN INIT INFO
# Provides:          
# Required-Start:
# Required-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: LazyGardener init file
# Description:       LazyGardener init file
### END INIT INFO


export PATH=$PATH:/usr/local/bin
export NODE_PATH=/usr/local/lib/node_modules
modprobe wire
modprobe w1-gpio
modprobe w1-therm

case "\$1" in
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
EOF

sudo update-rc.d LazyGardener defaults
sudo chmod a+x /etc/init.d/LazyGardener

echo "Done"
echo
echo

echo "Clone LazyGardener repo..."
cd ~
git clone git://github.com/pilotak/LazyGardener.git
echo "Done"
echo
echo

echo "Install node.js required modules, this will take a while"
cd ~/LazyGardener
sudo npm install
bower install
echo "Done"
echo
echo

cd ~/LazyGardener/
mkdir "temp"
cd ~/LazyGardener/temp
wget "https://raw.githubusercontent.com/morrisjs/morris.js/master/morris.js"
cat morris.js > ~/LazyGardener/bower_components/morrisjs/morris.js


echo "Install database..."
sudo dpkg -i influxdb_0.9.6_armhf.deb

cd ~/LazyGardener
node setup_db.js
echo "Done"
echo
echo

echo "Compile..."
cd ~/LazyGardener
grunt
echo "Done"
echo
echo

echo "Navigate to ~/LazyGardener/config/config.js and do some configuration to suits you and then run:"
echo "sudo service LazyGardener start"