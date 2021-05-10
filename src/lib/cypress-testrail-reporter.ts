import { reporters } from 'mocha';
import * as moment from 'moment';
import { TestRail } from './testrail';
import { titleToCaseIds } from './shared';
import { Status, TestRailResult } from './testrail.interface';
const chalk = require('chalk');
const path = require('path');
import { readdirSync } from "@jsdevtools/readdir-enhanced";

const createKey = () => {
  return `[ ${process.env.CIRCLE_BUILD_URL || process.env.TERM_SESSION_ID || moment().format('DD-MM-YYYY HH:mm:ss')} ]`;
};

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
};

const formatError = ({ message, actual, expected }) => {
  let output = '';
  if (message) {
    output += `**Error**: ${message}\n`
  }
  if (actual) {
    const lines = actual.split('\n');
    const text = `${lines.slice(0,50).map(line => `    ${line}`).join('\n')}${lines.length > 50 ? '(...truncated)' : ''}`;
    output += `---\n**Actual**\n${text}\n\n`;
  }
  if (expected) {
    const lines = expected.split('\n');
    const text = `${lines.slice(0,50).map(line => `    ${line}`).join('\n')}${lines.length > 50 ? '(...truncated)' : ''}`;
    output += `---\n**Expected**\n${text}\n\n`;
  }
  return output;
};

const releaseVersion = () => {
  if (!process.env.CI) {
    return '';
  }
  if (!/^release\/[0-9]+\.[0-9]+\.[0-9]+$/.test(process.env.CIRCLE_BRANCH)) {
    return '';
  }
  return process.env.CIRCLE_BRANCH.split('/')[1];
};

const releaseInfo = () => {
  if (!process.env.CI) {
    return '';
  }
  if (!/^release\/[0-9]+\.[0-9]+\.[0-9]+$/.test(process.env.CIRCLE_BRANCH)) {
    return '';
  }
  return `${process.env.CIRCLE_BRANCH} ${process.env.CIRCLE_SHA1}`;
};

const findScreenshots = (caseId) => {
  try {
    const baseDir = __dirname.split('/node_modules/', 1)[0];
    const SCREENSHOTS_FOLDER_PATH = path.join(baseDir, 'cypress/screenshots');
    const matchedFiles = readdirSync(SCREENSHOTS_FOLDER_PATH, { deep: true, filter: (stats) => {
      return stats.isFile() && stats.path.includes(`C${caseId}`) && /(failed|attempt)/g.test(stats.path);
    }});
    return matchedFiles.map(relativePath => path.join(SCREENSHOTS_FOLDER_PATH, relativePath));
  } catch (error) {
    console.error('Error looking up screenshots', error);
    return [];
  }
};

export class CypressTestRailReporter extends reporters.Spec {
  private results: TestRailResult[] = [];
  private testRail: TestRail;
  private screenshots: { [key: number]: string[] } = {};

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
      const executionDateTime = moment().format('DD-MM-YYYY HH:mm');
      const key = createKey();
      const name = `${reporterOptions.runName || 'Cypress'} ${executionDateTime} ${releaseInfo()}`;
      const description = `${key}\n${createDescription()}`;
      return this.testRail.getRun(name, description, key);
    });

    runner.on('pass', test => {
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        const results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Passed,
            comment: `Execution time: ${test.duration}ms`,
            ...test.duration && { elapsed: `${test.duration/1000}s` },
            version: releaseVersion(),
          };
        });
        this.results.push(...results);
      }
    });

    runner.on('fail', test => {
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        const screenshots = findScreenshots(caseIds[0]);
        if (screenshots && screenshots.length > 0) {
          this.screenshots[caseIds[0]] = findScreenshots(caseIds[0]);
        }
        const results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Failed,
            comment: formatError(test.err),
            ...test.duration && { elapsed: `${test.duration/1000}s` },
            version: releaseVersion(),
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
      return new Promise(async resolve => {
        const results = await this.testRail.publishResults(this.results);
        for (const [caseId, screenshots] of Object.entries(this.screenshots)) {
          const caseResults = await this.testRail.getResultsForCase(Number(caseId));
          if (!caseResults || caseResults.length < 1 || !screenshots || screenshots.length < 1) {
            continue;
          }
          for (const screenshotPath of screenshots) {
            await this.testRail.addAttachmentToResult(caseResults[0].id, screenshotPath);
          }
        }
      });
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
