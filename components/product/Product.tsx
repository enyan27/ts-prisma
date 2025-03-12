import Stars from "@/components/product/Stars";
import ImageDisplay from "@/components/product/ImageDisplay";

import { Image, Product, Review } from "@prisma/client";

// This is Product + Reivew and Image table
export interface ProductViewProps extends Product {
  reviews: Review[];
  images: Image[];
}

export default function ProductView({ product }: { product: ProductViewProps }) {
  // Get product
  if (!product) {
    return <div>Product not found</div>;
  }

  // Get average rating
  const totalRating = product.reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = totalRating / product.reviews.length;

  // Get image URLs
  const imageUrls = product.images.map((image) => image.url);

  return (
    <div className="grid gap-6">
      <ImageDisplay images={imageUrls} />
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {product.description}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-4xl font-bold">{product.price}</span>
          <div className="flex items-center gap-0.5">
            <Stars rating={averageRating} />
          </div>
        </div>
      </div>
    </div>
  );
}
