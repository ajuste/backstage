import { Entity, CompoundEntityRef } from '@backstage/catalog-model';
import { getPillarForEntity } from './githubEntityProvider';
import { getVoidLogger } from '@backstage/backend-common';


describe('githubEntityProvider', () => {
  describe('getPillarForEntity', () => {
    it('should return the correct pillar for a given entity', async () => {
      const entityRef: CompoundEntityRef = { kind: 'Component', namespace: 'default', name: 'test-entity' };
      const mockCatalogClient = {
        getEntityByRef: jest.fn(),
      };
      mockCatalogClient.getEntityByRef.mockImplementation(async () =>
        Promise.resolve({
          metadata: {
            name: 'test-entity',
            annotations: {
              'zerofox.com/pillar': 'test-pillar'
            } as Record<string, string>,
          },
          spec: {}
        } as Entity));

      const pillar = await getPillarForEntity(entityRef, mockCatalogClient as any, getVoidLogger());

      expect(mockCatalogClient.getEntityByRef).toHaveBeenCalledWith(entityRef);
      expect(pillar).toBe('test-pillar');
    });
  });
});