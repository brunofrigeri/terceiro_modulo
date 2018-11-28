const Ad = require('../models/ad')
const User = require('../models/user')
const Purchase = require('../models/purchase')
const Queue = require('../services/Queue')
const PurchaseMail = require('../jobs/PurchaseMail')
const SellMail = require('../jobs/SellMail')

class PurchaseController {
  async store(req, res) {
    const { ad, content } = req.body

    const purchaseAd = await Ad.findById(ad).populate('author')
    
    if (req.userId === purchaseAd.author.id){
      return res.status(400).json({ error: 'Você não pode realizar uma proposta ao seu próprio produto' })
    }

    if (purchaseAd.purchasedBy){
      return res.status(400).json({ error: 'Item já foi vendido' })
    }

    const user = await User.findById(req.userId)    
    
    const purchase = await Purchase.create({ ad, buyer: req.userId })

    Queue.create(PurchaseMail.key, {
      ad: purchaseAd,
      user,
      content
    }).save()    

    return res.json(purchase)
  }

  async sell(req, res) {
    //id da purchase    
    const { id } = req.params    
    const { content } = req.body
    console.log(content)
    //Encontramos a proposta de compra
    const buyPropose = await Purchase.findById(id).populate('buyer')                
    //Encontramos o Ad ao qual a proposta foi feita
    const purchaseAd = await Ad.findById(buyPropose.ad).populate('author')        
    
    if (req.userId === purchaseAd.author.id) {
      if (purchaseAd){
        const ad = await Ad.findByIdAndUpdate(buyPropose.ad, {purchasedBy: buyPropose._id }, {
          new: true
        }).populate('author')        

        Queue.create(SellMail.key, {
          ad,
          buyer: buyPropose.buyer,
          content
        }).save()  
  
        return res.json(ad)
      } else {
        return res.status(400).json({ error: 'Produto não encontrado' })
      }     
    } else {
      return res.status(400).json({ error: 'Erro de autorização' })
    }        
  }
}

module.exports = new PurchaseController()
