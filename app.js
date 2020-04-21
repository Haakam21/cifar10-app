#!/usr/bin/env node

const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const mongoose = require('mongoose')

const HTTP_PORT = 80
const HTTPS_PORT = 443
const DB_URL = 'mongodb+srv://haakam:kHZTs8svfgIvnbyj@cluster0-r0fc0.mongodb.net/cifar10-app?retryWrites=true&w=majority'

const https_options = {
  key: fs.readFileSync('/etc/letsencrypt/live/cifar10app.ddns.net/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/cifar10app.ddns.net/fullchain.pem')
}

const predictionSchema = new mongoose.Schema({
  image: Array,
  prediction: Array
})
predictionSchema.index({image: 1}, {unique: true})
const Prediction = mongoose.model('Prediction', predictionSchema)

const app = express()
const httpServer = http.createServer(app)
const httpsServer = https.createServer(https_options, app)

app.use(express.json())
app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.post('/', (req, res) => {
  const options = {
    hostname: 'localhost',
    port: 8501,
    path: '/v1/models/cifar10:predict',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  }

  const ext_req = http.request(options, ext_res => {
    ext_res.on('data', d => {
      obj = JSON.parse(d)
      res.send(obj)
      console.log(obj)

      const prediction = new Prediction({
        image: req.body.instances[0],
        prediction: obj.predictions[0]
      })

      mongoose.connect(DB_URL, {useNewUrlParser: true, useUnifiedTopology: true})

      prediction.save().then(save_res => {
        console.log('prediction saved')
        mongoose.connection.close()
      }).catch(save_res => {
        console.log('prediction not saved')
        mongoose.connection.close()
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
