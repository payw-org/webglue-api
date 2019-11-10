import mongoose from 'mongoose'
import dbConfig from '@@/configs/database'
import LogHelper from '@/helpers/LogHelper'

export default class DBConnector {
  /**
   * Connect to database and set connection event listeners.
   */
  public static async connect(): Promise<void> {
    // open the database connection
    await mongoose.connect(dbConfig.uri, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true
    })

    mongoose.connection.on('error', err => {
      LogHelper.log(
        'info',
        `Mongoose default connection has occured ${err} error`
      )
    })

    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        LogHelper.log(
          'error',
          'Mongoose default connection is disconnected due to application termination'
        )
        process.exit(0)
      })
    })
  }
}
