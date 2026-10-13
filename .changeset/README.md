# Changesets

Ogni modifica che deve finire nel changelog va descritta con un changeset:

```sh
npm run changeset
```

Scegli `patch` (fix), `minor` (nuove funzionalità) o `major` (breaking change) e scrivi
una riga di descrizione. Il file `.changeset/*.md` va committato insieme alla modifica.

Al push su `main`, la GitHub Action apre (o aggiorna) la PR **"Version Packages"**:
quando la unisci, la versione sale, `CHANGELOG.md` si aggiorna e il pacchetto
viene pubblicato su npm.
