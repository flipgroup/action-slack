# Action Slack

[![Test](https://github.com/flipgroup/action-slack/actions/workflows/test.yml/badge.svg)](https://github.com/flipgroup/action-slack/actions/workflows/test.yml)

GitHub Action for sending Slack messages at the start and/or end of a Workflow run.

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
    runs-on: ubuntu-latest
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
    runs-on: ubuntu-latest
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
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v3

      # -- further job steps --

      - name: Slack message
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
