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
		let match, sort = {}

		// GET /tasks?completed=true
		if (req.query.completed === 'true' || req.query.completed === 'false') {
			match.completed = req.query.completed === 'true'
		}

		// GET /tasks?sortBy=createdAt:desc
		if (req.query.sortBy) {
			let [key, value] = req.query.sortBy.split(':')
			sort[key] = value === 'desc' ? -1 : 1
		}

		await req.user.populate({
			path: 'tasks',
			match,
			options: {
				limit: parseInt(req.query.limit),
				skip: parseInt(req.query.skip),
				sort
			}
		}).execPopulate()

		res.send(req.user.tasks)
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