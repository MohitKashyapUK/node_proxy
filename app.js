const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("/url"));

app.get(/(.+)/, (req, res) => {
  const headers = req.headers;
  
  // "host" header ko delete kar rahe hai taaki domain not match ka error na aaye
  delete headers.host;
  
  // First regex match
  const url = req.params[0]; // "/proxy/:regex0" proxy ke baad jo bhi aayega wo first regex match me shamil hoga

  res.send(url);
  return;
  
  // agar "referer" header hoga to sayad uski value wo URL hi hogi jis par request ki hai
  // iss liye "referer" header me pass ki gayi URL ko hi set kar rahe hai
  if (headers.referer !== undefined) headers.referer = url;
  
  // Client ke bheje gaye parameters ka object
  const params = req.query;

  // Axios configurations
  const configs = {
    method: "get",
    url,
    responseType: "stream",
    headers,
    params
  };

  axios(configs)
    .then((response) => {
      // HTTP status code from HTTP request
      const status = Number(response.status);

      // URL headers
      const response_headers = JSON.parse(JSON.stringify(response.headers));

      // HTTP status code for client
      res.status(status);

      // setting client headers
      res.set(response_headers);

      // Read data from the stream.
      response.data.on("data", (data) => res.write(data));
  
      // Close the stream.
      response.data.on("end", () => res.end());

      response.data.on('error', (error) => {
        console.error('Error while streaming:', error);
        res.end();
      });
    })
    .catch((error) => {
      console.log(error);
      res.end("Something wrong: " + error.message)
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}`));
