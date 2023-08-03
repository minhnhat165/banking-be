import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Term } from './terms.model';
import { CreateTermDto } from './dto/create-term.dto';
import { User } from 'src/users/user.model';
import { PaginationParams } from 'src/common/dto/paginationParams';
import { Pagination } from 'src/common/dto/pagination';
import { InterestRatesService } from 'src/interest-rates/interest-rates.service';

@Injectable()
export class TermsService {
  constructor(
    @Inject('TermRepository')
    private readonly termModel: typeof Term,
    private readonly interestRateService: InterestRatesService,
  ) {}
  async findAll(paginationParams: PaginationParams): Promise<Pagination<Term>> {
    const { page = 0, limit = 10, ...filter } = paginationParams;
    const { rows, count } = await this.termModel.findAndCountAll({
      offset: page * limit,
      limit,
      where: filter,
      order: [['id', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
        },
      ],
    });
    return {
      items: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    };
  }
  async findOne(id: number): Promise<Term> {
    const existingTerm = await this.termModel.findByPk(id);
    if (!existingTerm) {
      throw new NotFoundException(`Term with id ${id} not found`);
    }
    return existingTerm;
  }
  async create(term: CreateTermDto, userId: number): Promise<Term> {
    const newTerm = new Term();
    newTerm.name = term.name;
    newTerm.description = term.description;
    newTerm.createdBy = userId;
    newTerm.value = term.value;
    newTerm.createdDate = new Date();
    return newTerm.save();
  }
  async update(id: number, term: Partial<CreateTermDto>): Promise<Term> {
    await this.findOne(id);
    const filter = { termId: id };
    if (term.value) {
      const existingInterestRate = await this.interestRateService.findAll(
        filter,
      );
      if (existingInterestRate.items.length > 0) {
        throw new ForbiddenException(
          `Term with id ${id} has interest rates. Cannot update value`,
        );
      }
    }
    const [_, [updatedTerm]] = await this.termModel.update(
      { ...term },
      { where: { id }, returning: true },
    );
    return updatedTerm;
  }
  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.termModel.destroy({ where: { id } });
    } catch (error) {
      throw new ForbiddenException(
        `Term with id ${id} has interest rates. Cannot delete`,
      );
    }
  }
}
