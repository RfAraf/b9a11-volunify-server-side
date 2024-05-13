const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

// middlewares
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0xqywot.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const volunteerNeedCollection = client
      .db("volunteersDB")
      .collection("volunteerNeed");

    // get all volunteer post
    app.get("/volunteers", async (req, res) => {
      const result = await volunteerNeedCollection.find().toArray();
      res.send(result);
    });

    // get certain volunteer post
    app.get("/volunteer-post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerNeedCollection.findOne(query);
      res.send(result);
    });

    // get certain volunteer post by email
    app.get("/volunteer-posts/:email", async (req, res) => {
      const email = req.params.email;
      const query = { organizerEmail: email };
      const result = await volunteerNeedCollection.find(query).toArray();
      res.send(result);
    });

    // create a volunteer post
    app.post("/volunteers", async (req, res) => {
      const volunteerPost = req.body;
      console.log("new volunteerPost", volunteerPost);
      const result = await volunteerNeedCollection.insertOne(volunteerPost);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Volunify server");
});

// connect app to the port
app.listen(port, () => {
  console.log(`Volunify running on PORT : ${port}`);
});
