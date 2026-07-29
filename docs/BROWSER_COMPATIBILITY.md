# Browser Compatibility

## Supported Browsers

Chrome is the baseline browser. Firefox and Microsoft Edge are the two additional browsers claimed for this module.

| Browser | Tested version | Rendering engine | Result |
|---|---:|---|---|
| Google Chrome | 150.0.7871.186 | Blink | Pass |
| Mozilla Firefox | 152.0.5 | Gecko | Pass |
| Microsoft Edge | 150.0.4078.105 | Blink | Pass |

## Test Scope

The following workflows were exercised manually in all three browsers:

- registration, password login, logout and authenticated navigation;
- profile editing, avatar rendering, public profiles and achievements;
- friend requests, acceptance, presence, private chat and unread state;
- matchmaking, remote moves, turn timers, resign and completed-game results;
- configurable friend duels, reconnection and return to a current or completed match;
- spectator entry, live updates, spectator chat and previous spectator-chat history;
- leaderboard, match history and move-by-move game review;
- responsive lobby, leaderboard, navigation and chat at narrow viewport widths;
- browser console checked during the core workflows.

## Limitations

No functional browser-specific limitations were found in the tested workflows. Edge can emit an informational intervention message when it replaces lazily loaded images with placeholders; this is browser optimization output, not an application warning or error.

The application uses a self-signed development certificate, so every browser requires the certificate warning to be accepted once before testing HTTPS and secure WebSockets.

Safari was not tested and is not claimed by this module.
