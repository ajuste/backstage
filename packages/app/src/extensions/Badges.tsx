import {
    createPlugin,
    createApiExtension,
} from '@backstage/frontend-plugin-api';
import { badgesPlugin } from '@backstage-community/plugin-badges';

const badgesApiFactory = Array.from(badgesPlugin.getApis())[0];

const apiExtension = createApiExtension({
    factory: badgesApiFactory,
});

export default createPlugin({
    id: 'badges',
    extensions: [apiExtension,],
});
