require("./db/mongoose")
const express = require("express")
const bcrypt = require("bcryptjs")

const Task = require("./models/task")
const User = require("./models/user")

const userRouter = require("./routers/user")
const taskRouter = require("./routers/task")
const auth = require("./middleware/auth")

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => console.log("\n\nServer is up on port " + port + "."))