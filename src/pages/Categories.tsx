import { CategoryCard } from '../components/categories/CategoryCard';

const categories = [
  {
    id: '1',
    name: 'Retail',
    icon: '🛍️',
    description: 'Shop from your favorite stores',
  },
  {
    id: '2',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Book appointments and buy medicines',
  },
  {
    id: '3',
    name: 'Banking',
    icon: '🏦',
    description: 'Access financial services',
  },
  {
    id: '4',
    name: 'Transport',
    icon: '🚗',
    description: 'Book rides and track deliveries',
  },
];

export const Categories = () => {
  return (
    <div className="categories-container">
      <h1>Select a Category</h1>
      <div className="categories-grid">
        {categories.map((category) => (
          <CategoryCard key={category.id} {...category} />
        ))}
      </div>
    </div>
  );
};