import { createApiRoutes as initializeRagAiBackend } from '@roadiehq/rag-ai-backend';
import { PluginEnvironment } from '../types';
import { initializeOpenAiEmbeddings } from '@roadiehq/rag-ai-backend-embeddings-openai';
import { createRoadiePgVectorStore } from '@roadiehq/rag-ai-storage-pgvector';
import { createDefaultRetrievalPipeline } from '@roadiehq/rag-ai-backend-retrieval-augmenter';
import { OpenAI } from '@langchain/openai';
import { CatalogClient } from '@backstage/catalog-client';

export default async function createPlugin({
  logger,
  database,
  discovery,
  config,
  tokenManager,
}: PluginEnvironment) {
  const catalogApi = new CatalogClient({
    discoveryApi: discovery,
  });

  const vectorStore = await createRoadiePgVectorStore({ logger, database, config });
  const augmentationIndexer = await initializeOpenAiEmbeddings({
    logger,
    catalogApi,
    vectorStore,
    discovery,
    config,
    tokenManager,
  });

  const model = new OpenAI();
  const ragAi = await initializeRagAiBackend({
    logger,
    tokenManager,
    augmentationIndexer,
    retrievalPipeline: createDefaultRetrievalPipeline({
      discovery,
      logger,
      vectorStore: augmentationIndexer.vectorStore,
      tokenManager,
    }),
    model,
    config,
  });

  return ragAi.router;
}