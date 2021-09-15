'use strict';

const lib = require('./lib.js'),
  core = require('@actions/core'),
  github = require('@actions/github');


async function main() {
  // parse/load arguments from context and inputs
  let args = {};
  try {
    args = lib.parseArgs(core,github.context);
  } catch (ex) {
    core.setFailed(ex.message);
    return;
  }

  // build message payload
  const payload = lib.buildSlackPayload(args.slackChannel,{
    actor: args.actor,
    branchName: args.branchName,
    customFieldList: args.customFieldList,
    eventName: args.eventName,
    pullRequestNumber: args.pullRequestNumber,
    pullRequestTitle: args.pullRequestTitle,
    repositoryName: args.repositoryName,
    result: args.result,
    runId: args.runId,
    runNumber: args.runNumber,
    workflowName: args.workflowName,
  });

  // submit message
  try {
    await lib.sendSlackMessage(args.slackWebhookUrl,payload);
  } catch (ex) {
    core.setFailed(ex.message);
    return;
  }
}


main();
