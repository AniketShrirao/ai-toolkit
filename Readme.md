# AI Toolkit for Data Extraction and Summarization

## Introduction
    This project provides a comprehensive set of tools to extract data from various sources such as PDFs, Markdown files, OCR images, URLs, and Excel spreads
    files. It also includes a prompt generator that helps you create effective questions based on the extracted content.
    
## Features
    - **Data Extraction**: Extract text, tables, and other relevant information from different  sources like PDFs, Markdown files, OCR images, URLs, and Excel spreadsheets.
    - **Summarization**: Generate concise summaries of the extracted data in bullet points.
    - **Tagging**: Identify key terms or topics related to the content using a predefined list of tags.
    - **Question Generation**: Create detailed technical questions based on the provided content.

## Getting Started

### Prerequisites
- Node.js installed on your system.

### Installation
1. Clone this repository:
   git clone https://github.com/AniketShrirao/ai-toolkit.git


2. Install dependencies:
    npm install

3. Run the following command to start the server and listen for incoming requests:
    `node index.js sample.pdf`
    This will convert the PDF file into a JSON format
    and save it in the output folder.

    `node index.js sample.md`
    This will convert the Markdown file into a JSON format
    and save it in the output folder.

    `node index.js sample.png`
    This will extract text from the OCR image and save it in the output folder.
    
    `node index.js sample.jpg`
    This will extract text from the OCR image and save it in the output folder.

    `node index.js sample.pdf --summary`
    This will convert the PDF file into a JSON format, generate a summary of the content,
    and save it in the output folder.

    `node index.js sample.md --tags`
    This will convert the Markdown file into a JSON format, extract tags from the content,
    and save them in the output folder.

    `node index.js sample.png --qna`
    This will extract text from the OCR image and generate 5 detailed technical questions and answers
    
## Usage
- Install dependencies: `npm install`
- Run the script with a file path as an argument, e.g. `node index.js sample.pdf`

## License
MIT
