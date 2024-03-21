const { EventEmitter } = require('node:events')
const prisma = require('../utils/prisma')
const mailTransporter = require('../config/emailConfig')
const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')

// Init Event
const emailEventEmitter = new EventEmitter()

// Email verification on register
emailEventEmitter.on('verificationEmail', async ({ email, code }) => {
  try {
    await prisma.admins.update({
      where: {
        email,
      },
      data: {
        verification_tokens: {
          create: {
            code,
            token: uuidv4(),
            verify_type: 'EMAIL',
            expires_at: dayjs().add(1, 'day'),
          },
        },
      },
    })

    // Send verification email
    await mailTransporter.sendMail({
      from: process.env.Mail_SENDER,
      to: email,
      subject: 'Email verification',
      text: `Your email verification code is ${code}`,
    })
    console.log(`Sent verification email to ${email}`)
  } catch (error) {
    console.error(`Failed to send email for ${email}:`, error)
  }
})

// Email verification on password reset
emailEventEmitter.on('passwordResetEmail', async ({ email, code }) => {
  try {
    await prisma.users.update({
      where: {
        email,
      },
      data: {
        verification_tokens: {
          create: {
            code,
            token: uuidv4(),
            verify_type: 'PASSWORD_RESET',
            expires_at: dayjs().add(1, 'day'),
          },
        },
      },
    })

    // Send verification email
    await mailTransporter.sendMail({
      from: process.env.Mail_SENDER,
      to: email,
      subject: 'Password reset code',
      text: `Your password reset code is ${code}`,
    })
  } catch (error) {
    console.error(`Failed to send reset email for ${email}:`, error)
  }
})

module.exports = emailEventEmitter
