import LRU from 'lru-cache'

const cache = new LRU({
  max: 1073741824,
  maxAge: 1000 * 60
})

export default cache
