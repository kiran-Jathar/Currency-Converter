// Currency Converter Application
class CurrencyConverter {
    constructor() {
        this.rates = {};
        this.currencies = {};
        this.lastUpdate = null;
        this.updateInterval = 60000; // 60 seconds
        
        // DOM Elements
        this.amountInput = document.getElementById('amountInput');
        this.fromSelect = document.getElementById('fromSelect');
        this.toSelect = document.getElementById('toSelect');
        this.fromFlag = document.getElementById('fromFlag');
        this.toFlag = document.getElementById('toFlag');
        this.fromSymbol = document.getElementById('fromSymbol');
        this.converterForm = document.getElementById('converterForm');
        this.swapBtn = document.getElementById('swapBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.convertBtn = document.getElementById('convertBtn');
        this.rateMessage = document.getElementById('rateMessage');
        this.lastUpdated = document.getElementById('lastUpdated');
        this.resultFromAmount = document.getElementById('resultFromAmount');
        this.resultFromCurrency = document.getElementById('resultFromCurrency');
        this.resultToAmount = document.getElementById('resultToAmount');
        this.resultToCurrency = document.getElementById('resultToCurrency');
        this.themeToggle = document.getElementById('themeToggle');
        this.toast = document.getElementById('toast');
        this.offlineNotice = document.getElementById('offlineNotice');
        
        this.init();
    }
    
    async init() {
        this.loadTheme();
        await this.loadCurrencies();
        await this.fetchRates();
        this.setupEventListeners();
        this.setupAutoUpdate();
        this.checkOnlineStatus();
    }
    
    // Load available currencies
    async loadCurrencies() {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all');
            const countries = await response.json();
            
            const currencyList = {};
            
            countries.forEach(country => {
                if (country.currencies) {
                    Object.entries(country.currencies).forEach(([code, currency]) => {
                        if (!currencyList[code]) {
                            currencyList[code] = {
                                name: currency.name,
                                symbol: currency.symbol || code
                            };
                        }
                    });
                }
            });
            
            this.currencies = currencyList;
            this.populateCurrencySelects();
        } catch (error) {
            console.error('Error loading currencies:', error);
            this.populateDefaultCurrencies();
        }
    }
    
    // Populate default currencies
    populateDefaultCurrencies() {
        const defaultCurrencies = {
            'USD': { name: 'US Dollar', symbol: '$' },
            'EUR': { name: 'Euro', symbol: '€' },
            'GBP': { name: 'British Pound', symbol: '£' },
            'JPY': { name: 'Japanese Yen', symbol: '¥' },
            'AUD': { name: 'Australian Dollar', symbol: 'A$' },
            'CAD': { name: 'Canadian Dollar', symbol: 'C$' },
            'CHF': { name: 'Swiss Franc', symbol: 'CHF' },
            'CNY': { name: 'Chinese Yuan', symbol: '¥' },
            'SEK': { name: 'Swedish Krona', symbol: 'kr' },
            'NZD': { name: 'New Zealand Dollar', symbol: 'NZ$' },
            'INR': { name: 'Indian Rupee', symbol: '₹' },
            'BRL': { name: 'Brazilian Real', symbol: 'R$' },
            'RUB': { name: 'Russian Ruble', symbol: '₽' },
            'MXN': { name: 'Mexican Peso', symbol: '$' },
            'SGD': { name: 'Singapore Dollar', symbol: 'S$' },
            'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$' },
            'NOR': { name: 'Norwegian Krone', symbol: 'kr' },
            'KRW': { name: 'South Korean Won', symbol: '₩' },
            'TRY': { name: 'Turkish Lira', symbol: '₺' },
            'ZAR': { name: 'South African Rand', symbol: 'R' }
        };
        
        this.currencies = defaultCurrencies;
        this.populateCurrencySelects();
    }
    
    // Populate currency dropdowns
    populateCurrencySelects() {
        const sortedCurrencies = Object.keys(this.currencies).sort();
        
        const fromOptions = sortedCurrencies.map(code => 
            `<option value="${code}">${code} - ${this.currencies[code].name}</option>`
        ).join('');
        
        const toOptions = sortedCurrencies.map(code => 
            `<option value="${code}">${code} - ${this.currencies[code].name}</option>`
        ).join('');
        
        this.fromSelect.innerHTML = fromOptions;
        this.toSelect.innerHTML = toOptions;
        
        // Set defaults
        this.fromSelect.value = 'USD';
        this.toSelect.value = 'INR';
        
        this.updateFlagAndSymbol();
    }
    
    // Fetch exchange rates
    async fetchRates() {
        try {
            this.setLoadingState(true);
            
            // Using exchangerate-api.com free tier
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            this.rates = data.rates;
            this.rates['USD'] = 1; // USD to USD = 1
            this.lastUpdate = new Date();
            
            // Save to localStorage
            localStorage.setItem('exchangeRates', JSON.stringify({
                rates: this.rates,
                timestamp: this.lastUpdate
            }));
            
            this.showToast('Exchange rates updated!');
            this.updateLastUpdatedTime();
            this.performConversion();
            this.setLoadingState(false);
        } catch (error) {
            console.error('Error fetching rates:', error);
            this.loadFromCache();
            this.setLoadingState(false);
        }
    }
    
    // Load rates from cache
    loadFromCache() {
        try {
            const cached = localStorage.getItem('exchangeRates');
            if (cached) {
                const data = JSON.parse(cached);
                this.rates = data.rates;
                this.lastUpdate = new Date(data.timestamp);
                this.showOfflineNotice();
                this.updateLastUpdatedTime();
                this.performConversion();
            } else {
                this.setDefaultRates();
            }
        } catch (error) {
            console.error('Error loading cache:', error);
            this.setDefaultRates();
        }
    }
    
    // Set default rates (fallback)
    setDefaultRates() {
        this.rates = {
            'USD': 1,
            'EUR': 0.92,
            'GBP': 0.79,
            'JPY': 149.50,
            'INR': 80,
            'CAD': 1.36,
            'AUD': 1.52,
            'CHF': 0.88
        };
        this.lastUpdate = new Date();
    }
    
    // Setup event listeners
    setupEventListeners() {
        this.amountInput.addEventListener('input', () => this.performConversion());
        this.fromSelect.addEventListener('change', () => {
            this.updateFlagAndSymbol();
            this.performConversion();
        });
        this.toSelect.addEventListener('change', () => {
            this.updateFlagAndSymbol();
            this.performConversion();
        });
        
        this.converterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.fetchRates();
        });
        
        this.swapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.swapCurrencies();
        });
        
        this.copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.copyResult();
        });
        
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Quick convert chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                this.amountInput.value = chip.dataset.amount;
                this.performConversion();
            });
        });
        
        // Real-time conversion
        this.amountInput.addEventListener('change', () => this.performConversion());
    }
    
    // Perform currency conversion
    performConversion() {
        const amount = parseFloat(this.amountInput.value);
        
        if (isNaN(amount) || amount < 0) {
            this.resultToAmount.textContent = '0';
            return;
        }
        
        const fromCurrency = this.fromSelect.value;
        const toCurrency = this.toSelect.value;
        
        const rate = this.getExchangeRate(fromCurrency, toCurrency);
        const convertedAmount = (amount * rate).toFixed(2);
        
        // Update result display
        this.resultFromAmount.textContent = amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        this.resultFromCurrency.textContent = fromCurrency;
        
        this.resultToAmount.textContent = parseFloat(convertedAmount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        this.resultToCurrency.textContent = toCurrency;
        
        // Update rate message
        const displayRate = (1 * rate).toFixed(4);
        this.rateMessage.textContent = `1 ${fromCurrency} = ${displayRate} ${toCurrency}`;
    }
    
    // Get exchange rate
    getExchangeRate(from, to) {
        if (!this.rates[from] || !this.rates[to]) {
            return 1;
        }
        return this.rates[to] / this.rates[from];
    }
    
    // Update flag and currency symbol
    updateFlagAndSymbol() {
        const fromCode = this.fromSelect.value;
        const toCode = this.toSelect.value;
        
        // Get country codes from currency codes (simplified)
        const currencyToCountry = {
            'USD': 'US', 'EUR': 'DE', 'GBP': 'GB', 'JPY': 'JP', 'AUD': 'AU',
            'CAD': 'CA', 'CHF': 'CH', 'CNY': 'CN', 'SEK': 'SE', 'NZD': 'NZ',
            'INR': 'IN', 'BRL': 'BR', 'RUB': 'RU', 'MXN': 'MX', 'SGD': 'SG',
            'HKD': 'HK', 'NOR': 'NO', 'KRW': 'KR', 'TRY': 'TR', 'ZAR': 'ZA',
            'THB': 'TH', 'MYR': 'MY', 'PHP': 'PH', 'VND': 'VN', 'IDR': 'ID',
            'PKR': 'PK', 'BDT': 'BD', 'LKR': 'LK'
        };
        
        const fromCountry = currencyToCountry[fromCode] || 'US';
        const toCountry = currencyToCountry[toCode] || 'IN';
        
        this.fromFlag.src = `https://flagsapi.com/${fromCountry}/flat/64.png`;
        this.toFlag.src = `https://flagsapi.com/${toCountry}/flat/64.png`;
        
        // Update currency symbol
        const symbol = this.currencies[fromCode]?.symbol || fromCode;
        this.fromSymbol.textContent = symbol;
    }
    
    // Swap currencies
    swapCurrencies() {
        const temp = this.fromSelect.value;
        this.fromSelect.value = this.toSelect.value;
        this.toSelect.value = temp;
        
        this.updateFlagAndSymbol();
        this.performConversion();
        this.showToast('Currencies swapped!');
    }
    
    // Copy result to clipboard
    copyResult() {
        const text = `${this.resultFromAmount.textContent} ${this.resultFromCurrency.textContent} = ${this.resultToAmount.textContent} ${this.resultToCurrency.textContent}`;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }
    
    // Show toast notification
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
    
    // Update last updated time
    updateLastUpdatedTime() {
        if (!this.lastUpdate) return;
        
        const now = new Date();
        const diff = now - new Date(this.lastUpdate);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        let timeText = 'Just now';
        if (minutes > 0) timeText = `${minutes}m ago`;
        if (hours > 0) timeText = `${hours}h ago`;
        
        this.lastUpdated.textContent = `Last updated: ${timeText}`;
    }
    
    // Setup auto-update
    setupAutoUpdate() {
        setInterval(() => {
            this.updateLastUpdatedTime();
            if (!navigator.onLine) {
                this.showOfflineNotice();
            } else {
                this.offlineNotice.style.display = 'none';
            }
        }, 60000);
        
        // Refresh rates every 60 seconds when online
        setInterval(() => {
            if (navigator.onLine) {
                this.fetchRates();
            }
        }, this.updateInterval);
    }
    
    // Check online status
    checkOnlineStatus() {
        window.addEventListener('online', () => {
            this.offlineNotice.style.display = 'none';
            this.fetchRates();
            this.showToast('Back online! Updating rates...');
        });
        
        window.addEventListener('offline', () => {
            this.showOfflineNotice();
            this.showToast('You are offline. Using cached rates.');
        });
    }
    
    // Show offline notice
    showOfflineNotice() {
        if (!navigator.onLine) {
            this.offlineNotice.style.display = 'flex';
        }
    }
    
    // Set loading state
    setLoadingState(isLoading) {
        this.convertBtn.disabled = isLoading;
        if (isLoading) {
            this.convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Updating...</span>';
        } else {
            this.convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Get Exchange Rate</span>';
        }
    }
    
    // Toggle theme
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        this.themeToggle.innerHTML = isDark ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
    
    // Load saved theme
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});
