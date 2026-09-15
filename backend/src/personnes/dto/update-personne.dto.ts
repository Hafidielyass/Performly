import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonneDto } from './create-personne.dto';

export class UpdatePersonneDto extends PartialType(CreatePersonneDto) {}
