import { Category } from '../../types';

export const CategoryCard = ({ name, icon, description }: Category) => {
  return (
    <div className="category-card">
      <div className="category-icon">{icon}</div>
      <h3 className="category-title">{name}</h3>
      <p className="category-description">{description}</p>
    </div>
  );
};