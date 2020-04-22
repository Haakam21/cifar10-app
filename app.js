#!/usr/bin/env node

require('dotenv').config()
const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const HTTP_PORT = 80
const HTTPS_PORT = 443
const DB_URI = process.env.MONGODB_URI

const https_options = {
  key: fs.readFileSync('/etc/letsencrypt/live/cifar10app.ddns.net/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/cifar10app.ddns.net/fullchain.pem')
}

const Prediction = mongoose.model('Prediction', new mongoose.Schema({
date: Date,
image: {
  type: Array,
  unique: true
},
prediction: Array
}).plugin(uniqueValidator))

const app = express()
const httpServer = http.createServer(app)
const httpsServer = https.createServer(https_options, app)

app.use(express.json())
app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.get('/predictions', (req, res) => {
  Prediction.find({}).sort('-date').then(predictions => {
    res.json(predictions)
  })
})

app.post('/predict', (req, res) => {
  const options = {
    hostname: 'localhost',
    port: 8501,
    path: '/v1/models/cifar10:predict',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  }

  const ext_req = http.request(ext_req_options, ext_res => {
    ext_res.on('data', d => {
      obj = JSON.parse(d)
      res.send(obj)
      console.log(obj)

      const prediction = new Prediction({
        date: new Date(),
        image: req.body.instances[0],
        prediction: obj.predictions[0]
      })

      prediction.save().then(result => {
        console.log('prediction saved')
      }).catch(error => {
        console.log('prediction not saved')
      })
    })
  })

  ext_req.on('error', err => {
    console.log(err)
  })

  ext_req.write(JSON.stringify(req.body))
  ext_req.end()
})


httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_PORT}`)
})

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS server running on port ${HTTPS_PORT}`)
})

mongoose.connect(DB_URI, {useNewUrlParser: true, useUnifiedTopology: true}).then(result => {
  console.log('connected to MongoDB')
})
.catch((error) => {
  console.log('error connecting to MongoDB:', error.message)
})
