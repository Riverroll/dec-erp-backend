import { PrismaService } from '../../prisma/prisma.service';
import { BaseQueryDto } from '../dto/base-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Generic paginated findAll with search, sort, soft-delete filter.
   * Pass the Prisma delegate (e.g. this.prisma.user) as `model`.
   */
  protected async findAllPaginated<T>(
    model: any,
    params: BaseQueryDto,
    searchFields: string[] = [],
    extraWhere: Record<string, any> = {},
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20, search, sortBy = 'created_at', sortOrder = 'DESC' } = params;
    const skip = (page - 1) * limit;

    const where: any = { flag: 1, ...extraWhere };

    if (search && searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: { contains: search }, // SQLite: case-insensitive by default for ASCII
      }));
    }

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
      }),
      model.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  protected async softDelete(model: any, id: number): Promise<void> {
    await model.update({
      where: { id },
      data: { flag: 2 },
    });
  }
}
