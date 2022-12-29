const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Cliente = require("../models/Cliente");
const Pedido = require("../models/Pedido");
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
      },
     // =========== Obtener Pedidos =================
     obtenerPedidos: async (  ) => {
        try {
          const pedidos = await Pedido.find({});
          return pedidos;
        } catch (err) {
            console.log("error en mostrar todos los pedidos.",err)
        }
     },
     // ==================Obtener Pedidos por Vendedor
     obtenerPedidosVendedor : async (_, {}, ctx) => {
        try { 
          const pedidos = await Pedido.find({vendedor:ctx.usuario.id});
          return pedidos;
        } catch (err){
          console.log('Error en obtener pedido por ti.')
        }
     },
     // ===========OBTENER SOLO PEDIDO
     obtenerPedido : async (_,{id},ctx) => {
        // Si el pedido existe
       const pedido = await Pedido.findById(id);
       if (!pedido) throw new Error('Pedido no encontrado');
       // Solo quien lo creo puede verlo
       if(pedido.vendedor.toString() !== ctx.usuario.id) throw new Error('Error en las credendiales.')
       // retornar el resultado
       return pedido;
     },
     //========= OBTENER ESTADO DEL PEDIDO
     obtenerPedidoEstado : async ( _, {estado},ctx) => {
        // Si el pedido existe
        const pedidos = await Pedido.find({vendedor:ctx.usuario.id, estado});
        return pedidos;
     },
     // ==================== OBTENER MEJORES CLIENTES
     mejoresClientes : async () => {
        const clientes = await Pedido.aggregate([
          { $match : { estado : "COMPLETADO"}},
          { $group : {
            _id : "$cliente",
            total : { $sum : '$total'}
          }},
          {
            $lookup : {
              from : 'clientes',
              localField : '_id',
              foreignField : '_id',
              as : "cliente"
            }
          },
          {
            $sort : { total : -1}
          }
        ]);
        return clientes;
     },
     // ===================- OBTENER MEJORES VENDEDORES
     mejoresVendedores : async () => {
      const vendedores = await Pedido.aggregate([
        { $match : { estado : "COMPLETADO" }},
        { $group : {
          _id : "$vendedor",
          total : { $sum : '$total' }
        }},
        {
          $lookup : {
            from : 'usuario',
            localField : '_id',
            foreignField : '_id',
            as : 'vendedor'
          }
        } , 
        {
          $limit : 3
        },
        {
          $sort : { total : -1}
        }
      ]);
      return vendedores;
     },
     // ======================BUSCAR PRODUCTOS
     buscarProducto : async (_,{texto}) => {
      const producto = await Producto.find({$text:{$search:texto}}).limit(10);
      return producto;
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
      },

      //========== NuevoPedido ========================
    nuevoPedido: async (_,{input},ctx) => {
      const { cliente  }  = input;
      // Verificar si el cliente existe o no
      let clienteExiste = await Cliente.findById(cliente);
      if (!clienteExiste) {
        throw new Error('El cliente no existe.')
      }
      // Verificar si el cliente es el vendedor
      if(clienteExiste.vendedor.toString() !==  ctx.usuario.id){
        throw new Error('No tienes las credenciales.')
      }

      // Revisar si el stock esta disponible
      for await ( const articulo of input.pedido ){
        const { id } = articulo;
        const producto = await Producto.findById(id);
        if(articulo.cantidad > producto.existencia){
          throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`);
        } else { 
          // Resta de la cantidad disponible
          producto.existencia = producto.existencia - articulo.cantidad;
          await producto.save();
          
        }
      }
      //Crear un nuevo Pedido
      const nuevoPedido = new Pedido(input);

      // Asignarle un Vendedor
      nuevoPedido.vendedor = ctx.usuario.id;

      // Guardar en la base de datos
      const resultado = await nuevoPedido.save();
      return resultado;
    },
    // ================= ACTUALIZAR PEDIDO
    actualizarPedido: async (_, {id, input}, ctx) => {
      const {cliente} = input;
      // Si el pedido existe
      const existePedido = await Pedido.findById(id);
      if (!existePedido) throw new Error('No se encuentra el pedido');
      // SI el cliente existe
      const existeCliente = await Cliente.findById(cliente);
      if (!existeCliente) throw new Error('No se encuentra el cliente');
      // Si el cliente y pedido pertenece al vendedor
      if (existeCliente.vendedor.toString() !== ctx.usuario.id) throw new Error('No tienes todas las credenciales');
      // Revisar el stock
      if(input.pedido){
        for await (const articulo of input.pedido)
        {
          const { id } = articulo;
          const producto = await Producto.findById(id);
          if(articulo.cantidad > producto.existencia){
            throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible.`)
          } else {
            // Restar la cantidad disponible
            producto.existencia = producto.existencia -  articulo.cantidad;
            await producto.save();
          }
        }  
      }
      // Guardar pedido
      const resultado = await Pedido.findOneAndUpdate({_id:id},input,{new:true});
      return resultado;

    },
      // Guardar el pedido
      eliminarPedido: async (_,{id},ctx) => { 
        // verificar si el pedido existe
        const pedido = await Pedido.findById(id);
        if(!pedido) throw new Error('No se encuentra el pedido.');
        //verificar si el vendedor es quien lo borra
        if(pedido.vendedor.toString() !==  ctx.usuario.id) throw new Error('No tienes todas las credenciales.');
        // Eliminar Producto
        await Pedido.findOneAndDelete({_id:id});
        return 'Pedido Eliminado.'
      },
   },
}
module.exports = resolvers;
