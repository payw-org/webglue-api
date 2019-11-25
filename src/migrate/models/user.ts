import mongoose, { Model } from 'mongoose'
import userSchema, { UserDoc } from '@@/migrate/schemas/user'

const User = mongoose.model<UserDoc, Model<UserDoc>>('User', userSchema)

export default User
