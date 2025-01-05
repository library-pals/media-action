# media-action

Keep a media log


<!-- START GENERATED DOCUMENTATION -->

## Set up the workflow

To use this action, create a new workflow in `.github/workflows` and modify it as needed:

```yml
name: media action
run-name: 🎬 ${{ inputs['media-status'] }} media ${{ inputs.identifier }}

# Grant the action permission to write to the repository
permissions:
  contents: write

# Trigger the action
on:
  workflow_dispatch:
    inputs:
      media-status:
        description: What is the status of the media? Required.
        required: true
        type: choice
        default: "want to watch"
        options:
          - "want to watch"
          - "watching"
          - "watched"
          - "summary" # Outputs your media summary year to date
      identifier:
        description: The media's identifier. Required.
        # Example values:
        # https://www.imdb.com/title/tt7908628/
        type: string
      date:
        description: Date to record the status of the media (YYYY-MM-DD). Leave blank for today.
        type: string
      notes:
        description: Notes about the media. Optional.
        type: string
      # Adding a rating is optional.
      # You can change the options to whatever you want to use.
      # For example, you can use numbers, other emoji, or words.
      rating:
        description: Rate the media. Optional.
        type: choice
        default: "unrated"
        options:
          - "unrated"
          - ⭐️
          - ⭐️⭐️
          - ⭐️⭐️⭐️
          - ⭐️⭐️⭐️⭐️
          - ⭐️⭐️⭐️⭐️⭐️
      # Tags are optional.
      tags:
        description: Add tags to categorize the media. Separate each tag with a comma.
        type: string

# Set up the steps to run the action
jobs:
  update-library:
    runs-on: ubuntu-latest
    name: Media
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Media
        id: media-log
        uses: library-pals/media-action@v0.0.0

      - name: Commit updated media file
        if: inputs['media-status'] != 'summary'
        run: |
          git pull
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A && git commit -m "🎬 “${{ steps.media-log.outputs.media-title }}” (${{ inputs['media-status'] }})"
          git push
```

## Action options

- `filename`: The file where you want to save your media. Default: `_data/media.json`.

## Trigger the action

To trigger the action, [create a workflow dispatch event](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event) with the following body parameters:

```js
{
  "ref": "main", // Required. The git reference for the workflow, a branch or tag name.
  "inputs": {
    "media-status": "", // Required. What is the status of the media? Required. Default: `want to watch`. Options: `want to watch`, `watching`, `watched`, `summary`.
    "identifier": "", // The media's identifier. Required.
    "date": "", // Date to record the status of the media (YYYY-MM-DD). Leave blank for today.
    "notes": "", // Notes about the media. Optional.
    "rating": "", // Rate the media. Optional. Default: `unrated`. Options: `unrated`, `⭐️`, `⭐️⭐️`, `⭐️⭐️⭐️`, `⭐️⭐️⭐️⭐️`, `⭐️⭐️⭐️⭐️⭐️`.
    "tags": "", // Add tags to categorize the media. Separate each tag with a comma.
  }
}
```



## Action outputs

- `now-watching`: The current media you are watching.

- `media-thumbnail`: The thumbnail of the current media you are watching.

- `media-thumbnail-url`: The URL of the thumbnail of the current media you are watching.

- `media-status`: The status of the current media.

- `media-title`: The title of the current media.
<!-- END GENERATED DOCUMENTATION -->
