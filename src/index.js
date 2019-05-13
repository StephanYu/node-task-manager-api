const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})

// const Task = require('./models/task')
// const User = require('./models/user')

// const main = async () => {
// 	const user = await User.findById('5cd6a3d46d302674151bccbb')
// 	await user.populate('tasks').execPopulate()

// 	console.log(user.tasks)
// }

// main()