'use strict';

const lib = require('./lib.js'),
  core = require('@actions/core'),
  github = require('@actions/github');


async function main() {
  // parse/load arguments from context and inputs
  let args = {};
  try {
    args = lib.parseArgs(core,github.context);
  } catch (err) {
    core.setFailed(err.message);
    return;
  }

  // build message payload
  const payload = lib.buildSlackPayload(args.slackChannel,{
    actor: args.actor,
    customFieldList: args.customFieldList,
    githubServerUrl: args.githubServerUrl,
    pullRequestNumber: args.pullRequestNumber,
    pullRequestTitle: args.pullRequestTitle,
    refData: args.refData,
    repositoryName: args.repositoryName,
    result: args.result,
    runId: args.runId,
    runNumber: args.runNumber,
    workflowName: args.workflowName,
  });

  // submit message
  try {
    await lib.sendSlackMessage(args.slackWebhookUrl,payload);
  } catch (err) {
    core.setFailed(err.message);
    return;
  }
}


main();
