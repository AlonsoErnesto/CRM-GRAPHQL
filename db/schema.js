const { gql } = require('apollo-server');

// Schema
const typeDefs = gql`
   # ========================TYPE========================
   type Usuario {
      id:ID
      nombre:String
      apellido:String
      email:String
      creado:String
   }
   type Producto {
      id:ID
      nombre:String
      existencia:Int
      precio:Float
      creado:String
   }
   type Cliente {
      id:ID!
      nombre:String
      apellido:String
      empresa:String
      email:String
      telefono:String
      creado:String
      vendedor:ID!
   }
   type Token {
      token : String
   }
   # ========================INPUT========================
   input UsuarioInput {
      nombre:String!
      apellido:String!
      email:String!
      password:String!
   }
   input AutenticarInput {
      email:String!
      password:String!
   }
   input ProductoInput {
      nombre:String!
      existencia:Int!
      precio:Float!
   }
   input ClienteInput {
      nombre:String!
      apellido:String!
      empresa:String!
      email:String!
      telefono:String!
   }
   # ========================QUERY========================
   type Query {
      # Usuario
      obtenerUsuario(token:String!):Usuario
      # Producto
      obtenerProductos:[Producto]
      obtenerProducto(id:ID!):Producto
      # Cliente
      obtenerClientes:[Cliente]
      obtenerCliente(id:ID!):Cliente
   }
   # ========================MUTATION========================
   type Mutation {
      # Usuarios
      nuevoUsuario(input:UsuarioInput): Usuario
      autenticarUsuario(input:AutenticarInput):Token
      # Productos
      nuevoProducto(input:ProductoInput):Producto
      actualizarProducto(id:ID!,input:ProductoInput):Producto
      eliminarProducto(id:ID!):String
      # Clientes
      nuevoCliente(input:ClienteInput):Cliente
      actualizarCliente(id :ID!,input:ClienteInput) : Cliente
      eliminarCliente(id:ID!):String
 }
`;

module.exports = typeDefs;
