# Bahi — GST billing software website (Next.js)

## Run
npm install
npm run dev
# open http://localhost:3000

## Brand change
lib/site.js me name, phone, email badlo.
Colors: app/globals.css ke :root variables.

## Pages
/  /solutions  /pricing  /about  /desktop  /careers  /partner  /login

## Languages
lib/i18n.js me LANGS (list) aur DICT (translations). Default English.
Jo text kisi language me nahi hai, woh English me dikhega.

## Try mobile app page
/mobile-app -> app/mobile-app/MobileApp.js (store links, QR, SMS form)
