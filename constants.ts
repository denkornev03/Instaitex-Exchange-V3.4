

import { CoinData, NewsItem } from './types';

export const MAX_HISTORY_POINTS = 60; // Increased for smoother charts
export const SIMULATION_INTERVAL = 1500; // Slightly faster ticks

// Helper to generate mock history so charts aren't empty on load
const generateMockHistory = (basePrice: number) => {
  const history = [];
  const now = Date.now();
  for (let i = MAX_HISTORY_POINTS; i > 0; i--) {
    const time = new Date(now - i * SIMULATION_INTERVAL).toLocaleTimeString();
    // Simulate some variance for history, unless price is 0
    const variance = basePrice === 0 ? 0 : (Math.random() * 0.04 - 0.02); // +/- 2%
    const value = Math.max(0, basePrice * (1 + variance));
    history.push({ time, value });
  }
  return history;
};

export const INITIAL_COINS: CoinData[] = [
  {
    id: 'USTC',
    name: 'SkyWay Shares',
    symbol: 'USTC',
    description: 'Investment shares in RSW Systems.',
    balance: 2694803,
    basePrice: 0.010,
    currentPrice: 0.010,
    history: generateMockHistory(0.010),
    color: '#10b981', // Emerald
  },
  {
    id: 'INSb',
    name: 'INSbit Token',
    symbol: 'INSb',
    description: 'Official exchange utility token.',
    balance: 1099999799,
    basePrice: 0.000001,
    currentPrice: 0.000001,
    history: generateMockHistory(0.000001),
    color: '#3b82f6', // Blue
  },
  {
    id: 'HOT',
    name: 'Holo Fuel',
    symbol: 'HOT',
    description: 'Decentralized hosting fuel.',
    balance: 500,
    basePrice: 1.0,
    currentPrice: 1.0,
    history: generateMockHistory(1.0),
    color: '#f97316', // Orange
  },
  {
    id: 'KEEP',
    name: 'Храни Token',
    symbol: 'KEEP',
    description: 'Secure decentralized storage.',
    balance: 1000000000,
    basePrice: 0.0000010,
    currentPrice: 0.0000010,
    history: generateMockHistory(0.0000010),
    color: '#a855f7', // Purple
  },
  {
    id: 'RBTC',
    name: 'RabBitcoin',
    symbol: 'RBTC',
    description: 'Rabbit-themed Bitcoin token.',
    balance: 1961965,
    basePrice: 0.0000014,
    currentPrice: 0.0000014,
    history: generateMockHistory(0.0000014),
    color: '#ec4899', // Pink
  },
  {
    id: 'GAFR',
    name: 'Gaffer Studio',
    symbol: 'GAFR',
    description: 'Voxel Art Studio Token',
    balance: 0,
    basePrice: 0,
    currentPrice: 0,
    history: generateMockHistory(0),
    color: '#00B2B2', // Teal
  },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '9',
    category: 'article',
    title: 'Разработчик KEEP реализовал шаринг файлов',
    summary: 'В экосистеме KEEP представлен новый функционал публичного обмена файлами, аналогичный популярным облачным сервисам.',
    content: `
      <p>Важное обновление в экосистеме децентрализованного хранилища KEEP. Ведущий разработчик анонсировал запуск функции публичного обмена файлами.</p>
      
      <blockquote class="border-l-4 border-purple-500 pl-4 py-2 my-6 text-purple-200 italic bg-purple-900/20 rounded-r">
        "Пояснительная бригада, я реализовал механизм шаринга файлов по ссылке как у Яндекс диск"
      </blockquote>
      
      <p>Это нововведение ставит KEEP в один ряд с традиционными облачными сервисами (Web2), но с сохранением всех преимуществ безопасности и анонимности Web3 технологий.</p>
      
      <img src="https://i.ibb.co/jPKvwm7J/Screenshot-2.png" alt="Интерфейс шаринга KEEP" class="w-full rounded-lg my-6 border border-gray-700 shadow-lg">
      
      <p>Теперь пользователи могут не только безопасно хранить свои данные, но и делиться ими с кем угодно, просто отправив сгенерированную ссылку.</p>
    `,
    date: '03.12.2025',
    imageUrl: 'https://i.ibb.co/jPKvwm7J/Screenshot-2.png',
    relatedCoinId: 'KEEP',
    priceImpact: '+0.50%'
  },
  {
    id: '8',
    category: 'article',
    title: 'Делегация из Вьетнама посетила UST Inc.',
    summary: 'Делегация из Вьетнама с визитом прибыла в Беларусь и посетила компанию UST Inc. В составе группы – представители прессы и органов власти, руководители компаний и отраслевых ассоциаций, а также учёные и общественные деятели.',
    content: `
      <p>Гости посетили офис компании и подробно познакомились с технологией uST. В рамках визита делегаты также отправились в ЭкоТехноПарк в Марьиной Горке, где смогли увидеть действующие образцы струнного транспорта и оценить потенциал их внедрения во Вьетнаме. Кроме того, в программе визита был осмотр завода «СВ Плант», на котором производится подвижной состав комплексов uST.</p>
      
      <p>Во время переговоров делегация встретилась с генеральным директором UST Inc. Надеждой Косаревой, а также с руководителями подразделений компании. В том числе с заместителем генерального конструктора по науке Сергеем Артюшевским, который рассказал гостям об особенностях ведения научно-образовательной работы в компании, и с заместителем генерального директора по маркетингу Евгением Петровым, который познакомил делегатов с текущими проектами.</p>
      
      <p>Стороны обсудили перспективы сотрудничества, варианты локализации технологий и рассмотрели шесть возможных проектов струнного транспорта для Вьетнама. Среди них – двухпутные струнные пассажирские линии между:</p>
      <ul class="list-disc pl-5 space-y-2 mb-4">
        <li>районом Ханоя Линь Нам и международным аэропортом Зябинь, длиной 30 км;</li>
        <li>районом Хошимина (улица Фан Ван Три) и автостанцией Тан Чан Хиеп, длиной 9,3 км;</li>
        <li>туристической деревней Бинь Кой и станцией Национальная автомагистраль 50 (район № 8 города Ханой);</li>
        <li>станцией Ба Сон и автовокзалом Мьен Тай, длиной 11,3 км.</li>
      </ul>
      
      <p>А также меридианный транспортный коридор uST по маршруту Шок Шон – Шон Тэй – Хоа Лак – Суэн Май – Фу Сюэн вокруг столицы Вьетнама, города Ханой, и транспортно-инфраструктурный комплекс вдоль реки Хонгха.</p>
      
      <img src="https://i.ibb.co/zHW7cW1q/Screenshot-2rtea.png" alt="Карта маршрутов" class="w-full rounded-lg my-6 border border-gray-700 shadow-lg">
      
      <p>Ожидается, что внедрение комплекса uST увеличит мобильность населения, улучшит доступ к важным объектам и повысит туристическую привлекательность региона. Компания UST Inc. стремится продвигать свои технологии во Вьетнаме, и визит делегации подтверждает взаимный интерес.</p>
    `,
    date: '02.12.2025',
    imageUrl: 'https://i.ibb.co/PvB72gYy/Screenshot-2hgtsa.png',
    relatedCoinId: 'USTC',
    priceImpact: '+4.20%',
    url: 'https://ust.inc/news/vietnamese-delegation-visits-ust-inc'
  },
  {
    id: '7',
    category: 'article',
    title: 'Масштабное обновление: Запуск Airdrop раздела',
    summary: 'Instaitex запускает долгожданный раздел Airdrop с раздачей токенов INSb.',
    content: `
      <div class="bg-blue-500/10 border-l-4 border-blue-500 p-4 mb-6 rounded-r">
        <p class="font-bold text-blue-400">Срочные новости</p>
        <p>Официально запущен пул вознаграждений в размере 99,999,799 INSb!</p>
      </div>
      <p>Мы рады объявить о запуске нашего нового раздела <strong>Airdrop</strong>. Это важный шаг в демократизации доступа к экосистеме Instaitex.</p>
      <h3>Детали раздачи:</h3>
      <ul class="list-disc pl-5 space-y-2 mb-4">
        <li><strong>Токен:</strong> INSb (Governance Token)</li>
        <li><strong>Награда на пользователя:</strong> 1,000 INSb</li>
        <li><strong>Требование:</strong> Подключение TON кошелька</li>
      </ul>
      <p>Перейдите в новый раздел прямо сейчас, чтобы успеть получить свою долю до окончания эмиссии.</p>
    `,
    date: '01.12.2025',
    imageUrl: 'https://i.ibb.co/TM6Vjnfb/y-search-gen-4.png',
    relatedCoinId: 'INSb',
    priceImpact: '+35.00%',
    internalLink: 'airdrop'
  },
  {
    id: '6',
    category: 'article',
    title: 'Стратегическая переоценка INSb',
    summary: 'Администратор биржи объявляет о радикальном пересмотре стоимости токена INSb (падение в 100 раз) в рамках новой долгосрочной стратегии.',
    content: `
      <div class="bg-blue-900/30 p-6 rounded-xl border border-blue-500/20 mb-8 italic">
        <span class="text-4xl text-blue-500 font-serif absolute -mt-4 -ml-2">"</span>
        <p class="text-xl text-blue-100 font-light relative z-10">
          Я переосмыслил потенциал своего токена. Иногда, чтобы взлететь выше, нужно начать с более низкой базы. Это не падение — это разбег.
        </p>
        <div class="mt-4 flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gray-700"></div>
            <span class="text-sm font-bold text-gray-400">— Admin, Instaitex CEO</span>
        </div>
      </div>
      <p>В неожиданном для рынка шаге, базовая стоимость утилитарного токена INSb была скорректирована с $0.001 до $0.00001.</p>
      <p>Это решение открывает возможности для привлечения микро-инвесторов и создания более широкой базы держателей перед запуском ключевых продуктов экосистемы.</p>
    `,
    date: '01.12.2025',
    imageUrl: 'https://i.ibb.co/nqC6TVPh/y-search-gen-6.png',
    relatedCoinId: 'INSb',
    priceImpact: '-99.00%'
  },
  {
    id: '5',
    category: 'article',
    title: 'ОФИЦИАЛЬНО: Администратор выполнил снижение цены на 90%',
    summary: 'Администрация Instaitex вручную снизила цену токена на 90% в рамках стратегической перезагрузки экосистемы.',
    content: `
      <div class="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-6">
        <strong class="text-red-400 block mb-1">Рыночное оповещение</strong>
        Это санкционированное администратором действие по корректировке цены. Торговля продолжается в обычном режиме по новым уровням.
      </div>
      <p>В смелом шаге по перекалибровке токеномики KEEP, администратор биржи выполнил команду на немедленное снижение базовой стоимости актива на 90%.</p>
      <blockquote class="border-l-4 border-gray-600 pl-4 py-2 my-6 text-gray-400 italic">
        "Мы приводим оценку в соответствие с текущей фазой накопления. Это создает беспрецедентную точку входа для новых участников."
      </blockquote>
      <p>Графики мгновенно отреагировали красной свечой, но объемы торгов показывают всплеск интереса покупателей на "дне".</p>
    `,
    date: '01.12.2025',
    imageUrl: 'https://i.ibb.co/k2C69zXb/y-search-gen-3.png',
    relatedCoinId: 'KEEP',
    priceImpact: '-90.00%'
  }
];
