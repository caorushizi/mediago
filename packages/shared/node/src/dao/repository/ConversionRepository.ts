import { provide } from "@inversifyjs/binding-decorators";
import type { ConversionPagination } from "@mediago/shared-common";
import { inject, injectable } from "inversify";
import { i18n } from "../../i18n";
import TypeORM from "../../vendor/TypeORM";
import { Conversion } from "../entity/Conversion";

@injectable()
@provide()
export default class ConversionRepository {
  constructor(
    @inject(TypeORM)
    private readonly db: TypeORM,
  ) {}

  async findConversion(id: number) {
    const repository = this.db.manager.getRepository(Conversion);
    const conversion = await repository.findOneBy({ id });

    if (!conversion) {
      throw new Error(i18n.t("noTaskFound"));
    }

    return conversion;
  }

  async getConversions(pagination: ConversionPagination) {
    const { current = 0, pageSize = 50 } = pagination;

    const [items, count] = await this.db.manager.getRepository(Conversion).findAndCount({
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
    await this.db.manager.getRepository(Conversion).save(conversion);
  }

  async deleteConversion(id: number) {
    await this.db.manager.getRepository(Conversion).delete({ id });
  }
}
