const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        required: true,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    image: {
        type: Buffer,
    }
}, {
    timestamps: true
})

taskSchema.methods.toJSON = function() {
    var taskObj = this.toObject()

    delete taskObj.__v
    return taskObj
}

const Task = mongoose.model("Task", taskSchema)

module.exports = Task