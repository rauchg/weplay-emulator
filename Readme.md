
# weplay-emulator

## How to install

Make sure `cairo` is installed, then run:

```bash
$ npm install
```

Then run it with the following ENV vars:

- `WEPLAY_ROM` - pointing to the rom you want to emulate
- `WEPLAY_REDIS` - redis uri (`localhost:6379`)
- `WEPLAY_SAVE_INTERVAL` - state save frequency (`60000`)

```
$ WEPLAY_ROM=path/to/rom.gb node index
```

## License

MIT
