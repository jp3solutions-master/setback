# Setback Scorecard

A lightweight, phone-friendly scorekeeper for Setback. Open `index.html` in a browser or publish the repository with GitHub Pages. On a phone, use the browser’s “Add to Home Screen” action for an app-like full-screen experience. The scorecard and app shell are cached for offline use after the first visit.

## Included

- Start a match with editable team names.
- Track High, Low, Jack, and Game points for each hand.
- Choose the bidding team, set a bid from 2 to 4, and have the scorecard determine whether they made it or were set back.
- Play multiple hands until a team reaches 11 points to win a game; track exactly five games and review hand history.
- Save the current match in the browser on the device.
- Switch between light and dark themes; the preference is saved on the device.

## Scoring assumptions in this starter

This first version uses a common four-point Setback score: one point each for High, Low, Jack, and Game. A bid is successful when the bidding team earns at least the bid amount in card points. A successful bid keeps those points; if the team misses the bid, its hand score is the negative bid amount, while the other team keeps the points it earned. Hand scores accumulate until a team reaches 11 points to win the game. The match consists of five games, and the match score tracks games won.

Setback rules vary by table. In particular, the definition of Game and bid scoring can differ. Update the scoring behavior in `app.js` to match your supplied rules when they are available.
