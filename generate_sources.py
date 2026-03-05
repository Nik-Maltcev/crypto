import re
import csv
import os

constants_path = r'c:\Users\uzer\Downloads\cryptopulse-ai\constants.ts'
output_path = r'c:\Users\uzer\Downloads\cryptopulse-ai\sources.csv'

with open(constants_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Subreddits
subreddits = []
sub_match = re.search(r'const RAW_SUBREDDITS = Array\.from\(new Set\(\[(.*?)\]\)\);', content, re.DOTALL)
if sub_match:
    subs_raw = sub_match.group(1)
    subreddits = [s.strip().strip('"').strip("'") for s in subs_raw.split(',') if s.strip()]

# Named Accounts
twitter_accounts = []
named_match = re.search(r'const NAMED_ACCOUNTS: TwitterAccountOption\[\] = \[(.*?)\];', content, re.DOTALL)
if named_match:
    named_raw = named_match.group(1)
    urls = re.findall(r'url:\s*"(.*?)"', named_raw)
    twitter_accounts.extend(urls)

# Raw IDs
raw_ids_match = re.search(r'const RAW_TWITTER_IDS = \[(.*?)\];', content, re.DOTALL)
if raw_ids_match:
    ids_raw = raw_ids_match.group(1)
    ids = [i.strip().strip('"').strip("'") for i in ids_raw.split(',') if i.strip()]
    for id_ in ids:
        twitter_accounts.append(f"https://twitter.com/i/user/{id_}")

with open(output_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Type', 'Link/Username/ID'])
    for sub in subreddits:
        writer.writerow(['Subreddit', f"https://www.reddit.com/r/{sub}/"])
    for acc in twitter_accounts:
        writer.writerow(['Twitter', acc])

print("Created sources.csv successfully")
