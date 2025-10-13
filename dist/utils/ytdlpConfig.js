/**
 * Configurações avançadas do yt-dlp para evitar detecção de bot
 * Baseado em métodos que funcionam consistentemente sem cookies
 */
export const YT_DLP_CONFIG = {
    // User agents rotativos para evitar detecção
    userAgents: [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ],
    // Headers que simulam navegador real
    baseHeaders: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "Dnt": "1"
    },
    // Configurações de retry e sleep para evitar rate limiting
    retryConfig: {
        extractorRetries: 5,
        fragmentRetries: 5,
        retrySleep: "exp=1:10", // Exponential backoff
        sleepInterval: 3,
        maxSleepInterval: 10,
        sleepSubtitles: 3
    },
    // Formatos seguros que funcionam bem
    formats: [
        "best[height<=720]",
        "best[height<=480]",
        "worst"
    ]
};
/**
 * Gera argumentos otimizados para yt-dlp sem cookies
 */
export function getOptimizedYtDlpArgs() {
    // Usar user agent aleatório
    const randomUserAgent = YT_DLP_CONFIG.userAgents[Math.floor(Math.random() * YT_DLP_CONFIG.userAgents.length)];
    const args = [
        "--user-agent", randomUserAgent,
        "--extractor-retries", YT_DLP_CONFIG.retryConfig.extractorRetries.toString(),
        "--fragment-retries", YT_DLP_CONFIG.retryConfig.fragmentRetries.toString(),
        "--retry-sleep", YT_DLP_CONFIG.retryConfig.retrySleep,
        "--sleep-interval", YT_DLP_CONFIG.retryConfig.sleepInterval.toString(),
        "--max-sleep-interval", YT_DLP_CONFIG.retryConfig.maxSleepInterval.toString(),
        "--sleep-subtitles", YT_DLP_CONFIG.retryConfig.sleepSubtitles.toString(),
        // Adicionar todos os headers
        ...Object.entries(YT_DLP_CONFIG.baseHeaders).flatMap(([key, value]) => [
            "--add-header", `${key}:${value}`
        ]),
        // Configurações extras anti-detecção
        "--no-check-certificate",
        "--prefer-insecure",
        "--ignore-errors",
        "--no-warnings"
    ];
    return args;
}
