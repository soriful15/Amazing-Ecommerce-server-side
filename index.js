const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// middleware
require('dotenv').config()
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
// jwt
const jwt = require('jsonwebtoken');


const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  // console.log(authorization)
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }
  // bearer token
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {

    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded
    next()
  })
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.uwuwq9x.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db('amazingEcommerce').collection('users')
    const productCollection = client.db('amazingEcommerce').collection("addProduct")
    const cartsCollection = client.db('amazingEcommerce').collection("carts")
    const ordersCollection = client.db('amazingEcommerce').collection("orderList")


    app.post('/users', async (req, res) => {
      const user = req.body
      console.log(user)
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query)
      console.log('existing user', existingUser)
      if (existingUser) {
        return res.send({ message: 'user already existingUser' })
      }

      const result = await usersCollection.insertOne(user)
      res.send(result)
    })


    app.get('/allCollectionUsers', verifyJwt,  async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.post('/addProduct',  async (req, res) => {
      const  productItem = req.body
      const result = await productCollection.insertOne( productItem)
      res.send(result)
    })

    app.get('/allProduct',  async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result)
    })
    app.get('/allProduct/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const singleProduct = await productCollection.findOne(query)
      res.send(singleProduct)
    })

    app.post('/carts', async (req, res) => {
      const items = req.body
      console.log(items)
      const result = await cartsCollection.insertOne(items)
      res.send(result)
    })


    
    app.get('/carts', verifyJwt, async (req, res) => {
      const email = req.query.email
      console.log(email)
      if (!email) {
        res.send([])
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(401).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email }
      const result = await cartsCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollection.deleteOne(query)
      res.send(result)
    })

    app.get('/orderList', verifyJwt,  async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result)
    })

 // jwt 
 app.post('/jwt', async (req, res) => {
  const user = req.body
  const token = jwt.sign(user, process.env.JWT_TOKEN_SECRET, { expiresIn: '10h' });
  res.send({ token })
})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})