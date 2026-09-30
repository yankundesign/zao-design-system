export const THEME_KEY = 'zao-theme';
export const MODE_KEY = 'zao-mode';

/** Runs before first paint (see app/layout.tsx) so the page never flashes the wrong finish. */
export const finishInitScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('${THEME_KEY}')||'su';var m=localStorage.getItem('${MODE_KEY}')||'system';d.setAttribute('data-zao-theme',t);if(t==='yu'){d.setAttribute('data-zao-mode','dark')}else if(m==='light'||m==='dark'){d.setAttribute('data-zao-mode',m)}else{d.removeAttribute('data-zao-mode')}}catch(e){}})();`;
