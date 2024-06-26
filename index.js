const express = require("express");
const mongodb = require("mongodb");
const nodemailer = require("nodemailer");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Adjust the limit as per your requirement

const uri =
  "mongodb+srv://hasinichaithanya04:Mongodb123@cluster0.suc7fzf.mongodb.net/user_test_data?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let chefs;

function Connect() {
  client
    .connect()
    .then((res) => {
      console.log("Connected to db");
      db = client.db("mini-project");
      chefs = db.collection("chefs");
      users = db.collection("pt-users");
      async function populateDatabase() {
        try {
          const result = await users.insertMany(usersdata);
          console.log(`${result.insertedCount} documents were inserted`);
        } catch (err) {
          console.error(err);
        } finally {
          await client.close();
        }
      }
    })
    .catch((err) => {
      console.error("Error connecting : ", err.message);
      process.exit(1);
    });
}
Connect();

app.post("/register", (req, res) => {
  const userDetails = req.body;
  if (Object.keys(userDetails).length == 0)
    return res.status(404).json({ message: "Cannot add empty user!" });
  chefs
    .insertOne(userDetails)
    .then((userDetails) =>
      res.status(200).json({
        message: "Registered successfully",
        userDetails,
        id: userDetails._id,
        success: true,
      })
    )
    .catch((e) => {
      res.status(400).json("Error: ", e);
      console.log(err);
    });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    const chef = await chefs.findOne({ email });
    const user = await users.findOne({ email });

    console.log(user);
    if (user) {
      if (user.password === password) {
        res
          .status(200)
          .json({ Message: "Login Success!", user: "user", userId: user._id });
      } else {
        res.status(401).json({ Message: "Incorrect password!" });
      }
    } else if (chef) {
      if (chef.Password == password) {
        res
          .status(200)
          .json({ Message: "Login Success!", user: "chef", userId: chef._id });
      } else {
        res.status(401).json({ Message: "Incorrect password!" });
      }
    } else {
      res
        .status(404)
        .json({ Message: "User or Chef does not exist, register to login!" });
    }
    console.log(chef);
  } catch (err) {
    console.error(err);
    res.status(500).json({ Message: "Internal Server Error" });
  }
});

app.post("/user-signup", (req, res) => {
  const userDetails = req.body;
  if (Object.keys(userDetails).length == 0)
    return res.status(404).json({ message: "Cannot add empty user!" });
  users
    .insertOne(userDetails)
    .then((userDetails) => {
      console.log(userDetails);
      res.status(200).json({
        message: "Signed in successfully",
        user: "user",
        id: userDetails.insertedId,
      });
    })
    .catch((e) => {
      res.status(400).json("Error: ", e);
      console.log(err);
    });
});
app.get("/get-all", async (req, res) => {
  chefs
    .find({})
    .toArray()
    .then((chefsList) =>
      res.json({
        message: "Data is successfully fetched",
        total_count: chefsList.length,
        chefsList,
      })
    )
    .catch((e) => {
      res.json("Error fetching the data:", e.message);
      console.log(e);
    });
});

app.get("/get-chef/", async (req, res) => {
  const { id } = req.query;
  console.log(id);
  var message;
  if (!mongodb.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, message: "Invalid User ID" });
  }
  chefs
    .findOne({ _id: new mongodb.ObjectId(id) })
    .then((chefDetails) => {
      if (chefDetails !== null) {
        message = "User details are fetched successfully";
      } else {
        message = "No user is found from the given ID";
      }

      res.status(200).json({
        message,
        chefDetails,
      });
    })
    .catch((e) => {
      res.status(400).json("Error: ", e);
      console.log(err);
    });
});
app.get("/get-user/", async (req, res) => {
  const { id } = req.query;
  console.log(id);
  var message;
  if (!mongodb.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, message: "Invalid User ID" });
  }
  users
    .findOne({ _id: new mongodb.ObjectId(id) })
    .then((userDetails) => {
      if (userDetails !== null) {
        message = "User details are fetched successfully";
      } else {
        message = "No user is found from the given ID";
      }

      res.status(200).json({
        message,
        userDetails,
      });
    })
    .catch((e) => {
      res.status(400).json("Error: ", e);
      console.log(err);
    });
});

app.put("/chef-profile", async (req, res) => {
  try {
    const { name, email, cost, image, location, experience, description } =
      req.body;
    const updatedUser = await chefs.findOneAndUpdate(
      { email: req.user.email },
      { name, email, cost, image, location, experience, description },
      { new: true }
    );
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

app.put("/change-password", async (req, res) => {
  try {
    const { password } = req.body;
    await chefs.findOneAndUpdate({ email: req.user.email }, { password });
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating password" });
  }
});

app.post("/send-mail", async (req, res) => {
  const { chefId, userId, time, date, selectedItems } = req.body;
  console.log(chefId, userId, time, selectedItems);
  var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "hasinichaithanya04@gmail.com",
      pass: "lljibhgveishczwi",
    },
  });
  try {
    const user = await users.findOne({ _id: new mongodb.ObjectId(userId) });
    const chef = await chefs.findOne({ _id: new mongodb.ObjectId(chefId) });
    const userUpdateResult = await users.updateOne(
      { _id: new mongodb.ObjectId(userId) },
      {
        $push: {
          orders: {
            time,
            date,
            selectedItems,
            chefName: chef.name,
            cost: chef.cost,
            image: chef.image,
          },
        },
      }
    );
    const chefUpdateResult = await chefs.updateOne(
      { _id: new mongodb.ObjectId(chefId) },
      { $push: { orders: { time, date, selectedItems } } }
    );
    console.log(user, user.email, "245");
    const mailOptions = {
      from: user.email,
      to: ["hasinichaithanya04@gmail.com", chef.email],
      subject: "New Booking Notification",
      text: `You have a new booking on:\n\nDate: ${date}\nTime: ${time}. \n\n From ${user.name} ${user.email} and they ordered for ${selectedItems}`,
    };
    const response = await transporter.sendMail(mailOptions);
    return res.json({
      message: "Booked and Email sent successfully",
      status: "success",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Failed to send email", status: "Failed" });
  }
});

app.delete("/delete-all", async (req, res) => {
  chefs
    .deleteMany({})
    .then((response) => {
      res.json({ response, message: "All are deleted successfully" });
    })
    .catch((e) => {
      res.status(400).send({ error: "Could not delete the chefs" });
    });
});
app.post("/update-comments/:id", async (req, res) => {
  const { id } = req.params;
  const { comments } = req.body;
  console.log(`Updating comments for chef with ID: ${id}`);
  console.log(`New comments: ${comments}`);
  try {
    const result = await chefs.updateOne(
      { _id: new mongodb.ObjectId(id) },
      { $set: { comments: comments } }
    );

    if (result.modifiedCount === 0) {
      console.error(`Chef with ID ${id} not found`);
      return res.status(404).send({ message: "Chef not found" });
    }

    console.log(`Comments updated successfully for chef with ID: ${id}`);
    res.status(200).send({ message: "Comments updated successfully" });
  } catch (error) {
    console.error(`Error updating comments for chef with ID ${id}:`, error);
    res.status(500).send({ message: "Failed to update comments", error });
  }
});

app.post("/update-likes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await chefs.updateOne(
      { _id: new mongodb.ObjectId(id) },
      { $inc: { likes: 1 } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ message: "Chef not found" });
    }

    res.status(200).send({ message: "Likes updated successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to update likes", error });
  }
});

app.post("/book", async (req, res) => {
  const { userId, chefId, date, time } = req.body;

  try {
    // Check if the date is already booked
    const existingBooking = await chefs.findOne({ chefId });
    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "Date already booked for this chef" });
    }

    // Update chef's orders

    // Notify the chef via email
    sendBookingEmail(chef.email, { date, time });

    res.status(201).json({ message: "Booking created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get bookings for a chef to disable booked dates
app.get("/bookings/:chefId", async (req, res) => {
  const { chefId } = req.params;

  try {
    const bookings = await chefs.find({ chefId }).select("date");
    res.status(200).json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
