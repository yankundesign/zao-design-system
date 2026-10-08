export const THEME_KEY = 'zao-theme';
export const MODE_KEY = 'zao-mode';

/** Runs before first paint (see app/layout.tsx) so the page never flashes the wrong finish. */
export const finishInitScript = `(function(){var d=document.documentElement;d.setAttribute('data-zao-theme','su');try{var m=localStorage.getItem('${MODE_KEY}')||'system';if(m==='light'||m==='dark'){d.setAttribute('data-zao-mode',m)}else{d.removeAttribute('data-zao-mode')}localStorage.setItem('${THEME_KEY}','su')}catch(e){}})();`;
