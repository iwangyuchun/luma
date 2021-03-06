export default function isOldIE(opts?:{}) {
    const navigator = typeof window !== 'undefined' ? window.navigator || {} : {};

    // @ts-ignore
    const userAgent = opts.userAgent || navigator.userAgent || '';

    const isMSIE = userAgent.indexOf('MSIE ') !== -1;
    const isTrident = userAgent.indexOf('Trident/') !== -1;
    return isMSIE || isTrident;
}