"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CypressTestRailReporter = void 0;
var mocha_1 = require("mocha");
var moment = require("moment");
var testrail_1 = require("./testrail");
var shared_1 = require("./shared");
var testrail_interface_1 = require("./testrail.interface");
var chalk = require('chalk');
var path = require('path');
var readdir_enhanced_1 = require("@jsdevtools/readdir-enhanced");
var createKey = function () {
    return "[ " + (process.env.CIRCLE_BUILD_URL || process.env.TERM_SESSION_ID || moment().format('DD-MM-YYYY HH:mm:ss')) + " ]";
};
var createDescription = function () {
    if (!process.env.CI) {
        return 'Automated Cypress run';
    }
    var props = {
        jobName: process.env.CIRCLE_JOB,
        branch: process.env.CIRCLE_BRANCH,
        repoName: process.env.CIRCLE_PROJECT_REPONAME,
        pullRequest: process.env.CIRCLE_PULL_REQUEST,
        sha: process.env.CIRCLE_SHA1,
    };
    return JSON.stringify(props, null, 2);
};
var formatError = function (_a) {
    var message = _a.message, actual = _a.actual, expected = _a.expected;
    var output = '';
    if (message) {
        output += "**Error**: " + message + "\n";
    }
    if (actual) {
        var lines = actual.split('\n');
        var text = "" + lines.slice(0, 50).map(function (line) { return "    " + line; }).join('\n') + (lines.length > 50 ? '(...truncated)' : '');
        output += "---\n**Actual**\n" + text + "\n\n";
    }
    if (expected) {
        var lines = expected.split('\n');
        var text = "" + lines.slice(0, 50).map(function (line) { return "    " + line; }).join('\n') + (lines.length > 50 ? '(...truncated)' : '');
        output += "---\n**Expected**\n" + text + "\n\n";
    }
    return output;
};
var releaseVersion = function () {
    if (!process.env.CI) {
        return '';
    }
    if (!/^release\/[0-9]+\.[0-9]+\.[0-9]+$/.test(process.env.CIRCLE_BRANCH)) {
        return '';
    }
    return process.env.CIRCLE_BRANCH.split('/')[1];
};
var releaseInfo = function () {
    if (!process.env.CI) {
        return '';
    }
    return process.env.CIRCLE_BRANCH + " " + process.env.CIRCLE_SHA1;
};
var findScreenshots = function (caseId) {
    try {
        var baseDir = __dirname.split('/node_modules/', 1)[0];
        var SCREENSHOTS_FOLDER_PATH_1 = path.join(baseDir, 'cypress/screenshots');
        var matchedFiles = readdir_enhanced_1.readdirSync(SCREENSHOTS_FOLDER_PATH_1, { deep: true, filter: function (stats) {
                return stats.isFile() && stats.path.includes("C" + caseId) && /(failed|attempt)/g.test(stats.path);
            } });
        return matchedFiles.map(function (relativePath) { return path.join(SCREENSHOTS_FOLDER_PATH_1, relativePath); });
    }
    catch (error) {
        console.error('Error looking up screenshots', error);
        return [];
    }
};
var CypressTestRailReporter = /** @class */ (function (_super) {
    __extends(CypressTestRailReporter, _super);
    function CypressTestRailReporter(runner, options) {
        var _this = _super.call(this, runner) || this;
        _this.results = [];
        _this.screenshots = {};
        var reporterOptions = options.reporterOptions;
        if (process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD) {
            reporterOptions.password = process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD;
        }
        _this.testRail = new testrail_1.TestRail(reporterOptions);
        _this.validate(reporterOptions, 'host');
        _this.validate(reporterOptions, 'username');
        _this.validate(reporterOptions, 'password');
        _this.validate(reporterOptions, 'projectId');
        _this.validate(reporterOptions, 'suiteId');
        runner.on('start', function () {
            var executionDateTime = moment().format('DD-MM-YYYY HH:mm');
            var key = createKey();
            var name = (reporterOptions.runName || 'Cypress') + " " + executionDateTime + " " + releaseInfo();
            var description = key + "\n" + createDescription();
            return _this.testRail.getRun(name, description, key);
        });
        runner.on('pass', function (test) {
            var _a;
            var caseIds = shared_1.titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                var results = caseIds.map(function (caseId) {
                    return __assign(__assign({ case_id: caseId, status_id: testrail_interface_1.Status.Passed, comment: "Execution time: " + test.duration + "ms" }, test.duration && { elapsed: test.duration / 1000 + "s" }), { version: releaseVersion() });
                });
                (_a = _this.results).push.apply(_a, results);
            }
        });
        runner.on('fail', function (test) {
            var _a;
            var caseIds = shared_1.titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                if (reporterOptions.uploadScreenshots) {
                    var screenshots = findScreenshots(caseIds[0]);
                    if (screenshots && screenshots.length > 0) {
                        _this.screenshots[caseIds[0]] = findScreenshots(caseIds[0]);
                    }
                }
                var results = caseIds.map(function (caseId) {
                    return __assign(__assign({ case_id: caseId, status_id: testrail_interface_1.Status.Failed, comment: formatError(test.err) }, test.duration && { elapsed: test.duration / 1000 + "s" }), { version: releaseVersion() });
                });
                (_a = _this.results).push.apply(_a, results);
            }
        });
        runner.on('end', function () {
            process.stdin.resume();
            if (_this.results.length == 0) {
                process.stdin.pause();
                console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
                console.warn('\n', 'No testcases were matched. Ensure that your tests are declared correctly and matches Cxxx', '\n');
                return;
            }
            setTimeout(function () {
                process.stdin.pause();
            }, 120 * 1000);
            // publish test cases results
            return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                var results, _i, _a, _b, caseId, screenshots, caseResults, _c, screenshots_1, screenshotPath;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.testRail.publishResults(this.results)];
                        case 1:
                            results = _d.sent();
                            if (!reporterOptions.uploadScreenshots) {
                                resolve(true);
                                return [2 /*return*/];
                            }
                            _i = 0, _a = Object.entries(this.screenshots);
                            _d.label = 2;
                        case 2:
                            if (!(_i < _a.length)) return [3 /*break*/, 8];
                            _b = _a[_i], caseId = _b[0], screenshots = _b[1];
                            return [4 /*yield*/, this.testRail.getResultsForCase(Number(caseId))];
                        case 3:
                            caseResults = _d.sent();
                            if (!caseResults || caseResults.length < 1 || !screenshots || screenshots.length < 1) {
                                return [3 /*break*/, 7];
                            }
                            _c = 0, screenshots_1 = screenshots;
                            _d.label = 4;
                        case 4:
                            if (!(_c < screenshots_1.length)) return [3 /*break*/, 7];
                            screenshotPath = screenshots_1[_c];
                            return [4 /*yield*/, this.testRail.addAttachmentToResult(caseResults[0].id, screenshotPath)];
                        case 5:
                            _d.sent();
                            _d.label = 6;
                        case 6:
                            _c++;
                            return [3 /*break*/, 4];
                        case 7:
                            _i++;
                            return [3 /*break*/, 2];
                        case 8:
                            resolve(true);
                            return [2 /*return*/];
                    }
                });
            }); }).then(function () {
                process.stdin.pause();
            }).catch(function () {
                process.stdin.pause();
            });
        });
        return _this;
    }
    CypressTestRailReporter.prototype.validate = function (options, name) {
        if (options == null) {
            throw new Error('Missing reporterOptions in cypress.json');
        }
        if (options[name] == null) {
            throw new Error("Missing " + name + " value. Please update reporterOptions in cypress.json");
        }
    };
    return CypressTestRailReporter;
}(mocha_1.reporters.Spec));
exports.CypressTestRailReporter = CypressTestRailReporter;
//# sourceMappingURL=cypress-testrail-reporter.js.map