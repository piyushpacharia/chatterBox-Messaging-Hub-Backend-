const mongoose =require("mongoose")

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    profilePic:{
        type:String,
        required:true,
        default:"https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    email:{
        type:String,
        unique:true,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    About:{
        type:String,
        default:"I am Using ChatterBox"
    },
    verified:{
        type:Boolean,
        default:false,
        required:true,
        
    },

});

// apply indexing on searching friend

UserSchema.index({name:"text",email:"text"});

module.exports = mongoose.model("chatterboxusers",UserSchema)
