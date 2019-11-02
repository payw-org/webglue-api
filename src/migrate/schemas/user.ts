import mongoose, { Document } from 'mongoose'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'

export interface UserDoc extends Document {
  googleId: string
  email: string
  nickname: string
  image: string
  name: string
  loggedInAt: Date
  glueBoards: Array<string | GlueBoardDoc>
}

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  nickname: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  name: { type: String, required: true },
  loggedInAt: { type: Date, required: true, default: new Date() },
  glueBoards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GlueBoard' }]
})

export default userSchema
