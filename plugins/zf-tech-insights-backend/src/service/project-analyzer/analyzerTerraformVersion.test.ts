import { TerraformVersionAnalyzer, TerraformVersionAnalyzeResult } from './analyzerTerraformVersion';
import { NoMatchResult } from './analyzer';

describe('TerraformVersionAnalyzer', () => {
    describe('analyze', () => {
        it('extracts terraform version from .tf file', async () => {
            const analyzer = new TerraformVersionAnalyzer();
            const content = `
                terraform {
                    required_version = "1.2.3"
                }
            `;
            expect(analyzer.analyze('main.tf', content)).resolves.toEqual(
                new TerraformVersionAnalyzeResult(true, '1.2.3')
            );
        });

        it('returns NoMatchResult for non-tf files', async () => {
            const analyzer = new TerraformVersionAnalyzer();
            const content = `required_version = "1.2.3"`;
            expect(analyzer.analyze('main.txt', content)).resolves.toEqual(NoMatchResult);
        });

        it('returns NoMatchResult when no version is found', async () => {
            const analyzer = new TerraformVersionAnalyzer();
            const content = `terraform { }`;
            expect(analyzer.analyze('main.tf', content)).resolves.toEqual(NoMatchResult);
        });

        it('handles terraform version with different formatting', async () => {
            const analyzer = new TerraformVersionAnalyzer();
            const content = `terraform {
                required_version="1.2.3"
            }`;
            expect(analyzer.analyze('main.tf', content)).resolves.toEqual(
                new TerraformVersionAnalyzeResult(true, '1.2.3')
            );
        });
    });

    describe('disambiguate', () => {
        it('selects the lowest version when multiple versions are found', async () => {
            const analyzer = new TerraformVersionAnalyzer();
            const analyses = [
                { analyzer, path: 'a.tf', result: new TerraformVersionAnalyzeResult(true, '1.2.3') },
                { analyzer, path: 'b.tf', result: new TerraformVersionAnalyzeResult(true, '1.1.0') },
                { analyzer, path: 'c.tf', result: new TerraformVersionAnalyzeResult(true, '1.3.0') }
            ];

            const expected = {
                analyzer,
                path: 'b.tf',
                result: new TerraformVersionAnalyzeResult(true, '1.1.0')
            };

            const result = await analyzer.disambiguate(analyses);
            expect(result).toEqual(expected);
        });
    });
});
