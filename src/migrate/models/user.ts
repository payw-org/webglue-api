import mongoose from 'mongoose'
import userSchema from '@@/migrate/schemas/user'

const User = mongoose.model('User', userSchema)

export default User
