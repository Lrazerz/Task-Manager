const express = require('express')
const { body, validationResult } = require('express-validator');

const TaskModel = require('../../models/Task');
const authMiddleware = require('../../middleware/auth');

const router = express.Router()

// Create task
router.post('/',[
  authMiddleware
  ],
  async (req,res) => {
  try {
    const task = new TaskModel({...req.body,owner:req.user._id});
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(500).json({errors: [{"msg": "Server error"}]})
  }
});

// Get all tasks
// tasks/?completed=true
// tasks/?limit=5&skip=2
// tasks/?sortBy=created_at:asd  (desc)
router.get('/',[
    authMiddleware
  ],
  async (req,res) => {
  const {completed,limit,skip,sortBy} = req.query;

  // filter
  const filter = {};
  if(completed) filter.completed = completed;

  // pagination
  const options = {};
  if(limit) options.limit = parseInt(limit);
  if(skip) options.skip = parseInt(skip);

  // sort
  if(sortBy) {
    const [sortField,sortOrder] = sortBy.split(':');
    // desc first in the check, becauser we can have query like ?sortBy=field
    options.sort = {[sortField]:sortOrder === 'desc' ? -1 : 1};
  }

  try {

    const tasks = await TaskModel.find(filter,{}, options);
    return res.status(200).json(tasks);
  } catch (e) {
    res.status(500).json({errors: [{"msg": "Server error"}]})
  }
});

// Get task by ID
router.get('/:id', async (req,res) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if(!task) return res.status(404).json({errors: [{"msg": "Task not found"}]});
    res.status(200).json(task);
  } catch (e) {
    if(e.kind === "ObjectId") {
      return res.status(404).json({errors: [{"msg": "Incorrect ID"}]});
    }
    res.status(500).json({errors: [{"msg": "Server error"}]});
  }
})

// Update task by ID
router.patch('/:id',[
    body('*', 'Request contains not allowed fields')
      .custom((fieldValue,{path}) => {
      const allowedFields = ['description','completed'];
      if(!allowedFields.includes(path)) return false;
      return true;
    })
  ],
  async (req,res) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    const task = await TaskModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if(!task) return res.status(404).json({errors: [{"msg": "Task not found"}]});
    res.status(200).json(task);
  } catch (e) {
    if(e.kind === "ObjectId") {
      return res.status(404).json({errors: [{"msg": "Incorrect ID"}]});
    }
    res.status(500).json({errors: [{"msg": "Server error"}]});
  }
})


// Delete task by ID
router.delete('/:id', async (req,res) => {
  try {
    const task = await TaskModel.findByIdAndDelete(req.params.id);
    if(!task) return res.status(404).json({errors: [{"msg": "Task not found"}]});
    res.status(200).json(task);
  } catch (e) {
    if(e.kind === "ObjectId") {
      return res.status(404).json({errors: [{"msg": "Incorrect ID"}]});
    }
    res.status(500).json({errors: [{"msg": "Server error"}]});
  }
})

module.exports = router;