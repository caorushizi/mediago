import { provide } from "@inversifyjs/binding-decorators";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { i18n } from "../../i18n";
import type { ConversionPagination } from "@mediago/shared-common";
import TypeORM from "../../vendor/TypeORM";
import { Conversion } from "../entity/conversion.entity";

@injectable()
@provide()
export default class ConversionRepository {
  private get repository(): Repository<Conversion> {
    return this.db.manager.getRepository(Conversion);
  }

  constructor(
    @inject(TypeORM)
    private readonly db: TypeORM,
  ) {}

  // Create operations
  async create(
    data: Omit<Conversion, "id" | "createdDate">,
  ): Promise<Conversion> {
    const item = this.repository.create(data);
    return await this.repository.save(item);
  }

  async createMany(
    conversions: Omit<Conversion, "id" | "createdDate">[],
  ): Promise<Conversion[]> {
    const items = this.repository.create(conversions);
    return await this.repository.save(items);
  }

  // Read operations
  async findById(id: number): Promise<Conversion | null> {
    return await this.repository.findOneBy({ id });
  }

  async findByIdOrFail(id: number): Promise<Conversion> {
    const conversion = await this.findById(id);
    if (!conversion) {
      throw new Error(i18n.t("noTaskFound"));
    }
    return conversion;
  }

  async findAll(order: "ASC" | "DESC" = "ASC"): Promise<Conversion[]> {
    return await this.repository.find({
      order: {
        createdDate: order,
      },
    });
  }

  async findWithPagination(pagination: ConversionPagination) {
    const { current = 1, pageSize = 50 } = pagination;

    const [items, total] = await this.repository.findAndCount({
      order: {
        createdDate: "ASC",
      },
      skip: (current - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      total,
      current,
      pageSize,
    };
  }

  // Delete operations
  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteMany(ids: number[]): Promise<void> {
    await this.repository.delete(ids);
  }
}
