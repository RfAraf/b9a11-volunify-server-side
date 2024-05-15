const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://volunify-2c546.web.app",
    "https://volunify-2c546.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

// middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0xqywot.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares
const logger = (req, res, next) => {
  console.log("log: info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // no token available
  if (!token) {
    return res.status(401).send({ message: "if there is no token" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized to access" });
    }
    req.user = decoded;
    next();
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const volunteerNeedCollection = client
      .db("volunteersDB")
      .collection("volunteerNeed");
    const volunteerCollection = client
      .db("volunteersDB")
      .collection("volunteers");

    // creating token auth related api
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      console.log(token);

      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    // clearing cookie
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logout user", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    app.get("/volunteers", async (req, res) => {
      const result = await volunteerNeedCollection.find().toArray();
      res.send(result);
    });

    // get all volunteer posts in volunteer need page
    app.get("/volunteer-cards", async (req, res) => {
      const search = req.query.search;
      console.log("search", search);
      let query = {
        title: { $regex: search, $options: "i" },
      };

      const sort = req.query.sort;
      let options = {};
      if (sort) options = { sort: { deadline: sort === "asc" ? 1 : -1 } };

      const result = await volunteerNeedCollection
        .find(query, options)
        .toArray();
      res.send(result);
    });

    // get all volunteers
    app.get("/volunteer-requests", async (req, res) => {
      const result = await volunteerCollection.find().toArray();
      res.send(result);
    });

    // get certain volunteer post
    app.get("/volunteer-post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerNeedCollection.findOne(query);
      res.send(result);
    });

    // get certain volunteer post to be a volunteer
    app.get("/be-volunteer/:id", async (req, res) => {
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

    // get certain volunteer by email
    app.get("/volunteer-requests/:email", async (req, res) => {
      const email = req.params.email;
      const query = { volunteerEmail: email };
      const result = await volunteerCollection.find(query).toArray();
      res.send(result);
    });

    // create a volunteer post
    app.post("/volunteers", async (req, res) => {
      const volunteerPost = req.body;
      console.log("new volunteerPost", volunteerPost);
      const result = await volunteerNeedCollection.insertOne(volunteerPost);
      res.send(result);
    });

    // create a volunteer
    app.post("/volunteer-requests", async (req, res) => {
      const volunteer = req.body;
      console.log("new volunteer", volunteer);
      const result = await volunteerCollection.insertOne(volunteer);
      res.send(result);
    });

    // update a post
    app.put("/volunteer-post/:id", async (req, res) => {
      const id = req.params.id;
      const post = req.body;
      console.log(post);
      const {
        thumbnail,
        title,
        description,
        location,
        category,
        deadline,
        volunteersNeed,
      } = post;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedPost = {
        $set: {
          thumbnail: thumbnail,
          title: title,
          description: description,
          location: location,
          category: category,
          deadline: deadline,
          volunteersNeed: volunteersNeed,
        },
      };

      const result = await volunteerNeedCollection.updateOne(
        filter,
        updatedPost,
        options
      );
      res.send(result);
    });

    // delete a post
    app.delete("/volunteer-post/:id", async (req, res) => {
      const id = req.params.id;
      console.log("delete this id from db", id);
      const query = { _id: new ObjectId(id) };
      const result = await volunteerNeedCollection.deleteOne(query);
      res.send(result);
    });

    // delete a request
    app.delete("/volunteer-requests/:id", async (req, res) => {
      const id = req.params.id;
      console.log("delete this id from db", id);
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
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
