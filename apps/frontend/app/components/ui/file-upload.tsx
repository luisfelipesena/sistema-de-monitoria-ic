'use client';

import { cn } from '@/lib/utils';
import { UploadIcon } from '@radix-ui/react-icons';
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from './card';

export interface FileUploadProps {
  onDrop?: (acceptedFiles: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  uploadIconClassName?: string;
  textClassName?: string;
  hintClassName?: string;
}

export function FileUpload({
  onDrop,
  accept,
  maxFiles = 1,
  maxSize,
  disabled = false,
  className,
  uploadIconClassName,
  textClassName,
  hintClassName,
  ...props
}: FileUploadProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'>) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (onDrop) {
        onDrop(acceptedFiles);
      }
    },
    [onDrop],
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop: handleDrop,
      accept,
      maxFiles,
      maxSize,
      disabled,
    });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        'border-dashed cursor-pointer transition-colors',
        isDragActive
          ? 'border-primary bg-muted/50'
          : 'border-muted-foreground/20 hover:border-muted-foreground/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <CardContent className="flex flex-col items-center justify-center gap-4 py-8 px-4 text-center">
        <input {...getInputProps()} />
        <UploadIcon
          className={cn('h-12 w-12 text-muted-foreground', uploadIconClassName)}
        />
        <div>
          <p className={cn('text-sm font-medium', textClassName)}>
            {isDragActive
              ? 'Solte os arquivos aqui'
              : 'Arraste e solte arquivos aqui ou clique para selecionar'}
          </p>
          <p
            className={cn('text-xs text-muted-foreground mt-1', hintClassName)}
          >
            {acceptedFiles.length > 0
              ? `${acceptedFiles.length} arquivo${acceptedFiles.length > 1 ? 's' : ''} selecionado${acceptedFiles.length > 1 ? 's' : ''}`
              : `Máximo de ${maxFiles} arquivo${maxFiles > 1 ? 's' : ''}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
