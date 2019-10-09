const databaseConfig = {
  uri:
    'mongodb://' +
    process.env.DB_USERNAME +
    ':' +
    process.env.DB_PASSWORD +
    '@' +
    process.env.DB_HOST +
    ':' +
    process.env.DB_PORT +
    '/' +
    process.env.DB_DATABASE
}

export default databaseConfig
