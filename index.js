const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

dotenv.config({ path: './config.env' })
require("./db/connection")


app.use(cors());
app.use(express.json());
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded(
  { extended: false }
))



app.get("/api/",async(req,res)=>{
  res.json("Congratulations BreakIN server made successfully")
})

app.use(require("./router/api"));


const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});