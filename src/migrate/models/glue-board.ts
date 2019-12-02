import mongoose, { Model } from 'mongoose'
import glueBoardSchema, { GlueBoardDoc } from '@@/migrate/schemas/glue-board'

const GlueBoard = mongoose.model<GlueBoardDoc, Model<GlueBoardDoc>>(
  'GlueBoard',
  glueBoardSchema,
  'glueBoards'
)

export default GlueBoard
