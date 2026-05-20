import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import * as React from 'react';

export interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  dropMessage?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      dropMessage = 'Arraste e solte arquivos aqui ou clique para selecionar',
      ...props
    },
    ref,
  ) => {
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    }, []);

    const handleDrop = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0] && inputRef.current) {
        inputRef.current.files = e.dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    }, []);

    const handleClick = React.useCallback(() => {
      inputRef.current?.click();
    }, []);

    return (
      <div
        className={cn(
          'relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-white p-4 text-slate-500 transition-colors',
          dragActive && 'border-primary bg-primary/5',
          className,
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={(node) => {
            // Handles both forwardRef and local ref
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            inputRef.current = node;
          }}
          className="absolute h-full w-full cursor-pointer opacity-0"
          type="file"
          {...props}
        />
        <Upload className="mb-2 h-10 w-10 text-slate-400" />
        <p className="mb-2 text-sm font-medium">{dropMessage}</p>
      </div>
    );
  },
);
FileInput.displayName = 'FileInput';

export { FileInput };
