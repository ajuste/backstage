// packages/backend/src/processors/githubProcessor.ts
import { CatalogProcessor, CatalogProcessorEmit, processingResult } from '@backstage/plugin-catalog-node';

import { Entity, CompoundEntityRef } from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';

export class GithubProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'GithubProcessor';
  }

  // Run first
  async preProcessEntity(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
    originLocation: LocationSpec,
    cache: CatalogProcessorCache,
  ): Promise<Entity> {
    return entity;
  }

  // Run after preProcess
  async validateEntityKind(entity: Entity): Promise<boolean> {
    // Return true if entity kind and it's fields are valid
    // and can be processed by this processor. Return false if the entity 
    // cannot be processed with this processor. Throw error if the entity
    // is invalid.
    return true;
  }

  // Run after validateEntityKind
  async postProcessEntity(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
    // cache: CatalogProcessorCache,
  ): Promise<Entity> {
    // console.log('fff');
    // console.log(entity);
    return entity;
    if (entity.kind === 'Group') {
      if ('name' in entity.metadata) {
        let name = entity.metadata.name;
        console.log(name);
        if (name === 'team-configuration') {
          console.log(entity);
          console.log(processingResult);
          let source: CompoundEntityRef = {
              kind: entity.kind,
              namespace: entity.metadata.namespace,
              name: entity.metadata.name, 
          };
          let targetRef: CompoundEntityRef = {
              kind: 'System',
              namespace: entity.metadata.namespace,
              name: 'alert-content-service',
          };

          // Assuming Pillar team, make API call for team repos, then emit relations that they own those repos

          emit(
            processingResult.relation({ 
              "source": source,
              "type": "ownerOf",
              // "targetRef": "system:alert-content-service",
              "targetRef": targetRef,
            }),
          );
        }
      }
    }
    return entity;
  }
}
