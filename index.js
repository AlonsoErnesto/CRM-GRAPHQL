const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema.js');
const resolvers = require('./db/resolvers.js');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config({path:'variables.env'});


//Conectar a la base de datos
conectarDB();


// servidor
const server = new ApolloServer({
   typeDefs,
   resolvers,
   context: ({req}) => {
      const token = req.headers['authorization'] || '';
      if(token) {
         try{
            const usuario = jwt.verify(token,process.env.SECRETA);
            return {
               usuario
            }
         } catch(err){
            console.log('Error en prcesar el token',err);
         };
      }
   }
});


// arrancar el servidor
server.listen().then(({url}) => {
   console.log(`Servidor corriendo en el puerto ${url}`);
});