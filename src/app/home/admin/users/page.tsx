'use client'

import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterModal, type FilterValues } from '@/components/ui/FilterModal';
import { api } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { formatUsernameToProperName } from '@/utils/username-formatter';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Filter,
  Loader,
  Mail,
  Pencil,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  GraduationCap,
  BookOpen,
  Building,
} from 'lucide-react';

type UserListItem = {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
  professorProfile?: {
    id: number;
    nomeCompleto: string;
    cpf: string;
    telefone: string | null;
    telefoneInstitucional: string | null;
    emailInstitucional: string;
    matriculaSiape: string | null;
    regime: '20H' | '40H' | 'DE';
    departamentoId: number;
  } | null;
  studentProfile?: {
    id: number;
    nomeCompleto: string;
    matricula: string;
    cpf: string;
    cr: number;
    cursoId: number;
    telefone: string | null;
    emailInstitucional: string;
  } | null;
};

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { data: usersData, isLoading: loadingUsers } = api.user.getUsers.useQuery({});
  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false });
  const { data: cursos } = api.course.getCourses.useQuery({ includeStats: false });
  
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'professor' | 'student'>('all');

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleEditUser = (userId: number, role: string) => {
    router.push(`/home/admin/users/${userId}/edit`);
  };

  const handleInviteProfessor = () => {
    router.push('/home/admin/invite-professor');
  };

  // Filtrar usuários baseado nos filtros aplicados
  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    
    let filtered = usersData.users;
    
    // Filtro por role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }
    
    // Outros filtros
    if (filters.departamento) {
      filtered = filtered.filter(user => 
        user.professorProfile?.departamentoId.toString() === filters.departamento
      );
    }
    
    return filtered;
  }, [usersData?.users, selectedRole, filters]);

  // Calcular estatísticas
  const userStats = useMemo(() => {
    if (!usersData?.users) return { total: 0, admins: 0, professors: 0, students: 0 };
    
    return usersData.users.reduce(
      (acc, user) => {
        acc.total++;
        if (user.role === 'admin') acc.admins++;
        else if (user.role === 'professor') acc.professors++;
        else if (user.role === 'student') acc.students++;
        return acc;
      },
      { total: 0, admins: 0, professors: 0, students: 0 }
    );
  }, [usersData?.users]);

  // Column definitions for users table
  const colunasUsuarios: ColumnDef<UserListItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Usuário
        </div>
      ),
      accessorKey: 'username',
      cell: ({ row }) => {
        const user = row.original;
        const displayName = user.professorProfile?.nomeCompleto || 
                          user.studentProfile?.nomeCompleto || 
                          formatUsernameToProperName(user.username);
        
        return (
          <div>
            <span className="font-semibold text-base text-gray-900">
              {displayName}
            </span>
            <div className="text-xs text-muted-foreground">
              @{user.username}
            </div>
          </div>
        );
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: 'email',
      cell: ({ row }) => {
        const user = row.original;
        const institutionalEmail = user.professorProfile?.emailInstitucional || 
                                 user.studentProfile?.emailInstitucional;
        
        return (
          <div>
            <div className="text-sm">{user.email}</div>
            {institutionalEmail && institutionalEmail !== user.email && (
              <div className="text-xs text-muted-foreground">
                {institutionalEmail}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Papel',
      accessorKey: 'role',
      cell: ({ row }) => {
        const role = row.original.role;
        const roleConfig = {
          admin: { label: 'Administrador', variant: 'default' as const, icon: UserCheck },
          professor: { label: 'Professor', variant: 'secondary' as const, icon: GraduationCap },
          student: { label: 'Estudante', variant: 'outline' as const, icon: BookOpen },
        };
        
        const config = roleConfig[role];
        const Icon = config.icon;
        
        return (
          <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Informações Adicionais',
      cell: ({ row }) => {
        const user = row.original;
        
        if (user.role === 'professor' && user.professorProfile) {
          const dept = departamentos?.find(d => d.id === user.professorProfile?.departamentoId);
          return (
            <div className="text-sm">
              <div>Regime: {user.professorProfile.regime}</div>
              <div className="text-xs text-muted-foreground">
                {dept?.nome || 'Depto. não encontrado'}
              </div>
              {user.professorProfile.matriculaSiape && (
                <div className="text-xs text-muted-foreground">
                  SIAPE: {user.professorProfile.matriculaSiape}
                </div>
              )}
            </div>
          );
        }
        
        if (user.role === 'student' && user.studentProfile) {
          const curso = cursos?.find(c => c.id === user.studentProfile?.cursoId);
          return (
            <div className="text-sm">
              <div>Matrícula: {user.studentProfile.matricula}</div>
              <div className="text-xs text-muted-foreground">
                CR: {user.studentProfile.cr.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {curso?.nome || 'Curso não encontrado'}
              </div>
            </div>
          );
        }
        
        return <span className="text-muted-foreground">-</span>;
      },
    },
    {
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditUser(row.original.id, row.original.role)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      ),
    },
  ];

  // Action buttons
  const dashboardActions = (
    <>
      <Button
        variant="outline"
        onClick={handleInviteProfessor}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Convidar Professor
      </Button>
      <Button
        variant="outline"
        onClick={() => setFilterModalOpen(true)}
      >
        <Filter className="w-4 h-4 mr-1" />
        Filtros
      </Button>
    </>
  );

  return (
    <PagesLayout title="Gerenciar Usuários" subtitle="Administração de usuários do sistema" actions={dashboardActions}>
      {loadingUsers ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando usuários...</span>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-700">
                  {userStats.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  Usuários cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Professores
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {userStats.professors}
                </div>
                <p className="text-xs text-muted-foreground">
                  Professores ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Estudantes
                </CardTitle>
                <BookOpen className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {userStats.students}
                </div>
                <p className="text-xs text-muted-foreground">
                  Estudantes matriculados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Administradores
                </CardTitle>
                <UserCheck className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {userStats.admins}
                </div>
                <p className="text-xs text-muted-foreground">
                  Administradores do sistema
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            {[
              { id: 'all', label: 'Todos os Usuários', count: userStats.total },
              { id: 'professor', label: 'Professores', count: userStats.professors },
              { id: 'student', label: 'Estudantes', count: userStats.students },
              { id: 'admin', label: 'Administradores', count: userStats.admins },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRole(tab.id as 'all' | 'admin' | 'professor' | 'student')}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  selectedRole === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <TableComponent
            columns={colunasUsuarios}
            data={filteredUsers || []}
          />
        </>
      )}

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="admin"
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </PagesLayout>
  );
}