import mongoose, { Document } from 'mongoose'

export interface FragmentJSON {
  id: string
  url: string
  selector: string
  xPos: number
  yPos: number
  scale: number
  subscription: boolean
  headers?: {
    userAgent: string
    accept: string
    acceptLanguage: string
  }
  snapshot?: string
  watchCycle?: number
  lastWatchedAt?: Date
}

export interface FragmentDoc extends Document {
  id: string
  url: string
  selector: string
  xPos: number
  yPos: number
  scale: number
  subscription: boolean
  headers?: {
    userAgent: string
    accept: string
    acceptLanguage: string
  }
  snapshot?: string
  watchCycle?: number
  lastWatchedAt?: Date
}

const fragmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  selector: { type: String, required: true },
  xPos: { type: Number, required: true },
  yPos: { type: Number, required: true },
  scale: { type: Number, required: true, default: 1 },
  subscription: { type: Boolean, required: true, default: false },
  headers: {
    userAgent: { type: String, required: false },
    accept: { type: String, required: false },
    acceptLanguage: { type: String, required: false },
    required: false
  },
  snapshot: { type: String, required: false },
  watchCycle: { type: Number, required: false },
  lastWatchedAt: { type: Date, required: false }
})

export default fragmentSchema
