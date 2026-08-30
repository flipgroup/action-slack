# Action Slack

[![Test](https://github.com/flipgroup/action-slack/actions/workflows/test.yml/badge.svg)](https://github.com/flipgroup/action-slack/actions/workflows/test.yml)

GitHub Action for sending Slack messages at the start and/or end of a Workflow run, or when approval is required.

## Usage

Single job workflow:

```yaml
jobs:
  main:
    name: Single job
    runs-on: ubuntu-latest
    steps:
      - name: Slack message start
        uses: flipgroup/action-slack@main
        with:
          channel: '#target-channel'
          webhook-url: ${{ secrets.SLACK_INCOMING_WEBHOOK_URL }}

      # -- further job steps --

      - name: Slack message finish
        if: always()
        uses: flipgroup/action-slack@main
        with:
          channel: '#target-channel'
          field-list: |
            Custom field 1|Value
            Custom field 2|Value
          result: ${{ job.status }}
          webhook-url: ${{ secrets.SLACK_INCOMING_WEBHOOK_URL }}
```

Multiple job workflow:

```yaml
jobs:
  slack-message-start:
    name: Slack message start
    runs-on: ubuntu-slim
    steps:
      - name: Slack message
        uses: flipgroup/action-slack@main
        with:
          channel: '#target-channel'
          webhook-url: ${{ secrets.SLACK_INCOMING_WEBHOOK_URL }}

  first:
    name: First job
    runs-on: ubuntu-latest
    steps:
      # -- further job steps --

  second:
    name: Second job
    runs-on: ubuntu-latest
    steps:
      # -- further job steps --

  slack-message-finish:
    name: Slack message finish
    if: always()
    needs:
      - slack-message-start
      - first
      - second
    runs-on: ubuntu-slim
    steps:
      - name: Slack message
        uses: flipgroup/action-slack@main
        with:
          channel: '#target-channel'
          field-list: |
            Custom field 1|Value
            Custom field 2|Value
          result: ${{ join(needs.*.result,'|') }}
          webhook-url: ${{ secrets.SLACK_INCOMING_WEBHOOK_URL }}
```

Message only upon cancelled or failed workflow:

```yaml
jobs:
  main:
    name: Job cancelled or failure
    runs-on: ubuntu-slim
    steps:
      # -- insert job steps --

      - name: Slack message failure
        if: (cancelled() || failure()) && (github.ref == 'refs/heads/main')
        uses: flipgroup/action-slack@main
        with:
          channel: '#target-channel'
          field-list: |
            Custom field 1|Value
            Custom field 2|Value
          result: ${{ job.status }}
          webhook-url: ${{ secrets.SLACK_INCOMING_WEBHOOK_URL }}
```

Message when approval is required:

```yaml
  slack-message-approval:
    name: Slack message approval
    runs-on: ubuntu-slim
    needs:
      - evaluator
    if: needs.evaluator.outputs.approval-required == 'true'
    steps:
      - name: Slack message approval
        uses: flipgroup/action-slack@main
        with:
          channel: ${{ inputs.slack-channel }}
          result: approval_required
          field-list: |
            Approval required|<@TODO> please review and approve
          webhook-url: ${{ secrets.GEPPETTO_SLACK_INCOMING_WEBHOOK_URL }}
```
