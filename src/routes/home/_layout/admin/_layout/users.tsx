import { PagesLayout } from '@/components/layout/PagesLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useDeleteUser, useUpdateUserRole, useUsers } from '@/hooks/use-user';
import { userRoleEnum } from '@/server/database/schema';
import { logger } from '@/utils/logger';
import { createFileRoute } from '@tanstack/react-router';
import { Info, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

const log = logger.child({
  context: 'admin-users',
});

export const Route = createFileRoute('/home/_layout/admin/_layout/users')({
  component: UsersPage,
});

const roleOptions = userRoleEnum.enumValues;

function UsersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user: me } = useAuth();
  const [currentUser, setCurrentUser] = useState<{
    id?: number;
    username: string;
    email: string;
    role: (typeof userRoleEnum.enumValues)[number];
  }>({
    username: '',
    email: '',
    role: '' as (typeof userRoleEnum.enumValues)[number],
  });
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const { data: users, isLoading } = useUsers();
  const updateUserRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const openDialog = (user?: any) => {
    if (user) {
      setIsEditing(true);
      setCurrentUser({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      setIsEditing(false);
      setCurrentUser({
        username: '',
        email: '',
        role: '' as (typeof userRoleEnum.enumValues)[number],
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setCurrentUser({
      username: '',
      email: '',
      role: '' as (typeof userRoleEnum.enumValues)[number],
    });
  };

  const openDeleteDialog = (userId: number) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentUser((prev) => ({
      ...prev,
      role: e.target.value as (typeof userRoleEnum.enumValues)[number],
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser.id) return;
    try {
      z.enum(roleOptions).parse(currentUser.role);
      updateUserRoleMutation.mutate(
        { userId: currentUser.id, data: { role: currentUser.role } },
        {
          onSuccess: () => {
            toast({
              title: 'Usuário atualizado',
              description: 'O papel do usuário foi atualizado com sucesso',
            });
            closeDialog();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro',
              description:
                error?.response?.data?.error || 'Erro ao atualizar o usuário',
              variant: 'destructive',
            });
          },
        },
      );
    } catch (error) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione um papel válido',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete, {
        onSuccess: () => {
          toast({
            title: 'Usuário removido',
            description: 'O usuário foi removido com sucesso',
          });
          closeDeleteDialog();
        },
        onError: (error: any) => {
          toast({
            title: 'Erro',
            description:
              error?.response?.data?.error || 'Erro ao remover o usuário',
            variant: 'destructive',
          });
        },
      });
    }
  };

  return (
    <PagesLayout
      title="Gerenciar Usuários"
      subtitle="Visualize, edite e remova usuários do sistema"
    >
      {isLoading ? (
        <div className="flex justify-center py-10">Carregando usuários...</div>
      ) : !users?.length ? (
        <div className="text-center py-20 border rounded-md bg-muted/20">
          <Info className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">Nenhum usuário cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Nenhum usuário foi encontrado no sistema.
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/10">
                  <TableCell className="font-mono text-sm">{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(user)}
                        disabled={
                          updateUserRoleMutation.isPending ||
                          deleteUserMutation.isPending
                        }
                      >
                        <Pencil size={16} className="mr-1" />
                        Editar Papel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(user.id)}
                        disabled={
                          deleteUserMutation.isPending ||
                          updateUserRoleMutation.isPending ||
                          user.id === me?.id
                        }
                      >
                        <Trash2 size={16} className="mr-1" />
                        Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de edição de papel */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Papel do Usuário</DialogTitle>
            <DialogDescription>
              Selecione o novo papel para o usuário{' '}
              <strong>{currentUser.username}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold">
                Papel
              </Label>
              <select
                id="role"
                name="role"
                value={currentUser.role}
                onChange={handleRoleChange}
                className="w-full border rounded px-2 py-2"
                required
              >
                <option value="" disabled>
                  Selecione um papel
                </option>
                {roleOptions.map((role) => (
                  <option key={role} value={role} className="capitalize">
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={updateUserRoleMutation.isPending}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUserRoleMutation.isPending}>
                {updateUserRoleMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 size={18} />
              Remover Usuário
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este usuário? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Ao remover um usuário, ele perderá acesso ao sistema imediatamente.
          </p>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleteUserMutation.isPending}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending
                ? 'Removendo...'
                : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
