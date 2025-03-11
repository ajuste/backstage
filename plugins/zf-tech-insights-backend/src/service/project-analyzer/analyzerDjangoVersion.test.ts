import { DjangoVersionAnalyzer, DjangoVersionAnalyzeResult } from './analyzerDjangoVersion';
import { NoMatchResult } from './analyzer';

describe('DjangoVersionAnalyzer', () => {

    describe("analyze", () => {

        it('returns the Django version from requirements', async () => {
            const analyzer = new DjangoVersionAnalyzer();
            expect(analyzer.analyze("requirements.txt", "django==1.2.3")).resolves.toEqual(new DjangoVersionAnalyzeResult(true, "1.2.3"));
        });

        it('returns nothing when passed file is not requirements.txt', async () => {
            const analyzer = new DjangoVersionAnalyzer();
        expect(analyzer.analyze("requirements.txt2", "django==1.2.3")).resolves.toEqual(NoMatchResult);
        });

        it('returns nothing when passed file is requirements.txt but it doesn\'t contain django', async () => {
            const analyzer = new DjangoVersionAnalyzer();
            expect(analyzer.analyze("requirements.txt2", "django-blah==1.2.3")).resolves.toEqual(NoMatchResult);
        });

        it('returns the Django version from pyproject.toml', async () => {
            const analyzer = new DjangoVersionAnalyzer();
            expect(analyzer.analyze("pyproject.toml", 'django = "4.2.0"')).resolves.toEqual(new DjangoVersionAnalyzeResult(true, "4.2.0"));
        });

        it('returns nothing when pyproject.toml doesn\'t contain django', async () => {
            const analyzer = new DjangoVersionAnalyzer();
            expect(analyzer.analyze("pyproject.toml", 'django-rest-framework = "3.14.0"')).resolves.toEqual(NoMatchResult);
        });

    });

});
