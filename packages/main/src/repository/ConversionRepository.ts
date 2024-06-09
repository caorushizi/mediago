import { inject, injectable } from "inversify";
import { ConversionPagination } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import TypeORM from "../vendor/TypeORM.ts";
import { Conversion } from "../entity/Conversion.ts";

@injectable()
export default class ConversionRepository {
  constructor(
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM
  ) {}

  async getConversions(pagination: ConversionPagination) {
    const { current = 0, pageSize = 50 } = pagination;

    const [items, count] = await this.db.appDataSource
      .getRepository(Conversion)
      .findAndCount({
        order: {
          createdDate: "ASC",
        },
        skip: (current - 1) * pageSize,
        take: pageSize,
      });
    return {
      total: count,
      list: items,
    };
  }

  async addConversion(conversion: Conversion) {
    await this.db.appDataSource.getRepository(Conversion).save(conversion);
  }
}
