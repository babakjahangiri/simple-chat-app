var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const http = require("http").Server(app);
var io = require("socket.io")(http);
var mongoose = require("mongoose");
require("dotenv").config();

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const SERVER_IP = process.env.SERVER_IP || "localhost";

var dbUrl = process.env.DB_CONNECTION;

// message model
var Message = mongoose.model("message", {
  name: String,
  msg: String,
  time: { type: Date, default: Date.now },
});

app.get("/messages", (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
    console.log("get messages by", req.ip);
  }).sort({ time: 1 });
});

app.post("/messages", async (req, res) => {
  try {
    //throw "some error";
    var message = new Message(req.body);

    console.log("post messages by", req.ip);
    console.log("user message : ", req.body.msg);
    if (!req.body.msg !== undefined) {
      var savedMessage = await message.save();
      console.log("user message has saved to database");
    }

    var censored = await Message.findOne({ msg: "badword" });
    if (censored) {
      console.log("censored word found", censored);
      await Message.remove({ _id: censored.id });
      console.log("removed censored message");
    } else {
      io.emit("message", req.body);
    }

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    return console.error(error);
  }
});

io.on("connection", (socket) => {
  console.log("-> a user has connected");
});

mongoose.connect(
  dbUrl,
  { useUnifiedTopology: true, useNewUrlParser: true },
  (err) => {
    err !== null && console.log("mongo db connection , Error : ", err);
  }
);
var server = http.listen(5000, () => {
  console.log("server is running on port", server.address().port);
});

/*
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data

*/
