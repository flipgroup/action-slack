# Action Slack

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
  first:
    name: First job
    runs-on: ubuntu-latest
    steps:
      - name: Slack message start
        uses: flipgroup/action-slack@main
        with:
          channel: '#target-channel'
          webhook-url: ${{ secrets.SLACK_INCOMING_WEBHOOK_URL }}

      # -- further job steps --

  second:
    name: Second job
    runs-on: ubuntu-latest
    steps:
      # -- further job steps --

  slack-message:
    name: Slack message
    if: always()
    needs:
      - first
      - second
    runs-on: ubuntu-latest
    steps:
      - name: Slack message finish
        uses: flipgroup/action-slack@main
        with:
          channel: '#target-channel'
          field-list: |
            Custom field 1|Value
            Custom field 2|Value
          result: ${{ join(needs.*.result,'|') }}
          webhook-url: ${{ secrets.SLACK_INCOMING_WEBHOOK_URL }}
```
