module.exports = {
  db: {
    host: 'localhost',
    user: 'root',
    pass: 'root',
    name: 'LazyGardener',
    port: 8086
  },
  push_messages: {
    email: {
      enabled: false,
      settings: { // nodemailer settings
        service: 'Gmail',
        auth: {
          user: '***',
          pass: '***'
        }
      }
    },
    gcm: {
      enabled: false
    },
    interval: '*/1 * * * *' // in CRON like format
  },
  frontend: {
    user: '***',
    pass: '***',
    port: 4000
  },
  api: {
    port: 8000,
    db: 'raw'
  },
  i2c: {
    dev: '/dev/i2c-1',
    this: 0x18
  },
  valve: [
    {
      pin: 5,
      id: 1,
      timeout: 1000 * 20, // 1000*60*7
      name: 'Zelenina'
    },
    {
      pin: 6,
      id: 2,
      timeout: 1000 * 12, // 1000*60*10
      name: 'Ovoce'
    },
    {
      pin: 13,
      id: 3,
      timeout: 1000 * 15, // 1000*60*15
      name: 'Kytičky'
    },
    {
      pin: 19,
      id: 4,
      timeout: 1000 * 12, // 1000*60*15
      name: ''
    }
  ],
  valve_power: {
    enabled: true,
    pin: 20,
    delay: 1000 // how long to wait to switch on valves
  },
  meteo_station: {
    enabled: false,
    interval: '*/30 * * * * *', // in CRON like format
    BMP085_addr: 0x77,
    HTU21D_addr: 0x40,
    BH1750_addr: 0x23,
    hub_addr: 0x04
  },
  pump: {
    enabled: false,
    address: 'http://xxx.xxx.xxx.xxx'
  },
  auto_control: {
    enabled: true,
    interval: '*/10 * * * *', // in CRON like format
    weather: {
      enabled: true,
      lat: 49.137243,
      lng: 14.1084932,
      units: 'metric',
      api: ''
    },
    hours: {
      on: 6,
      off: 20
    }
  },
  fan: {
    enabled: true,
    pin: 26,
    too_hot: 28, // in °C
    interval: '*/10 * * * *' // in CRON like format
  },
  probe: [
    {
      id: 1,
      location: 1
    }
  ]
}
