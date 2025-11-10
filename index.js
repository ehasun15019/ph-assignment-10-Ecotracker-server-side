const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const cors = require("cors");

// mongodb require
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@qdhi4wp.mongodb.net/?appName=ic-cluster`;

// middleware
app.use(express.json());
app.use(cors());

/* mongoDB functionality start */
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    /* collections */
    const dataBase = client.db("ecoTracker");
    const usersCollection = dataBase.collection("users");

    /* users all api start */
    app.post('/users', async(req, res) => {
      const newUser = req.body;

      const email = req.body.email;
      const query = {
        email: email
      }

      const existingUser = await usersCollection.findOne(query);

      if(existingUser) {
        res.send({
          message: 'user already exits'
        })
      } else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      }
    })
    /* users all api emd */

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } 
  finally {
    
  }
}
run().catch(console.dir);
/* mongoDB functionality end */

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`server is running on  http://localhost:${port}`);
});
