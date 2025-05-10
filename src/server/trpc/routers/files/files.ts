import { createTRPCRouter } from '@/server/trpc/init'
import { deleteFileRouter } from '@/server/trpc/routers/files/delete'
import { listFilesRouter } from '@/server/trpc/routers/files/list'
import { presignedUrlRouter } from '@/server/trpc/routers/files/pressigned-url'
import { uploadFileRouter } from '@/server/trpc/routers/files/upload'
export const filesRouter = createTRPCRouter({
  list: listFilesRouter,
  delete: deleteFileRouter,
  presignedUrl: presignedUrlRouter,
  upload: uploadFileRouter,
}) 