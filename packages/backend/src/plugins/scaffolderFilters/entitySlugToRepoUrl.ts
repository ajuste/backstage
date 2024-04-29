import { JsonValue } from "@backstage/types";

export default (str: JsonValue | null): JsonValue | null => {
    if (typeof str === 'object' && str !== null) {
        const entity = str as any;
        const slug = entity.metadata?.annotations?.['github.com/project-slug'];
        const [org, repo] = slug.split('/');
        return slug && org && repo ? `github.com?repo=${repo}&owner=${org}` : null;

    }
    return null
}