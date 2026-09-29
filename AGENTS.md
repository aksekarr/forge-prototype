# Repository rules

- This is a dependency-free static site with no build step.
- Never commit.
- Never change localStorage keys or the saved-state format except additively.
- Never tighten personal-link validation.
- Testers use the live site on main, so work on branches.
- Keep new styles and scripts in their own files rather than growing app.js or styles.css.
- Never generate or download art. Use only assets listed in ASSETS.md. If an asset is missing, add a placeholder and say so.
- Report changes briefly.
