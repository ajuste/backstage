import { AngularVersionAnalyzer, AngularVersionAnalyzeResult } from './analyzerAngularVersion';
import { AnalysisMatch } from './analyzer';

describe('AngularVersionAnalyzer', () => {
    const analyzer = new AngularVersionAnalyzer();

    describe('analyze', () => {
        it('should extract Angular version from valid package-lock.json', async () => {
            const content = JSON.stringify({
                dependencies: {
                    '@angular/core': {
                        version: '13.1.0'
                    }
                }
            });

            const result = await analyzer.analyze('package-lock.json', content);
            expect(result).toBeInstanceOf(AngularVersionAnalyzeResult);
            expect((result as AngularVersionAnalyzeResult).matched).toBe(true);
            expect((result as AngularVersionAnalyzeResult).angularVersion).toBe('13.1.0');
        });

        it('should return no match for non-package-lock files', async () => {
            const result = await analyzer.analyze('other-file.json', '{}');
            expect(result.matched).toBe(false);
        });

        it('should return no match for invalid JSON', async () => {
            const result = await analyzer.analyze('package-lock.json', '{invalid json}');
            expect(result.matched).toBe(false);
        });

        it('should return no match for empty content', async () => {
            const result = await analyzer.analyze('package-lock.json', '');
            expect(result.matched).toBe(false);
        });

        it('should return no match for null content', async () => {
            const result = await analyzer.analyze('package-lock.json', null as unknown as string);
            expect(result.matched).toBe(false);
        });

        it('should return no match when @angular/core is not found', async () => {
            const content = JSON.stringify({
                dependencies: {
                    'other-package': {
                        version: '1.0.0'
                    }
                }
            });

            const result = await analyzer.analyze('package-lock.json', content);
            expect(result.matched).toBe(false);
        });

        it('should return no match when dependencies is not an object', async () => {
            const content = JSON.stringify({
                dependencies: null
            });
            const result = await analyzer.analyze('package-lock.json', content);
            expect(result.matched).toBe(false);
        });

        it('should return no match when @angular/core version is not a string', async () => {
            const content = JSON.stringify({
                dependencies: {
                    '@angular/core': {
                        version: null
                    }
                }
            });
            const result = await analyzer.analyze('package-lock.json', content);
            expect(result.matched).toBe(false);
        });
    });

    describe('disambiguate', () => {
        it('should handle empty analyses array', async () => {
            const analyses: AnalysisMatch[] = [];
            const result = await analyzer.disambiguate(analyses);
            expect(result).toBeUndefined();
        });

        it('should return single analysis without comparison', async () => {
            const analyses: AnalysisMatch[] = [{
                analyzer,
                result: new AngularVersionAnalyzeResult(true, '14.0.0'),
                path: 'path1/package-lock.json'  
            }];
            const result = await analyzer.disambiguate(analyses);
            expect((result.result as AngularVersionAnalyzeResult).angularVersion).toBe('14.0.0');
        });

        it('should select lowest Angular version when multiple results exist', async () => {
            const analyses: AnalysisMatch[] = [
                {
                    analyzer,
                    result: new AngularVersionAnalyzeResult(true, '14.0.0'),
                    path: 'path1/package-lock.json'  
                },
                {
                    analyzer,
                    result: new AngularVersionAnalyzeResult(true, '13.0.0'),
                    path: 'path2/package-lock.json'  
                },
                {
                    analyzer,
                    result: new AngularVersionAnalyzeResult(true, '15.0.0'),
                    path: 'path3/package-lock.json'  
                }
            ];

            const result = await analyzer.disambiguate(analyses);
            expect((result.result as AngularVersionAnalyzeResult).angularVersion).toBe('13.0.0');
        });

        it('should handle invalid semver versions', async () => {
            const analyses: AnalysisMatch[] = [
                {
                    analyzer,
                    result: new AngularVersionAnalyzeResult(true, 'invalid'),
                    path: 'path1/package-lock.json'  
                },
                {
                    analyzer,
                    result: new AngularVersionAnalyzeResult(true, '13.0.0'),
                    path: 'path2/package-lock.json'  
                }
            ];

            const result = await analyzer.disambiguate(analyses);
            expect((result.result as AngularVersionAnalyzeResult).angularVersion).toBe('13.0.0');
        });
    });
});
