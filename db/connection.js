const mongoose = require('mongoose');
const uri = process.env.DATABASE;
mongoose.set("strictQuery", false)
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log(`connection successful`);
}).catch((err) => console.log(err));