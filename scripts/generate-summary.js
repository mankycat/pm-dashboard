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
var data_1 = require("../lib/data");
var promises_1 = __importDefault(require("fs/promises"));
var path_1 = __importDefault(require("path"));
function generateSummary() {
    return __awaiter(this, void 0, void 0, function () {
        var databases, tasksDb, tasks, activeTasks, date, report, getStatusName, getDueDate, _i, activeTasks_1, task, reportPath;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Generating Daily Summary...");
                    return [4 /*yield*/, (0, data_1.getDatabases)()];
                case 1:
                    databases = _b.sent();
                    tasksDb = databases.find(function (db) { return db.name === 'Tasks'; });
                    if (!tasksDb) {
                        console.error("Tasks database not found!");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, data_1.getPages)(tasksDb.id)];
                case 2:
                    tasks = _b.sent();
                    activeTasks = tasks.filter(function (t) {
                        var _a;
                        var statusProp = (_a = tasksDb.schema.find(function (p) { return p.name === 'Status'; })) === null || _a === void 0 ? void 0 : _a.id;
                        if (!statusProp)
                            return true; // Keep if no status prop
                        var statusVal = t.properties[statusProp];
                        // Assuming 'opt-done' is the ID for Done. 
                        // A more robust way is to find the option with name "Done".
                        /*
                          In our current schema:
                          opt-todo = To Do
                          opt-doing = In Progress
                          opt-done = Done
                        */
                        return statusVal !== 'opt-done';
                    });
                    date = new Date().toISOString().split('T')[0];
                    report = "# Daily Summary - ".concat(date, "\n\n");
                    report += "**Active Tasks**: ".concat(activeTasks.length, "\n\n");
                    if (activeTasks.length === 0) {
                        report += "No active tasks. Great job!\n";
                    }
                    else {
                        report += "| Task | Status | Due Date |\n";
                        report += "| :--- | :--- | :--- |\n";
                        getStatusName = function (val) {
                            var _a;
                            var prop = tasksDb.schema.find(function (p) { return p.name === 'Status'; });
                            var opt = (_a = prop === null || prop === void 0 ? void 0 : prop.options) === null || _a === void 0 ? void 0 : _a.find(function (o) { return o.id === val; });
                            return opt ? opt.name : val || 'Empty';
                        };
                        getDueDate = function (props) {
                            var prop = tasksDb.schema.find(function (p) { return p.name === 'Due Date'; });
                            return prop ? (props[prop.id] || '-') : '-';
                        };
                        for (_i = 0, activeTasks_1 = activeTasks; _i < activeTasks_1.length; _i++) {
                            task = activeTasks_1[_i];
                            report += "| ".concat(task.title, " | ").concat(getStatusName(task.properties[(_a = tasksDb.schema.find(function (p) { return p.name === 'Status'; })) === null || _a === void 0 ? void 0 : _a.id]), " | ").concat(getDueDate(task.properties), " |\n");
                        }
                    }
                    reportPath = path_1.default.join(process.cwd(), 'daily-summary.md');
                    return [4 /*yield*/, promises_1.default.writeFile(reportPath, report)];
                case 3:
                    _b.sent();
                    console.log("Report saved to ".concat(reportPath));
                    return [2 /*return*/];
            }
        });
    });
}
// Execute
generateSummary().catch(console.error);
