const fs = jest.createMockFromModule('fs') as any;

fs.readdirSync = (path: string) => {
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
};

fs.statSync = (path: string) => {
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
};

fs.readFileSync = (path: string) => {
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
};

export default fs;

