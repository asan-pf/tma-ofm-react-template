interface CategoryFiltersProps {
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

const categories = [
  { id: "all", label: "All", icon: "📍" },
  { id: "grocery", label: "Grocery", icon: "🛒" },
  { id: "restaurant-bar", label: "Food & Drink", icon: "🍽️" },
  { id: "other", label: "Other", icon: "🏪" },
];

export function CategoryFilters({
  selectedCategories,
  onCategoryToggle,
}: CategoryFiltersProps) {
  const isSelected = (categoryId: string) => {
    if (categoryId === "all") {
      return selectedCategories.length === 0;
    }
    return selectedCategories.includes(categoryId);
  };

  const handleCategoryClick = (categoryId: string) => {
    onCategoryToggle(categoryId);
  };

  return (
    <div className="category-filters">
      <div className="category-filters-scroll">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`category-filter-pill${
              isSelected(category.id) ? " is-active" : ""
            }`}
          >
            <span className="category-filter-icon">{category.icon}</span>
            <span className="category-filter-label">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
