const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path:'variables.env'});


const crearToken = (usuario,secreta,expiresIn) => {
   const { id,email,nombre,apellido,creado} = usuario;
   return jwt.sign({id,email,nombre,apellido,creado},secreta,{expiresIn});
}


const resolvers = {
   Query : {
      // ============ ObtenerUsuario ==============
      obtenerUsuario : async (_,{token}) => {
         const usuarioId = await jwt.verify(token,process.env.SECRETA);
         return usuarioId;
      },

      // ============ ObtenerProductoS ==============
      obtenerProductos : async () => {
         try {
            const productos = await Producto.find({});
            return productos;
         } catch (error) {
            console.log('No se pudo obtener productos.',error);
         }
      },

      // ============ ObtenerProducto ==============
      obtenerProducto : async (_,{id}) => {
         const producto = await Producto.findById(id);
         if(!producto){
            throw new Error('Producto no encontrado');
         }
         return producto;
      },

      // ============ ObtenerClientes ==============
      obtenerClientes: async () => {
         try {
            const clientes = await Cliente.find({});
            return clientes;
         } catch (error) {
            console.log('Error en mostar todos los clientes',err);
         }
      },

      // ============ ObtenerCliente ==============
      obtenerCliente: async (_,{id},ctx) => {
        //Revisar si el cliente existe
        const cliente = await Cliente.findById(id);
          if(!cliente){
            throw new Error('CLiente no encontrado');
          }

        //Quien lo creo lo puede ver
        if(cliente.vendedor.toString() !== ctx.usuario.id){
          throw new Error('No tienes las credenciales.')
        }
        return cliente;
      }
   },


  Mutation: {

    // ============ NuevoUsuario ==============
    nuevoUsuario: async (_, {input}) => {

      const {email, password} = input;

      // Revisar si el usuario ya esta registrado
      const existeUsuario = await Usuario.findOne({email});
      if (existeUsuario) {
        throw new Error('El usuario ya esta registado.')
      }
      // Hashear password
      const salt = await bcryptjs.genSaltSync(10);
      // Guardamos el resultado del password(1234) ya hasehado en input.password
      //, para poder ser guardado en la base de datos
      // ya que el "password" solo es la variable que guarda el valor del cliente(1234)
      input.password = await bcryptjs.hashSync(password, salt);

      try {
        // Guardar Usuario base de datos
        const nuevoUsuario = new Usuario(input);
        const resultado = await nuevoUsuario.save();
        return resultado;
      } catch (err) {
        console.log('Error en guardar el usuario resolgers.gql - backend-28line', err);
      }
    },

    //============= AutenticarUsuario =========
    autenticarUsuario: async (_, {input}) => {
      try {
        const {email, password} = input;
        // Si el usuario esta registrado
        const existeUsuario = await Usuario.findOne({email});
        if (!existeUsuario) {
          throw new Error('El usuario no esta registrado.')
        }
        // Si el password es correcto
        // Comparamos en "password" que enviamos con la que hay en la base de datos "existeUsuario.password"
        const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
        if (!passwordCorrecto) {
          throw new Error("El password o email son incorrectos.")
        }
        //Crear TOKEN
        return {
          token: crearToken(existeUsuario, process.env.SECRETA, '24h')
        }
      } catch (error) {
        console.log('error', error)
      }
    },

    //============= NuevoProducto =========
    nuevoProducto: async (_, {input}) => {
      try {
        const nuevoProducto = new Producto(input);
        const resultado = await nuevoProducto.save();
        return resultado;
      } catch (error) {
        console.log('Error al crear un producto nuevo.', error)
      }
    },

    //============= ActualizarProducto =========
    actualizarProducto: async (_, {id, input}) => {
      let producto = await Producto.findById(id);
      if (!producto) {
        throw new Error('Producto no encontrado para modificar');
      }
      // pasamos en id en el _id de la base de datos,
      // junto el cambio(input) y nos retorna el cambio(new:true)
      producto = await Producto.findOneAndUpdate({_id: id}, input, {new: true});
      return producto;
    },

    //============= EliminarProducto =========
    eliminarProducto: async (_, {id}) => {
         
      const producto = await Producto.findById(id);
      if (!producto) throw new Error('Producto para elimimnar, no encontrado');
      await Producto.findByIdAndDelete({_id: id});
      return 'Producto eliminado';
    },

    //============= NuevoCliente =========
    nuevoCliente: async (_, {input}, ctx) => {
      const {email} = input;
      const cliente = await Cliente.findOne({email})
      if (cliente) {
        throw new Error('Este cliente ya esta registrado.');
      }
      const nuevoCliente = new Cliente(input);
      nuevoCliente.vendedor = ctx.usuario.id;
      try {
        const resultado = await nuevoCliente.save();
        return resultado;
      } catch (err) {
        console.log('Erroe en crear un nuevo cliente', err);
      }
    },

    // ========= ActualizarCLiente ================
    actualizarCliente: async (_, {id, input}, ctx) => {
      // Verificar si existe el cliente
      let cliente = await Cliente.findById(id);
      if (!cliente) throw new Error('Ese cliente no existe');
      // Verificar si el vendedor es quien lo edita]
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No tienes todas las credenciales.')
      }
      // Guardar Cliente
      cliente = await Cliente.findOneAndUpdate({_id: id}, input, {new: true});
      return cliente;
    },
      // ========== EliminarCliente ==================
      eliminarCliente: async (_,{id},ctx) => {
        let cliente = await Cliente.findById(id);
        if(!cliente ){
          throw new Error('No existe el cliente');
        };
        if (cliente.vendedor.toString() !== ctx.usuario.id){
          throw new Error('No tienes credenciales correctas.')
        };
        cliente = await Cliente.findByIdAndDelete({_id:id});
        return 'Se elmino el cliente ';
      }
   }
}

module.exports = resolvers;
