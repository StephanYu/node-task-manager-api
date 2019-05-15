const express = require('express')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/authentication')
const multer = require('multer')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')

const router = express.Router()

router.post('/users', async (req, res) => {
	const user = new User(req.body)

	try {
		await user.save()
		sendWelcomeEmail(user.email, user.name)
		const token = await user.generateAuthToken()

		res.status(201).send({ user, token })
	} catch (error) {
		res.status(400).send(error)
	}
})

router.post('/users/login', async (req, res) => {
	const email = req.body.email
	const password = req.body.password

	try {
		const user = await User.findByCredentials(email, password)
		const token = await user.generateAuthToken()

		res.send({ user, token })
	} catch (error) {
		res.status(400).send()
	}
})

router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
		await req.user.save()

		res.send()
	} catch (error) {
		res.status(500).send()
	}
})

router.post('/users/logout/all', auth, async (req, res) => {
	try {
		req.user.tokens = []
		await req.user.save()

		res.send()
	} catch (error) {
		res.status(500).send()
	}
})

router.get('/users/myprofile', auth, async (req, res) => {
	const user = req.user

	res.send(user)
})

router.patch('/users/myprofile', auth, async (req, res) => {
	const user = req.user
	const newProps = req.body
	const allowedUpdates = ['name', 'email', 'password', 'age']
	const keysToUpdate = Object.keys(newProps)
	const isValidOperation = keysToUpdate.every(key =>  allowedUpdates.includes(key))

	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid Operation!'})
	}

	try {
		keysToUpdate.forEach(key => user[key] = newProps[key])
		await user.save()

		res.send(user)
	} catch (error) {
		res.status(400).send(error)
	}
})

router.delete('/users/myprofile', auth, async (req, res) => {
	try {
		await req.user.remove()
		sendCancellationEmail(req.user.email, req.user.name)

		res.send(req.user)
	} catch (error) {
		res.status(500).send(error)
	}
})

const uploadAvatar = multer({
	limits: {
		fileSize: 1000000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('Please upload either a .jpg or .png formatted image file.'))
		}

		cb(undefined, true)
	}
})
router.post('/users/myprofile/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
	const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
	req.user.avatar = buffer
	await req.user.save()

	res.send()
}, (error, req, res, next) => {
	res.status(400).send({ error: error.message })
})

router.delete('/users/myprofile/avatar', auth, async (req, res) => {
	req.user.avatar = undefined
	await req.user.save()

	res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id)

		if (!user || !user.avatar) {
			throw new Error()
		}

		res.set('Content-Type', 'image/png')
		res.send(user.avatar)
	} catch (error) {
		res.status(404).send()
	}
})


module.exports = router