const express = require('express')
const User = require('../models/user')
const router = express.Router()
const auth = require('../middleware/authentication')

router.post('/users', async (req, res) => {
	const user = new User(req.body)

	try {
		await user.save()
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

		res.send(req.user)
	} catch (error) {
		res.status(500).send(error)
	}
})

module.exports = router