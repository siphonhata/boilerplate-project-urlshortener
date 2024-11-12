require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const dns = require("dns");
const shortId = require("shortid");
const mongoose = require("mongoose");


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlsSchema = new mongoose.Schema({
  short_url: String,
  original_url: { type: String, required: true, unique: true },
});
const Urls = mongoose.model("Urls", urlsSchema);


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(bodyParser.urlencoded({ extended: true }));

// Short URL endpoint
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;
  try {
    const parsedUrl = new URL(originalUrl);
    dns.lookup(parsedUrl.hostname, async (err, address) => {
      if (err) {
        res.json({ error: "invalid url" });
      } else {
        const shortUrl = shortId.generate();
        const savedUrl = new Urls({
          short_url: shortUrl,
          original_url: originalUrl,
        });
        const found = await Urls.findOne({ original_url: originalUrl });
        if (found) {
          res.json({
            original_url: originalUrl,
            short_url: found.short_url,
          });
        } else {
          savedUrl.save();
          res.json({
            original_url: originalUrl,
            short_url: shortUrl,
          });
        }
      }
    });
  } catch (error) {
    res.json({ error: "invalid url" });
  }
});


app.get("/api/shorturl/:shorturl", async (req, res) => {
  const shortUrl = req.params.shorturl;
  try {
    const found = await Urls.findOne({ short_url: shortUrl });
    if (found) {
      res.redirect(found.original_url);
    } else {
      res.json({ error: "invalid url" });
    }
  } catch (error) {
    console.error("Error finding document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
