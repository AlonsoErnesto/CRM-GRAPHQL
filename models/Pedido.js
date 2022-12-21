const mongoose = require('mongoose');

const PedidoSchema = mongoose.Schema({
  pedidos:{
    type:Array,
    required:true
  },
  total: {
    type:Number,
    required:true,
  },
  cliente:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Cliente',
    required:true,
  },
  vendedor : {
    type:mongoose.Schema.Types.ObjectId,
    ref:'Usuario',
    required:true,
  },
  estado : {
    type: String,
    default:"Pendiente"
  },
  creado : {
    type : Date,
    default: Date.now(),
  }
});

module.exports = mongoose.model('Pedido', PedidoSchema);

