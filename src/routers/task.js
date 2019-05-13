const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/authentication')
const router = express.Router()

router.post('/tasks', auth, async (req, res) => {
	const task = new Task({
		...req.body,
		owner: req.user._id
	})

	try {
		await task.save()
		res.status(201).send(task)
	} catch (error) {
		res.status(400).send(error)
	}
})

router.get('/tasks', auth, async (req, res) => {
	try {
		const tasks = await Task.find({ owner: req.user._id })
		// Alternative way to find all tasks of specific user
		// const tasks = await req.user.populate('tasks').execPopulate()

		res.send(tasks)
	} catch (error) {
		res.status(500).send(error)
	}
})

router.get('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id

	try {
		const task = await Task.findOne({ _id, owner: req.user._id })

		if (!task) {
			return res.status(404).send()
		}

		res.send(task)
	} catch (error) {
		res.status(500).send(error)
	}
})

router.patch('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id
	const newProps = req.body
	const allowed = ['description', 'completed']
	const keysToUpdate = Object.keys(newProps)
	const isValidOperation = keysToUpdate.every(key => allowed.includes(key))

	if (!isValidOperation) {
		return res.status(400).send({error: 'Invalid Operation!'})
	}

	try {
		const task = await Task.findOne({ _id, owner: req.user._id })

		if (!task) {
			return res.status(404).send()
		}

		keysToUpdate.forEach(key => task[key] = newProps[key])
		await task.save()

		res.send(task)
	} catch (error) {
		res.status(400).send()
	}
})

router.delete('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id

	try {
		const task = await Task.findOneAndDelete({ _id, owner: req.user._id })

		if (!task) {
			return res.status(404).send()
		}

		res.send(task)
	} catch (error) {
		res.status(500).send(error)
	}
})

module.exports = router