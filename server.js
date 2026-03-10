require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// =====================
// CONEXÃO COM MONGODB
// =====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orders_db';
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch((err) => { console.error('❌ Erro ao conectar ao MongoDB:', err.message); process.exit(1); });

// =====================
// MODEL
// =====================

/**
 * Schema do item dentro de um pedido
 * Mapeamento: idItem -> productId | quantidadeItem -> quantity | valorItem -> price
 */
const itemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  price:     { type: Number, required: true, min: 0 }
});

/**
 * Schema do pedido
 * Mapeamento: numeroPedido -> orderId | valorTotal -> value | dataCriacao -> creationDate
 */
const orderSchema = new mongoose.Schema({
  orderId:      { type: String, required: true, unique: true, trim: true },
  value:        { type: Number, required: true, min: 0 },
  creationDate: { type: Date,   required: true },
  items:        { type: [itemSchema], validate: { validator: (v) => v.length > 0, message: 'O pedido deve ter pelo menos um item' } }
});

const Order = mongoose.model('Order', orderSchema);

// =====================
// HELPER: mapeia payload de entrada para formato do banco
// =====================
const mapInput = ({ numeroPedido, valorTotal, dataCriacao, items }) => ({
  orderId: numeroPedido,
  value: valorTotal,
  creationDate: new Date(dataCriacao),
  items: items.map(({ idItem, quantidadeItem, valorItem }) => ({
    productId: idItem,
    quantity: quantidadeItem,
    price: valorItem
  }))
});

// =====================
// VALIDAÇÃO BÁSICA
// =====================
const validateOrderBody = (req, res, next) => {
  const { numeroPedido, valorTotal, dataCriacao, items } = req.body;
  const errors = [];

  if (!numeroPedido) errors.push('numeroPedido é obrigatório');
  if (valorTotal == null || isNaN(valorTotal)) errors.push('valorTotal deve ser um número');
  if (!dataCriacao || isNaN(Date.parse(dataCriacao))) errors.push('dataCriacao deve ser uma data ISO 8601 válida');
  if (!Array.isArray(items) || items.length === 0) errors.push('items deve ser um array com pelo menos um item');
  else items.forEach((item, i) => {
    if (item.idItem == null) errors.push(`items[${i}].idItem é obrigatório`);
    if (!item.quantidadeItem || item.quantidadeItem < 1) errors.push(`items[${i}].quantidadeItem deve ser maior que 0`);
    if (item.valorItem == null || isNaN(item.valorItem)) errors.push(`items[${i}].valorItem deve ser um número`);
  });

  if (errors.length > 0) return res.status(400).json({ message: 'Dados inválidos', errors });
  next();
};

// =====================
// ROTAS
// =====================

// POST /order — Cria um novo pedido
app.post('/order', validateOrderBody, async (req, res) => {
  try {
    const order = await new Order(mapInput(req.body)).save();
    return res.status(201).json({ message: 'Pedido criado com sucesso', order });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Já existe um pedido com esse número' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: 'Dados inválidos', errors: Object.values(err.errors).map(e => e.message) });
    console.error(err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /order/list — Lista todos os pedidos
app.get('/order/list', async (req, res) => {
  try {
    const orders = await Order.find().sort({ creationDate: -1 });
    return res.status(200).json({ total: orders.length, orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /order/:orderId — Busca pedido pelo número
app.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(200).json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /order/:orderId — Atualiza um pedido
app.put('/order/:orderId', validateOrderBody, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      mapInput(req.body),
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(200).json({ message: 'Pedido atualizado com sucesso', order });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: 'Dados inválidos', errors: Object.values(err.errors).map(e => e.message) });
    console.error(err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /order/:orderId — Remove um pedido
app.delete('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    return res.status(200).json({ message: 'Pedido deletado com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// =====================
// INICIAR SERVIDOR
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST   http://localhost:${PORT}/order`);
  console.log(`  GET    http://localhost:${PORT}/order/list`);
  console.log(`  GET    http://localhost:${PORT}/order/:orderId`);
  console.log(`  PUT    http://localhost:${PORT}/order/:orderId`);
  console.log(`  DELETE http://localhost:${PORT}/order/:orderId`);
});