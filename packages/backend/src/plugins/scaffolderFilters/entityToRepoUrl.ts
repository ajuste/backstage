import { JsonValue } from "@backstage/types";
import { guessRepository } from "@internal/plugin-zf-tech-insights-backend";

export default (str: JsonValue | null): string | undefined => {
    if (typeof str === 'object' && str !== null) {
        const slug = guessRepository(str as any);
        if (!slug) {
            return undefined;
        }
        const [org, repo] = slug.split('/');
        return slug && org && repo ? `github.com?repo=${repo}&owner=${org}` : undefined;
    }
    return undefined;
}

