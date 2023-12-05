const mailTransporter = require('../config/emailConfig')
const asyncHandler = require('express-async-handler')
const prisma = require('./prisma')
const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')

const sendEmailVerifyCode = asyncHandler(async (email, role, code, tx) => {
  // Create email verify token based on role
  if (role === 'admin') {
    await tx.admins.update({
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
  }

  if (role === 'teacher') {
    await tx.teachers.update({
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
  }

  if (role === 'student') {
    await tx.students.update({
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
  }

  // Send verification email
  await mailTransporter.sendMail({
    from: 'test@example.com',
    to: email,
    subject: 'Email verification',
    text: `Your email verification code is ${code}`,
  })
})

const sendPasswordResetCode = asyncHandler(async (email, role, code) => {
  // Create password reset token based on role
  if (role === 'admin') {
    await prisma.admins.update({
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
  }

  if (role === 'teacher') {
    await prisma.teachers.update({
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
  }

  if (role === 'student') {
    await prisma.students.update({
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
  }

  // Send password reset code email
  await mailTransporter.sendMail({
    from: 'test@example.com',
    to: email,
    subject: 'Password reset code',
    text: `Your password reset code is ${code}`,
  })
})

module.exports = { sendEmailVerifyCode, sendPasswordResetCode }
