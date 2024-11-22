import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function transformDate(dateString) {
  if (dateString.length !== 8 || isNaN(dateString)) {
    return dateString; // Return original value if it's not in the expected format
  }
  return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

function findDateColumn(headers, rows) {
  for (let i = 0; i < headers.length; i++) {
    if (rows.every(row => row[i] && row[i].length === 8 && !isNaN(row[i]))) {
      return i;
    }
  }
  return -1;
}

async function processCSV(inputPath, outputPath) {
  try {
    // Read the CSV file
    const fileContent = await fs.readFile(inputPath, 'utf-8');
    const records = parse(fileContent, { columns: true, skip_empty_lines: true });

    if (records.length === 0) {
      throw new Error('The CSV file is empty');
    }

    const headers = Object.keys(records[0]);
    const dateColumnIndex = findDateColumn(headers, records);

    if (dateColumnIndex === -1) {
      throw new Error('Could not find a column with dates in YYYYMMDD format');
    }

    const dateColumnName = headers[dateColumnIndex];

    // Transform dates
    const transformedRecords = records.map(record => {
      const updatedRecord = { ...record };
      updatedRecord[dateColumnName] = transformDate(record[dateColumnName]);
      return updatedRecord;
    });

    // Write the transformed data to a new CSV file
    const output = stringify(transformedRecords, { header: true });
    await fs.writeFile(outputPath, output);

    console.log(`CSV file successfully processed. Output saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error processing CSV:', error.message);
  }
}

async function main() {
  try {
    const inputPath = await promptUser('Enter the path to the input CSV file: ');
    const outputPath = await promptUser('Enter the path for the output CSV file: ');

    await processCSV(inputPath, outputPath);
  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    rl.close();
  }
}

main();
