import mongoose, { Document } from 'mongoose'

export interface FragmentDoc extends Document {
  id: string
  url: string
  selector: string
  xPos: number
  yPos: number
  scale: number
}

const fragmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  selector: { type: String, required: true },
  xPos: { type: Number, required: true },
  yPos: { type: Number, required: true },
  scale: { type: Number, required: true, default: 1 }
})

export default fragmentSchema
