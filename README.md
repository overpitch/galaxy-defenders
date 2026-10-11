# Galaxy Defenders

A pixel-art space shooter made for (and designed by) Murilo. One or two players fly at the bottom of the screen and blast rows of aliens that march slowly down toward them. It runs in a web browser, including Microsoft Edge on Xbox.

## Play online

**https://overpitch.github.io/galaxy-defenders/**

**On Xbox:** open the address in Microsoft Edge, then **hold the Menu ☰ button** for about a second so the controller plays the game instead of moving the cursor.

## How it works

- **The aliens march** side to side, stepping down each time they reach the edge. They speed up as you destroy them. If they reach the bottom line, **they land and the game is over**. The line flashes red when they're close.
- **Some aliens dive** at you (yellow divers especially). Hit one while it's diving for double points.
- **Health bars:** each ship can take a few hits (bumping into an alien or a boss costs 2). After each hit you blink and can't be hurt for a moment.
- If one player is knocked out, the other keeps going. The knocked-out player **comes back at the next wave** with half health.
- Clearing a wave repairs 1 health. Beating a boss repairs everything.
- **One team score**, and the best score is saved.
- After losing, you can **try the same level again**. After beating all 5 levels, you can **keep going** at a harder difficulty.

## Ships

| Ship | Shot | Speed | Power | Armor |
|---|---|---|---|---|
| **Falcon** | Twin blasters | ●●● | ●●● | ●●● |
| **Hornet** | Rapid fire | ●●●●● | ●●● | ●● |
| **Titan** | Triple spread | ● | ●●●● | ●●●●● |
| **Comet** | Piercing laser (goes through aliens) | ●●●● | ●●●●● | ●●● |

If both players pick the same ship, player 2's is a different color.

## Levels and bosses

Each level has 3 waves of aliens and then a boss.

1. **Earth Orbit**: Mega Saucer (fires spreads, drops divers)
2. **Red Planet**: Crab King (claw shots and a big laser; watch for the red warning line)
3. **Ice Moons**: The Eye (rings and spirals of bullets; it watches you)
4. **Hive Nebula**: Hive Queen (sends out divers)
5. **Dark Star**: Dreadnought (everything at once when it's hurt)

Every boss gets angrier at half health (its health bar turns red).

## Controls

| | Xbox controller | Keyboard player 1 | Keyboard player 2 |
|---|---|---|---|
| Move | Left stick / d-pad | W A S D | Arrow keys |
| Shoot (hold) | A, X, RB or RT | Space or J | / or . or Numpad 0 |
| Back (menus) | B | K | , |
| Pause | Menu ☰ | Esc or P | Backspace or Numpad Enter |

On the ship select screen, player 2 joins by pressing A on a second controller.

## Files

- `index.html` loads everything. Bump the `?v=` numbers on the script links when you publish changes, so browsers (and the Xbox) fetch the new files.
- `js/core.js`: screen, sounds, and controls.
- `js/sprites.js`: all the pixel art (each sprite is rows of letters, one letter per color) and the planets.
- `js/game.js`: ships, aliens, bosses, levels, and drawing the game.
- `js/main.js`: title, ship select, pause, game over and victory screens.
- `tests/bot.js`: robot pilots play the whole game at top speed to check nothing crashes and every level can be beaten. In the browser console, load the script and run `botAll()`.
