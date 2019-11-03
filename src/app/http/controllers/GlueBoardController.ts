import { Response, SimpleHandler } from '@/http/RequestHandler'
import { UserDoc } from '@@/migrate/schemas/user'
import User from '@@/migrate/models/user'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'

interface IndexResponseBody {
  glueBoards: Array<{
    id: string
    name: string
    color: string
  }>
}

export default class GlueBoardController {
  public static index(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      const user = (await User.findById((req.user as UserDoc)._id, {
        _id: 0,
        glueBoards: 1
      })
        .lean()
        .populate({
          path: 'glueBoards',
          select: 'id category -_id'
        })) as UserDoc
      const glueBoards = user.glueBoards as GlueBoardDoc[]

      const responseBody: IndexResponseBody = {
        glueBoards: []
      }

      for (const glueBoard of glueBoards) {
        responseBody.glueBoards.push({
          id: glueBoard.id,
          name: glueBoard.category.name,
          color: glueBoard.category.color
        })
      }

      return res.status(200).json(responseBody)
    }
  }
}
