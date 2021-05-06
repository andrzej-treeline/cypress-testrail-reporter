"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mocha_1 = require("mocha");
var moment = require("moment");
var testrail_1 = require("./testrail");
var shared_1 = require("./shared");
var testrail_interface_1 = require("./testrail.interface");
var chalk = require('chalk');
var createKey = function () {
    return "[ " + (process.env.CIRCLE_BUILD_URL || process.env.TERM_SESSION_ID || moment().format('MMM Do YYYY, HH:mm (Z)')) + " ]";
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
var releaseInfo = function () {
    if (!process.env.CI) {
        return undefined;
    }
    if (!/^release\/[0-9]+\.[0-9]+\.[0-9]+$/.test(process.env.CIRCLE_BRANCH)) {
        return undefined;
    }
    return process.env.CIRCLE_BRANCH + " " + process.env.CIRCLE_SHA1;
};
var CypressTestRailReporter = /** @class */ (function (_super) {
    __extends(CypressTestRailReporter, _super);
    function CypressTestRailReporter(runner, options) {
        var _this = _super.call(this, runner) || this;
        _this.results = [];
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
            var executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
            var key = createKey();
            var name = (reporterOptions.runName || releaseInfo() || 'Cypress') + " " + executionDateTime;
            var description = key + "\n" + createDescription();
            _this.testRail.getRun(name, description, key);
        });
        runner.on('pass', function (test) {
            var caseIds = shared_1.titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                var results = caseIds.map(function (caseId) {
                    return {
                        case_id: caseId,
                        status_id: testrail_interface_1.Status.Passed,
                        comment: "Execution time: " + test.duration + "ms",
                        elapsed: test.duration / 1000 + "s"
                    };
                });
                (_a = _this.results).push.apply(_a, results);
            }
            var _a;
        });
        runner.on('fail', function (test) {
            var caseIds = shared_1.titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                var results = caseIds.map(function (caseId) {
                    return {
                        case_id: caseId,
                        status_id: testrail_interface_1.Status.Failed,
                        comment: "" + test.err.message,
                    };
                });
                (_a = _this.results).push.apply(_a, results);
            }
            var _a;
        });
        runner.on('end', function () {
            if (_this.results.length == 0) {
                console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
                console.warn('\n', 'No testcases were matched. Ensure that your tests are declared correctly and matches Cxxx', '\n');
                return;
            }
            // publish test cases results
            _this.testRail.publishResults(_this.results);
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