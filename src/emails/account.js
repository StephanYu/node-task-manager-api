const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
	const msg = {
		to: email,
		from: 'test@email.com',
		subject: 'Welcome to Task manager',
		text: `
			Hello, ${name}!

			Thank you for signing up.
		`
	}

	sgMail.send(msg)
}

const sendCancellationEmail = (email, name) => {
	const msg = {
		to: email,
		from: 'taskmanager@email.com',
		subject: 'Please come back',
		text: `
			Hello, ${name}!

			I am sad that you have decided to leave.
			Is there something we can do to convince you to stay?

			Yours truly,
			Task Manager
		`
	}

	sgMail.send(msg)
}

module.exports = {
	sendWelcomeEmail,
	sendCancellationEmail
}
