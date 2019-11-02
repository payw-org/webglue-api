import mongoose, { Document } from 'mongoose'

export interface CategoryDoc extends Document {
  name: string
  color: string
}

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, required: true }
})

export default categorySchema
