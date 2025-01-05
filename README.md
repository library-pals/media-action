# media-action

This GitHub action helps you track the tv shows or movies that you watch by updating a JSON file in your repository. Pair it with an iOS Shortcut to automatically trigger the action or click **Run workflow** from the Actions tab to submit details about the media.

[Create a workflow dispatch event](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event) with information about the media.

Given a [data provider identifier](#data-providers), the action will fetch the media's metadata and commit the change in your repository, always sorting by the date you finished the media.

## Data providers

Depending on the type of `identifier` you submit to the action, it will use the following data provider.

| Identifier | Provider                                        | Example `identifier` value             |
| ---------- | ----------------------------------------------- | -------------------------------------- |
| IMDb URL   | [IMDb](https://www.imdb.com/) via meta scraping | `https://www.imdb.com/title/tt7908628` |

## Media lifecycle

When you add or update media, you can set it as: `want to watch`, `watching`, or `watched`. This will set the value as `status` and will add an accompanying date for the status.

To update the media's status, trigger the action using the same identifier (IMDb URL) that you used in the initial request.

<!-- START GENERATED DOCUMENTATION -->

## Set up the workflow

To use this action, create a new workflow in `.github/workflows` and modify it as needed:

```yml
name: Add to media log
run-name: 🎬 ${{ inputs['media-status'] }} ${{ inputs.identifier }}

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
        uses: library-pals/media-action@v0.1.0

      - name: Download the book thumbnail
        if: steps.media-log.outputs.media-thumbnail != ''
        run: curl "${{ steps.media-log.outputs.media-thumbnail-url }}" -o "img/${{ steps.media-log.outputs.media-thumbnail }}"

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
