const { Router } = require('express')
const bcryptjs = require('bcryptjs')
const User = require('./../model/Users')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')
const route = Router()
// const {check, validationResult} = required('express-validator')

route.post('/register',
    [
        check('email', 'Wrong email').isEmail(),
        check('firstName', 'The \'first name\' is required').isLength({ min: 1 }),
        check('lastName', 'The \'last name\' is required').isLength({ min: 1 }),
        check('password', 'The password must be 5+ chars long').isLength({ min: 5 })
    ], async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: `Errors: ${errors.array().map(error => error.msg)}` })
            }
            const { email, password, firstName, lastName } = req.body
            const isUserExisted = await User.findOne({ email })
            if (isUserExisted) {
                Promise.reject('User is already exist')
                return res.status(400).json({ message: `User is already exist` })
            }
            const hashedPassword = await bcryptjs.hash(password, 12)

            const user = new User({ email, password: hashedPassword, firstName, lastName })
            await user.save()
            res.status(200).json({ message: 'User is created' });

        } catch (e) {
            res.status(500).json({ message: `${e.message}` })
        }


    })

route.post('/login',
    [
        check('email', 'Wrong email').normalizeEmail().isEmail(),
        check('password', 'Why empty?').optional()
    ], async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: `Errors: validation is not passed` })
            }
            const { email, password } = req.body

            const user = await User.findOne({ email })
            if (!user) {
                Promise.reject('User is not yet existed')
                return res.status(400).json({ message: `User is not yet existed` })
            }
            const isPassword = await bcryptjs.compare(password, user.password)

            if (!isPassword) {
                return res.status(400).json({ message: `Password is incorrect` })
            }
            const token = jwt.sign(
                {userId: user.id},
                config.get('jwtSecret'),
                {expiresIn:'1h'}
            )
            res.status(200).json({token, firstName: user.firstName, lastName: user.lastName })
        } catch (e) {
            res.status(500).json({ message: `It is an error in /login request, try again) ${e.message}` })
        }
    })

module.exports = route