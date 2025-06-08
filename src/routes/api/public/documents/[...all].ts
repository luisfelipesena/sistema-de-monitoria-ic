import minioClient, { bucketName } from '@/server/lib/minio';
import { logger } from '@/utils/logger';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { Stream } from 'stream';

const log = logger.child({ context: 'PublicFileAccess' });

export const APIRoute = createAPIFileRoute('/api/public/documents/[/all]')({
  GET: async ({ params }) => {
    const allParam = (params as Record<string, string | string[]>)['all'];
    const filePath = Array.isArray(allParam) ? allParam.join('/') : allParam;

    if (!filePath) {
      return new Response('File path not provided', { status: 400 });
    }

    try {
      const stat = await minioClient.statObject(bucketName, filePath);
      const stream = await minioClient.getObject(bucketName, filePath);

      const responseHeaders = new Headers({
        'Content-Type':
          stat.metaData['content-type'] || 'application/octet-stream',
        'Content-Length': stat.size.toString(),
        'Last-Modified': stat.lastModified.toUTCString(),
        ETag: stat.etag,
      });

      if (stat.metaData['original-filename']) {
        responseHeaders.set(
          'Content-Disposition',
          `inline; filename="${stat.metaData['original-filename']}"`,
        );
      }

      // Convert Node.js stream to Web API stream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });

      return new Response(webStream, {
        headers: responseHeaders,
        status: 200,
      });
    } catch (error) {
      log.error(error, `Failed to get public file: ${filePath}`);
      if (
        error instanceof Error &&
        (error.message.includes('NoSuchKey') ||
          (error as any).code === 'NoSuchKey')
      ) {
        return new Response('File not found', { status: 404 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }
  },
}); 