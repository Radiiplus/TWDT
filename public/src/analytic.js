(function () {
    function makeRequest(url, method, data) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    console.error('Request failed with status:', xhr.status, 'Response:', xhr.responseText);
                    reject(new Error(xhr.statusText));
                }
            };
            xhr.onerror = function () {
                reject(new Error('Network Error'));
            };
            xhr.send(JSON.stringify(data));
        });
    }

    function getIpInfo() {
        return makeRequest('https://ipapi.co/json/', 'GET');
    }

    function sendAnalytics(data) {
        return makeRequest('/access/analytic', 'POST', data);
    }

    function collectAndSendData() {
        const viewportSize = `${window.innerWidth}x${window.innerHeight}`;
        const userAgent = navigator.userAgent;

        getIpInfo().then(ipInfo => {
            const analyticsData = {
                viewport: viewportSize,
                device: `User Agent: ${userAgent}`,
                ip: ipInfo.ip,
                network: ipInfo.network,
                version: ipInfo.version,
                city: ipInfo.city,
                region: ipInfo.region,
                region_code: ipInfo.region_code,
                country: ipInfo.country_name,
                country_code: ipInfo.country_code,
                country_code_iso3: ipInfo.country_code_iso3,
                country_capital: ipInfo.country_capital,
                country_tld: ipInfo.country_tld,
                continent_code: ipInfo.continent_code,
                in_eu: ipInfo.in_eu,
                postal: ipInfo.postal,
                latitude: ipInfo.latitude,
                longitude: ipInfo.longitude,
                timezone: ipInfo.timezone,
                utc_offset: ipInfo.utc_offset,
                country_calling_code: ipInfo.country_calling_code,
                currency: ipInfo.currency,
                currency_name: ipInfo.currency_name,
                languages: ipInfo.languages,
                country_area: ipInfo.country_area,
                country_population: ipInfo.country_population,
                asn: ipInfo.asn,
                org: ipInfo.org
            };
            return sendAnalytics(analyticsData);
        })
        .then(() => {
            console.log('Noted');
        })
        .catch(error => {
            console.error('Error in analytics process:', error);
        });
    }

    if (document.readyState === 'complete') {
        collectAndSendData();
    } else {
        window.addEventListener('load', collectAndSendData);
    }
})();
