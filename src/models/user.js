const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
		validate(value) {
			if (!validator.isEmail(value)) {
				throw new Error('Email is not valid')
			}
		}
	},
	age: {
		type: Number,
		default: 0,
		validate(value) {
			if (value < 0) {
				throw new Error('Age must be a positive number.')
			}
		}
	},
	password: {
		type: String,
		required: true,
		trim: true,
		minlength: 7,
		validate(value) {
			if (value.toLowerCase().includes('password')) {
				throw new Error(`Password must not contain the phrase 'password'.`)
			}
		}
	},
	tokens: [{
		token: {
			type: String,
			required: true
		}
	}]
})

// Create virtual relationship between User and Task models
userSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'owner'
})

// Custom function to check user credentials during login
userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email })

	if (!user) {
		throw new Error('Login has failed')
	}

	const isMatch = await bcrypt.compare(password, user.password)

	if (!isMatch) {
		throw new Error('Login has failed')
	}

	return user
}

// Generate JWT Auth token for authenticating users
userSchema.methods.generateAuthToken = async function() {
	const user = this
	const secret = 'my_secure_secret'
	const token = jwt.sign({ _id: user._id.toString() }, secret)

	user.tokens = user.tokens.concat({ token })
	await user.save()

	return token
}

// Hide sensitive information before returning user data
// toJSON() gets called whenever a response is sent back
userSchema.methods.toJSON = function () {
	const user = this
	const userObj = user.toObject()

	delete userObj.password
	delete userObj.tokens

	return userObj
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
	const user = this

	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 8)
	}

	next()
})

// Delete all tasks associated with user when user gets deleted
userSchema.pre('remove', async function (next) {
	const user = this

	await Task.deleteMany({ owner: user._id })
	next()
})

const User = mongoose.model('User', userSchema)

module.exports = User