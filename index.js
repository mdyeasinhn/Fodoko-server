const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000
const app = express();
// middlewere
const corsOptions = {
  origin: ['http://localhost:5173/'],
  Credential: true,
  optionSuccessStatus: 200,

}
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json())
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qrif73o.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Middleware
const logger = (req, res, next) => {
  console.log('log: info', req.method, req.url);
  next()
}
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" })
    }
    req.user = decoded
    next();
  })
}
async function run() {
  try {
    const foodsCollection = client.db('foodoko').collection('foods')
    const ordersCollection = client.db('foodoko').collection("orders")
    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      // console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
        .send({ success: true })
    })
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out user', user);
      res.clearCookie('token', { maxAge: 0 })
        .send({ success: true })
    })


    // Get all item data form db 
    app.get('/items', async (req, res) => {
      const result = await foodsCollection.find().toArray();
      res.send(result);
    })
    // Get single item data from db
    app.get('/item/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.findOne(query)
      res.send(result)
    })
    // Get data for update
    app.get('/update/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.findOne(query)
      res.send(result)
    })
    // update a data in db
    app.put('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const foodData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...foodData,
        },
      }
      const result = await foodsCollection.updateOne(query, updateDoc, options);
      res.send(result)
    })

    // Save a order data in db
    app.post('/order', async (req, res) => {
      const orderData = req.body;
      const result = await ordersCollection.insertOne(orderData);
      res.send(result)
    })
    // Save a Item data in db
    app.post('/food', async (req, res) => {
      const foodData = req.body;
      const result = await foodsCollection.insertOne(foodData);
      res.send(result);
    })
    // Get all Foods by specific user
    app.get('/foods/:email', logger, verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { buyer: email };
      if (req.user.email != email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const result = await foodsCollection.find(query).toArray()
      res.send(result)
    })
    // Delete a item from db
    app.delete('/food/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.deleteOne(query)
      res.send(result)
    })
    // Get all orders for a user by email from db
    app.get('/orders/:email', logger, verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log('token owner info', req.user);
      if (req.user.email != email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Restaurant is open...')
})
app.listen(port, () => console.log(`server running on the port ${port}`))