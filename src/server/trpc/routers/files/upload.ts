import minioClient, { bucketName } from "@/server/lib/minio";
import { createTRPCRouter, privateProcedure } from "@/server/trpc/init";
import { z } from "zod";

export const uploadFileRouter = createTRPCRouter({
  post: privateProcedure.input(z.object({
    file: z.instanceof(File),
  })).mutation(async ({ input }) => {
    const { file } = input;

    const fileBuffer = await file.arrayBuffer();
    const fileData = await minioClient.putObject(bucketName, file.name, Buffer.from(fileBuffer));

    return fileData;
  }),
});