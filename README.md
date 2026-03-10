# 📦 Orders API

API REST em Node.js para gerenciamento de pedidos, desenvolvida como desafio técnico Jitterbit.

## 🚀 Tecnologias

- **Node.js** + **Express**
- **MongoDB** com **Mongoose**
- **dotenv** para variáveis de ambiente

## ⚙️ Como rodar localmente

### Pré-requisitos
- Node.js instalado
- Conta no [MongoDB Atlas](https://cloud.mongodb.com) (gratuito)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/mac3d011/orders-api.git
cd orders-api

# Instale as dependências
npm install
```

### Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
MONGODB_URI=mongodb+srv://<usuario>:<senha>@cluster0.xxxxx.mongodb.net/orders_db
PORT=3000
```

### Executar

```bash
node server.js
```

## 📡 Endpoints

| Método | URL | Descrição |
|--------|-----|-----------|
| `POST` | `/order` | Cria um novo pedido |
| `GET` | `/order/list` | Lista todos os pedidos |
| `GET` | `/order/:orderId` | Busca pedido pelo número |
| `PUT` | `/order/:orderId` | Atualiza um pedido |
| `DELETE` | `/order/:orderId` | Remove um pedido |

## 📋 Exemplo de uso

### Criar pedido

**POST** `http://localhost:3000/order`

```json
{
  "numeroPedido": "v10089016vdb-01",
  "valorTotal": 10000,
  "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
  "items": [
    {
      "idItem": 2434,
      "quantidadeItem": 1,
      "valorItem": 1000
    }
  ]
}
```

**Resposta** `201 Created`:

```json
{
  "message": "Pedido criado com sucesso",
  "order": {
    "orderId": "v10089016vdb-01",
    "value": 10000,
    "creationDate": "2023-07-19T12:24:11.529Z",
    "items": [
      {
        "productId": 2434,
        "quantity": 1,
        "price": 1000
      }
    ]
  }
}
```

## 🔄 Mapeamento de campos

A API transforma automaticamente os campos do payload de entrada para o formato do banco de dados:

| Entrada | Banco de dados |
|---------|---------------|
| `numeroPedido` | `orderId` |
| `valorTotal` | `value` |
| `dataCriacao` | `creationDate` |
| `items[].idItem` | `items[].productId` |
| `items[].quantidadeItem` | `items[].quantity` |
| `items[].valorItem` | `items[].price` |

## 🛡️ Respostas HTTP

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso |
| `201` | Pedido criado |
| `400` | Dados inválidos |
| `404` | Pedido não encontrado |
| `409` | Pedido já existe |
| `500` | Erro interno do servidor |
