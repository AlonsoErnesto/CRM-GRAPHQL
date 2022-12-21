const mongoose = require('mongoose');
require('dotenv').config({path:'variables.env'});

const conectarDB = async () => {
   try {
      await mongoose.set('strictQuery', false)
      await mongoose.connect(process.env.DB_MONGO,{
         useNewUrlParser: true,
         useUnifiedTopology: true,
      });
      console.log('Conectando a MongoDB');
   } catch (err) {
      console.log('No se pudo conectar a la base de datos.')
      console.log(err);
      process.exit(1); // detener la app
   }
}

module.exports = conectarDB;