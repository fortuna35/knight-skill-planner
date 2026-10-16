# Knight Skill Planner

A small, fan-made, offline planner for manually organizing up to eight skillbar notes. It uses plain HTML, CSS, and JavaScript with no external libraries, CDN resources, accounts, analytics, or network calls.

This project is not affiliated with or endorsed by Knight Online, NTTGame, or Mgame. It does not connect to the game, read game files or processes, interact with anti-cheat software, send input, run macros, or provide an executable skill mapping. Cooldown text is a note only; no timer runs.

## Use

Serve this folder over localhost because the page uses native JavaScript modules. With Python installed, open a terminal in this folder and run `python -m http.server 8000 --bind 127.0.0.1`, then visit `http://127.0.0.1:8000`. Stop the server when you are done. No package installation or build step is required.

Add up to eight skill names and optional manual reminders, choose a role label, and reorder the notes with the accessible Move up / Move down buttons. Your plan is stored in this browser's local storage. Use **Export JSON** for a copy you control or **Import JSON** to restore a validated planner file. Imported files are limited to 100 KB and the app's own schema. Clear Plan removes the local plan.

The project is intended for planning and personal reference. Use Knight Online only through the official client and follow the official rules. This tool does not determine whether any third-party software is approved by the game operator.

## Tests

With Node.js 18 or newer, run `node --test`. Tests cover schema validation, the eight-slot limit, editing, deletion, reordering, and invalid/oversized imports.

## License

MIT. See `LICENSE`.
