### ENV Setup

### Secret Token Creation
```javascript
  // Go into node repl by typing node and then type the command below
  require('crypto').randomBytes(64).toString('hex')
```
Do above for different secret tokens (Access token, refresh token and reset_token)

- NODE_ENV=production
- PORT=5000
- DOMAIN_NAME=
- ACCESS_TOKEN_SECRET=
- REFRESH_TOKEN_SECRET=
- RESET_TOKEN_SECRET=

- DATABASE_URL=postgresql://user:password@database:5432/school_db?schema=public
- MAIL_HOST=
- MAIL_PORT=
- MAIL_USER=
- MAIL_PASSWORD=
- MAIL_SENDER=

### Database Setup
- npx prisma db push
- npx prisma db seed
- npm run prod
