const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authConfig = require('../../config/auth')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

//Tudo que deve acontecer antes do save do usuário
//function padrão para utilizar o 'this'
UserSchema.pre('save', async function (next) {
  if(!this.isModified('password')){
    return next()
  }

  //Criptografando password
  this.password = await bcrypt.hash(this.password, 8)
})

//Estruturas methods são chamadas sempre pelo user, ou seja, pela constante criada, que condiz ao
//usuário (um único)
UserSchema.methods = {
  compareHash(password){
    return bcrypt.compare(password, this.password)
  }
}

//Estruturas statis são chamadas sempre pelo User, ou seja, pelo schema
UserSchema.statics = {
  generateToken({ id }) {
    //Primeiro parâmetro -> Informações criptografadas pelo token, informações importantes podem ser colocadas
    //dentro desse parâmetro
    //Segunda parâmetro -> Palavra secreta
    //Terceiro parâmetro -> Tempo que o token fica válido
    return jwt.sign({ id }, authConfig.secret, {expiresIn: authConfig.ttl} )
  }
}

module.exports = mongoose.model('User', UserSchema)