import { Container } from "@/components/common/Container";
import CategoryCard from "./CategoryCard";
import { categoryData } from "./categoryData";

export default function Categories() {
  return (
    <section className="bg-slate-950 py-24">

      <Container>

        <div className="mb-16 text-center">

          <h2 className="text-4xl font-bold text-white">
            Shop by Category
          </h2>

          <p className="mt-4 text-slate-400">
            Discover trusted local shops across multiple categories.
          </p>

        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {categoryData.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
            />
          ))}

        </div>

      </Container>

    </section>
  );
}