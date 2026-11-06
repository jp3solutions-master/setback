# Setback Scorecard

A lightweight, phone-friendly scorekeeper for Setback. Open `index.html` in a browser or publish the repository with GitHub Pages. On a phone, use the browser’s “Add to Home Screen” action for an app-like full-screen experience. The scorecard and app shell are cached for offline use after the first visit.

## Included

- Start a match with editable team names.
- Track High, Low, Jack, and Game points for each hand.
- Choose the bidding team, set a bid from 2 to 4, and have the scorecard determine whether they made it or were set back.
- Set a target score and exact number of games at the welcome screen (defaults: 11 points and 5 games); every selected game is played. Optionally require a 2-point lead to win each game, and review hand history.
- Save the current match in the browser on the device.
- Switch between light and dark themes; the preference is saved on the device.
- Increase or decrease text size with the A− / A+ controls; sizing preference is saved on the device.
- Keep the hand-scoring action pinned to the bottom of the screen on phones.

## Scoring assumptions in this starter

This first version uses a common four-point Setback score: one point each for High, Low, Jack, and Game. A bid is successful when the bidding team earns at least the bid amount in card points. A successful bid keeps those points; if the team misses the bid, its hand score is the negative bid amount, while the other team keeps the points it earned. Hand scores accumulate until a team reaches the selected target to win the game. Win by 2 can be enabled in setup. The match always plays the selected number of games in full, and the match score tracks game wins without a best-of cutoff.

Setback rules vary by table. In particular, the definition of Game and bid scoring can differ. Update the scoring behavior in `app.js` to match your supplied rules when they are available.

Created by Jerry Piscitelli 2026 | JP3SOLUTIONS

Donate to this project at https://account.venmo.com/u/pisci2727