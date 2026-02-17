const express = require('express');
const app = express();
const cross = require('cors');

const connect = require('./Config/DBconfig');
require('dotenv').config();
const port = process.env.PORT || 8080;
app.use(cross());
connect();


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running onport ${port}`);
});