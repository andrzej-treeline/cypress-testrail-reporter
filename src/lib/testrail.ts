const axios = require('axios');
const chalk = require('chalk');
const nodeFetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
import { TestRailOptions, TestRailResult, TestRailCase } from './testrail.interface';

export class TestRail {
  private base: String;
  private runId: Number;
  private includeAll: Boolean = true;
  private caseIds: Number[] = [];
  private automatedTypeId: Number;
  cases: TestRailCase[];

  fetchWithAuth = async (url: string, options?: { method?: string, headers?: any, body?: string | FormData }) => {
    try {
      const overrideContentType = options && options.headers && Object.keys(options.headers).find(k => k.toLowerCase() === 'content-type');
      const response = await nodeFetch(url, {
        ...options,
        headers: {
          ...(!overrideContentType && { 'content-type': 'application/json' }),
          'Authorization': `Basic ${Buffer.from(this.options.username + ":" + this.options.password).toString('base64')}`,
          ...options && options.headers
        }, 
        timeout: 60000,
      });
      const text = await response.text();
      response.text = async () => text;
      response.json = async () => {
        try {
          const json = JSON.parse(text);
          if (json && json.error) {
            console.error(`Error response ${options && options.method || 'GET'} ${url}`, { json, body: options.body });
          }
          return json;
        } catch (error) {
          console.error('Invalid JSON', text);
          return undefined;
        }
      }
      return response;
    } catch (error) {
      console.error(`Error requesting ${options && options.method || 'GET'} ${url}`, error);
    }
  };

  constructor(private options: TestRailOptions) {
    this.base = `${options.host}/index.php?/api/v2`;
  }

  private async getRunId (): Promise<Number> {
    return new Promise((resolve) => {
      let attempt = 0;
      if (this.runId) {
        resolve(this.runId);
        return;
      }
      const interval = setInterval(() => {
        if (this.runId) {
          clearInterval(interval);
          resolve(this.runId);
          return;
        }
        ++attempt;
        if (attempt > 30) {
          clearInterval(interval);
          resolve(undefined);
        }
      }, 1000);
    })
  }

  public async getCaseTypes () {
    const url = `${this.base}/get_case_types`;
    const response = await this.fetchWithAuth(url);
    return response.json();
  }

  public async getCases () {
    let url = `${this.base}/get_cases/${this.options.projectId}&suite_id=${this.options.suiteId}`;
    if (this.options.groupId) {
      url += `&section_id=${this.options.groupId}`;
    }
    if (this.options.filter) {
      url += `&filter=${this.options.filter}`;
    }
    const response = await this.fetchWithAuth(url);
    return response.json();
  }

  public async getRun (name: string, description: string, key: string) {
    const url = `${this.base}/get_runs/${this.options.projectId}`;
    const response = await this.fetchWithAuth(url);
    const json = await response.json();
    const run = (json.runs || json).find(run => run.description && run.description.indexOf(key) >= 0);
    if (run) {
      this.runId = run.id;
      return;
    }
    return this.createRun(name, description);
  }

  public async updateCasesType (results: TestRailResult[]) {
    if (this.automatedTypeId && this.cases) {
      for (const result of results) {
        const existingCase = this.cases.find(c => c.id === result.case_id);
        if (existingCase && existingCase.type_id !== this.automatedTypeId) {
          const url = `${this.base}/update_case/${result.case_id}`;
          const response = await this.fetchWithAuth(url, {
            method: 'POST',
            body: JSON.stringify({
              'type_id': this.automatedTypeId
            }),
          });
        }
      }
    }
  }

  public async createRun (name: string, description: string) {
    const caseTypes = await this.getCaseTypes();
    this.automatedTypeId = (caseTypes.find(t => t.name === 'Automated') || {}).id;
    this.cases = await this.getCases();
    if (this.options.includeAllInTestRun === false){
      this.includeAll = false;
      this.caseIds = this.cases.map(c => c.id);
    } 
    const url = `${this.base}/add_run/${this.options.projectId}`;
    const response = await this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({
        suite_id: this.options.suiteId,
        name,
        description,
        include_all: this.includeAll,
        case_ids: this.caseIds
      }),
    })
    const json = await response.json();
    this.runId = json.id;
    return json;
  }

  public async deleteRun() {
    const url = `${this.base}/delete_run/${await this.getRunId()}`;
    const response = await this.fetchWithAuth(url, {
      method: 'POST',
    });
    return response.json();
  }

  public async getResultsForCase(caseId: number) {
    const url = `${this.base}/get_results_for_case/${await this.getRunId()}/${caseId}`;
    const response = await this.fetchWithAuth(url);
    const json = await response.json();
    return json;
  }

  public async addAttachmentToResult(resultId: number, filePath: string) {
    const form = new FormData();
    form.append('attachment', fs.createReadStream(filePath));
    const url = `${this.base}/add_attachment_to_result/${resultId}`;
    const response = await this.fetchWithAuth(url, {
      method: 'POST',
      headers: { ...form.getHeaders() },
      body: form,
    });
    return response.json();
  }

  public async publishResults(results: TestRailResult[]) {
    const url = `${this.base}/add_results_for_cases/${await this.getRunId()}`;
    const response = await this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({ results }),
    });
    console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
    console.log(
      '\n',
      ` - Results are published to ${chalk.magenta(
        `${this.options.host}/index.php?/runs/view/${await this.getRunId()}`
      )}`,
      '\n'
    );
    await this.updateCasesType(results);
    return response.json();
  }

  public async closeRun() {
    const url =  `${this.base}/close_run/${await this.getRunId()}`;
    const response = await this.fetchWithAuth(url, {
      method: 'POST'
    })
    console.log('- Test run closed successfully');
  }
}
