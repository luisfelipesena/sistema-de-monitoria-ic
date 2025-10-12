import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CursoListItem } from "@/types";

interface CourseDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  curso: CursoListItem | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CourseDeleteDialog({
  isOpen,
  onOpenChange,
  curso,
  onConfirm,
  isLoading = false,
}: CourseDeleteDialogProps) {
  if (!curso) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o curso <strong>{curso.nome}</strong>?
            Esta ação não pode ser desfeita e removerá todas as associações do curso.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}