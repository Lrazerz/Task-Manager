const {Schema, model} = require('mongoose');

const taskSchemaOptions = {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}};

const taskSchema = new Schema({
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200
    },
    completed: {
      type: Boolean,
      default: false
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true
    }
  }, taskSchemaOptions);

module.exports = model('Task', taskSchema);