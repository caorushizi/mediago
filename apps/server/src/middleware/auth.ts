import { provide } from "@inversifyjs/binding-decorators";
import { injectable } from "inversify";

@injectable()
@provide()
export default class AuthMiddleware {}
