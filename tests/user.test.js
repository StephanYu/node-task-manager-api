const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOne, newUser, setUpDatabase } = require('./fixtures/db')

beforeEach(setUpDatabase)

describe('Registration of new user', () => {
	test('Should sign up a new user', async () => {
		await request(app).post('/users')
			.send(newUser)
			.expect(201)
	})

	test('Should return the correct user', async () => {
		const response = await request(app).post('/users')
			.send(newUser)
		const id = response.body.user._id
		const fetchedUser = await User.findById(id)
		const userObject = {
			user: {
				name: 'Alice Newman',
				email: 'new@user.com'
			},
			token: fetchedUser.tokens[0].token
		}

		expect(response.body).toMatchObject(userObject)
	})

	test('Should save the new user', async () => {
		const response = await request(app).post('/users')
			.send(newUser)
		const id = response.body.user._id
		const fetchedUser = await User.findById(id)

		expect(fetchedUser).not.toBeNull()
	})

	test('Should not store the password in plain text', async () => {
		const response = await request(app).post('/users')
			.send(newUser)
		const id = response.body.user._id
		const fetchedUser = await User.findById(id)

		expect(fetchedUser.password).not.toBe(newUser.password)
	})
})

describe('Login of existing user', () => {
	test('Should login user', async () => {
		await request(app).post('/users/login')
			.send(userOne)
			.expect(200)
	})

	test('Should save a new token when logging in', async () => {
		const response = await request(app).post('/users/login')
			.send(userOne)
		const id = response.body.user._id
		const fetchedUser = await User.findById(id)

		expect(response.body.token).toBe(fetchedUser.tokens[1].token)
	})

	test('Should not login a non-existent user', async () => {
		const userNonExistent = {
			name: 'John Doe',
			email: 'john@doe.com',
			password: 'johndoe'
		}

		await request(app).post('/users/login')
			.send(userNonExistent)
			.expect(400)
	})
})

describe('User Profile', () => {
	test('Should get user profile for authenticated user', async () => {
		let userOneToken = userOne.tokens[0].token
		await request(app).get('/users/myprofile')
			.send(userOne)
			.set('Authorization', `Bearer ${userOneToken}`)
			.expect(200)
	})

	test('Should not get user profile for unauthenticated user', async () => {
		await request(app).get('/users/myprofile')
			.send()
			.expect(401)
	})

	test('Should update valid user fields', async () => {
		let userOneToken = userOne.tokens[0].token
		await request(app).patch('/users/myprofile')
			.send({
				name: 'Updated User One'
			})
			.set('Authorization', `Bearer ${userOneToken}`)
			.expect(200)
		const fetchedUser = await User.findById(userOne._id)

		expect(fetchedUser.name).toEqual('Updated User One')
	})

	test('Should not update invalid user fields', async () => {
		let userOneToken = userOne.tokens[0].token
		await request(app).patch('/users/myprofile')
			.send({
				location: 'London'
			})
			.set('Authorization', `Bearer ${userOneToken}`)
			.expect(400)
	})
})

describe('Deleting user account', () => {
	test('Should delete user account', async () => {
		let userOneToken = userOne.tokens[0].token
		await request(app).delete('/users/myprofile')
			.send(userOne)
			.set('Authorization', `Bearer ${userOneToken}`)
			.expect(200)
	})

	test('Should remove delete user from the database', async () => {
		let userOneToken = userOne.tokens[0].token
		await request(app).delete('/users/myprofile')
			.send(userOne)
			.set('Authorization', `Bearer ${userOneToken}`)
		const fetchedUser = await User.findById(userOne._id)

		expect(fetchedUser).toBeNull()
	})

	test('Should not delete user account for unauthenticated user', async () => {
		await request(app).delete('/users/myprofile')
			.send()
			.expect(401)
	})
})

describe('Uploading user avatar', () => {
	test('Should upload avatar image as Buffer', async () => {
		let userOneToken = userOne.tokens[0].token
		await request(app).post('/users/myprofile/avatar')
			.set('Authorization', `Bearer ${userOneToken}`)
			.attach('avatar', 'tests/fixtures/test bot.jpeg')
			.expect(200)
		const fetchedUser = await User.findById(userOne._id)

		expect(fetchedUser.avatar).toEqual(expect.any(Buffer))
	})
})

