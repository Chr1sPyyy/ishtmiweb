# Ishtmi – Streamer-Webseite

Statische Fan-/Community-Seite für den Twitch-Streamer **Ishtmi** (Planet Zoo 1 & 2, Graveyard Keeper II).
Kein Build, kein Framework: einfach `index.html` öffnen oder den Ordner auf einen Webspace laden.

## Struktur

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenaufbau: animierter Hero, Stream, Info, Streamplan, News, Workshop, Games, Setup, Footer |
| `css/style.css` | Design & Animationen (Farben oben in `:root`) |
| `js/data.js` | **Alle Inhalte zum Bearbeiten**: Streamplan, Info-Kacheln, News, Games, Setup |
| `js/data.js` → `HERO`, `SCENES` | Hero-Video/Diashow und die fünf Scroll-Szenen (Bild, Effekt, Texte) |
| `js/workshop.js` | Steam-Workshop-Items (Titel, Bild, Abos, Favoriten, Aufrufe, Kurztext) und die Highlight-Auswahl |
| `js/main.js` | Logik: Hero-Video, Szenen, Rendern der Daten, Live-Status, Countdown, Twitch-Player |
| `js/fx.js` | Erlebnis-Schicht: Intro-Vorhang, Smooth Scroll (Lenis), eigener Cursor, Magnet-Buttons, Split-Text, Zähler, Spotlight, Pfoten-Navigation, Welt-Ebene, Leistungsmodus |

## Inhalte pflegen

Alles Inhaltliche steht in `js/data.js`:

- **Streamplan** (`SCHEDULE`): pro Tag `slot` auf `"offline"`, `"vormittags"` oder `"abends"` setzen.
  Optional `time` (z. B. `"ab ca. 19 Uhr"`) und `special` (z. B. `"Bastelei"`).
- **News** (`NEWS`): neuen Eintrag oben einfügen, Datum im Format `JJJJ-MM-TT`. Der neueste Eintrag wird groß dargestellt.
- **Games** (`GAMES`): `status` ist `"aktuell"`, `"geplant"` oder `"pausiert"`. Cover sind Twitch-Boxart-URLs, eigene Bilder gehen genauso.
- **Setup** (`SETUP`): drei Listen (Rechner, Zubehör, Software).

### Steam Workshop (`js/workshop.js`)

- `WORKSHOP` enthält alle Items mit Abos/Favoriten/Aufrufen als Momentaufnahme. Neue Items einfach als weitere Zeile ergänzen
  (ID aus der Workshop-URL, Bild-URL ohne `?…`-Parameter).
- Die drei Highlights oben wählt die Seite automatisch nach Beliebtheit (Abos > Favoriten > Aufrufe, Sterne geben Bonus).
  Wer selbst bestimmen will, trägt bis zu drei IDs in `WORKSHOP_FEATURED` ein, z. B. `["2983287093", "2940254077", "3171840511"]`.
- `blurb` ist der Kurztext auf der Karte; leer lassen, wenn keiner gewünscht ist.

## Hero & Scroll-Szenen

- Der Hero zeigt den offiziellen Planet-Zoo-2-Launch-Trailer (HLS-Stream von Steam, stumm, per hls.js) über einer
  Ken-Burns-Diashow aus Store-Screenshots. Ohne Video (Datensparmodus, reduzierte Bewegung, Fehler) bleibt die Diashow.
  Lautsprecher-Button unten rechts schaltet den Ton ein.
- Zwischen den Sektionen liegen fünf Scroll-Szenen (`SCENES` in `js/data.js`). Jede ist 190vh hoch, das Bild klebt im
  Viewport und `main.js` schreibt den Fortschritt in die CSS-Variable `--p`. Effekte: `pan` (Kamerafahrt),
  `dive` (Kreisblende + Lichtstrahlen + Blasen), `wipe` (Vorher/Nachher-Regler mit zwei Bildern), `dusk` (Tag → Nacht mit
  Sternen und Mond), `zoomout` (Herauszoomen). Bild tauschen = URL in `SCENES` ändern; Szene entfernen = Eintrag löschen
  oder den `<div class="scene-slot">` in `index.html` entfernen.
- Alle Bilder sind Hotlinks: Planet-Zoo-2-Screenshots vom Steam-Store (© Frontier Developments), Workshop-Bilder von
  Ishtmis Steam-Profil. Für eine dauerhafte Lösung die Bilder lokal unter `img/` ablegen und die URLs anpassen.

## Erlebnis-Schicht (`js/fx.js`)

- **Intro-Vorhang** nur beim ersten Aufruf pro Browser-Sitzung (sessionStorage `ishtmi-intro`). Zum erneuten Ansehen
  ein neues Tab öffnen oder den Eintrag löschen.
- **Smooth Scroll** per [Lenis](https://lenis.darkroom.engineering/) (CDN), nur mit Maus/Trackpad, nicht bei Touch oder
  reduzierter Bewegung.
- **Eigener Cursor**, **magnetische Buttons** (`.magnetic`), **Spotlight** auf Karten und **Pfoten-Navigation** rechts
  gibt es nur auf Geräten mit Maus. Auf Touch bleibt alles normal bedienbar.
- **Countdown** rechnet mit den Startzeiten aus `SLOTS` in `js/data.js` (`start`, `hours`, `approx`). Die Zeiten
  10:00 und 19:00 Uhr sind Platzhalter und werden als „ca.“ angezeigt – bitte an die echten Zeiten anpassen.
- **Zähler** im Stats-Band: Follower kommen live von decapi, Workshop-Abos und Items werden aus `js/workshop.js` summiert.
- Alles respektiert `prefers-reduced-motion`: dann keine Intro-Animation, kein Grain, kein Cursor, keine Scroll-Effekte.

## Welt-Ebene & Etagen

- Hinter allen normalen Sektionen liegt eine fixe „Welt“ (`WORLD` in `js/data.js`): pro Sektion ein Biom-Bild, das beim
  Scrollen überblendet, dazu Etagen-Schild („Ebene 02 · Dschungel“) und Entdeckungen (`critters`): Vögel, fallende
  Blätter, Giraffe, Blasen, Fische, Schmetterlinge, Luftballons, laufender Elefant, Sterne, Glühwürmchen, Seilbahn.
- Biom tauschen = Bild-URL ändern; Entdeckungen anpassen = Liste in `critters` ändern.
- Alle Effekte nutzen nur transform/opacity (keine Filter oder Blend-Modi), damit das Scrollen flüssig bleibt.

## Performance & Leistungsmodus

- **Grundregeln:** Animiert werden nur `transform` und `opacity`. Keine Weichzeichner, Blend-Modi, Clip-Masken oder
  Farbfilter auf großen Flächen. Nichts läuft dauerhaft pro Frame: Effekte rechnen nur bei Scroll oder Mausbewegung.
- **Außerhalb des Bildes** werden alle CSS-Animationen angehalten (Klasse `offscreen`), Tier-Animationen gar nicht gerendert.
- **Trailer** höchstens in 720p, Glühwürmchen-Canvas in einfacher Pixeldichte, Bilder werden vor dem Einblenden dekodiert.
- **Leistungsmodus** (`<html class="lite">`): kein Video, kein Smooth Scroll, kein eigener Cursor, keine Tiere,
  keine Dauer-Animationen. Wird automatisch gewählt
  - auf Geräten mit Touch, höchstens 4 Kernen, höchstens 4 GB Speicher oder Datensparmodus,
  - oder wenn die Messung nach dem Intro zu viele langsame Frames sieht (dann erscheint ein Hinweis mit „Alle Effekte“).
- Umschalten jederzeit über den Button **„✨ Effekte“** im Footer. Die Wahl wird im Browser gespeichert
  (`localStorage` `ishtmi-fx`). Zum Testen: `?fx=lite` oder `?fx=full` an die Adresse hängen.

## Live-Status & Player

- Der Live-Status (Live/Offline, Spiel, Titel, Uptime, Follower) kommt ohne API-Key von
  [decapi.me](https://decapi.me) und wird alle zwei Minuten aktualisiert.
  Ist der Dienst nicht erreichbar, zeigt die Seite neutral den nächsten geplanten Stream.
- Der Twitch-Player braucht die Domain, auf der die Seite läuft (`parent`-Parameter).
  Das passiert automatisch über `location.hostname`. Lokal funktioniert er nur über einen
  kleinen Webserver (siehe unten), nicht per Doppelklick auf die Datei.

## Lokal ansehen

```bash
python -m http.server 8080
```

Dann `http://localhost:8080` im Browser öffnen.

## Veröffentlichen

**Live:** https://chr1spyyy.github.io/ishtmiweb/ (GitHub Pages, Repository `Chr1sPyyy/ishtmiweb`, Branch `main`, Ordner `/`).

Jeder Push auf `main` ist nach ein bis zwei Minuten online:

```bash
git add -A && git commit -m "Update" && git push
```

Eigene Domain: in den Repository-Einstellungen unter Pages eintragen und beim Domain-Anbieter einen CNAME auf
`chr1spyyy.github.io` setzen. HTTPS ist nötig, damit der Twitch-Player eingebettet werden darf.
