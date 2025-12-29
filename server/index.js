const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cn4mz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   
    // await client.connect(); 

    const database = client.db("ProductDB");
    const userCollection = database.collection("users");
    const cartCollection = database.collection("cart");

  
    const verifyToken = (req, res, next) => {
  console.log('Headers Authorization:', req.headers.authorization); 
  
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access - No Token Found' });
  }
  
  const token = req.headers.authorization.split(' ')[1];
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log('JWT Verify Error:', err.message); 
      return res.status(401).send({ message: 'unauthorized access - Invalid Token' });
    }
    req.decoded = decoded;
    next();
  });
};

   
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({ token });
    });

   
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    
    app.post('/cart', verifyToken, async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

   
    app.get('/cart', verifyToken, async (req, res) => {
      const email = req.query.email;
      
      
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: 'forbidden access' });
      }

      if (!email) return res.send([]);
      const query = { userEmail: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    console.log("Connected to MongoDB & Server Ready!");

  } catch (error) {
    console.error("MongoDB Error:", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Express Server running on port ${port}`);
});