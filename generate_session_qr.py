import asyncio
import qrcode
from telethon import TelegramClient
from telethon.sessions import StringSession

# Updated script to generate a StringSession for Telethon via QR code login
# Now with ASCII QR code display in terminal

async def generate_qr():
    print("--- Telegram QR Session Generator ---")
    api_id = input("Enter your API_ID: ").strip()
    api_hash = input("Enter your API_HASH: ").strip()

    if not api_id or not api_hash:
        print("Error: API_ID and API_HASH are required.")
        return

    client = TelegramClient(StringSession(), int(api_id), api_hash)
    await client.connect()

    qr_login = await client.qr_login()
    
    print("\n" + "="*50)
    print("SCAN THIS QR CODE WITH YOUR TELEGRAM APP")
    print("Settings > Devices > Link Desktop Device")
    print("="*50 + "\n")

    # Generate and print ASCII QR code
    qr = qrcode.QRCode()
    qr.add_data(qr_login.url)
    qr.print_ascii(invert=True)

    print("\n" + "="*50)
    print(f"URL (if QR doesn't work): {qr_login.url}")
    print("="*50 + "\n")
    
    print("Waiting for scan...")
    
    try:
        # Wait for the login to complete
        user = await qr_login.wait()
        print(f"\nSuccessfully logged in as {user.first_name}!")
        
        print("\n--- NEW SESSION STRING BELOW ---")
        print("--------------------------------------------------")
        print(client.session.save())
        print("--------------------------------------------------")
        print("\nPaste this into TELETHON_SESSION in Railway.")
        
    except Exception as e:
        print(f"\nLogin failed or timed out: {e}")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(generate_qr())
