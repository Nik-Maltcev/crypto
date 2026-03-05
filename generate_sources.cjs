const fs = require('fs');

const constantsPath = 'c:/Users/uzer/Downloads/cryptopulse-ai/constants.ts';
const outputPathTxt = 'c:/Users/uzer/Downloads/cryptopulse-ai/sources.txt';
const outputPathCsv = 'c:/Users/uzer/Downloads/cryptopulse-ai/sources.csv';

const content = fs.readFileSync(constantsPath, 'utf8');

// Subreddits
const subMatch = content.match(/const RAW_SUBREDDITS = Array\.from\(new Set\(\[(.*?)\]\)\);/s);
let subreddits = [];
if (subMatch) {
    const subsRaw = subMatch[1];
    subreddits = subsRaw.split(',').map(s => s.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')).filter(s => s);
}

// Named Accounts
const namedMatch = content.match(/const NAMED_ACCOUNTS: TwitterAccountOption\[\] = \[(.*?)\];/s);
let twitterAccounts = [];
if (namedMatch) {
    const namedRaw = namedMatch[1];
    const urlMatches = namedRaw.matchAll(/url:\s*"(.*?)"/g);
    for (const match of urlMatches) {
        twitterAccounts.push(match[1]);
    }
}

// Raw IDs
const rawIdsMatch = content.match(/const RAW_TWITTER_IDS = \[(.*?)\];/s);
if (rawIdsMatch) {
    const idsRaw = rawIdsMatch[1];
    const ids = idsRaw.split(',').map(i => i.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')).filter(i => i);
    ids.forEach(id => {
        twitterAccounts.push(`https://twitter.com/i/user/${id}`);
    });
}

// Write TXT
let txtContent = "=== SUBREDDITS ===\n";
subreddits.forEach(sub => txtContent += `https://www.reddit.com/r/${sub}/\n`);
txtContent += "\n=== TWITTER ACCOUNTS ===\n";
twitterAccounts.forEach(acc => txtContent += `${acc}\n`);
fs.writeFileSync(outputPathTxt, txtContent, 'utf8');

// Write CSV
let csvContent = "Type,Link/Username/ID\n";
subreddits.forEach(sub => csvContent += `Subreddit,https://www.reddit.com/r/${sub}/\n`);
twitterAccounts.forEach(acc => csvContent += `Twitter,${acc}\n`);
fs.writeFileSync(outputPathCsv, csvContent, 'utf8');

console.log('Created sources.txt and sources.csv successfully');
