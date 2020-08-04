const express = require('express');
const bcrypt = require('bcryptjs');
const uploadImageMiddleware = require('../../middleware/upload-image');
const {body, validationResult} = require('express-validator');
const sharp = require('sharp');

const UserModel = require('../../models/User');
const authMiddleware = require('../../middleware/auth');

// email
const sendEmail = require('../../emails/account');

const router = express.Router()

// Add user (registration) deprecated
router.post('/', [
  body('name', 'Name should contains at least 3 symbols').trim().isLength({min: 3}),
  body('email', 'Email invalid').isEmail().normalizeEmail(),
  body('password', "Password should be at least 7 symbols and can not be 'password'")
    .trim().isLength({min: 7}).custom(value => value !== 'password')
], async (req, res) => {
  try {
    // express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    const user = new UserModel(req.body);
    await user.save();

    res.status(201).send('all ok');
  } catch (e) {
    if (e.keyPattern.email === 1) {
      return res.status(400).json({errors: [{msg: `Email already exists`}]});
    }
    res.status(500).json({errors: [{msg: `Server error`}]})
  }
});

// Signup user
router.post('/signup', [
  body('name', 'Name should contains at least 3 symbols').trim().isLength({min: 3}),
  body('email', 'Email invalid').isEmail().normalizeEmail(),
  body('password', "Password should be at least 7 symbols and can not be 'password'")
    .trim().isLength({min: 7}).custom(value => value !== 'password')
], async (req, res) => {
  console.log('req', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }

  try {
    const {body: inputUser} = req;
    console.log(inputUser);
    // Find user
    let user = await UserModel.findOne({email: inputUser.email});
    if (user) return res.status(404).json({errors: [{msg: `User with email '${inputUser.email}' already exists`}]});
    user = new UserModel(inputUser);
    await user.hashPassword(inputUser.password);
    await user.save();
    const token = await user.generateToken();
    // If passed, all ok
    sendEmail(user.email, user.name);
    res.status(201).json({user, token});
  } catch (e) {
    console.log(e.message);
    res.status(500).json({errors: [{msg: "Server error"}]})
  }
});

// Login user
router.post('/login',
  [
    body('email', 'Email invalid').isEmail().normalizeEmail(),
    body('password', "Password should be at least 7 symbols and can not be 'password'")
      .trim().isLength({min: 7}).custom(value => value !== 'password')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    try {
      const {body: inputUser} = req;
      // Find user
      const user = await UserModel.findOne({email: inputUser.email});
      if (!user) return res.status(404).json({errors: [{msg: `User with email '${inputUser.email}' not found`}]});

      // Check password
      console.log(inputUser.password);
      const isPasswordValid = await bcrypt.compare(inputUser.password, user.password);
      console.log('password here', isPasswordValid);
      if (!isPasswordValid) return res.status(404).json({errors: [{msg: 'Password is not valid'}]});

      const token = await user.generateToken();

      // If passed, all ok
      res.status(200).json({user, token});
    } catch (e) {
      console.log(e);
      res.status(500).json({errors: [{msg: "Server error"}]})
    }
  });

// Get current user
router.get('/me', [
  authMiddleware
], async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    // todo maybe delete
    if (!user) return res.status(404).json({errors: [{"msg": "User not found"}]});
    res.status(200).json(user);
  } catch (e) {
    res.status(500).json({errors: [{"msg": "Server error"}]});
  }
})

// Logout Current User (delete current token)
router.post('/logout', [
  authMiddleware
], async (req, res) => {
  try {
    // delete current token
    const tokenIndex = req.user.tokens.findIndex(token => token.token === req.token);
    req.user.tokens = req.user.tokens.slice(1, tokenIndex);
    await req.user.save();

    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
})

// Logout Current User From All Devices (delete all tokens)
router.post('/logoutAll', [
  authMiddleware
], async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
})

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({errors: [{"msg": "Server error"}]})
  }
})

// Update user by ID
router.patch('/me', [
    authMiddleware,
    body('name', 'Name should contains at least 3 symbols').trim().isLength({min: 3}).optional(),
    body('email', 'Email invalid').isEmail().normalizeEmail().optional(),
    body('password', "Password should be at least 7 symbols and can not be 'password'")
      .trim().isLength({min: 7}).custom(value => value !== 'password').optional(),
    body('*', 'Request contains not allowed fields')
      .custom((fieldValue, {path}) => {
        const allowedFields = ['name', 'email', 'password'];
        if (!allowedFields.includes(path)) return false;
        return true;
      })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }
      for (const a in req.body) {
        req.user[a] = req.body[a];
      }
      if (req.body.password) {
        req.user.hashPassword(req.body.password);
      }
      const user = await req.user.save();
      res.status(200).json(user);
    } catch (e) {
      // if(e.kind === "ObjectId") {
      //   return res.status(404).json({errors: [{"msg": "Incorrect ID"}]});
      // }
      console.log(e);
      if (e.keyPattern && e.keyPattern.email === 1) {
        return res.status(400).json({errors: [{msg: `Email already exists`}]});
      }
      res.status(500).json({errors: [{"msg": "Server error"}]});
    }
  })


router.post('/me/avatar', authMiddleware, uploadImageMiddleware, async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).toBuffer();

  req.user.avatar.avatar = buffer;
  req.user.avatar.extension = req.file.extension;
  await req.user.save();
  res.status(200).send();
}, (err, req, res, next) => {
  res.send(400).json([{msg: err.message}]);
});

router.get('/:id/avatar', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.avatar.avatar) {
      throw new Error('User has no avatar');
    }
    res.set({
      'Content-Type': `image/${user.avatar.extension.slice(1)}`
    })
    res.send(user.avatar.avatar);
  } catch (e) {
    res.status(404).json([{msg: e.message}]);
  }
})

router.delete('/me/avatar', authMiddleware, async (req, res) => {
  try {
    if (!req.user.avatar.avatar) {
      return res.status(200).json({msg: 'Avatar deleted'});
    }
    req.user.avatar = {};
    await req.user.save();
    res.status(200).json({msg: 'Avatar deleted'});
  } catch (e) {
    res.status(500).json([{msg: 'Server error'}]);
  }

}, (err, req, res, next) => {
  res.send(400).json([{msg: err.message}]);
});

// Delete user by ID
router.delete('/me', [
  authMiddleware
], async (req, res) => {
  try {
    // const user = await UserModel.findByIdAndDelete(req.user._id);
    // or
    await req.user.remove();
    sendEmail(user.email, user.name, 'leave');
    res.status(200).json(req.user);
  } catch (e) {
    res.status(500).json({errors: [{"msg": "Server error"}]});
  }
})

module.exports = router;