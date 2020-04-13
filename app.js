#!/usr/bin/env node

const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')

const HTTP_PORT = 80
const HTTPS_PORT = 443

const https_options = {
  key: fs.readFileSync('/etc/letsencrypt/live/cifar10app.ddns.net/fullchain.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/cifar10app.ddns.net/privkey.pem')
}


const app = express()
const httpServer = http.createServer(app)
const httpsServer = https.createServer(https_options, app)

app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
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
      console.log(d)
      res.send(d)
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
