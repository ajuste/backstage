import { OwnershipFactRetriever, getOwnershipFactRetriever } from './ownershipFactRetriever';
import { FactRetrieverContext } from '@backstage-community/plugin-tech-insights-node';

jest.mock('@backstage/catalog-client');

describe('OwnershipFactRetriever', () => {
  let context: FactRetrieverContext;

  it('should get full ownership level', () => {
    const retriever = new OwnershipFactRetriever(context);
    const entity = {
      apiVersion: '1.0.0',
      kind: 'Component',
      metadata: {
        name: 'test',
        annotations: {
          'zerofox.com/pillar': 'test-pillar',
        },
      },
      relations: [
        {
          type: 'ownedBy',
          target: {
            kind: 'user',
            namespace: 'default',
            name: 'test-user',
          },
        },
        {
          type: 'ownedBy',
          target: {
            kind: 'group',
            namespace: 'default',
            name: 'team-test',
          },
        } as any,
      ],
    };
    const level = retriever.getOwnershipLevel(entity);

    expect(level).toEqual('full');
  });

  it('should get no-user-owner ownership level', () => {
    const retriever = new OwnershipFactRetriever(context);
    const entity = {
      apiVersion: '1.0.0',
      kind: 'Component',
      metadata: {
        name: 'test',
        annotations: {
          'zerofox.com/pillar': 'test-pillar',
        },
      },
      relations: [
        {
          type: 'ownedBy',
          target: {
            kind: 'group',
            namespace: 'default',
            name: 'team-test',
          },
        } as any,
      ],
    };
    const level = retriever.getOwnershipLevel(entity);

    expect(level).toEqual('no-user-owner');
  });

  it('should get no-team-owner ownership level', () => {
    const retriever = new OwnershipFactRetriever(context);
    const entity = {
      apiVersion: '1.0.0',
      kind: 'Component',
      metadata: {
        name: 'test',
        annotations: {
          'zerofox.com/pillar': 'test-pillar',
        },
      },
      relations: [
        {
          type: 'ownedBy',
          target: {
            kind: 'user',
            namespace: 'default',
            name: 'test-user',
          },
        } as any,
      ],
    };
    const level = retriever.getOwnershipLevel(entity);

    expect(level).toEqual('no-team-owner');
  });

  it('should get no-pillar ownership level', () => {
    const retriever = new OwnershipFactRetriever(context);
    const entity = {
      apiVersion: '1.0.0',
      kind: 'Component',
      metadata: {
        name: 'test',
        annotations: {},
      },
      relations: [
        {
          type: 'ownedBy',
          target: {
            kind: 'user',
            namespace: 'default',
            name: 'test-user',
          },
        } as any,
      ],
    };
    const level = retriever.getOwnershipLevel(entity);

    expect(level).toEqual('no-pillar');
  });

  it('should get no-owner ownership level', () => {
    const retriever = new OwnershipFactRetriever(context);
    const entity = {
      apiVersion: '1.0.0',
      kind: 'Component',
      metadata: {
        name: 'test',
        annotations: {},
      },
      relations: [],
    };
    const level = retriever.getOwnershipLevel(entity);

    expect(level).toEqual('no-owner');
  });

  it('should get no-owner ownership level for empty entity', () => {
    const retriever = new OwnershipFactRetriever(context);
    const entity = {
      apiVersion: '1.0.0',
      kind: 'Component',
      metadata: {
        name: 'test',
      },
      relations: [
        {
          type: 'ownedBy',
        } as any,
      ],
    };
    const level = retriever.getOwnershipLevel(entity);

    expect(level).toEqual('no-owner');
  });
});

describe('getOwnershipFactRetriever', () => {
  it('should return ownershipFactRetriever', () => {
    const factRetriever = getOwnershipFactRetriever();

    expect(factRetriever.id).toEqual('ownershipFactRetriever');
    expect(factRetriever.version).toEqual('0.0.1');
    expect(factRetriever.title).toEqual('Entity Ownership');
    expect(factRetriever.description).toEqual('Generates ownership level facts for entities');
  });
});