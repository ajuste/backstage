import { DjangoVersionAnalyzer, DjangoVersionAnalyzeResult } from './analyzerDjangoVersion';
import { NoMatchResult } from './analyzer';

jest.mock('fs');

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

    });

});
