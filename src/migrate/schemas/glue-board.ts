import mongoose, { Document } from 'mongoose'
import { FragmentDoc } from '@@/migrate/schemas/fragment'
import { UserDoc } from '@@/migrate/schemas/user'

export interface GlueBoardJSON {
  id: string
  category: {
    name: string
    color: string
  }
  sharing: boolean
}

export interface GlueBoardDoc extends Document {
  user: string | UserDoc
  id: string
  category: {
    name: string
    color: string
  }
  sharing: boolean
  fragments?: Array<string | FragmentDoc>
}

const glueBoardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String, required: true, unique: true },
  category: {
    name: { type: String, required: true },
    color: { type: String, required: true }
  },
  sharing: { type: Boolean, required: true, default: false },
  fragments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fragment' }]
})

// set composite unique key
glueBoardSchema.index({ user: 1, 'category.name': 1 }, { unique: true })

export default glueBoardSchema
