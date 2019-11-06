import mongoose from 'mongoose'
import glueBoardSchema from '@@/migrate/schemas/glue-board'

const GlueBoard = mongoose.model('GlueBoard', glueBoardSchema, 'glueBoards')

export default GlueBoard
