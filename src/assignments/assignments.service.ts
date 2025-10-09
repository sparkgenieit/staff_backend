import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  // Minimal list for Live Shifts page
  list() {
    return this.prisma.assignment.findMany({
      select: {
        id: true,
        workOrderId: true,
        workerId: true,
        final: true,
        createdAt: true,
      },
      orderBy: { id: 'desc' },
    });
  }
}

