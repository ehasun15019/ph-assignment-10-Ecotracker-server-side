const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const cors = require("cors");

// mongodb require
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const challengesCollection = dataBase.collection("challenges");
    const userChallengesCollection = dataBase.collection("userChallenges");
    const tipsCOllection = dataBase.collection("Tips");
    const eventCollection = dataBase.collection("events");

    /* challenges app api start */
    // get method for showing all data for frontend
    app.get("/challenges", async (req, res) => {
      const cursor = challengesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get method for showing 6 data
    app.get("/challenges-six", async (req, res) => {
      const cursor = challengesCollection
        .find()
        .sort({ participants: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get method for details
    app.get("/challenges/:id", async (req, res) => {
      const challengeId = req.params.id;
      const query = {
        _id: new ObjectId(challengeId),
      };
      const result = await challengesCollection.findOne(query);
      res.send(result);
    });

    //post method for join user-Challenges
    app.post("/challenges/join/:id", async (req, res) => {
      try {
        const challengeId = req.params.id;
        const { userId } = req.body;

        const existingJoin = await userChallengesCollection.findOne({
          userId,
          challengeId: new ObjectId(challengeId),
        });

        if (existingJoin) {
          return res.status(400).send({
            success: false,
            message: "You already joined this challenge!",
          });
        }

        // for challenge title
        const challenge = await challengesCollection.findOne({
          _id: new ObjectId(challengeId),
        });

        if (!challenge) {
          return res.status(404).send({
            success: false,
            message: "Challenge not found!",
          });
        }

        const newJoin = {
          userId,
          challengeId: new ObjectId(challengeId),
          challengeTitle: challenge.title,
          status: "Not Started",
          Progress: 0,
          joinDate: new Date(),
        };

        await userChallengesCollection.insertOne(newJoin);

        await challengesCollection.updateOne(
          { _id: new ObjectId(challengeId) },
          { $inc: { participants: 1 } }
        );

        res.send({ success: true, message: "Challenges joined successfully" });
      } catch (error) {
        console.error("Error joining challenge:", error);
        res
          .status(500)
          .send({ success: false, message: "Server error occurred" });
      }
    });

    // patch method for admin challenges
    app.patch("/challenges/:id", async (req, res) => {
      try {
        const challengeId = req.body.id;
        const updateData = req.body;

        const result = await challengesCollection.updateOne(
          { _id: new ObjectId(challengeId) },
          { $set: updateData }
        );

        if (res.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Challenge not found!",
          });
        }

        res.send({
          success: true,
          message: "Challenge updated successfully!",
        });
      } catch (err) {
        console.log("Error updating challenge:", err);

        res.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    });

    //delete method for admin challenges
    app.delete("/challenges/:id", async (req, res) => {
      try {
        const challengeId = req.params.id;

        const result = await challengesCollection.deleteOne({
          _id: new ObjectId(challengeId),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Challenge not found or deleted already",
          });
        }

        res.send({
          success: true,
          message: "Challenge deleted successfully",
        });
      } catch (err) {
        console.error("Error deleting challenge:", err);
        res.status(500).send({
          success: false,
          message: "Failed to delete challenge",
        });
      }
    });

    // post method add new challenges
    app.post("/challenges", async (req, res) => {
      try {
        const {
          title,
          category,
          description,
          imageUrl,
          duration,
          target,
          impactMetric,
          startDate,
          endDate,
          createdBy,
        } = req.body;

        const newChallenge = {
          title,
          category,
          description,
          imageUrl,
          duration: parseInt(duration),
          target,
          impactMetric,
          startDate,
          endDate,
          createdBy,
          createdAt: new Date(),
          createdBy: req.body.createdBy,
        };

        const result = await challengesCollection.insertOne(newChallenge);

        res.status(201).send({
          message: "Challenge created successfully!",
          result: result.insertedId,
        });
      } catch (error) {
        console.error("Error creating challenge:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });
    /* challenges app api end */

    /* users all api start */
    app.post("/users", async (req, res) => {
      const newUser = req.body;

      const email = req.body.email;
      const query = {
        email: email,
      };

      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        res.send({
          message: "user already exits",
        });
      } else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      }
    });
    /* users all api emd */

    /* Events api start */
    // get method for all-events
    app.get("/all-events", async (req, res) => {
      const cursor = eventCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //get method for upcoming-events
    app.get("/upcoming-events", async (req, res) => {
      const cursor = eventCollection.find().sort({ date: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    /* Events api end */

    /* Tips api start */
    //get method for All Tips
    app.get("/all-tips", async (req, res) => {
      const cursor = tipsCOllection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get method for recent tips
    app.get("/recent-tips", async (req, res) => {
      const cursor = tipsCOllection.find().sort({ createdAt: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    /* Tips api end */

    /* Join challenges api start */
    // get method for specify data
    app.get("/user-challenges/:userId", async (req, res) => {
      try {
        const userId = req.params.userId;

        const userChallenges = await userChallengesCollection
          .find({ userId: userId })
          .toArray();

        if (userChallenges.length === 0) {
          return res.status(404).send({
            success: false,
            message: "No challenges found for this user",
          });
        }

        res.send({
          success: true,
          message: "User challenges fetched successfully",
          data: userChallenges,
        });
      } catch (error) {
        console.error("Error fetching user challenges:", error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch user challenges",
        });
      }
    });

    // delete  method for specify data
    app.delete("/user-challenges/:id", async (req, res) => {
      try {
        const challengeJoinId = req.params.id;

        const result = await userChallengesCollection.deleteOne({
          _id: new ObjectId(challengeJoinId),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Challenge not found or already deleted",
          });
        }

        res.send({
          success: true,
          message: "User challenge deleted successfully",
        });
      } catch (err) {
        console.error("Error deleting user challenge:", err);
        res.status(500).send({
          success: false,
          message: "Failed to delete user challenge",
        });
      }
    });
    /* Join challenges api end */

    /*  admin created challenges api start  */
    // get method for admin challenges
    app.get("/created-challenges/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const challenges = await challengesCollection
          .find({ createdBy: email })
          .sort({ createdAt: 1 })
          .toArray();

        res.send({
          success: true,
          data: challenges,
        });
      } catch (err) {
        console.error("Error fetching created challenges:", err);
        res.status(500).send({
          success: false,
          message: "Failed to fetch created challenges",
        });
      }
    });
    /*  admin created challenges api end  */

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
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
