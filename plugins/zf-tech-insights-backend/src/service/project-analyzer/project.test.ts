import { Project } from './project';

jest.mock('fs', () => ({
    readdirSync: (path: string) => {
        switch (path) {
            case "/user/test":
                return [".terra", "foo", "vendor", "big.file"];
            case "/user/test/.terra":
                return ["test.tf", "test2.tf"];
            case "/user/test/foo":
                return ["bar"];
            case "/user/test/vendor":
                return ["deps.txt"];
            default:
                return [];
        }
    },

    statSync: (path: string) => {
        switch (path) {
            case "/user/test/.terra":
                return { isDirectory: () => true, isFile: () => false, size: 100 };
            case "/user/test/foo":
                return { isDirectory: () => true, isFile: () => false, size: 100 };
            case "/user/test/vendor":
                return { isDirectory: () => true, isFile: () => false, size: 100 };
            case "/user/test/.terra/test.tf":
                return { isDirectory: () => false, isFile: () => true, size: 100 };
            case "/user/test/.terra/test2.tf":
                return { isDirectory: () => false, isFile: () => true, size: 100 };
            case "/user/test/foo/bar":
                return { isDirectory: () => false, isFile: () => true, size: 100 };
            case "/user/test/vendor/deps.txt":
                return { isDirectory: () => false, isFile: () => true, size: 100 };
            case "/user/test/big.file":
                return { isDirectory: () => false, isFile: () => true, size: 10000000000 };
            default:
                return { isDirectory: () => true, isFile: () => false, size: 100 };
        }
    },

    readFileSync: (path: string) => {
        switch (path) {
            case "/user/test/.terra/test.tf":
                return "required_version = \"0.12.31\"";
            case "/user/test/.terra/test2.tf":
                return "required_version = \"0.12.32\"";
            case "/user/test/foo/bar":
                return "hello folks";
            case "/user/test/vendor/deps.txt":
                return "hello folks";
            default:
                return "hello folks";
        }
    }
}));

describe('project', () => {

    beforeEach(() => {
        jest.clearAllMocks();
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
