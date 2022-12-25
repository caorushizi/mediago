import { Session, session } from 'electron'
import { Sessions } from '../utils/variables'
import { injectable } from 'inversify'
import { SessionService } from '../interfaces'

@injectable()
export default class SessionServiceImpl implements SessionService {
  partition = Sessions.PERSIST_MEDIAGO
  session: Session

  constructor () {
    this.session = session.fromPartition(this.partition)
  }

  get (): Session {
    return this.session
  }
}
