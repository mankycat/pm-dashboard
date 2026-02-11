"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabases = getDatabases;
exports.getDatabase = getDatabase;
exports.saveDatabase = saveDatabase;
exports.getPages = getPages;
exports.updatePage = updatePage;
exports.createPageInDb = createPageInDb;
exports.savePage = savePage;
exports.deletePage = deletePage;
var promises_1 = __importDefault(require("fs/promises"));
var path_1 = __importDefault(require("path"));
// --- Paths ---
var DATA_DIR = path_1.default.join(process.cwd(), 'data');
var DB_FILE = path_1.default.join(DATA_DIR, 'databases.json');
var PAGES_DIR = path_1.default.join(DATA_DIR, 'pages');
// --- Helpers ---
function ensureDir(dirPath) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 4]);
                    return [4 /*yield*/, promises_1.default.access(dirPath)];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 2:
                    _a = _b.sent();
                    return [4 /*yield*/, promises_1.default.mkdir(dirPath, { recursive: true })];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function readJson(filePath, defaultValue) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf-8')];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, JSON.parse(data)];
                case 2:
                    error_1 = _a.sent();
                    return [2 /*return*/, defaultValue];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function writeJson(filePath, data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promises_1.default.writeFile(filePath, JSON.stringify(data, null, 2))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// --- Concurrency Control ---
var writeLock = Promise.resolve();
function withLock(fn) {
    return __awaiter(this, void 0, void 0, function () {
        var currentLock, release, newLock;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentLock = writeLock;
                    newLock = new Promise(function (resolve) { release = resolve; });
                    // Append new lock to the chain, but don't await the *new* lock, await the *current* one before running fn
                    writeLock = writeLock.then(function () { return newLock; });
                    return [4 /*yield*/, currentLock];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 4, 5]);
                    return [4 /*yield*/, fn()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    release();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// --- Database Operations ---
function getDatabases() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readJson(DB_FILE, [])];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function getDatabase(id) {
    return __awaiter(this, void 0, void 0, function () {
        var dbs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDatabases()];
                case 1:
                    dbs = _a.sent();
                    return [2 /*return*/, dbs.find(function (db) { return db.id === id; })];
            }
        });
    });
}
function saveDatabase(database) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, withLock(function () { return __awaiter(_this, void 0, void 0, function () {
                        var dbs, index;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, getDatabases()];
                                case 1:
                                    dbs = _a.sent();
                                    index = dbs.findIndex(function (db) { return db.id === database.id; });
                                    if (index >= 0) {
                                        dbs[index] = database;
                                    }
                                    else {
                                        dbs.push(database);
                                    }
                                    return [4 /*yield*/, writeJson(DB_FILE, dbs)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// --- Page Operations ---
function getPageFilePath(databaseId) {
    return path_1.default.join(PAGES_DIR, "".concat(databaseId, ".json"));
}
function getPages(databaseId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureDir(PAGES_DIR)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, readJson(getPageFilePath(databaseId), [])];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * atomic update of a page to prevent race conditions
 */
function updatePage(databaseId, pageId, updater) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, withLock(function () { return __awaiter(_this, void 0, void 0, function () {
                        var filePath, pages, page;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, ensureDir(PAGES_DIR)];
                                case 1:
                                    _a.sent();
                                    filePath = getPageFilePath(databaseId);
                                    return [4 /*yield*/, readJson(filePath, [])];
                                case 2:
                                    pages = _a.sent();
                                    page = pages.find(function (p) { return p.id === pageId; });
                                    if (!page) return [3 /*break*/, 4];
                                    updater(page); // Mutate in place
                                    page.updatedAt = new Date().toISOString();
                                    return [4 /*yield*/, writeJson(filePath, pages)];
                                case 3:
                                    _a.sent();
                                    _a.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function createPageInDb(page) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, withLock(function () { return __awaiter(_this, void 0, void 0, function () {
                        var filePath, pages;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, ensureDir(PAGES_DIR)];
                                case 1:
                                    _a.sent();
                                    filePath = getPageFilePath(page.databaseId);
                                    return [4 /*yield*/, readJson(filePath, [])];
                                case 2:
                                    pages = _a.sent();
                                    pages.push(page);
                                    return [4 /*yield*/, writeJson(filePath, pages)];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function savePage(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Use updatePage logic to be safe, or just lock here if we are replacing whole object
                // But savePage as typically used by overwrite might be risky if we don't read first.
                // Let's deprecate savePage for updatePage usage, OR handle logic here.
                return [4 /*yield*/, updatePage(page.databaseId, page.id, function (p) {
                        Object.assign(p, page);
                    })];
                case 1:
                    // Use updatePage logic to be safe, or just lock here if we are replacing whole object
                    // But savePage as typically used by overwrite might be risky if we don't read first.
                    // Let's deprecate savePage for updatePage usage, OR handle logic here.
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deletePage(databaseId, pageId) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, withLock(function () { return __awaiter(_this, void 0, void 0, function () {
                        var filePath, pages, filtered;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    filePath = getPageFilePath(databaseId);
                                    return [4 /*yield*/, readJson(filePath, [])];
                                case 1:
                                    pages = _a.sent();
                                    filtered = pages.filter(function (p) { return p.id !== pageId; });
                                    return [4 /*yield*/, writeJson(filePath, filtered)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
