import mongoose from 'mongoose'
import fragmentSchema from '@@/migrate/schemas/fragment'

const Fragment = mongoose.model('Fragment', fragmentSchema)

export default Fragment
