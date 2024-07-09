const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

require('dotenv').config();
const port = process.env.PORT || 5000

const app = express();
// middlewere
const corsOptions = {
    origin: ['http://localhost:5173/'],
    Credential: true,
    optionSuccessStatus: 200,

}
app.use(cors({ corsOptions }))
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qrif73o.mongodb.net/?appName=Cluster0`;

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
app.listen(port, ()=> console.log(`server running on the port ${port}`))