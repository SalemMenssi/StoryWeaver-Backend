import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  name: String, // String is shorthand for {type: String}
  email: String,
    password: String,
    
});

const User = mongoose.model("User", userSchema);

export default User;
