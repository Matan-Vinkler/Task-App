const express = require("express")
const multer = require("multer")
const sharp = require("sharp")
const User = require("../models/user")
const auth = require("../middleware/auth")
const { sendWelcomeMail, sendCancelMail } = require("../emails/account")

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

router.post("/users", async (req, res) => {
    var user = new User(req.body)

    try {
        await user.save()
        sendWelcomeMail(user.email, user.name)
        var token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }
    catch(e) {
        res.status(400).send(e)
    }
})

router.post("/users/login", async (req, res) => {
    try {
        var user = await User.findByCredentials(req.body.email, req.body.password)
        var token = await user.generateAuthToken()
        res.send({user, token})
    }
    catch(e) {
        console.log(e)
        res.status(400).send(e)
    }
})

router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    }
    catch(e) {
        res.status(500).send()
    }
})

router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    }
    catch(e) {
        res.status(500).send(e)
    }
})

router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    var buff = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
  
    req.user.avatar = buff
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user)
})

router.get("/users/:id/avatar", async (req, res) => {
    try {
        var user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error("Avatar not found!")
        }

        res.set("Content-type", "image/png")
        res.send(user.avatar)
    }
    catch(e) {
        res.status(404).send(e)
    }
})

router.patch("/users/me", auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name", "email", "password", "age"]
    var isValid = updates.every((update) => allowedUpdates.includes(update))
    
    if(!isValid) {
        return res.status(400).send({error: "Invalid Update"})
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        res.send(req.user)
    }
    catch(e) {
        console.log(e)
        res.status(400).send(e)
    }
})

router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelMail(req.user.email, req.user.name)
        res.send(req.user)
    }
    catch(e) {
        console.log(e)
        res.status(500).send(e)
    }
})

router.delete("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (err, req, res, next) => {
    res.status(400).send({error: err.message})
})

module.exports = router