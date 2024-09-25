import { inject, injectable } from "inversify";
import { ConversionPagination } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import TypeORM from "../vendor/TypeORM.ts";
import { Conversion } from "../entity/Conversion.ts";
import i18n from "../i18n/index.ts";

@injectable()
export default class ConversionRepository {
  constructor(
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
  ) {}

  async findConversion(id: number) {
    const repository = this.db.appDataSource.getRepository(Conversion);
    const conversion = await repository.findOneBy({ id });

    if (!conversion) {
      throw new Error(i18n.t("noTaskFound"));
    }

    return conversion;
  }

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

  async deleteConversion(id: number) {
    await this.db.appDataSource.getRepository(Conversion).delete({ id });
  }
}
