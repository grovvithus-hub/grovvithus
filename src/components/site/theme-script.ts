export const THEME_KEY = "gv-theme";

/** Runs before paint: the stored choice wins, otherwise the device setting. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.siteTheme=t}catch(e){document.documentElement.dataset.siteTheme='dark'}})();`;
