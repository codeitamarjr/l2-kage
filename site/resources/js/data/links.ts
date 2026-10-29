/** A clean, unmodified Lineage II Essence: Samurai Crow (EU, protocol 542) client, hosted by Lineage2.org.uk. */
export const CLIENT_DOWNLOAD_URL = 'https://www.lineage2.org.uk/download/lineage-ii-essence-samurai-crow-eu-542/';

/**
 * The client setup for servers whose login port isn't 2106 (the Samurai Crow client always logs in on 2106): an
 * L2.ini that logs in on 127.0.0.2 (redirected by `netsh interface portproxy` to the server's login port), and a
 * .bat that starts L2.exe with it. Both go in the client's system folder.
 */
export const CLIENT_INI_URL = '/downloads/l2-kage.ini';
export const CLIENT_START_URL = '/downloads/start-l2-kage.bat';
