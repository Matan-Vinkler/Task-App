const express = require("express")
const Task = require("../models/task")
const auth = require("../middleware/auth")
const multer = require("multer")
const sharp = require("sharp")
const { findByIdAndUpdate } = require("../models/task")

const router = express.Router()

var upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match("\.(jpg|jpeg|png)$")) {
            return cb(new Error("File must be an image!"))
        }

        cb(undefined, true)
    }
})

router.post("/tasks", auth, async (req, res) => {
    // var task = new Task(req.body)
    var task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    }
    catch(e) {
        res.status(400).send(e)
    }
})

router.post("/tasks/:id/image", auth, upload.single("image"), async (req, res) => {
    try {
        var buff = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
        var task = await Task.findById(req.params.id)

        if(!task) {
            res.status(404).send()
        }

        task.image = buff
        await task.save()

        res.send(task)
    }
    catch(e) {
        console.log(e)
        res.status(500).send(e)
    }
})

// GET /tasks?completed=<true|false>
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
    try {
        var match = {}
        var sort = {}

        if(req.query.completed) {
            match.completed = req.query.completed === "true"
        }

        if(req.query.sortBy) {
            var parts = req.query.sortBy.split(":")
            sort[parts[0]] = parts[1] === "desc" ? -1 : 1
        }

        await req.user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        if(req.user.tasks.length === 0) {
            return res.status(404).send()
        }

        res.send(req.user.tasks)
    }
    catch(e) {
        res.status(500).send(e)
    }
})

router.get("/tasks/:id", auth, async (req, res) => {

    try {
        var task = await Task.findOne({_id, owner: req.user._id})

        if(!task) {
            return res.status(404).send()
        }

        res.send(task)
    }
    catch(e) {
        res.status(500).send(e)
    }
})

router.get("/tasks/:id/image", auth, async (req, res) => {
    try {
        var task = await Task.findById(req.params.id)

        if(!task || !task.image) {
            throw new Error("Image not found!")
        }

        res.set("Content-type", "image/png")
        res.send(task.image)
    }
    catch(error) {
        console.log(error)
        res.status(404).send({error})
    }
})

router.patch("/tasks/:id", auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["description", "completed"]
    const isValid = updates.every((update) => allowedUpdates.includes(update))

    if(!isValid) {
        return res.status(400).send({error: "Invalid Update"})
    }

    try {
        var task = await Task.findOne({_id: req.params.id, owner: req.user._id})

        if(!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)
    }
    catch(e) {
        res.status(400).send(e)
    }
})

router.delete("/tasks/:id", auth, async (req, res) => {
    try {
        var task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})

        if(!task) {
            return res.status(404).send()
        }

        res.send(task)
    }
    catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router