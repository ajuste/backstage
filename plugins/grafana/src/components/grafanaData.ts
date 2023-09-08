import { Entity } from '@backstage/catalog-model';

export const ZEROFOX_PILLAR = 'zerofox.com/pillar';

export const isDashboardSelectorAvailable = (entity: Entity): boolean => !!entity?.metadata.annotations?.[ZEROFOX_PILLAR]
export const isAlertSelectorAvailable = () => false

export const dashboardSelectorFromEntity = (entity: Entity) => {
    switch (entity.kind) {
        case 'Component':
            if (entity?.metadata.annotations?.[ZEROFOX_PILLAR]) {
                return entity?.spec?.type === 'pillar' ? `pillar:${entity?.metadata.annotations?.[ZEROFOX_PILLAR].toLowerCase()}` : `service:${entity?.metadata.annotations?.[ZEROFOX_PILLAR].toLowerCase()}`;
            }
            return '';
        case 'System':
            return entity?.metadata?.name ? `service:${entity?.metadata?.name.toLowerCase()}` : '';
        default:
            return '';
    }
}
export const alertSelectorFromEntity = dashboardSelectorFromEntity

// @deprecated Use dashboardSelectorFromEntity instead
export const tagSelectorFromEntity = dashboardSelectorFromEntity;