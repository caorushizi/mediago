import { provide } from "@inversifyjs/binding-decorators";
import type { ConversionPagination } from "@mediago/shared-common";
import { inject, injectable } from "inversify";
import type { Conversion } from "../dao/entity/conversion.entity";
import ConversionRepository from "../dao/repository/conversion.repository";
import { TYPES } from "../types";

@injectable()
@provide(TYPES.ConversionService)
export class ConversionService {
  constructor(
    @inject(ConversionRepository)
    private readonly conversionRepository: ConversionRepository,
  ) {}

  async getConversions(pagination: ConversionPagination) {
    const result =
      await this.conversionRepository.findWithPagination(pagination);
    return {
      total: result.total,
      list: result.items,
    };
  }

  async addConversion(conversion: Omit<Conversion, "id" | "createdDate">) {
    return await this.conversionRepository.create(conversion);
  }

  async deleteConversion(id: number) {
    return await this.conversionRepository.delete(id);
  }

  async findByIdOrFail(id: number) {
    return await this.conversionRepository.findByIdOrFail(id);
  }
}
