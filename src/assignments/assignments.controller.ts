import { Controller, Get } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly svc: AssignmentsService) {}

  @Get()
  list() {
    return this.svc.list();
  }
}
