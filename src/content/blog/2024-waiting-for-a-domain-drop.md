---
title: Waiting for a Domain Drop
date: 2025-01-04T04:44:22+08:00
description: ""
category: tech
tag:
  - Python
image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop'
badge: Article
slug: waiting-for-a-domain-drop
---

I'm not a domain player, but I do have a few domains saved—they're like digital collectibles.

Good domains are usually snatched up (pre-registered) by domain platforms during the redemption period. If the original owner doesn't pay a high price to redeem them, the pre-registrant gets them. Even some average domains, when about to drop, are registered by platforms first (for a period) and then put up for auction or sold on marketplaces like Dan.com, which is honestly quite frustrating.

In summary -> It's almost impossible to wait for a nice domain to drop naturally.

Only domain hacks composed of less mainstream country code TLDs (like those in Africa) are worth registering, such as p.ng or v.ps. Recently, I saw an .ee domain on expireddomains.net that is about to drop, and I'm going to try and register it. Since I don't know the exact time it will drop, I wrote a script to monitor it.

(Code block for Python script follows)

``` python
import time
import requests
from xml.etree import ElementTree

# Configuration parameters
WHOIS_API_KEY = "YOUR_API_KRY"
DOMAIN = "xx.ee"
WHOIS_API_URL = f"https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey={WHOIS_API_KEY}&domainName={DOMAIN}"

TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN" 
TELEGRAM_CHAT_ID = "YOUR_CHAT_ID" 
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

# Function: Send message via Telegram
def send_telegram_message(message):
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
    }
    try:
        response = requests.post(TELEGRAM_API_URL, json=payload)
        response.raise_for_status()
        print("Telegram notification sent.")
    except requests.exceptions.RequestException as e:
        print(f"Failed to send Telegram message: {e}")

# Function: Check domain status
def check_domain_status():
    try {
        response = requests.get(WHOIS_API_URL)
        response.raise_for_status()
        tree = ElementTree.fromstring(response.content)
        status = tree.findtext(".//status")
        raw_text = tree.findtext(".//rawText")
        data_error = tree.findtext(".//dataError")

        # Check if domain is available for registration
        if data_error == "MISSING_WHOIS_DATA" or "Domain not found" in raw_text or "expired" not in status :
            print(f"Domain {DOMAIN} is now available!")
            send_telegram_message(f"Domain {DOMAIN} is now available!")
            return True
        else:
            print(f"Current domain status: {status}")
    } catch (requests.exceptions.RequestException e) {
        print(f"WHOIS query failed: {e}")
    }
    return False

# Main loop: Check domain status every 30 seconds
def main():
    while True:
        print("Checking domain availability...")
        if check_domain_status():
            break
        time.sleep(30) 

if __name__ == "__main__":
    main()

```


Direct queries are too slow—the .ee registry response time is an issue...
