import mongoose from 'mongoose'
import userSchema from 'Migrate/schemas/user'

const User = mongoose.model('User', userSchema)

export default User
