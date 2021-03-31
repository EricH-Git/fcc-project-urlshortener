require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// MY CODE
const dns = require('dns');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: false }));

const urlSchema = new Schema({
  "original_url": String
});

const UrlModel = mongoose.model('urlModel', urlSchema);

const urlCleaner = (url) => {
  const reg = /^w{2}/i;
  let arr = url.split('/');
  while (arr.length - 1 > 2) {
   arr.pop();
  }
  if (reg.test(arr[arr.length - 1])) {
    arr = arr[arr.length - 1].split('www.');
    return arr[arr.length - 1];
  } else {
    return arr[arr.length - 1];
  }
};

app.get('/test', (req, res) => {
  res.json({'response': mongoose.connection.readyState});
  
});


// post new url
app.post('/api/shorturl/new', (req, res) => {

  const postedUrl = req.body.url;
  const httpReg = /http[s]:\/\//i;
  
  if(!httpReg.test(postedUrl)){
    res.json({ error: "invalid url" });
  };

  const cleanUrl = urlCleaner(postedUrl);
  
  // check and save
  dns.resolveAny(cleanUrl, (err, url) => {
    if(err) {
     console.log(err, url);
      res.json({ error: "invalid URL" });
    } else {
      const urlObj = new UrlModel({ 'original_url': postedUrl });
      urlObj.save((err, payload) => {
        if(err) { 
          res.json({ error: "invalid url" });
        } else {
          res.json({ original_url: postedUrl, short_url: payload._id });
        }
      });
    }
  });
});

// redirect
app.get('/api/shorturl/:urlid', (req,res) => {
  const urlId = req.params.urlid;
  console.log(urlId);
  const fullUrl = UrlModel.findById(urlId, (err, payload) => {
    if(err) {
      console.log('Error: Check ID ' + urlId );
    } else {
      res.redirect(payload['original_url']);
    } 
  });
});