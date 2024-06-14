import { Config } from '@backstage/config';
import { S3ClientGetter } from '../types';
import { S3Object } from 'backstage-plugin-zf-tech-insights-common';

export const newId = (): number => Math.round(Math.random() * 100000000)

/**
 * Get the label for a score
 * @param score The score
 * @returns The label
 */
export const getLabelForScore = (score: number): string => {
    if (score == null) {
        return "failure";
    } else {
        if (score < 30) {
            return "failure";
        } else if (score < 80) {
            return "almost-failure";
        } else {
            return "success";
        }
    }
}

/**
 * List all entries in the S3 bucket
 * @param config The config object
 * @returns The list of objects
 */
export const listEntries = async (getS3Client: S3ClientGetter, config: Config): Promise<S3Object[]> => {
    const client = getS3Client(config);
    const listResults = ["system", "component", "api"].map(async (kind) => {
        const listArgs = {
            bucket: `${config.getOptionalString('env')}-backstage`,
            prefix: `service_assessment/default/${kind}/`,
        };
        return client.listObjects(listArgs)
    })
    const results = (await Promise.all(listResults))
        .map((result) => result.objects ?? [])
        .flat()
        .filter((object) => object.key?.endsWith(".json"))
    return results
}

/**
 * Get an entry from the S3 bucket
 * @param config The config object
 * @param key The key of the object to get
 * @returns The object
 */
export const getEntry = async (getS3Client: S3ClientGetter, config: Config, key: string): Promise<string> => {
    const client = getS3Client(config);
    const getArgs = {
        bucket: `${config.getOptionalString('env')}-backstage`,
        key: key,
    }
    return await client.getObject(getArgs)
}

/**
 * Helper function to convert a ReadableStream to a string
 * @param stream The readable stream
 * @returns The string representation of the stream
 */
export const streamToString = async (stream: any) => {
    const chunks = [];
    for await (let chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Get all entries from the S3 bucket
 * @param config The config object
 * @param keys The keys of the objects to get
 * @returns The objects
 */
export const getEntries = async (getS3Client: S3ClientGetter, config: Config, keys: string[]): Promise<object[]> => {
    const results = [];
    for (let i = 0; i < keys.length; i += 30) {
        const batch = keys.slice(i, i + 30);
        const batchResults = await Promise.all(batch.map(key => getEntry(getS3Client, config, key)));
        debugger
        results.push(...batchResults
            .map(result => JSON.parse(result ?? "{}")));
    }
    return results;
}


