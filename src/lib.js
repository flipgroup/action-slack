'use strict';

const https = require('node:https'),
  url = require('node:url'),

  SLACK_MESSAGE_COLOR = {
    cancelled: '#808080',
    failure: '#a30200',
    start: '#ffa500',
    success: '#2eb886',
  };


function parseArgs(core,context) {
  // extract base context data
  const data = {
    actor: context.actor,
    githubServerUrl: context.serverUrl,
    refData: parseArgsRef(context.ref),
    runId: context.runId,
    runNumber: context.runNumber,
    // strip leading file path when workflow name not set
    workflowName: context.workflow.replace(/^\.github\/workflows\//,''),
  };

  if (context.eventName === 'pull_request') {
    // for a pull request, extract branch name from payload - and grab number/title
    const prData = context.payload.pull_request;
    data.pullRequestNumber = prData.number;
    data.pullRequestTitle = prData.title;
    data.refData = {
      isTag: false,
      name: prData.head.ref,
    };
  }

  // get inputs to action
  // input: Slack channel
  data.slackChannel = core.getInput('channel');
  if (data.slackChannel === '') {
    throw new Error('input Slack channel not set');
  }

  // input: custom field list
  data.customFieldList = parseArgsCustomFieldList(core.getMultilineInput('field-list'));

  // input: repository matches the format `owner-name/repository-name`
  data.repositoryName = core.getInput('repository');
  if (!/^[^/ ]+\/[^/ ]+$/.test(data.repositoryName)) {
    throw new Error('input GitHub repository has unexpected format');
  }

  // input: job result(s)
  data.result = parseArgsResult(core.getInput('result'));

  // input: Slack incoming webhook URL
  data.slackWebhookUrl = core.getInput('webhook-url');
  if (!data.slackWebhookUrl.startsWith('https://hooks.slack.com/services/')) {
    throw new Error('input Slack Incoming Webhook URL has unexpected format');
  }

  return data;
}

function parseArgsRef(ref) {
  if (ref.startsWith('refs/tags/')) {
    return {
      isTag: true,
      name: ref.slice(10), // drop `refs/tags/`
    };
  }

  return {
    isTag: false,
    name: ref.replace(/^refs\/heads\//,''), // drop `refs/heads/`, if exists
  };
}

function parseArgsCustomFieldList(fieldList) {
  const titleValueRegexp = /^([^|]+)\|(.+)/,
    resultList = [];

  for (const item of fieldList) {
    const match = titleValueRegexp.exec(item);
    if (match) {
      resultList.push([match[1].trim(),match[2].trim()]);
    }
  }

  return resultList;
}

function parseArgsResult(result) {
  if (result === '') {
    return '';
  }

  let finalResult = 'success';
  for (const item of result.split('|')) {
    // confirm result value is valid
    if (!['success','failure','cancelled','skipped'].includes(item)) {
      throw new Error(`input result value of [${item}] was unexpected`);
    }

    if (item === 'failure') {
      // any job fails - overall failure
      return item;
    }

    if (item === 'cancelled') {
      // any job cancelled - overall result _might_ be cancelled (unless something failed)
      finalResult = item;
    }

    // 'success' or 'skipped' - move along
  }

  return finalResult;
}

function buildSlackPayload(channel,data) {
  function resultText(result) {
    if (result === 'success') {
      return 'finished successfully';
    }

    if (result === 'failure') {
      return 'failed';
    }

    if (result === 'cancelled') {
      return 'been cancelled';
    }

    return 'started';
  }

  function makeSlackLink(title,url) {
    function escape(text) {
      text = ('' + text).replace('&','&amp;');
      text = text.replace('<','&lt;');
      return text.replace('>','&gt;');
    }

    url = url.replace('<','&lt;');
    return `<${escape(url)}|${escape(title)}>`;
  }

  const githubServerUrl = data.githubServerUrl,
    githubRepoUrlBase = `${githubServerUrl}/${data.repositoryName}`,
    payload = {
      channel,
      color: SLACK_MESSAGE_COLOR[data.result || 'start'],
      fallback: `Workflow "${data.workflowName}" has ${resultText(data.result)}`,
      fields: [],
      pretext: `Workflow \`${data.workflowName}\` has *${resultText(data.result)}*`,
    };

  function addField(title,value,short) {
    payload.fields.push({ title,value,short: !!short });
  }

  addField('Repository',makeSlackLink(data.repositoryName,githubRepoUrlBase));
  if (data.pullRequestNumber) {
    addField('Pull request',makeSlackLink(data.pullRequestTitle,`${githubRepoUrlBase}/pull/${data.pullRequestNumber}`));
  } else {
    addField((data.refData.isTag) ? 'Tag' : 'Branch',`\`${data.refData.name}\``);
  }

  addField('Run number',makeSlackLink(data.runNumber,`${githubRepoUrlBase}/actions/runs/${data.runId}`),true);
  addField('Triggered by',makeSlackLink(data.actor,`${githubServerUrl}/${data.actor}`),true);

  for (const item of data.customFieldList) {
    addField(item[0],item[1]);
  }

  return payload;
}

function sendSlackMessage(webhookUrl,payload) {
  return new Promise(function(resolve,reject) {
    // parse webhook URL and start request
    const wh = new url.URL(webhookUrl),
      req = https.request(
        {
          hostname: wh.hostname,
          method: 'POST',
          path: wh.pathname,
        },
        function(resp) {
          // throw away response
          resp.on('data',function() {});

          if (resp.statusCode !== 200) {
            // unable to post message
            reject(new Error('failure posting message to Slack'));
          }

          resolve();
        }
      );

    // close request - sending message payload JSON
    req.end(JSON.stringify(payload));
  });
}


module.exports = {
  parseArgs,
  parseArgsCustomFieldList,
  parseArgsResult,
  buildSlackPayload,
  sendSlackMessage,
};
