import mongoose, { Document } from 'mongoose'

export interface UserDoc extends Document {
  googleId: string
  email: string
  nickname?: string
  image: string
  name: string
  loggedInAt: Date
}

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  nickname: { type: String, unique: true },
  image: { type: String, required: true },
  name: { type: String, required: true },
  loggedInAt: { type: Date, required: true, default: new Date() }
})

export default userSchema
