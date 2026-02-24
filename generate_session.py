from telethon.sync import TelegramClient
from telethon.sessions import StringSession
import sys

# Script to generate a StringSession for Telethon
# Run this and follow the prompts

def generate():
    print("--- Telegram Session Generator ---")
    try:
        api_id = input("Enter your API_ID (from my.telegram.org): ").strip()
        api_hash = input("Enter your API_HASH (from my.telegram.org): ").strip()
        
        if not api_id or not api_hash:
            print("Error: API_ID and API_HASH are required.")
            return

        with TelegramClient(StringSession(), int(api_id), api_hash) as client:
            print("\n--- NEW SESSION STRING BELOW ---")
            print("Copy EVERYTHING between the lines:")
            print("--------------------------------------------------")
            print(client.session.save())
            print("--------------------------------------------------")
            print("\nPaste this string into your TELETHON_SESSION environment variable in Railway.")
    except Exception as e:
        print(f"\nAn error occurred: {e}")

if __name__ == "__main__":
    generate()
