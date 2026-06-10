import { SubredditOption, TwitterAccountOption } from './types';

export const CMC_API_KEY = 'f55086eb50a8426591f8d930dc7f6e63';
export const RAPID_API_KEY = '3fa1808794msh4889848f150da1ep1e822ejsnd21a6ca25058';
export const TWITTER_HOST = 'twitter-api45.p.rapidapi.com';
export const TWITTER_LIST_ID = '1343798673386434560';

export const SYSTEM_INSTRUCTION = `
You are a Crypto Market Analyst.
Task: Analyze BTC, ETH, XRP, SOL.
Output: JSON.

LANGUAGE:
- Descriptions: RUSSIAN.
- Enum/Symbols: English.

CRITICAL: Keep reasoning extremely concise.
`;

// Helper to generate categories based on keywords
const categorize = (name: string): SubredditOption['category'] => {
  const lower = name.toLowerCase();
  if (lower.includes('meme') || lower.includes('moon') || lower.includes('bets') || lower.includes('shiba') || lower.includes('doge') || lower.includes('pepe')) return 'Meme';
  if (lower.includes('trading') || lower.includes('market') || lower.includes('finance')) return 'Trading';
  if (lower.includes('defi') || lower.includes('nft') || lower.includes('mining') || lower.includes('dev') || lower.includes('tech')) return 'Tech';
  if (lower === 'cryptocurrency' || lower === 'bitcoin' || lower === 'ethereum') return 'General';
  return 'Specific';
};

const RAW_SUBREDDITS = Array.from(new Set([
  "phinvest", "investing", "IndianStreetBets", "Trading", "Bitcoin", "coins", "Daytrading",
  "TheTowerGame", "coincollecting", "conspiracy", "geometrydash", "hardwareswap", "CallOfDutyMobile",
  "FUTMobile", "Pmsforsale", "PokemonGoTrade", "AdoptMeTrading", "AdoptMeRBX", "btc", "CryptoCurrency",
  "Anarcho_Capitalism", "TradingViewSignals", "options", "BloxFruitsTradingHub", "trading212",
  "giftcardexchange", "Forexstrategy", "pennystocks", "CryptoMarkets", "algotrading", "pokemontrades",
  "ASX_Bets", "coinerrors", "RoyaleHigh_Roblox", "Cryptozoology", "RatchetAndClank", "PiNetwork",
  "defi", "AncientCoins", "ethtrader", "binance", "toshicoin", "RobloxGAGTrading", "BitcoinBeginners",
  "XRP", "CoinBase", "solana", "northcounty", "Forex", "CryptoIndia", "CryptoScams", "memecoins",
  "StocksAndTrading", "FuturesTrading", "cardano", "RoyaleHigh_Trading", "MaddenMobileForums",
  "RobloxTrading", "ethereum", "MarioKartTour", "AirdropCryptoAlpha", "litecoin", "dogecoin",
  "BitcoinMining", "TradingView", "thewallstreet", "SHIBArmy", "Slothana", "MaddenUltimateTeam",
  "AvakinOfficial", "Buttcoin", "Tradingcards", "Hedera", "swingtrading", "ledgerwallet",
  "AnimalCrossingTrading", "solanadev", "Monero", "lastofuspart2", "CryptoMoonShots", "Memecoinhub",
  "GlobalOffensiveTrade", "SolanaMemeCoins", "tradingcardcommunity", "CryptoCurrencyTrading",
  "BitcoinMarkets", "GoldandBlack", "cryptomining", "Malaysia_Crypto", "ethmemecoins",
  "CryptoTechnology", "CrossTrading_inRoblox", "Tronix", "Yield_Farming", "gpumining",
  "CoinMarketCap", "daytrade", "CryptoNewsandTalk", "Polkadot", "CoinMasterGame", "CryptoExchange",
  "RoyaleHighTrading", "TradingEdge", "Trading_es", "UKcoins", "RocketLeagueExchange", "AMPToken",
  "TsumTsum", "NFT", "Stellar", "nanocurrency", "Avax", "ExodusWallet", "cro", "BitcoinBrasil",
  "Chainlink", "cryptography", "CryptoInvesting", "BlockchainStartups", "Jobs4Bitcoins",
  "BinanceCrypto", "Solana_Memes", "StockTradingIdeas", "TokenFinders", "TransformersTrading"
]));

// Generate target subreddits from the massive list
export const TARGET_SUBREDDITS: SubredditOption[] = RAW_SUBREDDITS.map(name => ({
  name,
  url: `https://www.reddit.com/r/${name}/`,
  category: categorize(name)
}));

// 1. Manually mapped famous accounts for better UI experience
const NAMED_ACCOUNTS: TwitterAccountOption[] = [
  { username: "VitalikButerin", id: "295218901", url: "https://twitter.com/VitalikButerin" },
  { username: "cz_binance", id: "902926941413453824", url: "https://twitter.com/cz_binance" },
  { username: "brian_armstrong", id: "14379660", url: "https://twitter.com/brian_armstrong" },
  { username: "SBF_FTX", id: "1110877798820777986", url: "https://twitter.com/SBF_FTX" },
  { id: '12351235', username: 'CryptoCapo_', url: "https://twitter.com/CryptoCapo_" },
  { id: '1096926343513690117', username: 'DaanCrypto', url: "https://twitter.com/DaanCrypto" },
  { id: '85303666', username: 'rovercrc', url: "https://twitter.com/rovercrc" },
  { id: '961445378', username: 'IncomeSharks', url: "https://twitter.com/IncomeSharks" },
  { id: '1333467482', username: 'ali_charts', url: "https://twitter.com/ali_charts" },
  { username: "crypto", id: "928759224599040001", url: "https://twitter.com/crypto" },
  { username: "CoinDesk", id: "1333467482", url: "https://twitter.com/CoinDesk" },
  { username: "Cointelegraph", id: "2207129125", url: "https://twitter.com/Cointelegraph" },
  { username: "TheBlock__", id: "963767159536209921", url: "https://twitter.com/TheBlock__" },
  { username: "decryptmedia", id: "993530753014054912", url: "https://twitter.com/decryptmedia" },
  { username: "MessariCrypto", id: "412587524", url: "https://twitter.com/MessariCrypto" },
  { username: "glassnode", id: "1022821051187822593", url: "https://twitter.com/glassnode" },
  { username: "santimentfeed", id: "776078472477347840", url: "https://twitter.com/santimentfeed" },
  { username: "whale_alert", id: "1039833297751302144", url: "https://twitter.com/whale_alert" },
  { username: "a16zcrypto", id: "1539681011696603137", url: "https://twitter.com/a16zcrypto" },
  { username: "paradigm", id: "166765173", url: "https://twitter.com/paradigm" },
  { username: "PanteraCapital", id: "2287471915", url: "https://twitter.com/PanteraCapital" },
  { username: "aantonop", id: "1469101279", url: "https://twitter.com/aantonop" },
  { username: "PlanB", id: "166765173", url: "https://twitter.com/100trillionUSD" },
  { username: "scottmelker", id: "17351167", url: "https://twitter.com/scottmelker" },
  { username: "TheMoonCarl", id: "978732571738755072", url: "https://twitter.com/TheMoonCarl" },
  { username: "MMCrypto", id: "904700529988820992", url: "https://twitter.com/MMCrypto" },
  { username: "Bitboy_Crypto", id: "1904895819498872836", url: "https://twitter.com/bitboy_crypto" },
  { username: "AltcoinDailyio", id: "1869084032002306048", url: "https://twitter.com/AltcoinDailyio" },
  { username: "CryptoWendyO", id: "935742315389444096", url: "https://twitter.com/CryptoWendyO" },
  { username: "ToneVays", id: "2577886615", url: "https://twitter.com/ToneVays" },
  { username: "IvanOnTech", id: "712198712", url: "https://twitter.com/IvanOnTech" },
  { username: "intocryptoverse", id: "943506806931734528", url: "https://twitter.com/intocryptoverse" },
  { username: "CoinMarketCap", id: "2260491445", url: "https://twitter.com/CoinMarketCap" },
  { username: "BinanceResearch", id: "985688130509393920", url: "https://twitter.com/BinanceResearch" },
  { username: "IOHK_Charles", id: "1376161898", url: "https://twitter.com/IOHK_Charles" },
  { username: "solana", id: "929155859913039872", url: "https://twitter.com/solana" },
  { username: "rajgokal", id: "101833150", url: "https://twitter.com/rajgokal" },
  { username: "aeyakovenko", id: "929155859913039872", url: "https://twitter.com/aeyakovenko" },
  { username: "CryptoGodJohn", id: "210623431", url: "https://twitter.com/CryptoGodJohn" },
  { username: "Kaleo", id: "1154601225880555520", url: "https://twitter.com/CryptoKaleo" },
  { username: "Pentosh1", id: "1004162476273893377", url: "https://twitter.com/Pentosh1" },
  { username: "Cobie", id: "462775411", url: "https://twitter.com/Cobie" },
  { username: "Algorand", id: "978184299122892800", url: "https://twitter.com/Algorand" },
  { username: "Polygon", id: "1232319080637616128", url: "https://twitter.com/0xPolygon" }
];

export const TELEGRAM_BATCH_SIZE = 20;

export const DEFAULT_TELEGRAM_CHATS: string[] = [
  "cryptobarnospam", "SuperExOfficial_CN", "mewchina", "J9officialgroup",
  "HTX_DAO1", "bobadaolfg", "Aptos_CN_Official", "panewslab", "a36522",
  "Binance_api_Chinese", "doge88", "BinanceChinese", "otagh_goftego",
  "cryptoservat_g", "ask_crypto", "shibainudogecoin", "crypto_shahann",
  "binance_net", "bitcoin_in_arabic", "gangat_crypto", "airdropletsgo",
  "shibacoinfarsi", "simorgh_blockchain", "bitcointed", "binanceusers",
  "groupairdropi", "bitcoinarabinvestors", "libyantraderscommunity",
  "tgjsa8", "cryptocurrencyiran03", "cryptoiran0001", "coinex_persian",
  "signalcryptosgroup", "agtrader1", "tahlilbinance", "kardana_cryptochat",
  "traderhaforex", "cryptoiran001", "coinexglobalarabic", "bybitarabic",
  "cryptoiran00001", "traders_talking_bitcoin", "forexetrading",
  "bitgetarabicofficial", "irannn_binance", "afghanistanforexcryptotraders",
  "binancearabic"
];

// 2. Active Twitter IDs (verified active accounts from twitter_active_new.csv)
const RAW_TWITTER_IDS = [
  "782946231551131648", "1203496290589405185", "18469669", "893111826254356481",
  "1323762343302615040", "2207129125", "906230721513181184", "3109476390",
  "1297503202464718850", "398148139", "982719351244472320", "51073409",
  "4473212565", "972970759416111104", "618539620", "2260491445",
  "1384549926080860166", "731402158512476161", "2650025562", "1448939883423207452",
  "978732571738755072", "935742315389444096", "1223056821037957120", "911716127365042177",
  "146345384", "34097500", "37794688", "1360636645989441539", "993962483332329472",
  "1301215504686694400", "33149981", "1453592537567006720", "949685739935158272",
  "1433401849349132292", "634075747"
];

// 3. Merged List: Priority to Named Accounts, then append the rest from Raw list
export const TWITTER_ACCOUNTS: TwitterAccountOption[] = (() => {
  const merged = [...NAMED_ACCOUNTS];

  RAW_TWITTER_IDS.forEach(id => {
    // Avoid duplicates if the ID is already in the named list
    if (!merged.find(acc => acc.id === id)) {
      merged.push({
        username: `User_${id.slice(0, 5)}..`, // Placeholder name for raw IDs
        id: id,
        url: `https://twitter.com/i/user/${id}`
      });
    }
  });

  return merged;
})();