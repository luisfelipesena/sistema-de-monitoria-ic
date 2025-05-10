export interface FileListItem {
  objectName: string;
  size: number;
  lastModified: Date;
  metaData?: Record<string, string>;
  originalFilename?: string;
  mimeType?: string;
}

export interface PresignedUrlResponse {
  url: string;
  fileName: string;
  mimeType: string;
}

export interface UploadCompletionData {
  fileId: string;
  fileName: string;
} 