import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Term } from './terms.model';
import { CreateTermDto } from './dto/create-term.dto';
import { User } from 'src/users/user.model';

@Injectable()
export class TermsService {
  constructor(
    @Inject('TermRepository')
    private readonly termModel: typeof Term,
  ) {}
  async findAll(): Promise<Term[]> {
    return this.termModel.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
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
    const [_, [updatedTerm]] = await this.termModel.update(
      { ...term },
      { where: { id }, returning: true },
    );
    return updatedTerm;
  }
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.termModel.destroy({ where: { id } });
  }
}
