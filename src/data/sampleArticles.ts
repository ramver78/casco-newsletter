import { Article } from '../types';

export const sampleArticles: Article[] = [
  {
    id: '1',
    title: 'Breaking: Major Technology Breakthrough Announced',
    summary: 'Scientists reveal a groundbreaking discovery that could revolutionize how we interact with technology in our daily lives.',
    content: `<p>In a stunning announcement today, researchers at the Institute of Advanced Technology revealed what they're calling "the most significant breakthrough in computing since the microprocessor."</p>
    
<p>The new technology, which has been in development for over a decade, promises to increase processing speeds by a factor of 1000 while reducing energy consumption by 90%.</p>

<p>"This is not just an incremental improvement," said Dr. Sarah Chen, lead researcher on the project. "This is a fundamental shift in how we think about computation."</p>

<p>The implications of this breakthrough extend far beyond consumer electronics. Healthcare, climate modeling, and artificial intelligence could all see dramatic improvements.</p>

<p>Industry experts are already predicting that this technology could be in consumer devices within the next five years, though some caution that scaling manufacturing will be a significant challenge.</p>`,
    author: 'John Smith',
    category: 'Technology',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    publishedAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    status: 'published',
    featured: true,
  },
  {
    id: '2',
    title: 'Global Markets Rally on Economic Optimism',
    summary: 'Stock markets around the world posted significant gains as investors respond to positive economic indicators.',
    content: `<p>Global stock markets experienced their best week in months as positive economic data from major economies fueled investor optimism.</p>

<p>The S&P 500 rose 2.3%, while European and Asian markets saw similar gains. The rally was broad-based, with technology, healthcare, and financial sectors all posting strong returns.</p>

<p>"We're seeing a confluence of positive factors," said Maria Rodriguez, chief economist at Global Investments. "Inflation is cooling, employment remains strong, and corporate earnings are exceeding expectations."</p>

<p>Central banks have signaled they may pause interest rate hikes, which has further boosted market sentiment. However, some analysts caution that geopolitical risks remain.</p>`,
    author: 'Emily Brown',
    category: 'Business',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    publishedAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-14T14:30:00Z',
    status: 'published',
    featured: true,
  },
  {
    id: '3',
    title: 'New Study Reveals Benefits of Mediterranean Diet',
    summary: 'Research confirms that following a Mediterranean-style diet can significantly improve heart health and longevity.',
    content: `<p>A comprehensive study involving over 50,000 participants has provided the strongest evidence yet for the health benefits of the Mediterranean diet.</p>

<p>The research, published in the Journal of Nutrition, found that individuals who closely followed Mediterranean dietary patterns had a 25% lower risk of cardiovascular disease.</p>

<p>"The results are compelling," said Dr. Michael Torres, who led the study. "We saw benefits across all age groups and demographics."</p>

<p>The Mediterranean diet emphasizes fruits, vegetables, whole grains, olive oil, and lean proteins, particularly fish. It limits red meat and processed foods.</p>`,
    author: 'Sarah Johnson',
    category: 'Health',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    publishedAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
    status: 'published',
    featured: false,
  },
  {
    id: '4',
    title: 'Championship Finals Set After Dramatic Semifinals',
    summary: 'Two underdogs advance to the championship round after stunning victories in last night\'s semifinal matches.',
    content: `<p>In what many are calling the most exciting semifinals in tournament history, two underdog teams have punched their tickets to the championship finals.</p>

<p>The Eastern Conference semifinal went to overtime, with the home team securing victory on a last-second shot. The Western Conference game was equally thrilling, featuring a fourth-quarter comeback.</p>

<p>"We never stopped believing," said coach James Williams after the victory. "These players have heart."</p>

<p>The finals are scheduled for next Saturday at the National Arena, with tickets already sold out.</p>`,
    author: 'Mike Davis',
    category: 'Sports',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934- voices-1fccce2ff0e4?w=800',
    publishedAt: '2024-01-12T22:00:00Z',
    updatedAt: '2024-01-12T22:00:00Z',
    status: 'published',
    featured: false,
  },
  {
    id: '5',
    title: 'Award-Winning Director Announces New Film Project',
    summary: 'Oscar-winning filmmaker reveals details of upcoming ambitious production featuring an all-star cast.',
    content: `<p>Academy Award-winning director Alexandra Kim has announced her next project, an epic historical drama that has already attracted A-list talent.</p>

<p>The film, tentatively titled "Horizons," will explore themes of human connection across different time periods and continents.</p>

<p>"This is the most ambitious project I've ever undertaken," Kim said at a press conference. "It's a story that needs to be told."</p>

<p>Production is scheduled to begin next spring, with a release date set for the following year's awards season.</p>`,
    author: 'Lisa Park',
    category: 'Entertainment',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    publishedAt: '2024-01-11T16:45:00Z',
    updatedAt: '2024-01-11T16:45:00Z',
    status: 'published',
    featured: false,
  },
];

export const categories = [
  { id: '1', name: 'Technology', slug: 'technology', color: '#3b82f6' },
  { id: '2', name: 'Business', slug: 'business', color: '#10b981' },
  { id: '3', name: 'Health', slug: 'health', color: '#ef4444' },
  { id: '4', name: 'Sports', slug: 'sports', color: '#f59e0b' },
  { id: '5', name: 'Entertainment', slug: 'entertainment', color: '#8b5cf6' },
];
