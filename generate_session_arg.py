from telethon.sync import TelegramClient
from telethon.sessions import StringSession
import sys

# Usage: python generate_session_arg.py <API_ID> <API_HASH>

def generate():
    if len(sys.argv) < 3:
        print("Usage: python generate_session_arg.py <API_ID> <API_HASH>")
        return

    api_id = sys.argv[1]
    api_hash = sys.argv[2]
    
    print(f"Connecting with API_ID: {api_id}...")
    
    try:
        # This will STILL prompt for phone/code in the terminal
        with TelegramClient(StringSession(), int(api_id), api_hash) as client:
            print("\n--- NEW SESSION STRING BELOW ---")
            print(client.session.save())
            print("\nPaste this into TELETHON_SESSION in Railway.")
    except Exception as e:
        print(f"\nAn error occurred: {e}")

if __name__ == "__main__":
    generate()
