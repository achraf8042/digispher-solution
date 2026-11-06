# Rebuild the files the site actually serves. Edit styles.css, noscript.css, and main.js, then run this.
Set-Location $PSScriptRoot
npx --yes clean-css-cli -O1 -o assets/css/styles.min.css assets/css/styles.css
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx --yes clean-css-cli -O1 -o assets/css/noscript.min.css assets/css/noscript.css
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx --yes terser assets/js/main.js --compress --mangle --output assets/js/main.min.js
exit $LASTEXITCODE
