---
title: A Small Frontend Tweak for the Blog
date: 2024-01-11T12:23:59+08:00
description: ""
category: tech
badge: Article
slug: a-small-frontend-tweak-for-the-blog
---

 
I switched the blog theme to [Shiro](https://github.com/innei/Shiro), but noticed a pop-up on mobile devices saying "Browser version is too low"?

However, my device is running the latest system and browser versions...

I checked the code on Github and my phone's User Agent (UA), and realized the issue wasn't straightforward:

> Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1

My device is running Chrome on iOS.

-> It's reported as CriOS...

I found this reference: https://chromium.googlesource.com/chromium/src.git/+/HEAD/docs/ios/user_agent.md

Then I tried Safari, and the pop-up appeared there too. It seems the UAs for Safari on iOS and macOS are slightly different. So, I quickly wrote some code to fix it.

(Code block for JavaScript function follows)

``` js
function isSupportedBrowser() {
  const ua = navigator.userAgent;
  const macSafariRegex = /Version\/(\d+).*Safari/;
  const iosVersionRegex = /OS (\d+)_/;
  const chromeRegex = /Chrome\/(\d+)|CriOS\/(\d+)/;
  const firefoxRegex = /Firefox\/(\d+)/;
  const edgeRegex = /Edg\/(\d+)/;
  const operaRegex = /Opera\/(\d+)/;
  const criosRegex = /CriOS\/(\d+)/;

  // macOS Safari
  if (ua.includes('Macintosh') && ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Edg')) {
    const match = ua.match(macSafariRegex);
    return match && parseInt(match[1], 10) >= 16;
  }

  // iOS Safari
  if ((ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) && ua.includes('Safari') && !ua.includes('CriOS') && !ua.includes('Edg')) {
    const match = ua.match(iosVersionRegex);
    return match && parseInt(match[1], 10) >= 16;
  }

  // Chrome or Chrome on iOS (CriOS)
  let match = ua.match(chromeRegex);
  if (match) {
    const version = parseInt(match[1] || match[2], 10); // CriOS 的版本可能在第二个捕获组
    return version >= 110;
  }

  // Edge
  match = ua.match(edgeRegex);
  if (match) {
    return parseInt(match[1], 10) >= 110;
  }

  // Firefox
  match = ua.match(firefoxRegex);
  if (match) {
    return parseInt(match[1], 10) >= 113;
  }

  // Opera
  match = ua.match(operaRegex);
  if (match) {
    return parseInt(match[1], 10) >= 102;
  }
  
  return false;
}

```