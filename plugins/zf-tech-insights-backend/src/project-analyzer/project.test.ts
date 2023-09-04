import { Project } from './project';

jest.mock('fs');

describe('project', () => {

    beforeAll(async () => {

    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("readDirectoryContent", () => {
        it('returns structure from folder', async () => {
            const project = new Project(".terra");
            expect(project.readDirectoryContent("/user/test", "/user/test")).toEqual({
                '.terra/test.tf': 'required_version = \"0.12.31\"',
                '.terra/test2.tf': 'required_version = \"0.12.32\"',
                'foo/bar': 'hello folks',
            });
        });
    });

    describe("analyze", () => {
        it('returns disambiguated analyses', async () => {
            const project = new Project("/user/test");
            const result = await project.analyze();

            expect(result.matches).toEqual([
                {
                    analyzer: expect.anything(),
                    path: '.terra/test.tf',
                    result: {
                        matched: true,
                        terraformVersion: "0.12.31",
                    }
                },
            ]);
        });
    });
});
