import { reporters } from 'mocha';
import * as moment from 'moment';
import { TestRail } from './testrail';
import { titleToCaseIds } from './shared';
import { Status, TestRailResult } from './testrail.interface';
const chalk = require('chalk');

const createKey = () => {
  return `[ ${process.env.CIRCLE_BUILD_URL || process.env.TERM_SESSION_ID || moment().format('MMM Do YYYY, HH:mm (Z)')} ]`;
}

const createDescription = () => {
  if (!process.env.CI) {
    return 'Automated Cypress run';
  }
  const props = {
    jobName: process.env.CIRCLE_JOB,
    branch: process.env.CIRCLE_BRANCH,
    repoName: process.env.CIRCLE_PROJECT_REPONAME,
    pullRequest: process.env.CIRCLE_PULL_REQUEST,
    sha: process.env.CIRCLE_SHA1,
  };
  return JSON.stringify(props, null, 2);
}

const releaseInfo = () => {
  if (!process.env.CI) {
    return undefined;
  }
  if (!/^release\/[0-9]+\.[0-9]+\.[0-9]+$/.test(process.env.CIRCLE_BRANCH)) {
    return undefined;
  }
  return `${process.env.CIRCLE_BRANCH} ${process.env.CIRCLE_SHA1}`;
}

export class CypressTestRailReporter extends reporters.Spec {
  private results: TestRailResult[] = [];
  private testRail: TestRail;

  constructor(runner: any, options: any) {
    super(runner);

    let reporterOptions = options.reporterOptions;

    if (process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD) {
      reporterOptions.password = process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD;
    }

    this.testRail = new TestRail(reporterOptions);
    this.validate(reporterOptions, 'host');
    this.validate(reporterOptions, 'username');
    this.validate(reporterOptions, 'password');
    this.validate(reporterOptions, 'projectId');
    this.validate(reporterOptions, 'suiteId');

    runner.on('start', () => {
      const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
      const key = createKey();
      const name = `${reporterOptions.runName || 'Cypress'} ${executionDateTime} ${releaseInfo()}`;
      const description = `${key}\n${createDescription()}`;
      this.testRail.getRun(name, description, key);
    });

    runner.on('pass', test => {
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        const results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Passed,
            comment: `Execution time: ${test.duration}ms`,
            elapsed: `${test.duration/1000}s`
          };
        });
        this.results.push(...results);
      }
    });

    runner.on('fail', test => {
      if (test.err) {
        console.log('Error object', test.err);
      }
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        const results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Failed,
            comment: `${test.err.message}`,
          };
        });
        this.results.push(...results);
      }
    });

    runner.on('end', () => {
      if (this.results.length == 0) {
        console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
        console.warn(
          '\n',
          'No testcases were matched. Ensure that your tests are declared correctly and matches Cxxx',
          '\n'
        );
        return;
      }

      // publish test cases results
      this.testRail.publishResults(this.results);
    });
  }

  private validate(options, name: string) {
    if (options == null) {
      throw new Error('Missing reporterOptions in cypress.json');
    }
    if (options[name] == null) {
      throw new Error(`Missing ${name} value. Please update reporterOptions in cypress.json`);
    }
  }
}
