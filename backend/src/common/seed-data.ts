import { EnrollmentRecord, Event, PasswordResetRequest, User } from './domain.types'
import { hashPasswordSync } from './password'

export interface SeedState {
  users: User[]
  events: Event[]
  enrollments: EnrollmentRecord[]
  passwordResets: PasswordResetRequest[]
}

export function createSeedState(): SeedState {
  return {
    users: [
      {
        id: 'admin-001',
        name: 'Admin Sistema',
        email: 'admin@test.com',
        password: hashPasswordSync('admin123'),
        dob: '1990-01-01',
        role: 'admin',
      },
      {
        id: 'user-001',
        name: 'João Silva',
        email: 'joao@test.com',
        password: hashPasswordSync('senha123'),
        dob: '1995-05-15',
        role: 'user',
      },
      {
        id: 'user-002',
        name: 'Maria Santos',
        email: 'maria@test.com',
        password: hashPasswordSync('senha123'),
        dob: '1998-03-20',
        role: 'user',
      },
    ],
    events: [
      {
        id: 'event-001',
        title: 'Workshop de React Avançado',
        description: 'Workshop aprofundado sobre React hooks, context API e otimização de performance em aplicações modernas.',
        category: 'Tecnologia',
        date: '2026-09-15',
        time: '14:00',
        location: 'Auditório A',
        capacity: 100,
        currentEnrollments: 0,
        status: 'active',
        createdBy: 'admin-001',
      },
      {
        id: 'event-002',
        title: 'Typescript para Iniciantes',
        description: 'Aprenda os fundamentos de TypeScript e como usá-lo em seus projetos React.',
        category: 'Tecnologia',
        date: '2026-09-22',
        time: '10:00',
        location: 'Sala 101',
        capacity: 50,
        currentEnrollments: 0,
        status: 'active',
        createdBy: 'admin-001',
      },
      {
        id: 'event-003',
        title: 'DevOps na Prática',
        description: 'Descubra como implementar DevOps em sua organização com ferramentas modernas.',
        category: 'Tecnologia',
        date: '2026-09-28',
        time: '15:30',
        location: 'Auditório B',
        capacity: 80,
        currentEnrollments: 0,
        status: 'active',
        createdBy: 'admin-001',
      },
    ],
    enrollments: [],
    passwordResets: [],
  }
}
