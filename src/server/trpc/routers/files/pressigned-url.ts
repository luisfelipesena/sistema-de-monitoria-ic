import minioClient, { bucketName } from "@/server/lib/minio";
import { createTRPCRouter, privateProcedure } from "@/server/trpc/init";
import { z } from "zod";

const urlBodySchema = z.object({
  objectName: z.string().min(1, "Nome do objeto é obrigatório"),
});

export const presignedUrlRouter = createTRPCRouter({
  get: privateProcedure
    .input(urlBodySchema)
    .mutation(async ({ input }) => {
      try {
        const { objectName } = input;

        const stat = await minioClient.statObject(bucketName, objectName);
        const originalFilename = stat.metaData["original-filename"] || objectName.split("/").pop();
        const mimeType = stat.metaData["content-type"] || "application/octet-stream";

        const url = await minioClient.presignedGetObject(bucketName, objectName, 60 * 60);

        return {
          url,
          fileName: originalFilename,
          mimeType,
        };
      } catch (error) {
        if (error instanceof Error && (error.message.includes("NoSuchKey") || (error as any).code === "NoSuchKey")) {
          throw new Error("Arquivo não encontrado no bucket");
        }
        throw new Error("Erro interno do servidor ao gerar URL");
      }
    }),
});
