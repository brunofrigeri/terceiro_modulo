const Mail = require('../services/Mail')

class SellMail {
  async key(){
    return 'SellMail'
  }
  async sucess(job, done){    
    const { ad, buyer, content } = job.data    

    await Mail.sendMail({      
      from: `"${ad.author.name}" <${ad.author.email}>`,
      to: buyer.email,
      subject: 'Venda realizada com sucesso!',
      template: 'sell',
      context: { buyer, content, ad }
    })    

    return done()
  }
}

module.exports = new SellMail()