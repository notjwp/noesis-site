# noesis-site

The landing page for [NOESIS](https://github.com/notjwp/Noesis). One static page, no build step.

Run locally: `python -m http.server 8000` in this folder, then open http://localhost:8000/
(ES modules need http, not file://). Tests: http://localhost:8000/tests/ and
`python -m unittest discover tests`. Before committing: `python scripts/check_numbers.py`.

Deploys from `main` / root with GitHub Pages. Every figure on the page is copied from the agent
repository's README and `eval/CHANGELOG.md`; the check script enforces it.
