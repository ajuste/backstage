import { Entity } from "@backstage/catalog-model";

export function guessRepository(entity: Entity): string | undefined{
  let repo = entity.metadata.annotations?.['github.com/project-slug'];
  if (!repo) {
    const regex =  /url:https:\/\/github\.com\/([^\/]+\/[^\/]+)\//;
    const sourceLocation = entity.metadata?.annotations?.['backstage.io/source-location'];
    if (!sourceLocation) {
      return undefined;
    }
    const match = sourceLocation.match(regex);
    if (match && match[1]) {
      repo = match[1];
    }
  }
  return repo
}