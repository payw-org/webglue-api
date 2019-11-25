import mongoose, { Model } from 'mongoose'
import fragmentSchema, { FragmentDoc } from '@@/migrate/schemas/fragment'

const Fragment = mongoose.model<FragmentDoc, Model<FragmentDoc>>(
  'Fragment',
  fragmentSchema
)

export default Fragment
