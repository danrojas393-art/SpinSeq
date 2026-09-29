import {
  AdMob,
  BannerAdPosition,
  BannerAdPluginEvents,
  BannerAdSize
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const config = {
  appId: import.meta.env.VITE_ADMOB_APP_ID,
  bannerId: import.meta.env.VITE_ADMOB_BANNER_ID,
  rewardedId: import.meta.env.VITE_ADMOB_REWARDED_ID,
  testing: import.meta.env.DEV || import.meta.env.VITE_ADMOB_TESTING === 'true'
};
const isNative = Capacitor.isNativePlatform();
const status = document.getElementById('adStatus');
const privacyOptionsButton = document.getElementById('privacyOptionsButton');
let initialization = null;
let sdkInitialized = false;
let bannerListenersAdded = false;

function setStatus(message) {
  status.textContent = message;
  status.hidden = !message;
}

function validateConfig() {
  if (!/^ca-app-pub-\d+~\d+$/.test(config.appId || '')) {
    throw new Error('El ID de aplicación de AdMob no está configurado correctamente.');
  }
  if (!/^ca-app-pub-\d+\/\d+$/.test(config.bannerId || '')) {
    throw new Error('El ID de banner de AdMob no está configurado correctamente.');
  }
  if (!/^ca-app-pub-\d+\/\d+$/.test(config.rewardedId || '')) {
    throw new Error('El ID del anuncio recompensado de AdMob no está configurado correctamente.');
  }
}

function updatePrivacyOptions(consentInfo) {
  privacyOptionsButton.hidden = consentInfo.privacyOptionsRequirementStatus !== 'REQUIRED';
}

async function showPrivacyOptions() {
  try {
    await AdMob.showPrivacyOptionsForm();
    const consentInfo = await AdMob.requestConsentInfo();
    updatePrivacyOptions(consentInfo);
    if (!consentInfo.canRequestAds) {
      if (document.body.classList.contains('admob-banner-visible')) {
        await AdMob.removeBanner();
        document.body.classList.remove('admob-banner-visible');
      }
      setStatus('Los anuncios no están disponibles con la selección actual.');
      return;
    }
    initialization = null;
    await initializeOnce();
    setStatus('');
  } catch (error) {
    console.error('[AdMob] No se pudieron abrir las opciones de privacidad.', error);
    setStatus('No se pudieron abrir las opciones de privacidad.');
  }
}

async function initializeAdMob() {
  if (!isNative) return;
  validateConfig();
  let consentInfo = await AdMob.requestConsentInfo();
  if (consentInfo.isConsentFormAvailable) {
    consentInfo = await AdMob.showConsentForm();
  }
  updatePrivacyOptions(consentInfo);
  if (!consentInfo.canRequestAds) {
    throw new Error(`No se pueden solicitar anuncios con el estado de consentimiento ${consentInfo.status}.`);
  }
  if (!sdkInitialized) {
    await AdMob.initialize({ initializeForTesting: config.testing });
    if (!bannerListenersAdded) {
      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ height }) => {
        document.documentElement.style.setProperty('--admob-banner-height', `${Math.ceil(height)}px`);
        document.body.classList.toggle('admob-banner-visible', height > 0);
      });
      await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
        console.error('[AdMob] No se pudo cargar el banner.', error);
        setStatus('No se pudo cargar el anuncio de banner.');
      });
      bannerListenersAdded = true;
    }
    sdkInitialized = true;
  }
  await AdMob.showBanner({
    adId: config.bannerId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    isTesting: config.testing
  });
}

function initializeOnce() {
  if (!initialization) {
    initialization = initializeAdMob().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

privacyOptionsButton.addEventListener('click', showPrivacyOptions);

initializeOnce().catch((error) => {
  console.error('[AdMob] No se pudo inicializar el SDK o mostrar el banner.', error);
  setStatus('Los anuncios no están disponibles en este momento.');
});

window.SPINSEQ_ADMOB = {
  async showRewardedAd() {
    if (!isNative) {
      throw new Error('Los anuncios recompensados solo están disponibles en la aplicación Android.');
    }
    await initializeOnce();
    await AdMob.prepareRewardVideoAd({
      adId: config.rewardedId,
      isTesting: config.testing
    });
    return AdMob.showRewardVideoAd();
  }
};
