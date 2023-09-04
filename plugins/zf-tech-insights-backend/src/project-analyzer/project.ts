import * as fs from 'fs';
import * as Path from 'path';

import { Analyzer, AnalysisMatch } from "./analyzer";
import { TerraformVersionAnalyzer } from "./analyzerTerraformVersion";

/**
 * Maximum file size to analyze.
 */
const MAX_FILE_SIZE = 40 * 1024;  // 40KB

/**
 * Default analyzers to use.
 */
const DEFAULT_ANALYZERS: Analyzer[] = [
    new TerraformVersionAnalyzer()
];

/**
 * Paths that should be excluded from the analysis.
 */
const EXCLUDED_PATHS = [
    "vendor",
    "node_modules",
]

/**
 * Result of the project analysis.
 */
export type ProjectAnalysisResult = {
    matches: Array<AnalysisMatch>;
}

/**
 * Represents a project.
 */
export class Project {
    path: string;
    analyzers: Array<Analyzer>;

    constructor(path: string, analyzers: Array<Analyzer> = DEFAULT_ANALYZERS) {
        this.path = path;
        this.analyzers = analyzers;
    };

    /**
     * 
     * @param path Path to read content from. 
     * @returns Map where key is the path and value the content of the file.
     */
    readDirectoryContent(path: string, baseDir: string): { [key: string]: string } {
        const result: { [key: string]: string } = {};

        const items = fs.readdirSync(path);
        if (!items) {
            return result;
        }

        for (const item of items) {
            const currentPath = Path.join(path, item);
            const stats = fs.statSync(currentPath);
            const relativePath = Path.relative(baseDir, currentPath);

            if (EXCLUDED_PATHS.includes(item) || EXCLUDED_PATHS.includes(item + "/")) {
                continue;
            }

            if (stats.isDirectory()) {
                const nestedContent = this.readDirectoryContent(currentPath, baseDir);
                for (const [key, value] of Object.entries(nestedContent)) {
                    result[key] = value;
                }
            } else if (stats.isFile() && stats.size <= MAX_FILE_SIZE) {
                const content = fs.readFileSync(currentPath, 'utf-8');
                result[relativePath] = content;
            }
        }

        return result;
    }

    /**
     * Analyzes the project.
     * @returns A promise that resolves to the analysis result.
     */
    async analyze(): Promise<ProjectAnalysisResult> {
        const result: ProjectAnalysisResult = {
            matches: []
        };

        const pathToContent = this.readDirectoryContent(this.path, this.path);
        for (const [path, content] of Object.entries(pathToContent)) {
            for (const analyzer of this.analyzers) {
                const analyzeResult = await analyzer.analyze(path, content);
                if (analyzeResult.matched) {
                    result.matches.push({
                        analyzer,
                        result: analyzeResult,
                        path
                    });
                }
            }
        }

        // build dict of matches by analyzer
        const dict = result.matches.reduce((acc, match) => {
            const key = match.analyzer.constructor.name;
            const arr = acc.get(key) || [];
            acc.set(key, [...arr, match]);
            return acc;
        }, new Map<string, AnalysisMatch[]>());

        const disambiguatedMatches: AnalysisMatch[] = [];
        for (const [_, matches] of dict.entries()) {
            let disambiguatedMatch: AnalysisMatch | null = null;
            if (matches.length > 1) {
                disambiguatedMatch = await matches[0].analyzer.disambiguate(matches)
            } else {
                disambiguatedMatch = matches[0];
            }
            if (disambiguatedMatch) {
                disambiguatedMatches.push(disambiguatedMatch);
            }
        }
        result.matches = disambiguatedMatches
        return result
    }

}