const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileRouter = require('./router/file');
const userRouter = require('./router/user_api');
const ownerRouter = require('./router/owner_api');
const restaurantRouter = require('./router/restaurants');
const getDataRouter = require('./router/getData');

const app = express();

dotenv.config({ path: './config.env' })
require("./db/connection")


app.use(cors());
app.use(express.json());
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded(
  { extended: true }
))



app.get("/", async (req, res) => {
  res.json("Congratulations BreakIN server made successfully")
})
app.use("/", fileRouter)
app.use("/user/", userRouter)
app.use("/owner/", ownerRouter)
app.use("/restaurants/", restaurantRouter)
app.use("/getData/", getDataRouter)


const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});