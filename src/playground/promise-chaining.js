require('../db/mongoose')
const Task = require('../models/task')

// Task.findByIdAndDelete("5cc85bd96a3cd7b2412d6f9a").then(task => {
// 	console.log(task)
// 	return Task.countDocuments({completed: false})
// }).then(result => {
// 	console.log(result)
// }).catch(err => {
// 	console.log(err)
// })

const deleteTaskAndCount = async (id) => {
	const task = await Task.findByIdAndDelete(id)
	const count = await Task.countDocuments({completed: false})

	return count
}

deleteTaskAndCount("5cc9541df15263b66475a25f").then(result => {
	console.log(result)
}).catch(err => {
	console.log(err)
})
