const validator = require("validator")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Task = require("./task")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(val) {
            if(!validator.isEmail(val)) {
                throw new Error("Email is invalid")
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(val) {
            if(val.length <= 6 || val.toLowerCase().includes("password") || val.includes("1234")) {
                throw new Error("The password isn't enough secure")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(val) {
            if(val < 0) {
                throw new Error("Age must be a positive number.")
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual("tasks", {
    ref: "Task",
    localField: "_id",
    foreignField: "owner"
})

// Generate auth token
userSchema.methods.generateAuthToken = async function () {
    var token = jwt.sign({_id: this._id.toString()}, process.env.JWT_SECRET)
    this.tokens = this.tokens.concat({token})

    await this.save()
    return token
}

// Convert to JSON
userSchema.methods.toJSON = function () {
    var userObj = this.toObject()

    delete userObj.password
    delete userObj.tokens
    delete userObj.avatar
    delete userObj.__v

    return userObj
}

// Find by email and password
userSchema.statics.findByCredentials = async (email, password) => {
    var user = await User.findOne({email})
    if(!user) {
        throw new Error("Unable to login, try again later.")
    }

    var isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch) {
        throw new Error("Unable to login, try again later.")
    }

    return user
}

// Hash the password before saving
userSchema.pre("save", async function (next) {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8)
    }


    next()
})

// Delete user task when user is removed
userSchema.pre("remove", async function (next) {
    await Task.deleteMany({owner: this._id})
    next()
})

const User = mongoose.model("User", userSchema)

module.exports = User