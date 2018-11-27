require('dotenv').config()

const mongoose = require('mongoose')
const express = require('express')
const validate = require('express-validation')
const Youch = require('youch')
const databaseConfig = require('./config/database')
const Sentry = require('@sentry/node')
const sentryConfig = require('./config/sentry')

class App {
  constructor() {
    this.express = express()
    this.isDev = process.env.NODE_ENV !== 'production'

    this.sentry()
    this.database()
    this.middlewares()
    this.routes()    
    this.exception()
  }

  sentry(){
    Sentry.init(sentryConfig)
  }
  
  database() {
    mongoose.connect(databaseConfig.uri, {
      useNewUrlParser: true,
      useCreateIndex: true
     })
  }

  middlewares() {
    //json para requisições
    this.express.use(Sentry.Handlers.requestHandler())
    this.express.use(express.json())    
  }  

  routes() {
    this.express.use(require('./routes'))
  }

  exception() {
     if(process.env.NODE_ENV === 'production'){
       this.express.use(Sentry.Handlers.errorHandler())
     }

    this.express.use(async (err, req, res, next) => {
      if(err instanceof validate.ValidationError){
        return res.status(err.status).json(err)
      }

      if(process.env.NODE_ENV !== 'production'){
        const youch = new Youch(err, req)

        return res.json(await youch.toJSON())
      }

      return res.status(err.status || 500).json({ error: 'Internal Server Error'})
    })
  }
}

module.exports = new App().express