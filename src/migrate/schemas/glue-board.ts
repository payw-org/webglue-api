import mongoose, { Document } from 'mongoose'
import { FragmentDoc } from '@@/migrate/schemas/fragment'
import categorySchema, { CategoryDoc } from '@@/migrate/schemas/category'

export interface GlueBoardDoc extends Document {
  id: string
  category: CategoryDoc
  fragments?: Array<string | FragmentDoc>
}

const glueBoardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  category: { type: categorySchema, required: true },
  fragments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fragment' }]
})

export default glueBoardSchema
