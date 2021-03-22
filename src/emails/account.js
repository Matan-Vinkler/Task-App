const sg = require("@sendgrid/mail")

sg.setApiKey(process.env.API_KEY)

const sendWelcomeMail = (email, name) => {
    sg.send({
        to: email,
        from: "matanvinkler@gmail.com",
        subject: "Thanks for joining us!",
        text: `Welcome ${name}`
    })
}

const sendCancelMail = (email, name) => {
    sg.send({
        to: email,
        from: "matanvinkler@gmail.com",
        subject: "What?",
        text: "Lech ya zevel!"
    })
}

module.exports = {
    sendWelcomeMail,
    sendCancelMail
}