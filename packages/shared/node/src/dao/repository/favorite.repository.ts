import { provide } from "@inversifyjs/binding-decorators";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import TypeORM from "../../vendor/TypeORM";
import { Favorite } from "../entity/favorite.entity";

@injectable()
@provide()
export default class FavoriteRepository {
  private get repository(): Repository<Favorite> {
    return this.db.manager.getRepository(Favorite);
  }

  constructor(
    @inject(TypeORM)
    private readonly db: TypeORM,
  ) {}

  // Create operations
  async create(data: Omit<Favorite, "id" | "createdDate">): Promise<Favorite> {
    const item = this.repository.create({
      title: data.title,
      url: data.url,
      icon: data.icon,
    });
    return await this.repository.save(item);
  }

  async createMany(
    favorites: Omit<Favorite, "id" | "createdDate">[],
  ): Promise<Favorite[]> {
    const items = favorites.map((favorite) =>
      this.repository.create({
        title: favorite.title,
        url: favorite.url,
        icon: favorite.icon,
      }),
    );
    return await this.repository.save(items);
  }

  // Read operations
  async findById(id: number): Promise<Favorite | null> {
    return await this.repository.findOneBy({ id });
  }

  async findByUrl(url: string): Promise<Favorite | null> {
    return await this.repository.findOneBy({ url });
  }

  async findAll(order: "ASC" | "DESC" = "DESC"): Promise<Favorite[]> {
    return await this.repository.find({
      order: {
        createdDate: order,
      },
    });
  }

  // Delete operations
  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteMany(ids: number[]): Promise<void> {
    await this.repository.delete(ids);
  }
}
