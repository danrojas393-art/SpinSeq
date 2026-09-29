import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';

const appId = process.env.VITE_ADMOB_APP_ID;
if (!/^ca-app-pub-\d+~\d+$/.test(appId || '')) {
  throw new Error('VITE_ADMOB_APP_ID falta o no tiene un formato válido en .env.');
}

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
const stringsPath = 'android/app/src/main/res/values/strings.xml';
let manifest = await readFile(manifestPath, 'utf8');
const launcherActivity = [...manifest.matchAll(/<activity\b[^>]*>[\s\S]*?<\/activity>/g)]
  .find((match) => /android\.intent\.action\.MAIN/.test(match[0])
    && /android\.intent\.category\.LAUNCHER/.test(match[0]));

if (!launcherActivity) {
  throw new Error('No se encontró la actividad launcher en AndroidManifest.xml.');
}

const activity = launcherActivity[0];
const portraitActivity = /android:screenOrientation\s*=/.test(activity)
  ? activity.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="portrait"')
  : activity.replace('<activity', '<activity android:screenOrientation="portrait"');
manifest = manifest.replace(activity, portraitActivity);
manifest = manifest.replace(
  /\s*<meta-data\b(?=[^>]*android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID")[^>]*\/>/g,
  ''
);

const applicationEnd = manifest.lastIndexOf('</application>');
if (applicationEnd < 0) {
  throw new Error('No se encontró <application> en AndroidManifest.xml.');
}
const appIdMetadata = '    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />\n  ';
manifest = `${manifest.slice(0, applicationEnd)}${appIdMetadata}${manifest.slice(applicationEnd)}`;
await writeFile(manifestPath, manifest);

let strings = await readFile(stringsPath, 'utf8');
const resource = `<string name="admob_app_id">${appId}</string>`;
if (/<string name="admob_app_id">[\s\S]*?<\/string>/.test(strings)) {
  strings = strings.replace(/<string name="admob_app_id">[\s\S]*?<\/string>/, resource);
} else {
  const resourcesEnd = strings.lastIndexOf('</resources>');
  if (resourcesEnd < 0) {
    throw new Error('No se encontró </resources> en strings.xml.');
  }
  strings = `${strings.slice(0, resourcesEnd)}    ${resource}\n${strings.slice(resourcesEnd)}`;
}
await writeFile(stringsPath, strings);

console.log('AdMob configurado y orientación Android bloqueada en portrait.');
