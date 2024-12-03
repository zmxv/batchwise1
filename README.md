# Batchwise

Batchwise is a no-code data processing web application that leverages Chrome's built-in AI capabilities to transform CSV data row by row using natural language instructions.

## Key Features
- Process CSV files using plain English instructions 
- All processing happens locally—no data leaves your device
- Simple interface for uploading, transforming, and saving data

## Demo

Try it at: [https://batchwise.pages.dev](https://batchwise.pages.dev)

Prerequisites:
- Latest Chrome Canary or Chrome Dev build
- Gemini Nano model installed

## How to Use

1. **Upload Data**: Click _Load_ to upload your CSV file
2. **Write Instructions**: Enter natural language instructions for processing rows
3. **Process**: Click _Run_ to transform the data based on your instructions
4. **Save**: Click _Save_ to download the processed CSV

In your instructions, use `{1}`, `{2}`, `{3}`, etc. to reference specific column values.

### Example Instructions

* `Categorize the news headline "{1}" into: "Politics", "Business", "Sports", or "Others". Return nothing else.`
* `Translate "{1}" into {3} in a {2} tone. Return nothing else.`
* `Extract the car make from "{1}". Fix misspellings if any. Return nothing else.`

## Development

To run locally:
```bash
npm install
npm run dev
```

## Limitations

- This is a proof-of-concept created for the [Google Chrome built-in AI Challenge](https://developer.chrome.com/blog/ai-challenge)
- Not intended for production use
- Gemini Nano has limited capabilities compared to larger models
- Pull requests are not being accepted

## License
MIT
