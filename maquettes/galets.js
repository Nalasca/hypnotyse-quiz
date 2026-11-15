/* Univers "Les galets" : symboles SVG partagés, injectés une fois dans la page.
   Usage : <svg viewBox="0 0 120 100"><use href="#galet" style="color:var(--sauge)"/><use href="#calme"/></svg> */
document.addEventListener('DOMContentLoaded', function () {
  var holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><defs>'
    /* corps : couleur par currentColor */
    + '<symbol id="galet" viewBox="0 0 120 100"><ellipse cx="62" cy="93" rx="36" ry="4" fill="#1D2321" opacity=".07"/>'
    + '<path d="M17 60C14 37 38 19 64 19c28 0 47 16 45 39-2 22-22 32-48 32-27 0-41-9-44-30z" fill="currentColor"/>'
    + '<ellipse cx="45" cy="35" rx="15" ry="5.5" transform="rotate(-14 45 35)" fill="#fff" opacity=".38"/></symbol>'
    /* visages */
    + '<symbol id="calme" viewBox="0 0 120 100"><g fill="none" stroke="#1D2321" stroke-width="3" stroke-linecap="round">'
    + '<path d="M45 57q6 6 12 0"/><path d="M71 57q6 6 12 0"/><path d="M58 68q6 5 12 0"/></g>'
    + '<circle cx="42" cy="67" r="4.5" fill="#EE9C88" opacity=".55"/><circle cx="87" cy="67" r="4.5" fill="#EE9C88" opacity=".55"/></symbol>'
    + '<symbol id="dort" viewBox="0 0 120 100"><g fill="none" stroke="#1D2321" stroke-width="3" stroke-linecap="round">'
    + '<path d="M45 59q6-5 12 0"/><path d="M71 59q6-5 12 0"/><path d="M61 70h6"/></g></symbol>'
    + '<symbol id="tendu" viewBox="0 0 120 100"><g fill="none" stroke="#1D2321" stroke-width="3" stroke-linecap="round">'
    + '<path d="M46 55l9 3"/><path d="M82 55l-9 3"/><path d="M56 71q3-3 6 0t6 0t6 0"/></g>'
    + '<path d="M96 30c3 5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" fill="#9CC3E6"/></symbol>'
    + '<symbol id="envie" viewBox="0 0 120 100"><g fill="none" stroke="#1D2321" stroke-width="3" stroke-linecap="round">'
    + '<circle cx="50" cy="57" r="3" fill="#1D2321"/><circle cx="78" cy="57" r="3" fill="#1D2321"/><path d="M58 70q6-2 12 0"/></g></symbol>'
    /* accessoires */
    + '<symbol id="casque" viewBox="0 0 120 100"><path d="M27 52C27 16 95 16 95 52" fill="none" stroke="#1D2321" stroke-width="5" stroke-linecap="round"/>'
    + '<rect x="17" y="46" width="15" height="24" rx="6" fill="#1D2321"/><rect x="90" y="46" width="15" height="24" rx="6" fill="#1D2321"/></symbol>'
    + '<symbol id="lune" viewBox="0 0 40 40"><path d="M27 6a15 15 0 1 0 8 25A13 13 0 0 1 27 6z" fill="#F5C66B"/></symbol>'
    + '<symbol id="soleil" viewBox="0 0 40 40"><circle cx="20" cy="20" r="9" fill="#F5C66B"/><g stroke="#F5C66B" stroke-width="3" stroke-linecap="round">'
    + '<path d="M20 3v4M20 33v4M3 20h4M33 20h4M8 8l3 3M29 29l3 3M8 32l3-3M29 11l3-3"/></g></symbol>'
    + '<symbol id="tv" viewBox="0 0 120 100"><rect x="18" y="8" width="84" height="50" rx="10" fill="#DCE7F2"/><rect x="26" y="16" width="68" height="34" rx="6" fill="#fff" opacity=".5"/></symbol>'
    + '<symbol id="ondes" viewBox="0 0 160 40"><g fill="none" stroke="#2E7D5E" stroke-width="2">'
    + '<ellipse cx="80" cy="20" rx="34" ry="7" opacity=".55"/><ellipse cx="80" cy="20" rx="54" ry="11" opacity=".3"/><ellipse cx="80" cy="20" rx="74" ry="15" opacity=".15"/></g></symbol>'
    + '</defs></svg>';
  document.body.prepend(holder);
});
