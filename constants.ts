import { SubredditOption, TwitterAccountOption } from './types';

export const CMC_API_KEY = 'f55086eb50a8426591f8d930dc7f6e63';
export const RAPID_API_KEY = '3fa1808794msh4889848f150da1ep1e822ejsnd21a6ca25058';
export const TWITTER_HOST = 'twitter241.p.rapidapi.com';

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
  "CryptoCurrencies", "Ripple", "Monero", "crypto", "BitcoinMarkets", "RocketLeagueExchange", "NiceHash", "RealDayTrading", 
  "cosmosnetwork", "gpumining", "GoldandBlack", "UniSwap", "decentraland", "LitecoinMarkets", "ethstaker", "cryptomining", 
  "crypto_currency", "EnoughLibertarianSpam", "dogelon", "CryptoGamersCommunity", "AMPToken", "TsumTsum", "coingecko", 
  "CryptoScamReport", "CoinWithUs", "OfficialTrumpCoin", "defisignals", "Sologenic", "XBlockChain", "Defiance", "CryptoHorde", 
  "CryptoUnicornFinders", "BitcoinFrance", "BitcoinABC", "EthereumGang", "Malaysia_Crypto", "ethmemecoins", "NFT", 
  "BitcoinBeginners", "NFTsMarketplace", "Stellar", "EtherMining", "BitcoinMining", "nanocurrency", "Metamask", "0xPolygon", 
  "Avax", "thewallstreet", "ExodusWallet", "CardanoTrading", "CryptoAnarchy", "CryptoMexico", "ethereum", "XRP", "SHIBArmy", 
  "litecoin", "FuturesTrading", "ASX_Bets", "Bitcoincash", "Crypto_General", "NFTExchange", "algorand", "AltStreetBets", 
  "CoinMarketCap", "cro", "lastofuspart2", "jupiterexchange", "BitcoinBrasil", "MedievalCoin", "AirdropCryptoAlpha", "algotrading", 
  "cryptocurrencymemes", "Cryptozoology", "Crypto_com", "CryptoCurrencyTrading", "Chainlink", "cryptography", "MarioKartTour", 
  "mindcrack", "daytrade", "CryptoGrab", "Rblxcross_trading_", "CryptoTechnology", "PiNetwork", "CryptoMoon", "rocket_league_trading", 
  "binance", "cardano", "CryptoIndia", "StocksAndTrading", "ledgerwallet", "CryptoMars", "CryptoMarsShots", "AlgorandOfficial", 
  "RatchetAndClank", "CryptoNewsandTalk", "MemeCoinJunkies", "ethtrader", "altcoin", "swingtrading", "Slothana", "CryptoInvesting", 
  "CryptoMoonShots", "Crypto_Currency_News", "dogecoin", "Anarcho_Capitalism", "defi", "kucoin", "MaddenUltimateTeam", "ethdev", 
  "Polkadot", "CryptoScams", "BlockchainStartups", "RoyaleHigh_Trading", "Jobs4Bitcoins", "northcounty", "CrossTrading_inRoblox", 
  "ARK_Trading", "options", "AllCryptoBets", "toshicoin", "Forex", "AvakinOfficial", "CoinMasterGame", "BinanceCrypto", "coinerrors", 
  "GlobalOffensiveTrade", "Buttcoin", "Memecoinhub", "CryptoExchange", "phinvest", "Hedera", "RoyaleHigh_Roblox", "memecoins", 
  "RobloxGAGTrading", "CryptoMarkets", "TradingView", "investing", "AnimalCrossingTrading", "CoinBase", "trading212", "pennystocks", 
  "RoyaleHighTrading", "pokemontrades", "solana", "SolanaMemeCoins", "ReferralCodesCrypto", "IndianStreetBets", "Trading", 
  "AncientCoins", "btc", "BloxFruitsTradingHub", "CryptoCurrency", "giftcardexchange", "MaddenMobileForums", "Bitcoin", "coins", 
  "Daytrading", "TheTowerGame", "coincollecting", "conspiracy", "geometrydash", "hardwareswap", "CallOfDutyMobile", "FUTMobile", 
  "Forexstrategy", "Pmsforsale", "PokemonGoTrade", "AdoptMeTrading", "AdoptMeRBX", "PubeFinance", "PublishProtocol", "PulseBitcoin", 
  "Pulsechain", "PumpCrypto", "PURPEcryptocurrency", "QuantumBlockchain", "QuarkCoin", "QuiddTrading", "R6Marketplace_Trading", 
  "RadiantBlockchain", "RadioCacaNFT", "RaiBlocks", "RandomActsOfBTC", "RariCapital", "RavenX", "Raydium", "rBitcoin", 
  "rblxcross_trading", "RDAT", "reddCoin", "RedditavatarsNFT", "RedditBlockchain", "ReferenceCodeBinance", "RevalCoin", 
  "ReviewTrading", "RevivalDefi", "Ride_Defi", "rigelprotocol", "RiotBlockchain", "RiperDefi", "Rise_Coin", "RoastmyNFT", 
  "RobloxTrading", "rocketpool", "RopeSolana", "Rotl_Nft", "RoyalHighTrading", "RoyalProtocol", "RsrCoin", "RugEthereum", 
  "RupeeBlockchain", "saadboi", "SaitamaInu_Official", "SaitoCrypto", "SaltBlockchain", "SaltCoin", "SanctumSolana", "SandboxNFT", 
  "SantaCoin", "SargeCoin", "SatoshiStreetBets", "scam_coin", "ScientificCoin", "SeatlabNFT", "Securypto", "ShadowSolana", 
  "ShakaiNFT", "ShibaDino", "Shibainucoin", "ShibaInuCrypto", "SHIBArmyNFT", "ShibaSikkaToken", "Shieldtoken_official", 
  "ShinyTrading", "shitcoin_memecoin", "shouldaethereum", "ShpingCoin", "ShrimpSwap", "SigloCoin", "SimpleDefi", "SkyNetBinance", 
  "SmileCoin", "smTrading", "snoofi", "SnowgeCoin", "solanabeach", "solanabitcoin", "SolanaBitcone", "solanaboobs", "SolanaCanada", 
  "solanacasinos", "SolanaCBDC", "SolanaCryptoMemeCoin", "solanadev", "solanadoge", "solanaeas", "SolanaIndia", "SolanaInsights", 
  "solanamemecoincalls", "SolanaMemeMoonshots", "Solana_Memes", "SolanaMonkeyApes", "SolanaNFT", "solanapepe", "SolanaPresale", 
  "SolanaSniper", "SolanaSniperBots", "solanatools", "SolanaUK", "SolanaWalletTracker", "solanium", "SolarCoin", "SolCoins", 
  "SoldierOfSolana", "Solible", "SolSeaNFT", "solwork", "sombraNFT", "SorareTrading", "SourceLessBlockchain", "Spacefy_NFT", 
  "SpacePortCoin", "SpadesCoin", "SpearMoon", "spot_trading", "StakingAlertBinance", "StarverseNFT", "SteamTradingCards", 
  "StellarCannaCoin", "StellarNFT", "StepFinance_", "StepN", "sterwers_Solana", "STICKYtoken", "stockTrading", "StockTradingIdeas", 
  "stock_trading_India", "StoneDefi", "StonksTrading", "STOX", "suBitcoin", "SuccessKidSolana", "SushiSwap", "SwftCoin", 
  "SwitchBlockchain", "SwoleDogeSolana", "Swop_Defi", "SysCoin", "TacoEnergy", "Tau_coin", "TcgCoin", "Telefy_Defi", 
  "TeraWulfMiningBTC", "ternio", "Terra_Luna_crypto", "tezos", "TF2_Trading", "TheBinanceNFT", "TheDao", "thefaircoin", "thegraph", 
  "TheosNFT", "ThePepeFamilyASA", "tildethine", "TokenFinders", "TomketAirdropID", "TonicCrypto", "TonysolpranoSolana", 
  "TopCryptoSites", "TopNFT", "TosaInuCoin", "ToyotaBlockchain", "ToyotaBlockchainLab", "TradingAdvice", "TradingAI", "TradingAlerts", 
  "tradingcardcommunity", "Tradingcards", "Trading_Courses_", "TradingDesk", "TradingEdge", "Trading_es", "Trading_Futures", 
  "TradingInterview", "TradingLegends", "TradingPi", "TradingPost76", "TradingPsychologie", "TradingSignals", 
  "TradingSiteReviewsCom", "trading_strategy", "TradingTechniques", "TradingViewSignals", "TradingVolatility", 
  "TransformersTrading", "TreeDefi", "trenchors", "TriangleBitcoin", "TriasBlockchain", "Tronix", "trustapp", "trustNFT", 
  "TycoonTrading", "UKcoins", "ULEI_COIN", "ULIT_COIN_", "UltraBlockchain", "UltraNFT", "UnifiDeFi", "UnitedBTC", "UNIUM_NFT", 
  "Universa_Blockchain", "unlimited_defi", "UnturnedTrading", "UpcomingNFT", "UselessCrypto", "ValereumBlockchain", "Valinity_defi", 
  "velarBTC", "VerusCoin", "VoxiesNFT", "VoyagerCrypto", "VstTrading", "vyper", "WallStreetBetsCrypto", "Wavesplatform", 
  "Web3DeBankDefi", "WenLamboDefi", "Whitelist_Airdrop", "Wizard_bsc", "WoofCoin", "WSB_defi", "XcelDefi", "XendFinance", 
  "XMax_Blockchain", "X_Token", "YBAOfficial", "YearnNFT", "YetuSwap", "yGOAT", "Yield_Farming", "zebec", "ZunaCoin"
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

// 2. The Full Raw ID List restored from original data
const RAW_TWITTER_IDS = [
  "1394397159273811971", "1437041804214370314", "1438591882691555329", "29938901", "712198712", 
  "1174156053774102528", "1229568798", "867773137060069376", "1471618454", "810270119515553793", 
  "13141", "861445409205563392", "729400696085348353", "16909060", "1641971", "945045726605729793", 
  "2811745532", "943543913574518784", "575099162", "48249909", "1321136246349910016", "462775411", 
  "501870784", "1489171025913069568", "1398786228628164608", "933631656", "1150790822813560833", 
  "1395767775587573760", "1511654363550273536", "1441337034291900419", "1249135422816415744", 
  "1432649934264619012", "1436425769589350412", "1440937891232948226", "1527878420171894784", 
  "82224605", "872290782551527424", "1439832243078373380", "1320362651466166272", "929155859913039872", 
  "30517868", "2392642861", "1596018437557321728", "1973894065", "1066012933", "101833150", 
  "45652614", "1232319080637616128", "985688130509393920", "1636288561", "1466282212202975234", 
  "1705281", "49457533", "68854969", "566534886", "282584708", "1298338262457749504", 
  "1027902734316593152", "894967285877792769", "255045605", "304800873", "1330060420317646854", 
  "4473163535", "28587120", "2901915478", "2515887780", "1223056821037957120", "1258757141088948230", 
  "923280634822447104", "877006983496257536", "1656410755", "2378261498", "969686618922803200", 
  "1450024478331707399", "28949586", "884511390987407360", "1475109910320795650", "786935887884156929", 
  "1133538475066765312", "978921459958632448", "42920448", "982719351244472320", "28571999", 
  "2826522223", "1154601225880555520", "100075891", "2151686839", "1905283219932516353", "911716127365042177", 
  "990355365933010944", "2841256042", "1004162476273893377", "609143325", "2379355442", "159227459", 
  "299075997", "861408824", "3833416227", "146345384", "188369814", "1539681011696603137", 
  "384144651", "864211771858591746", "1004371029307912192", "1074445812250365962", "535136727", 
  "15253843", "130745589", "100416493", "735426681968660481", "14592709", "911314186365472768", 
  "941804156754460679", "989912836901089282", "2287471915", "166765173", "1337780902680809474", 
  "2320755170", "1869084032002306048", "1039833297751302144", "1096456962022223872", "962293079012241408", 
  "2260491445", "1136819035163619328", "776078472477347840", "1022821051187822593", "412587524", 
  "993530753014054912", "2207129125", "963767159536209921", "1333467482", "928759224599040001", 
  "1376161898", "291794336", "18469669", "2453385626", "897446848004227072", "24222556", 
  "712212062118748160", "702654540387127296", "1110877798820777986", "1035721495", "308396313", 
  "6718432", "902926941413453824", "2529971", "14379660", "1469101279", "918122676195090433", 
  "34097500", "33962758", "396045469", "295218901", "352619090", "1375234369636331522", 
  "1430181533198036996", "1144885988", "906230721513181184", "943506806931734528", "1084397942319054850", 
  "782946231551131648", "1384549926080860166", "1023796092243079168", "1288293005846142978", 
  "1163142718668902400", "826381583489855490", "437833889", "1386939394683252738", "200070195", 
  "1394145660581023747", "1240415094837780480", "2796712523", "893111826254356481", "2589423217", 
  "1409063853246365696", "37794688", "1203496290589405185", "1417477410841366538", "1274803199040462848", 
  "51073409", "1370466828972142592", "1103218563383549952", "45788327", "1360636645989441539", 
  "1034478294677250048", "3696215239", "1144245254469685250", "904700529988820992", "17351167", 
  "1355164945323683841", "1796207757856567296", "1530033576", "881258555432632322", "4473212565", 
  "1372196901936848901", "1383802058625609740", "817007725666242561", "1297503202464718850", 
  "993962483332329472", "1301215504686694400", "972970759416111104", "4441279246", "978184299122892800", 
  "1439608646", "1387497871751196672", "1323762343302615040", "978732571738755072", "361289499", 
  "963815487481303040", "1358688239037546500", "455937214", "1904895819498872836", "170049408", 
  "887748030304329728", "431243238", "935742315389444096", "2577886615", "1036115996", 
  "895748070083891202", "4911583324", "3005650652", "1475594648794062850", "934796999068651521", 
  "2573380344", "1318987223232999424", "1471908568089579521", "1291312101634519040", "1478116068073816064", 
  "33149981", "2660878747", "1448308125166096387", "1453592537567006720", "1443733938267049985", 
  "1319008189484912640", "1312844486003748864", "1439310192869576712", "1432772993810243584", 
  "900295063024144384", "731402158512476161", "834123445856145408", "1531327171", "1858233642", 
  "949685739935158272", "381127643", "415302903", "1485974663746539520", "1355293004119109633", 
  "398148139", "885331587310735360", "1433401849349132292", "68609023", "634075747", 
  "1438482430898458628", "210623431", "777557821462306816", "2364233382", "1424905944857722887", 
  "1376974468027805696", "1896013623593746435", "2650025562", "3109476390", "4017596542", 
  "1444050325258842122", "905763362277023744", "1183474595728384001", "1252627966724648960", 
  "18042095", "1399989738405126152", "1404716412451442689", "1408122299132358668", "1448939883423207452", 
  "1425966540843896832", "1422676808911269893", "618539620", "1399393068562911232", "1433801079645429771"
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