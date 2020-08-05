const validator = require('validator');
const {Schema, model} = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const _hashPassword = async password => {
  // genSalt(8); >8 - too slow, <8 - easier to crack
  const salt = await bcrypt.genSalt(8);
  return await bcrypt.hash(password, salt);
}

const userSchemaOptions = {timestamps: true};

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: {
      validator: value => validator.isEmail(value),
      msg: 'Email has invalid format'
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate: {
      validator: value => value !== 'password',
      msg: 'Password cannot be "password"'
    }
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  avatar: {
    avatar: {
      type: Buffer
    },
    extension: {
      type: String
    }
  }
},userSchemaOptions);

userSchema.method('generateToken', async function() {
  console.log(this);
  // this = current document
  const token = await jwt.sign({_id: this._id.toString()}, process.env.JWT_SECRET, {expiresIn: '1h'});
  this.tokens = this.tokens.concat({token});
  // todo maybe not save, will see later
  await this.save();
  return token;
});

// Hash password before save (create) and check if email already exists
userSchema.method('hashPassword', async function(password) {
  // this = current document, can const user = this, then user.password = ... for comfort
  this.password = await _hashPassword(password);
})

userSchema.method('toJSON',  function() {
  // this = current document, can const user = this, then user.password = ... for comfort
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  delete user.avatar;
  return user;
})

// Hash password before update
// userSchema.pre('findOneAndUpdate', async function() {
//   // this = query
//   const {password} = this._update
//   if(password) {
//     this._update.password = await _hashPassword(password);
//   }
// })

module.exports = model('User',userSchema);