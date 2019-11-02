import mongoose, { Document } from 'mongoose'
import { FragmentDoc } from '@@/migrate/schemas/fragment'
import categorySchema, { CategoryDoc } from '@@/migrate/schemas/category'

export interface GlueBoardDoc extends Document {
  category: CategoryDoc
  fragments?: Array<string | FragmentDoc>
  next?: string | GlueBoardDoc
}

const glueBoardSchema = new mongoose.Schema({
  category: { type: categorySchema, required: true },
  fragments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fragment' }],
  next: { type: mongoose.Schema.Types.ObjectId, ref: 'GlueBoard' }
})

export default glueBoardSchema
