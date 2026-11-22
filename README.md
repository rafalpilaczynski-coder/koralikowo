# Koralikowo (Wersja Web dla GitHub Pages)

Statyczna aplikacja przeglądarkowa działająca w 100% po stronie klienta (**HTML + CSS + JavaScript**), bez backendu, bez bazy danych i bez połączenia z LLM.

## Jak opublikować na GitHub Pages (w 2 minuty)

1. Utwórz nowe publiczne repozytorium na GitHubie (np. `koralikowo`).
2. Wrzuć **zawartość folderu `gh-pages/`** (`index.html`, `styles.css`, `app.js`) bezpośrednio do gałęzi `main` tego repozytorium.
3. Na GitHubie wejdź w **Settings → Pages**.
4. W sekcji **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` oraz folder `/ (root)`
5. Kliknij **Save**. Po ~30 sekundach aplikacja będzie dostępna pod adresem:
   `https://<twoj-login>.github.io/koralikowo/`

## Funkcje
- Prostokątne podkładki (`5×5`, `10×15`, `15×15`, `15×20`, `20×20`, `29×29` lub dowolne `3–60`).
- Wgrywanie obrazów JPG/PNG/WebP + wbudowane przykłady.
- Kwantyzacja CIE Lab K-Means++, ręczny wybór koralików z 36-kolorowej palety, próg tolerancji odcieni ΔE oraz globalna zamiana koloru w całym projekcie.
- Interaktywna mapa wzoru (zoom, przesuwanie, tryb odhaczania układanych koralików) i symulacja ułożenia (*Na podkładce* oraz *Po zaprasowaniu*).
- Eksport do **PNG**, **JPG**, **PDF** oraz udostępnianie projektu przez unikalny link `#p=...`.
