import { JsonValue } from "@backstage/types";

export default (str: JsonValue | null): JsonValue | null => {
    if (typeof str === 'object' && str !== null) {
        const entity = str as any;
        const slug = entity.metadata?.annotations?.['github.com/project-slug'];
        return slug ? `github.com/${slug}` : null;

    }
    return null
}