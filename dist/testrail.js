"use strict";
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
exports.TestRail = void 0;
var axios = require('axios');
var chalk = require('chalk');
var nodeFetch = require('node-fetch');
var fs = require('fs');
var FormData = require('form-data');
var TestRail = /** @class */ (function () {
    function TestRail(options) {
        var _this = this;
        this.options = options;
        this.includeAll = true;
        this.caseIds = [];
        this.fetchWithAuth = function (url, options) { return __awaiter(_this, void 0, void 0, function () {
            var overrideContentType, response, text_1, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        overrideContentType = options && options.headers && Object.keys(options.headers).find(function (k) { return k.toLowerCase() === 'content-type'; });
                        return [4 /*yield*/, nodeFetch(url, __assign(__assign({}, options), { headers: __assign(__assign(__assign({}, (!overrideContentType && { 'content-type': 'application/json' })), { 'Authorization': "Basic " + Buffer.from(this.options.username + ":" + this.options.password).toString('base64') }), options && options.headers), timeout: 60000 }))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 2:
                        text_1 = _a.sent();
                        response.text = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, text_1];
                        }); }); };
                        response.json = function () { return __awaiter(_this, void 0, void 0, function () {
                            var json;
                            return __generator(this, function (_a) {
                                try {
                                    json = JSON.parse(text_1);
                                    if (json && json.error) {
                                        console.error("Error response " + (options && options.method || 'GET') + " " + url, { json: json, body: options.body });
                                    }
                                    return [2 /*return*/, json];
                                }
                                catch (error) {
                                    console.error('Invalid JSON', text_1);
                                    return [2 /*return*/, undefined];
                                }
                                return [2 /*return*/];
                            });
                        }); };
                        return [2 /*return*/, response];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Error requesting " + (options && options.method || 'GET') + " " + url, error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.base = options.host + "/index.php?/api/v2";
    }
    TestRail.prototype.getRunId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var attempt = 0;
                        if (_this.runId) {
                            resolve(_this.runId);
                            return;
                        }
                        var interval = setInterval(function () {
                            if (_this.runId) {
                                clearInterval(interval);
                                resolve(_this.runId);
                                return;
                            }
                            ++attempt;
                            if (attempt > 30) {
                                clearInterval(interval);
                                resolve(undefined);
                            }
                        }, 1000);
                    })];
            });
        });
    };
    TestRail.prototype.getCaseTypes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.base + "/get_case_types";
                        return [4 /*yield*/, this.fetchWithAuth(url)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    TestRail.prototype.getCases = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.base + "/get_cases/" + this.options.projectId + "&suite_id=" + this.options.suiteId;
                        if (this.options.groupId) {
                            url += "&section_id=" + this.options.groupId;
                        }
                        if (this.options.filter) {
                            url += "&filter=" + this.options.filter;
                        }
                        return [4 /*yield*/, this.fetchWithAuth(url)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    TestRail.prototype.getRun = function (name, description, key) {
        return __awaiter(this, void 0, void 0, function () {
            var caseTypes, _a, url, response, json, run;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.options.setType) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getCaseTypes()];
                    case 1:
                        caseTypes = _b.sent();
                        this.setTypeId = (caseTypes.find(function (t) { return t.name === _this.options.setType; }) || {}).id;
                        _b.label = 2;
                    case 2:
                        _a = this;
                        return [4 /*yield*/, this.getCases()];
                    case 3:
                        _a.cases = _b.sent();
                        url = this.base + "/get_runs/" + this.options.projectId;
                        return [4 /*yield*/, this.fetchWithAuth(url)];
                    case 4:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 5:
                        json = _b.sent();
                        run = (json.runs || json).find(function (run) { return run.description && run.description.indexOf(key) >= 0; });
                        if (run) {
                            this.runId = run.id;
                            return [2 /*return*/];
                        }
                        return [2 /*return*/, this.createRun(name, description)];
                }
            });
        });
    };
    TestRail.prototype.updateCasesType = function (results) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1, _i, results_1, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.setTypeId) {
                            return [2 /*return*/];
                        }
                        if (!this.cases || this.cases.length === 0) {
                            return [2 /*return*/];
                        }
                        _loop_1 = function (result) {
                            var existingCase, url, response;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        existingCase = this_1.cases.find(function (c) { return c.id === result.case_id; });
                                        if (!existingCase) {
                                            return [2 /*return*/, "continue"];
                                        }
                                        if (existingCase.type_id === this_1.setTypeId) {
                                            return [2 /*return*/, "continue"];
                                        }
                                        url = this_1.base + "/update_case/" + result.case_id;
                                        return [4 /*yield*/, this_1.fetchWithAuth(url, {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    'type_id': this_1.setTypeId
                                                }),
                                            })];
                                    case 1:
                                        response = _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, results_1 = results;
                        _a.label = 1;
                    case 1:
                        if (!(_i < results_1.length)) return [3 /*break*/, 4];
                        result = results_1[_i];
                        return [5 /*yield**/, _loop_1(result)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TestRail.prototype.createRun = function (name, description) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.options.includeAllInTestRun === false) {
                            this.includeAll = false;
                            this.caseIds = this.cases.map(function (c) { return c.id; });
                        }
                        url = this.base + "/add_run/" + this.options.projectId;
                        return [4 /*yield*/, this.fetchWithAuth(url, {
                                method: 'POST',
                                body: JSON.stringify({
                                    suite_id: this.options.suiteId,
                                    name: name,
                                    description: description,
                                    include_all: this.includeAll,
                                    case_ids: this.caseIds
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        json = _a.sent();
                        this.runId = json.id;
                        return [2 /*return*/, json];
                }
            });
        });
    };
    TestRail.prototype.deleteRun = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, _a, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.base + "/delete_run/";
                        return [4 /*yield*/, this.getRunId()];
                    case 1:
                        url = _a + (_b.sent());
                        return [4 /*yield*/, this.fetchWithAuth(url, {
                                method: 'POST',
                            })];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    TestRail.prototype.getResultsForCase = function (caseId) {
        return __awaiter(this, void 0, void 0, function () {
            var url, _a, response, json;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.base + "/get_results_for_case/";
                        return [4 /*yield*/, this.getRunId()];
                    case 1:
                        url = _a + (_b.sent()) + "/" + caseId;
                        return [4 /*yield*/, this.fetchWithAuth(url)];
                    case 2:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        json = _b.sent();
                        return [2 /*return*/, json];
                }
            });
        });
    };
    TestRail.prototype.addAttachmentToResult = function (resultId, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var form, url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        form = new FormData();
                        form.append('attachment', fs.createReadStream(filePath));
                        url = this.base + "/add_attachment_to_result/" + resultId;
                        return [4 /*yield*/, this.fetchWithAuth(url, {
                                method: 'POST',
                                headers: __assign({}, form.getHeaders()),
                                body: form,
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    TestRail.prototype.publishResults = function (results) {
        return __awaiter(this, void 0, void 0, function () {
            var url, _a, response, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _a = this.base + "/add_results_for_cases/";
                        return [4 /*yield*/, this.getRunId()];
                    case 1:
                        url = _a + (_j.sent());
                        return [4 /*yield*/, this.fetchWithAuth(url, {
                                method: 'POST',
                                body: JSON.stringify({ results: results }),
                            })];
                    case 2:
                        response = _j.sent();
                        console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
                        _c = (_b = console).log;
                        _d = ['\n'];
                        _e = " - Results are published to ";
                        _g = (_f = chalk).magenta;
                        _h = this.options.host + "/index.php?/runs/view/";
                        return [4 /*yield*/, this.getRunId()];
                    case 3:
                        _c.apply(_b, _d.concat([_e + _g.apply(_f, [_h + (_j.sent())]), '\n']));
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    TestRail.prototype.closeRun = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, _a, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.base + "/close_run/";
                        return [4 /*yield*/, this.getRunId()];
                    case 1:
                        url = _a + (_b.sent());
                        return [4 /*yield*/, this.fetchWithAuth(url, {
                                method: 'POST'
                            })];
                    case 2:
                        response = _b.sent();
                        console.log('- Test run closed successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    return TestRail;
}());
exports.TestRail = TestRail;
//# sourceMappingURL=testrail.js.map