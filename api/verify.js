const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const captchaToken = req.body['h-captcha-response'];
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // --- ÉTAPE 1 : VÉRIFICATION VPN / PROXY (AbuseIPDB) ---
        // Remplace TA_API_KEY_ABUSE par ta clé gratuite
        const abuseResponse = await axios.get(`https://api.abuseipdb.com/api/v2/check`, {
            params: { ipAddress: clientIP, maxAgeInDays: 90 },
            headers: { 'Key': 'TA_API_KEY_ABUSE', 'Accept': 'application/json' }
        });

        const abuseScore = abuseResponse.data.data.abuseConfidenceScore;
        const isPublicProxy = abuseResponse.data.data.isPublicProxy;

        // Si le score est trop élevé ou si c'est un proxy connu
        if (abuseScore > 50 || isPublicProxy) {
            return res.redirect('/?error=vpn');
        }

        // --- ÉTAPE 2 : VÉRIFICATION HCAPTCHA ---
        // Remplace TA_SECRET_KEY par ta clé secrète hCaptcha
        const captchaSecret = 'TA_SECRET_KEY';
        const params = new URLSearchParams();
        params.append('response', captchaToken);
        params.append('secret', captchaSecret);

        const hCaptchaRes = await axios.post('https://hcaptcha.com/siteverify', params);

        if (hCaptchaRes.data.success) {
            // TOUT EST OK -> REDIRECTION FINALE
            return res.redirect('https://exemple.com');
        } else {
            return res.redirect('/?error=captcha');
        }

    } catch (error) {
        console.error(error);
        return res.status(500).send('Erreur interne du serveur');
    }
}
